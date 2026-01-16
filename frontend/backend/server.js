// server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { query } = require('./config/database');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'toolshare-2025-final-project';

// ================= Middleware =================
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static('uploads'));

// ================= Multer Config =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'), false);
    }
  }
});

// ================= JWT Authentication =================
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// ================= LOGIN =================
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [user] = await query('SELECT * FROM users WHERE username = ?', [username]);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        user_type: user.user_type,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ================= REGISTER =================
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, user_type = 'Student', first_name, last_name, student_id } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (username, email, password, user_type, first_name, last_name, student_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashed, user_type, first_name || null, last_name || null, student_id || null]
    );
    const token = jwt.sign({ userId: result.insertId }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      message: 'Registered successfully',
      token,
      user: { user_id: result.insertId, username, user_type }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(400).json({ error: 'Username or email already exists' });
  }
});

// ================= GET CURRENT USER =================
app.get('/api/getUser', authenticateToken, async (req, res) => {
  try {
    const [user] = await query(
      'SELECT user_id, username, email, first_name, last_name, user_type FROM users WHERE user_id = ?',
      [req.user.userId]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ================= GET ALL ITEMS =================
app.get('/api/items', async (req, res) => {
  try {
    const items = await query(`
      SELECT i.*, u.username as owner_name, c.name as category_name
      FROM items i
      JOIN users u ON i.owner_id = u.user_id
      LEFT JOIN categories c ON i.category_id = c.category_id
      ORDER BY i.item_id DESC
    `);
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load items' });
  }
});

// ================= ADD ITEM =================
app.post(
  '/api/items',
  authenticateToken,
  upload.single('image'),
  async (req, res) => {
    try {
      const { name, description, serial_number, category_id } = req.body;
      const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
      await query(
        `INSERT INTO items
         (name, faculty_id, description, image_url, owner_id, serial_number, category_id)
         VALUES (?, 1, ?, ?, ?, ?, ?)`,
        [name, description || null, imagePath, req.user.userId, serial_number || null, category_id || null]
      );
      res.json({ message: 'Item added successfully!' });
    } catch (err) {
      console.error('Add item error:', err);
      res.status(500).json({ error: 'Failed to add item' });
    }
  }
);

// ================= DELETE ITEM =================
app.delete('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'DELETE FROM items WHERE item_id = ? AND owner_id = ?',
      [id, req.user.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(403).json({ error: 'Not allowed to delete this item or it does not exist' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Delete item error:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// ================= BORROW REQUEST =================
app.post('/api/borrow-requests', authenticateToken, async (req, res) => {
  try {
    const { item_id, requested_start, requested_end, reason } = req.body;

    // 1. Check time validity
    if (new Date(requested_start) >= new Date(requested_end)) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    // 2. Check for overlapping requests for this item
    const conflicts = await query(
      `
      SELECT *
      FROM borrowrequests
      WHERE item_id = ?
        AND status IN ('Pending','Approved')
        AND NOT (
          requested_end   <= ? OR
          requested_start >= ?
        )
      `,
      [item_id, requested_start, requested_end]
    );

    if (conflicts.length > 0) {
      return res.status(409).json({ error: 'This time slot conflicts with another booking' });
    }

    // 3. If no conflict, insert new request
    await query(
      `INSERT INTO borrowrequests
       (borrower_id, item_id, requested_start, requested_end, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.userId, item_id, requested_start, requested_end, reason]
    );

    res.json({ message: 'Request submitted successfully!' });
  } catch (err) {
    console.error('Borrow request error:', err);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

// ================= GET MY REQUESTS =================
app.get('/api/my-requests', authenticateToken, async (req, res) => {
  try {
    const requests = await query(`
      SELECT br.*, i.name as item_name, i.image_url
      FROM borrowrequests br
      JOIN items i ON br.item_id = i.item_id
      WHERE br.borrower_id = ?
      ORDER BY br.request_id DESC
    `, [req.user.userId]);
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load requests' });
  }
});

// ================= GET INCOMING REQUESTS =================
app.get('/api/item-requests', authenticateToken, async (req, res) => {
  try {
    const requests = await query(`
      SELECT br.*, i.name as item_name, i.image_url, u.username as borrower_name
      FROM borrowrequests br
      JOIN items i ON br.item_id = i.item_id
      JOIN users u ON br.borrower_id = u.user_id
      WHERE i.owner_id = ? AND br.status = 'Pending'
    `, [req.user.userId]);
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load requests' });
  }
});

// ================= UPDATE REQUEST STATUS =================
app.put('/api/borrow-requests/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await query(
      'UPDATE borrowrequests SET status = ? WHERE request_id = ?',
      [status, id]
    );
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

// ================= TEST ROUTE =================
app.get('/', (req, res) => {
  res.json({ message: 'ToolShare Backend Running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
