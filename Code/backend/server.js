// server.js
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const multer = require("multer");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");

// Constants
const PORT = 3000;
const JWT_SECRET = "toolshare-2025-final-project";

// Create app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MySQL Connection
const db = mysql.createConnection({
  host: "localhost",
  port: "3306",
  user: "root",
  password: "",
  database: "project",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL database.");
});

// JWT Auth Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

// Helper: Query function
const query = async (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// Multer config for local upload storage
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Routes
app.get("/", (req, res) => res.json({ message: "ToolShare Backend Running!" }));

// REGISTER
app.post("/api/register", async (req, res) => {
  const { first_name, last_name, student_id, username, email, password, user_type } = req.body;

  if (!first_name || !last_name || !student_id || !username || !email || !password || !user_type) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      "INSERT INTO users (first_name, last_name, student_id, username, email, password, user_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [first_name, last_name, student_id, username, email, hashedPassword, user_type]
    );

    const token = jwt.sign({ userId: result.insertId, email }, JWT_SECRET, { expiresIn: "24h" });

    res.json({
      message: "Registered successfully.",
      token,
      user: { user_id: result.insertId, email, user_type },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error registering user." });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "All fields are required." });

  try {
    const rows = await query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });

    res.json({
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
      },
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET CURRENT USER
app.get("/api/getUser", authenticateToken, async (req, res) => {
  const rows = await query(
    "SELECT user_id, username, email, first_name, last_name, user_type FROM users WHERE user_id = ?",
    [req.user.userId]
  );
  res.json({ user: rows[0] || null });
});

// ITEMS: GET ALL
app.get("/api/items", authenticateToken, async (req, res) => {
  const items = await query(`
    SELECT i.*, u.username AS owner_name
    FROM items i
    JOIN users u ON i.owner_id = u.user_id
    ORDER BY i.item_id DESC
  `);

  res.json({ items });
});

// ITEMS IMAGE ADDED LOCALLY UPLOAD
app.post("/api/items", authenticateToken, upload.single("image"), async (req, res) => {
  const { name, description, serial_number } = req.body;
  const owner_id = req.user.userId;

  if (!name || !description) {
    return res.status(400).json({ error: "Name and description are required." });
  }

  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  await query(
    `INSERT INTO items (name, description, image_url, faculty_id, owner_id, serial_number)
     VALUES (?, ?, ?, 1, ?, ?)`,
    [name, description, image_url, owner_id, serial_number || null]
  );

  res.json({ message: "Item added successfully" });
});

// ITEMS: DELETE (OWNER ONLY)
app.delete("/api/items/:id", authenticateToken, async (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  if (!itemId) return res.status(400).json({ error: "Invalid item id" });

  // get item (to confirm owner + possibly remove file)
  const rows = await query("SELECT * FROM items WHERE item_id = ? AND owner_id = ?", [
    itemId,
    req.user.userId,
  ]);
  const item = rows[0];
  if (!item) return res.status(404).json({ error: "Item not found or not owned by you." });

  await query("DELETE FROM items WHERE item_id = ? AND owner_id = ?", [itemId, req.user.userId]);

  res.json({ message: "Item deleted successfully" });
});

// ITEMS: AVAILABILITY FILTER
// Returns items that do NOT overlap with APPROVED bookings in the selected range
app.get("/api/items/availability", authenticateToken, async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: "start and end are required" });

  const items = await query(
    `
    SELECT i.*, u.username AS owner_name
    FROM items i
    JOIN users u ON i.owner_id = u.user_id
    WHERE NOT EXISTS (
      SELECT 1
      FROM borrowrequests br
      WHERE br.item_id = i.item_id
        AND br.status = 'Approved'
        AND br.requested_start < ?
        AND br.requested_end > ?
    )
    ORDER BY i.item_id DESC
    `,
    [end, start]
  );

  res.json({ items });
});

// BORROW: CREATE REQUEST
app.post("/api/book-item", authenticateToken, async (req, res) => {
  const { item_id, requested_start, requested_end, reason } = req.body;
  const borrower_id = req.user.userId;

  if (!item_id || !requested_start || !requested_end || !reason) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const result = await query(
    `INSERT INTO borrowrequests (borrower_id, item_id, requested_start, requested_end, reason, status)
     VALUES (?, ?, ?, ?, ?, 'Pending')`,
    [borrower_id, item_id, requested_start, requested_end, reason]
  );

  res.json({ message: "Borrow request submitted successfully", request_id: result.insertId });
});

// BORROW: MY REQUESTS (student)
app.get("/api/my-requests", authenticateToken, async (req, res) => {
  const borrowRequests = await query(
    `
    SELECT br.request_id, br.item_id, br.status, br.requested_start, br.requested_end,
           br.reason, i.name AS item_name, i.image_url, u.first_name, u.last_name
    FROM borrowrequests br
    JOIN items i ON br.item_id = i.item_id
    JOIN users u ON br.borrower_id = u.user_id
    WHERE br.borrower_id = ?
    ORDER BY br.request_id DESC
    `,
    [req.user.userId]
  );

  res.json({ requests: borrowRequests });
});

// BORROW: INCOMING REQUESTS (faculty: items they own)
app.get("/api/item-requests", authenticateToken, async (req, res) => {
  const borrowRequests = await query(
    `
    SELECT br.request_id, br.item_id, br.status, br.requested_start, br.requested_end,
           br.reason, i.name AS item_name, i.image_url,
           u.first_name, u.last_name, u.username AS borrower_name
    FROM borrowrequests br
    JOIN items i ON br.item_id = i.item_id
    JOIN users u ON br.borrower_id = u.user_id
    WHERE i.owner_id = ?
    ORDER BY br.request_id DESC
    `,
    [req.user.userId]
  );

  res.json({ requests: borrowRequests });
});

// BORROW: UPDATE STATUS
app.put("/api/request-status", authenticateToken, async (req, res) => {
  const { request_id, status } = req.body;
  if (!request_id || !status) {
    return res.status(400).json({ error: "request_id and status are required." });
  }

  // ensure request belongs to an item owned by this faculty
  const rows = await query(
    `
    SELECT br.request_id
    FROM borrowrequests br
    JOIN items i ON br.item_id = i.item_id
    WHERE br.request_id = ? AND i.owner_id = ?
    `,
    [request_id, req.user.userId]
  );

  if (rows.length === 0) return res.status(403).json({ error: "Not allowed" });

  await query("UPDATE borrowrequests SET status = ? WHERE request_id = ?", [status, request_id]);

  res.json({ message: "Request status updated successfully." });
});

// EDIT ITEM (owner only)
app.put("/api/edit-item", authenticateToken, async (req, res) => {
  const { item_id, name, description } = req.body;
  const userId = req.user.userId;

  if (!item_id || !name) return res.status(400).json({ error: "Item ID and name are required." });

  await query(
    `UPDATE items SET name = ?, description = ? WHERE item_id = ? AND owner_id = ?`,
    [name, description || null, item_id, userId]
  );

  res.json({ message: "Item updated successfully" });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});