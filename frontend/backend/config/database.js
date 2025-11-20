// config/database.js
const mysql = require('mysql2');

// Admin connection 
const adminPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const adminDb = adminPool.promise();

// Main connection (will use 'project' database after creation)
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'project',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = pool.promise();

// Safe query function for normal app use
const query = async (sql, params = []) => {
  try {
    const [results] = await db.execute(sql, params);
    return results;
  } catch (err) {
    console.error('Query Error:', err.message);
    throw err;
  }
};

// ONE-TIME SETUP: Create database + tables
const setupDatabase = async () => {
  let conn;
  try {
    console.log('Setting up database...');
    conn = await adminDb.getConnection();

    // Use raw query() - NOT execute() - for these commands
    await conn.query('CREATE DATABASE IF NOT EXISTS project');
    await conn.query('USE project');
    console.log('Database "project" ready');

    // Create tables in correct order
    await conn.query(`
      CREATE TABLE IF NOT EXISTS Users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        student_id VARCHAR(50) NOT NULL UNIQUE,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        user_type ENUM('Student', 'Faculty') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS Items (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        owner_id INT NOT NULL,
        serial_number VARCHAR(100),

        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES Users(user_id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS BorrowRequests (
        request_id INT AUTO_INCREMENT PRIMARY KEY,
        borrower_id INT NOT NULL,
        item_id INT NOT NULL,
        requested_start DATETIME NOT NULL,
        requested_end DATETIME NOT NULL,
        reason TEXT NOT NULL,
        status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (borrower_id) REFERENCES Users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES Items(item_id) ON DELETE CASCADE
      )
    `);

    console.log('All tables created successfully!');
  } catch (err) {
    console.error('Database setup failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) conn.release();
  }
};

// Run setup once on server start
setupDatabase();

module.exports = { db, query };