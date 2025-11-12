// server.js
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: 'supersecretkey', 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }, // 1 hour
  })
);

// --- Static Files ---
app.use(express.static(path.join(__dirname, 'public')));

// --- MySQL Connection ---
const db = mysql.createConnection({
  host: 'localhost',
  port: '3307',
  user: 'root',
  password: '', // your MySQL password
  database: 'project', // your database name
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database.');
});

// --- ROUTES ---

// Serve pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'public/signup.html')));

// Middleware to protect routes
function ensureLoggedIn(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  next();
}

// Serve protected pages
app.get('/home', ensureLoggedIn, (req, res) =>
  res.sendFile(path.join(__dirname, 'public/home.html'))
);



app.get('/book_item', ensureLoggedIn, (req, res) =>
  res.sendFile(path.join(__dirname, 'public/book_item.html'))
);

app.get('/my-bookings', ensureLoggedIn, (req, res) =>
  res.sendFile(path.join(__dirname, 'public/my-bookings.html'))
);


// --- SIGNUP ROUTE ---
app.post('/api/signup', async (req, res) => {
  const { username, email, password, user_type } = req.body;

  if (!username || !email || !password || !user_type)
    return res.status(400).json({ message: 'All fields are required.' });

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const sql = 'INSERT INTO Users (name, email, password, user_type) VALUES (?, ?, ?, ?)';
    db.query(sql, [username, email, hashedPassword, user_type], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Email already registered.' });
        }
        console.error(err);
        return res.status(500).json({ message: 'Database error.' });
      }
      res.status(201).json({ message: 'User registered successfully.' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// --- LOGIN ROUTE ---
app.post('/api/login', (req, res) => {
  const { email, password, user_type } = req.body;

  if (!email || !password || !user_type)
    return res.status(400).json({ message: 'All fields are required.' });

  const sql = 'SELECT * FROM Users WHERE email = ? AND user_type = ?';
  db.query(sql, [email, user_type], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error.' });
    }

    if (results.length === 0)
      return res.status(401).json({ message: 'Invalid email or user_type.' });

    const user = results[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid password.' });

    // Create session
    req.session.user = {
      id: user.user_id,
      name: user.name,
      email: user.email,
      user_type: user.user_type,
    };

    res.json({ message: 'Login successful', user: req.session.user });
  });
});


// Ensure only faculty members can see add-items and requested-bookings pages
function ensureFaculty(req, res, next) {
  if (req.session.user && req.session.user.user_type === 'Faculty') {
    next();
  } else {
    res.status(403).send("Access denied");
  }
}

app.get('/add_item', ensureLoggedIn, ensureFaculty, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/add_item.html'));
});

app.get('/requested-bookings', ensureLoggedIn, ensureFaculty, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/requested-bookings.html'));
});


// --- Debugging: print current user session ---
app.get('/api/getUser', (req, res) => {
  console.log('--- Current User Session ---');
  if (req.session.user) {
    Object.entries(req.session.user).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
    res.json({ message: 'User printed in server console', user: req.session.user });
  } else {
    console.log('No user session found.');
    res.json({ message: 'No user session found' });
  }
});

// --- ADD ITEM ROUTE ---
app.post('/api/add-item', ensureLoggedIn, (req, res) => {
  const { name, description, serial_number, image_url } = req.body;

  if (!name || !description) {
    return res.status(400).json({ message: 'Name and description are required.' });
  }

  const owner_id = req.session.user.id; // from user ession
  const faculty_id = 1;  // HARDCODED - NOTE: CHANGE LATER
  const category_id = 1; //HARDCODED - NOTE: CHANGE LATER

  const sql = `INSERT INTO items (name, description, image_url, faculty_id, owner_id, serial_number, category_id)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.query(sql, [name, description, image_url || null, faculty_id, owner_id, serial_number || null, category_id], (err, result) => {
    if (err) {
      console.error('Error inserting item:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    res.json({ message: 'Item added successfully', item_id: result.insertId });
  });
});


// Get all items
app.get('/api/items', ensureLoggedIn, (req, res) => {
  const sql = `
    SELECT items.item_id, items.name, items.description, items.image_url
    FROM items
    ORDER BY items.item_id DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

// Get a single item by id
app.get('/api/items/:id', ensureLoggedIn, (req, res) => {
  const sql = 'SELECT item_id, name, description, image_url FROM items WHERE item_id = ?';
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'Item not found' });
    res.json(results[0]);
  });
});

// --- BOOK ITEM ROUTE ---
app.post('/api/book-item', ensureLoggedIn, (req, res) => {
  const { item_id, requested_start, requested_end, reason } = req.body;
  const borrower_id = req.session.user.id;

  if (!item_id || !requested_start || !requested_end || !reason) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const sql = `INSERT INTO borrowrequests 
               (borrower_id, item_id, requested_start, requested_end, reason, status)
               VALUES (?, ?, ?, ?, ?, 'Pending')`;

  db.query(sql, [borrower_id, item_id, requested_start, requested_end, reason], (err, result) => {
    if (err) {
      console.error('Error creating borrow request:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    res.json({ message: 'Borrow request submitted successfully.', request_id: result.insertId });
  });
});

// Get all borrow requests for the logged-in user
app.get('/api/my-bookings', ensureLoggedIn, (req, res) => {
  const user_id = req.query.user_id;

  const sql = `
     SELECT b.request_id, b.item_id, b.status, b.requested_start, b.requested_end, i.name, i.description, i.image_url
    FROM borrowrequests b
    JOIN items i ON b.item_id = i.item_id
    WHERE b.borrower_id = ?
    ORDER BY b.request_id DESC
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

// Get borrow requests for items owned by the faculty
app.get('/api/requested-bookings', ensureLoggedIn, ensureFaculty, (req, res) => {
  const faculty_id = req.query.faculty_id;
  const sql = `
    SELECT b.request_id, b.borrower_id, b.item_id, b.requested_start, b.requested_end, b.reason, b.status,
           i.name, i.description, i.image_url,
           u.name AS borrower_name
    FROM borrowrequests b
    JOIN items i ON b.item_id = i.item_id
    JOIN users u ON b.borrower_id = u.user_id
    WHERE i.owner_id = ?
    ORDER BY b.request_id DESC
  `;

  db.query(sql, [faculty_id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});


// Update borrow request status (Approve or Reject)
app.post('/api/borrowrequests/update-status', ensureLoggedIn, ensureFaculty, (req, res) => {
  const { request_id, status } = req.body;

  if (!request_id || !['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid request' });
  }

  // Optional: ensure the faculty actually owns the item
  const sqlCheckOwner = `
    SELECT i.owner_id 
    FROM borrowrequests b
    JOIN items i ON b.item_id = i.item_id
    WHERE b.request_id = ?
  `;
  db.query(sqlCheckOwner, [request_id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ success: false, message: 'Request not found' });

    const owner_id = results[0].owner_id;
    if (owner_id !== req.session.user.id) {
      return res.status(403).json({ success: false, message: 'You do not own this item' });
    }

    const sqlUpdate = `UPDATE borrowrequests SET status = ? WHERE request_id = ?`;
    db.query(sqlUpdate, [status, request_id], (err2, result) => {
      if (err2) return res.status(500).json({ success: false, message: 'Database error' });
      res.json({ success: true, message: `Request ${status.toLowerCase()}` });
    });
  });
});



// --- LOGOUT ROUTE ---
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out successfully.' });
  });

});

// --- CHECK SESSION (optional) ---
app.get('/api/session', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// --- Start Server ---
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
