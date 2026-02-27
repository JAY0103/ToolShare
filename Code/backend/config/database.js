// config/database.js
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");

// Admin connection 
const adminPool = mysql.createPool({
  host: "localhost",
  user: "root",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const adminDb = adminPool.promise();

// Main connection 
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  database: "project",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const db = pool.promise();

// Safe query helper
const query = async (sql, params = []) => {
  try {
    const [results] = await db.execute(sql, params);
    return results;
  } catch (err) {
    console.error("Query Error:", err.message);
    throw err;
  }
};

// ONE-TIME SETUP 
const setupDatabase = async () => {
  let conn;
  try {
    console.log("Setting up database...");
    conn = await adminDb.getConnection();

    await conn.query("CREATE DATABASE IF NOT EXISTS project");
    await conn.query("USE project");
    console.log('Database "project" ready');

    // USERS
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT NOT NULL AUTO_INCREMENT,
        email VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        user_type ENUM('Faculty','Student','Admin') NOT NULL DEFAULT 'Student',
        username VARCHAR(100) DEFAULT NULL,
        first_name VARCHAR(100) DEFAULT NULL,
        last_name VARCHAR(100) DEFAULT NULL,
        student_id INT DEFAULT NULL,
        PRIMARY KEY (user_id),
        UNIQUE KEY email (email),
        UNIQUE KEY username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // FACULTIES
    await conn.query(`
      CREATE TABLE IF NOT EXISTS faculties (
        faculty_id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        PRIMARY KEY (faculty_id),
        UNIQUE KEY name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed default faculty (so faculty_id = 1 exists)
    await conn.query(`
      INSERT IGNORE INTO faculties (faculty_id, name, description)
      VALUES (1, 'General', 'Default faculty');
    `);

    // CATEGORIES
    await conn.query(`
      CREATE TABLE IF NOT EXISTS categories (
        category_id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        PRIMARY KEY (category_id),
        UNIQUE KEY name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // ITEMS
    await conn.query(`
      CREATE TABLE IF NOT EXISTS items (
        item_id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        image_url VARCHAR(255) DEFAULT NULL,
        faculty_id INT NOT NULL,
        owner_id INT NOT NULL,
        serial_number VARCHAR(100) DEFAULT NULL,
        category_id INT DEFAULT NULL,
        PRIMARY KEY (item_id),
        KEY faculty_id (faculty_id),
        KEY owner_id (owner_id),
        KEY category_id (category_id),
        CONSTRAINT items_ibfk_1 FOREIGN KEY (faculty_id) REFERENCES faculties(faculty_id),
        CONSTRAINT items_ibfk_2 FOREIGN KEY (owner_id) REFERENCES users(user_id),
        CONSTRAINT items_ibfk_3 FOREIGN KEY (category_id) REFERENCES categories(category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // REQUEST GROUPS (MISSING BEFORE)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS request_groups (
        group_id INT NOT NULL AUTO_INCREMENT,
        borrower_id INT NOT NULL,
        requested_start DATETIME NULL,
        requested_end DATETIME NULL,
        reason TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (group_id),
        KEY borrower_id (borrower_id),
        CONSTRAINT request_groups_ibfk_1 FOREIGN KEY (borrower_id) REFERENCES users(user_id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // BORROW REQUESTS (UPDATED STATUSES + COLUMNS)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS borrowrequests (
        request_id INT NOT NULL AUTO_INCREMENT,
        borrower_id INT NOT NULL,
        item_id INT NOT NULL,
        requested_start DATETIME NOT NULL,
        requested_end DATETIME NOT NULL,
        reason TEXT NOT NULL,
        status ENUM('Pending','Approved','Rejected','CheckedOut','Returned','Overdue')
          NOT NULL DEFAULT 'Pending',
        rejectionReason TEXT,
        request_group_id INT NULL,
        checked_out_at DATETIME NULL,
        returned_at DATETIME NULL,
        PRIMARY KEY (request_id),
        KEY borrower_id (borrower_id),
        KEY item_id (item_id),
        KEY request_group_id (request_group_id),
        CONSTRAINT borrowrequests_ibfk_1 FOREIGN KEY (borrower_id) REFERENCES users(user_id),
        CONSTRAINT borrowrequests_ibfk_2 FOREIGN KEY (item_id) REFERENCES items(item_id),
        CONSTRAINT borrowrequests_ibfk_3 FOREIGN KEY (request_group_id) REFERENCES request_groups(group_id)
          ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Index to speed up conflict checks
    await conn.query(`
      CREATE INDEX IF NOT EXISTS idx_conflict
      ON borrowrequests (item_id, status, requested_start, requested_end);
    `).catch(() => {
    });

    // CONDITION IMAGES
    await conn.query(`
      CREATE TABLE IF NOT EXISTS conditionimages (
        image_id INT NOT NULL AUTO_INCREMENT,
        borrow_request_id INT NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        image_type ENUM('Before','After') NOT NULL,
        timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (image_id),
        KEY borrow_request_id (borrow_request_id),
        CONSTRAINT conditionimages_ibfk_1 FOREIGN KEY (borrow_request_id) REFERENCES borrowrequests(request_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // NOTIFICATIONS
    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(120) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info','success','warning','danger') DEFAULT 'info',
        is_read TINYINT(1) DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (notification_id),
        KEY user_id (user_id),
        KEY is_read (is_read),
        KEY created_at (created_at),
        CONSTRAINT notifications_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(user_id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // OPTIONAL: seed a librarian admin if none exists
    // Set ADMIN_EMAIL + ADMIN_PASSWORD in env before running DB_SETUP=1
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPass = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPass) {
      const existing = await conn.query(`SELECT user_id FROM users WHERE email = ? LIMIT 1`, [adminEmail]);
      const rows = existing?.[0] || [];
      if (!rows.length) {
        const hash = await bcrypt.hash(adminPass, 10);
        await conn.query(
          `INSERT INTO users (email, password, user_type, username, first_name, last_name)
           VALUES (?, ?, 'Admin', 'admin', 'Admin', 'Admin')`,
          [adminEmail, hash]
        );
        console.log("Seeded Admin user:", adminEmail);
      }
    }

    console.log("All tables created/updated successfully!");
  } catch (err) {
    console.error("Database setup failed:", err.message);
    process.exit(1);
  } finally {
    if (conn) conn.release();
  }
};

// Run setup only when explicitly requested
if (process.env.DB_SETUP === "1") {
  setupDatabase();
}

module.exports = { db, query, setupDatabase };