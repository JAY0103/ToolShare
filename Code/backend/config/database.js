// config/database.js

const mysql = require('mysql2');

// Admin connection
const adminPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const adminDb = adminPool.promise();

// Main connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'project',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = pool.promise();

// Safe query
const query = async (sql, params = []) => {
  try {
    const [results] = await db.execute(sql, params);
    return results;
  } catch (err) {
    console.error('Query Error:', err.message);
    throw err;
  }
};

// ONE-TIME SETUP
const setupDatabase = async () => {
  let conn;
  try {
    console.log('Setting up database...');
    conn = await adminDb.getConnection();

    await conn.query('CREATE DATABASE IF NOT EXISTS project');
    await conn.query('USE project');
    console.log('Database "project" ready');

    // TABLES ------------------------------------------------------

    // Users
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT NOT NULL AUTO_INCREMENT,
        email VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        user_type ENUM('Faculty','Student') NOT NULL,
        username VARCHAR(100) DEFAULT NULL,
        first_name VARCHAR(100) DEFAULT NULL,
        last_name VARCHAR(100) DEFAULT NULL,
        student_id INT DEFAULT NULL,
        PRIMARY KEY (user_id),
        UNIQUE KEY email (email),
        UNIQUE KEY username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Faculties
    await conn.query(`
      CREATE TABLE IF NOT EXISTS faculties (
        faculty_id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        PRIMARY KEY (faculty_id),
        UNIQUE KEY name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Categories
    await conn.query(`
      CREATE TABLE IF NOT EXISTS categories (
        category_id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        PRIMARY KEY (category_id),
        UNIQUE KEY name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Items
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

    // Borrow Requests
    await conn.query(`
      CREATE TABLE IF NOT EXISTS borrowrequests (
        request_id INT NOT NULL AUTO_INCREMENT,
        borrower_id INT NOT NULL,
        item_id INT NOT NULL,
        requested_start DATETIME NOT NULL,
        requested_end DATETIME NOT NULL,
        reason TEXT NOT NULL,
        status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
        rejectionReason TEXT,
        PRIMARY KEY (request_id),
        KEY borrower_id (borrower_id),
        KEY item_id (item_id),
        CONSTRAINT borrowrequests_ibfk_1 FOREIGN KEY (borrower_id) REFERENCES users(user_id),
        CONSTRAINT borrowrequests_ibfk_2 FOREIGN KEY (item_id) REFERENCES items(item_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Condition Images
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

    console.log('All tables created successfully!');
  } catch (err) {
    console.error('Database setup failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) conn.release();
  }
};

setupDatabase();

module.exports = { db, query };
