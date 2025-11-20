// server.js 
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('./config/database');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'toolshare-super-secret-key-2025';

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// JWT Auth Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { first_name, last_name, student_id, username, email, password, user_type } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO Users (first_name, last_name, student_id, username, email, password, user_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [first_name, last_name, student_id, username, email, hashed, user_type || 'Student']
    );
    const token = jwt.sign({ userId: result.insertId, username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: 'Registered', token, user: { user_id: result.insertId, username } });
  } catch (err) {
    res.status(400).json({ error: err.code === 'ER_DUP_ENTRY' ? 'Already exists' : 'Error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [user] = await query('SELECT * FROM Users WHERE username = ?', [username]);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.user_id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: 'Login success', token, user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/getUser', authenticateToken, async (req, res) => {
  const [user] = await query('SELECT user_id, username, email, first_name, last_name, user_type FROM Users WHERE user_id = ?', [req.user.userId]);
  res.json({ user });
});

app.get('/api/items', authenticateToken, async (req, res) => {
  const items = await query('SELECT i.*, u.username as owner_name FROM Items i JOIN Users u ON i.owner_id = u.user_id WHERE i.is_available = TRUE');
  res.json({ items });
});

app.post('/api/items', authenticateToken, async (req, res) => {
  const { name, description, image_url, serial_number } = req.body;
  await query('INSERT INTO Items (name, description, image_url, owner_id, serial_number) VALUES (?, ?, ?, ?, ?)', 
    [name, description, image_url || null, req.user.userId, serial_number || null]);
  res.json({ message: 'Item added' });
});

app.get('/', (req, res) => res.json({ message: 'ToolShare Backend Running!' }));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));