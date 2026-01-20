const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');

// Constants
const PORT = 3000;
const JWT_SECRET = 'toolshare-super-secret-key-2025';

// Create the app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  port: '3307',
  user: 'root',
  password: '', // No password for root in this case
  database: 'project',
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database.');
});

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Helper: Query function (returns a promise)
const query = async (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Routes

// Home Route (not protected)
app.get('/', (req, res) => res.json({ message: 'ToolShare Backend Running!' }));

// --- REGISTER ROUTE ---
app.post('/api/register', async (req, res) => {
  const { first_name, last_name, student_id, username, email, password, user_type } = req.body;

  if (!first_name || !last_name || !student_id || !username || !email || !password || !user_type) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into the database
    const result = await query(
      'INSERT INTO Users (first_name, last_name, student_id, username, email, password, user_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [first_name, last_name, student_id, username, email, hashedPassword, user_type || 'Student']
    );

    // Generate JWT token
    const token = jwt.sign({ userId: result.insertId, username }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Registered successfully.',
      token,
      user: { user_id: result.insertId, username }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error registering user.' });
  }
});

// --- LOGIN ROUTE ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'All fields are required.' });

  try {
    // Query to get the user by email
    const [user] = await query('SELECT * FROM Users WHERE email = ?', [email]);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        user_type: user.user_type
      }
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// --- GET CURRENT USER INFO ---
app.get('/api/getUser', authenticateToken, async (req, res) => {
  const [user] = await query(
    'SELECT user_id, username, email, first_name, last_name, user_type FROM Users WHERE user_id = ?',
    [req.user.userId]
  );
  res.json({ user });
});


// --- ITEMS ROUTES ---

// Get all available items
app.get('/api/items', authenticateToken, async (req, res) => {
  const items = await query(
    'SELECT i.*, u.username AS owner_name FROM Items i JOIN Users u ON i.owner_id = u.user_id'
  );

  res.json({ items });
});

// Add a new item
app.post('/api/items', authenticateToken, async (req, res) => {
  const { name, description, image_url, serial_number } = req.body;
  const owner_id = req.user.userId; // From the JWT token

  if (!name || !description) {
    return res.status(400).json({
      message: 'Name and description are required.',
    });
  }

  await query(
    'INSERT INTO Items (name, description, image_url, faculty_id, owner_id, serial_number) VALUES (?, ?, ?, 1, ?, ?)',
    [
      name,
      description,
      image_url || null,
      owner_id,
      serial_number || null,
    ]
  );

  res.json({ message: 'Item added successfully' });
});

// --- BORROW REQUEST ROUTES ---
// Book an item
app.post('/api/book-item', authenticateToken, async (req, res) => {
  const { item_id, requested_start, requested_end, reason } = req.body;
  const borrower_id = req.user.userId; // From the JWT token

  if (!item_id || !requested_start || !requested_end || !reason) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const result = await query(
    'INSERT INTO BorrowRequests (borrower_id, item_id, requested_start, requested_end, reason, status) VALUES (?, ?, ?, ?, ?, ?)',
    [borrower_id, item_id, requested_start, requested_end, reason, 'Pending']
  );

  res.json({ message: 'Borrow request submitted successfully', request_id: result.insertId });
});

// Get all borrow requests for the logged-in user
app.get('/api/my-bookings', authenticateToken, async (req, res) => {
  const borrowRequests = await query(
    `SELECT br.request_id, br.item_id, br.status, br.requested_start, br.requested_end, i.name, i.description, i.image_url
    FROM BorrowRequests br
    JOIN Items i ON br.item_id = i.item_id
    WHERE br.borrower_id = ?
    ORDER BY br.request_id DESC`,
    [req.user.userId]
  );
  res.json(borrowRequests);
});

app.get('/api/item-requests', authenticateToken, async (req, res) => {
  try {
    const borrowRequests = await query(
      `SELECT br.request_id, br.item_id, br.status, br.requested_start, br.requested_end, 
              br.reason, br.rejectionReason, i.name AS item_name, i.owner_id, u.first_name, u.last_name
       FROM BorrowRequests br
       JOIN Items i ON br.item_id = i.item_id
       JOIN Users u ON br.borrower_id = u.user_id
       WHERE i.owner_id = ?`,
      [req.user.userId]  // Only fetch requests for items owned by the logged-in user
    );
    
    res.json({ requests: borrowRequests });  // Return the result as JSON
  } catch (err) {
    console.error('Error fetching requests:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/item_status', authenticateToken, async (req, res) => {
  const { item_id, status } = req.body;  // Destructure item_id and status from request body

  if (!item_id || !status) {
    return res.status(400).json({ error: 'Item ID and status are required.' });
  }

  try {
    const [item] = await query('SELECT * FROM items WHERE item_id = ? AND owner_id = ?', [item_id, req.user.userId]);

    if (!item) {
      return res.status(404).json({ error: 'Item not found or you do not own this item.' });
    }

    await query('UPDATE borrowrequests SET status = ? WHERE item_id = ?', [status, item_id]);

    res.json({ message: 'Item status updated successfully.' });
  } catch (err) {
    console.error('Error updating item status:', err);
    res.status(500).json({ error: 'Server error while updating item status.' });
  }
});

// --- GET MY BORROW REQUESTS ROUTE ---
// Get all borrow requests where the borrower_id matches the logged-in user's user_id
app.get('/api/my-requests', authenticateToken, async (req, res) => {
  try {
    // Query the database to get all borrow requests for the logged-in user
    const borrowRequests = await query(
      `SELECT       
      br.request_id,
      br.item_id,
      br.status,
      br.requested_start,
      br.requested_end,
      br.reason,
      br.rejectionReason,
      i.name AS item_name,
      i.owner_id,
      u.first_name,
      u.last_name,
      i.image_url
       FROM BorrowRequests br
       JOIN Items i ON br.item_id = i.item_id
       JOIN Users u ON br.borrower_id = u.user_id
       WHERE br.borrower_id = ?`, // Fetch requests where borrower_id matches the logged-in user
      [req.user.userId]  // Use the user_id from the token (authenticated user)
    );

    // If no borrow requests are found, return a 404 error
    if (borrowRequests.length === 0) {
      return res.status(404).json({ message: 'No borrow requests found.' });
    }

    // Return the found borrow requests
    res.json({ requests: borrowRequests });

  } catch (err) {
    console.error('Error fetching borrow requests:', err);
    res.status(500).json({ error: 'Server error while fetching borrow requests.' });
  }
});


//This one
app.put('/api/edit-item', authenticateToken, async (req, res) => {
  const { item_id, name, description, image_url } = req.body;
  const userId = req.user.userId;

  if (!item_id || !name) {
    return res.status(400).json({ message: 'Item ID and name are required.' });
  }

  try {
    await query(
      `
      UPDATE items
      SET name = ?, description = ?, image_url = ?
      WHERE item_id = ? AND owner_id = ?
      `,
      [name, description || null, image_url || null, item_id, userId]
    );

    res.json({ message: 'Item updated successfully' });
  } catch (err) {
    console.error('Edit item error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// --- LOGOUT ROUTE ---
app.post('/api/logout', (req, res) => {
  res.json({ message: 'Logged out successfully.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
