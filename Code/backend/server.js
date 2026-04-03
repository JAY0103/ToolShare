// server.js
require("dotenv").config();
console.log("ENV CHECK:", process.env.DB_HOST);
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const crypto = require("crypto");
const mysql = require("mysql2");
const nodemailer = require("nodemailer");

// -------------------- Constants --------------------
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || "";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://54.85.60.202"
const GMAIL_USER = process.env.GMAIL_USER || "toolsharecapstone@gmail.com";
const GMAIL_PASS = process.env.GMAIL_PASS || "";

// -------------------- Create app --------------------
const app = express();

// -------------------- Middleware --------------------
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS (safe defaults for JWT in Authorization header)
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

//Email function
const mailer = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS
  },
});

async function sendReturnedEmail(toEmail, itemName) {
  if (!toEmail) return;

  await mailer.sendMail({
    from: `"ToolShare" <${GMAIL_USER}>`,
    to: toEmail,
    subject: "ToolShare: Item Returned",
    text: `Hello,

Your ToolShare booking for ${itemName} has been marked as returned.

Thank you for using ToolShare.`,
    
    html: `
      <p>Hello,</p>
      <p>Your ToolShare booking for <strong>${itemName}</strong> has been marked as <b>returned</b>.</p>
      <p>Thank you for using ToolShare.</p>
    `
  });
}

async function sendApprovedEmail(toEmail, itemName) {
  if (!toEmail) return;

  await mailer.sendMail({
    from: `"ToolShare" <${GMAIL_USER}>`,
    to: toEmail,
    subject: "ToolShare: Request Approved",
    text: `Hello,

Your ToolShare booking for ${itemName} has been approved.

Thank you for using ToolShare.`,

    html: `
      <p>Hello,</p>
      <p>Your ToolShare booking for <strong>${itemName}</strong> has been marked as <b>approved</b>.</p>
      <p>Thank you for using ToolShare.</p>
    `
  });
}

async function sendRejectedEmail(toEmail, itemName, rejectionReason) {
  if (!toEmail) return;

  await mailer.sendMail({
    from: `"ToolShare" <${GMAIL_USER}>`,
    to: toEmail,
    subject: "ToolShare: Request Rejected",
    text: `Hello,

Your ToolShare booking for ${itemName} has been rejected.
Reason: ${rejectionReason}

Thank you for using ToolShare.`,

    html: `
      <p>Hello,</p>
      <p>Your ToolShare booking for <strong>${itemName}</strong> has been marked as <b>rejected</b>.</p>
      <p>Reason: ${rejectionReason}</p>
      <p>Thank you for using ToolShare.</p>
    `
  });
}

async function sendOverdueEmail(toEmail, itemName) {
  if (!toEmail) return;

  await mailer.sendMail({
    from: `"ToolShare" <${GMAIL_USER}>`,
    to: toEmail,
    subject: "ToolShare: Item Overdue",
    text: `Hello,

Your ToolShare booking for ${itemName} is now overdue. Please return it as soon as possible.

Failure to return items may result in penalties.

Thank you for using ToolShare.`,

    html: `
      <p>Hello,</p>
      <p>Your ToolShare booking for <strong>${itemName}</strong> is now <b style="color:red">overdue</b>.</p>
      <p>Please return it as soon as possible. Failure to return items may result in penalties.</p>
      <p>Thank you for using ToolShare.</p>
    `
  });
}

async function sendCheckedOutEmail(toEmail, itemName) {
  if (!toEmail) return;

  await mailer.sendMail({
    from: `"ToolShare" <${GMAIL_USER}>`,
    to: toEmail,
    subject: "ToolShare: Item Checked Out",
    text: `Hello,

Your ToolShare booking for ${itemName} has been checked out. Please ensure you return it by the agreed end date.

Thank you for using ToolShare.`,

    html: `
      <p>Hello,</p>
      <p>Your ToolShare booking for <strong>${itemName}</strong> has been <b>checked out</b>.</p>
      <p>Please ensure you return it by the agreed end date.</p>
      <p>Thank you for using ToolShare.</p>
    `
  });
}

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MySQL Connection
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || "3306",
  user: process.env.DB_USER || "toolshare",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "project",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to MySQL database:", err);
    return;
  }
  console.log("Connected to MySQL database.");
  connection.release();
});

// Helper: Query function
const query = async (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// -------------------- Auth Middleware --------------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

// Role helpers (uses JWT role)
const roleLower = (req) => String(req.user?.role || "").toLowerCase();
const isAdmin = (req) => roleLower(req) === "admin";
const isStaff = (req) => ["faculty", "admin"].includes(roleLower(req));

// -------------------- Upload Security --------------------
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Allowed MIME types for all image uploads
const allowedMime = new Set(["image/jpeg", "image/png", "image/webp"]);

function createImageUploader(dir) {
  // Ensure directory exists
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
      const safe = crypto.randomBytes(12).toString("hex");
      cb(null, `${Date.now()}-${safe}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      if (!allowedMime.has(file.mimetype))
        return cb(new Error("Only JPEG/PNG/WebP images are allowed"));
      cb(null, true);
    },
  });
}

// General uploads (uploads/)
const upload = createImageUploader(uploadsDir);

// Condition images (uploads/condition-images/)
const conditionUploadsDir = path.join(uploadsDir, "condition-images");
const uploadConditionImage = createImageUploader(conditionUploadsDir);

// -------------------- Notifications Helper --------------------
const createNotification = async (user_id, title, message, type = "info") => {
  const t = String(type || "").toLowerCase();

  const allowed = new Set([
    "info",
    "request",
    "approved",
    "rejected",
    "cancelled",
    "checkedout",
    "returned",
    "overdue",
  ]);

  const safeType = allowed.has(t) ? t : "info";

  await query(
    `INSERT INTO notifications (user_id, title, message, type)
     VALUES (?, ?, ?, ?)`,
    [user_id, title, message, safeType]
  );
};

// -------------------- Overdue Auto Mark --------------------
const autoMarkOverdue = async () => {
  // Find the requests that WILL become overdue before updating
  const toBeOverdue = await query(`
    SELECT br.request_id, br.borrower_id,
           i.name AS item_name,
           u.email AS borrower_email
    FROM borrowrequests br
    JOIN items i ON br.item_id = i.item_id
    JOIN users u ON br.borrower_id = u.user_id
    WHERE br.status = 'CheckedOut'
      AND br.requested_end < NOW()
  `);

  // Mark them overdue
  await query(`
    UPDATE borrowrequests
    SET status = 'Overdue'
    WHERE status = 'CheckedOut'
      AND requested_end < NOW()
  `);

  // Send notifications and emails for each newly overdue request
  for (const r of toBeOverdue) {
    createNotification(
      r.borrower_id,
      "Item overdue",
      `Your booking for "${r.item_name}" is overdue. Please return it immediately.`,
      "overdue"
    ).catch(err => console.error("Overdue notification failed:", err));

    sendOverdueEmail(r.borrower_email, r.item_name)
      .catch(err => console.error("Overdue email failed:", err));
  }
};

// -------------------- Routes --------------------
app.get("/", (req, res) => res.json({ message: "ToolShare Backend Running!" }));

// REGISTER (secure): ALWAYS creates Student
app.post("/api/register", async (req, res) => {
  const { first_name, last_name, student_id, username, email, password } = req.body;

  if (!first_name || !last_name || !student_id || !username || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (first_name, last_name, student_id, username, email, password, user_type)
       VALUES (?, ?, ?, ?, ?, ?, 'Student')`,
      [first_name, last_name, student_id, username, email, hashedPassword]
    );

    const token = jwt.sign(
      { userId: result.insertId, email, role: "Student" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Registered successfully.",
      token,
      user: { user_id: result.insertId, email, user_type: "Student" },
    });
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      const msg = String(err?.sqlMessage || "");
      if (msg.includes("email")) return res.status(409).json({ error: "Email already exists." });
      if (msg.includes("username")) return res.status(409).json({ error: "Username already exists." });
      return res.status(409).json({ error: "Duplicate entry." });
    }

    console.error("Register error:", err);
    res.status(500).json({ error: "Error registering user." });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "All fields are required." });

  try {
    const rows = await query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.user_type },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
        username: user.username,
        student_id: user.student_id,
      },
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET CURRENT USER
app.get("/api/getUser", authenticateToken, async (req, res) => {
  try {
    const rows = await query(
      "SELECT user_id, username, email, first_name, last_name, user_type FROM users WHERE user_id = ?",
      [req.user.userId]
    );
    res.json({ user: rows[0] || null });
  } catch (err) {
    console.error("getUser error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ADMIN: change user role
app.put("/api/admin/users/:id/role", authenticateToken, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });

  const userId = Number(req.params.id);
  const { user_type } = req.body;

  const allowed = new Set(["Student", "Faculty", "Admin"]);
  if (!userId) return res.status(400).json({ error: "Invalid user id" });
  if (!allowed.has(String(user_type))) return res.status(400).json({ error: "Invalid role" });

  try {
    await query(`UPDATE users SET user_type = ? WHERE user_id = ?`, [user_type, userId]);
    res.json({ message: "Role updated" });
  } catch (err) {
    console.error("role update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- Notifications --------------------
app.get("/api/notifications", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications = await query(
      `
      SELECT notification_id, title, message, type, is_read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
      `,
      [userId]
    );

    const unreadRows = await query(
      `SELECT COUNT(*) AS unreadCount
       FROM notifications
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    res.json({
      notifications,
      unreadCount: unreadRows?.[0]?.unreadCount || 0,
    });
  } catch (err) {
    console.error("notifications get error:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.put("/api/notifications/:id/read", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: "Invalid notification id" });

    await query(
      `UPDATE notifications
       SET is_read = 1
       WHERE notification_id = ? AND user_id = ?`,
      [id, userId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("notifications read error:", err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

app.put("/api/notifications/read-all", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    await query(
      `UPDATE notifications
       SET is_read = 1
       WHERE user_id = ?`,
      [userId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("notifications read-all error:", err);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

// -------------------- CATEGORIES --------------------
app.get("/api/categories", authenticateToken, async (req, res) => {
  try {
    const categories = await query(
      `SELECT category_id, name, description
       FROM categories
       ORDER BY name ASC`
    );
    res.json({ categories });
  } catch (err) {
    console.error("get categories error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// faculty/admin can create categories
app.post("/api/categories", authenticateToken, async (req, res) => {
  const { name, description } = req.body;
  if (!name || !String(name).trim()) return res.status(400).json({ error: "Category name is required." });

  try {
    if (!isStaff(req)) return res.status(403).json({ error: "Only faculty/admin can create categories." });

    await query(
      `INSERT INTO categories (name, description)
       VALUES (?, ?)`,
      [String(name).trim(), description || null]
    );

    res.json({ message: "Category created" });
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Category already exists." });
    console.error("create category error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- ITEMS --------------------
app.get("/api/items", authenticateToken, async (req, res) => {
  try {
    const items = await query(`
      SELECT i.*,
             u.username AS owner_name,
             c.name AS category_name
      FROM items i
      JOIN users u ON i.owner_id = u.user_id
      LEFT JOIN categories c ON i.category_id = c.category_id
      ORDER BY i.item_id DESC
    `);

    res.json({ items });
  } catch (err) {
    console.error("get items error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ITEMS CREATE (faculty/admin only)
app.post("/api/items", authenticateToken, upload.single("image"), async (req, res) => {
  const { name, description, serial_number, category_id } = req.body;
  const owner_id = req.user.userId;

  if (!name || !description) {
    return res.status(400).json({ error: "Name and description are required." });
  }

  try {
    if (!isStaff(req)) return res.status(403).json({ error: "Only faculty/admin can add items." });

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const catId = category_id ? Number(category_id) : null;

    await query(
      `INSERT INTO items (name, description, image_url, faculty_id, owner_id, serial_number, category_id)
       VALUES (?, ?, ?, 1, ?, ?, ?)`,
      [name, description, image_url, owner_id, serial_number || null, catId || null]
    );

    res.json({ message: "Item added successfully" });
  } catch (err) {
    console.error("add item error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ITEMS: DELETE (OWNER OR ADMIN)
app.delete("/api/items/:id", authenticateToken, async (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  if (!itemId) return res.status(400).json({ error: "Invalid item id" });

  try {
    if (!isAdmin(req)) {
      const rows = await query("SELECT item_id FROM items WHERE item_id = ? AND owner_id = ? LIMIT 1", [
        itemId,
        req.user.userId,
      ]);
      if (!rows[0]) return res.status(404).json({ error: "Item not found or not owned by you." });
    }

    await query("DELETE FROM items WHERE item_id = ?", [itemId]);
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("delete item error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// AVAILABILITY
app.get("/api/items/availability", authenticateToken, async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: "start and end are required" });

  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return res.status(400).json({ error: "Invalid date format." });
  if (e <= s) return res.status(400).json({ error: "end must be after start." });

  try {
    await autoMarkOverdue();

    const items = await query(
      `
      SELECT i.*, u.username AS owner_name, c.name AS category_name
      FROM items i
      JOIN users u ON i.owner_id = u.user_id
      LEFT JOIN categories c ON i.category_id = c.category_id
      WHERE NOT EXISTS (
        SELECT 1
        FROM borrowrequests br
        WHERE br.item_id = i.item_id
          AND br.status IN ('Approved','CheckedOut','Overdue')
          AND br.requested_start < ?
          AND br.requested_end > ?
      )
      ORDER BY i.item_id DESC
      `,
      [end, start]
    );

    res.json({ items });
  } catch (err) {
    console.error("availability error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/edit-item", authenticateToken, async (req, res) => {
  const { item_id, name, description, category_id, serial_number, quantity } = req.body;
  if (!item_id || !name) return res.status(400).json({ error: "Item ID and name are required." });

  if (quantity !== undefined && (isNaN(Number(quantity)) || Number(quantity) < 0)) {
    return res.status(400).json({ error: "Quantity must be a non-negative number." });
  }

  try {
    // Check permissions: admin can edit anything, tool owners can edit their own items
    if (!isAdmin(req)) {
      const rows = await query(
        `SELECT item_id FROM items WHERE item_id = ? AND owner_id = ? LIMIT 1`,
        [item_id, req.user.userId]
      );
      if (!rows[0]) return res.status(403).json({ error: "Not allowed" });
    }

    const catId = category_id ? Number(category_id) : null;
    const qty = quantity !== undefined ? Number(quantity) : null;

    // Update item details
    await query(
      `UPDATE items
       SET name = ?, description = ?, category_id = ?, serial_number = ?, quantity = ?
       WHERE item_id = ?`,
      [name, description || null, catId || null, serial_number || null, qty, item_id]
    );

    res.json({ message: "Item updated successfully" });
  } catch (err) {
    console.error("edit-item error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- BORROW / BOOKINGS --------------------

app.post("/api/book-item", authenticateToken, async (req, res) => {
  const { item_id, requested_start, requested_end, reason } = req.body;
  const borrower_id = req.user.userId;

  // --- Basic validation ---
  if (!item_id || !requested_start || !requested_end || !reason) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const start = new Date(requested_start);
  const end = new Date(requested_end);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: "Invalid date format." });
  }

  if (end <= start) {
    return res.status(400).json({ error: "End time must be after start time." });
  }

  try {
    // --- Auto mark overdue requests ---
    await autoMarkOverdue();

    // --- Fetch item category ---
    const itemRows = await query(
      `SELECT category_id FROM items WHERE item_id = ? LIMIT 1`,
      [item_id]
    );

    if (!itemRows.length) {
      return res.status(404).json({ error: "Item not found" });
    }

    const category_id = itemRows[0].category_id;

    // --- Fetch "Bulk Items" category ID dynamically ---
    const bulkRows = await query(
      `SELECT category_id FROM categories WHERE name = ? LIMIT 1`,
      ["Bulk Items"]
    );

    const bulkCategoryId = bulkRows.length ? bulkRows[0].category_id : null;

    // --- Determine booking status ---
    const status = category_id === bulkCategoryId ? "Approved" : "Pending";

    // --- Check for conflicts ---
    const conflicts = await query(
      `
      SELECT 1
      FROM borrowrequests
      WHERE item_id = ?
        AND status IN ('Approved','CheckedOut','Overdue')
        AND requested_start < ?
        AND requested_end > ?
      LIMIT 1
      `,
      [item_id, requested_end, requested_start]
    );

    if (conflicts.length > 0) {
      return res.status(409).json({ error: "This item is already booked for the selected time range." });
    }

    // --- Insert new booking ---
    const insertResult = await query(
      `
      INSERT INTO borrowrequests
        (item_id, borrower_id, requested_start, requested_end, reason, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      `,
      [item_id, borrower_id, requested_start, requested_end, reason, status]
    );

    res.status(201).json({
      message: `Booking ${status === "Approved" ? "approved" : "submitted"} successfully!`,
      bookingId: insertResult.insertId,
      status,
    });

  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/request-group", authenticateToken, async (req, res) => {
  const borrower_id = req.user.userId;
  const { reason, items } = req.body;

  if (!reason || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "reason and items[] are required." });
  }

  try {
    await autoMarkOverdue();

    const borrowerRows = await query(`SELECT first_name, last_name, username FROM users WHERE user_id = ? LIMIT 1`, [
      borrower_id,
    ]);
    const b = borrowerRows[0] || {};
    const borrowerName = `${b.first_name || ""} ${b.last_name || ""}`.trim() || b.username || "A student";

    const groupInsert = await query(
      `INSERT INTO request_groups (borrower_id, requested_start, requested_end, reason)
       VALUES (?, NULL, NULL, ?)`,
      [borrower_id, reason]
    );
    const group_id = groupInsert.insertId;

    const created = [];
    const failed = [];
    const ownerAgg = new Map();

    for (const it of items) {
      const item_id = Number(it?.item_id);
      const requested_start = it?.requested_start;
      const requested_end = it?.requested_end;

      if (!item_id || !requested_start || !requested_end) {
        failed.push({ item_id: it?.item_id || null, error: "Missing item_id/requested_start/requested_end" });
        continue;
      }

      const start = new Date(requested_start);
      const end = new Date(requested_end);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
        failed.push({ item_id, error: "Invalid date range" });
        continue;
      }

      const itemRows = await query(`SELECT item_id, owner_id, name, category_id FROM items WHERE item_id = ? LIMIT 1`, [item_id]);
      if (!itemRows.length) {
        failed.push({ item_id, error: "Item not found" });
        continue;
      }

      const itemMeta = itemRows[0];

      if (Number(itemMeta.owner_id) === Number(borrower_id)) {
        failed.push({ item_id, error: "You cannot request your own item" });
        continue;
      }

      const conflicts = await query(
        `
        SELECT 1
        FROM borrowrequests
        WHERE item_id = ?
          AND status IN ('Approved','CheckedOut','Overdue')
          AND requested_start < ?
          AND requested_end > ?
        LIMIT 1
        `,
        [item_id, requested_end, requested_start]
      );

      if (conflicts.length) {
        failed.push({ item_id, error: "Item already booked for that time range" });
        continue;
      }

      //Enforce booking limit (account for created in this loop)
      const activeCountRows = await query(
        `
        SELECT COUNT(*) AS count
        FROM borrowrequests
        WHERE borrower_id = ?
          AND status IN ('Pending','Approved','CheckedOut','Overdue')
        `,
        [borrower_id]
      );

      const currentTotal = activeCountRows[0].count + created.length;

      if (currentTotal >= 5) {
        failed.push({ item_id, error: "Booking limit reached" });
        continue;
      }

      const autoApproveRows = await query(
        `SELECT auto_approve FROM categories WHERE category_id = ? LIMIT 1`,
        [itemMeta.category_id]
      );
      const status = autoApproveRows[0]?.auto_approve ? "Approved" : "Pending";

      const ins = await query(
        `INSERT INTO borrowrequests
           (borrower_id, item_id, requested_start, requested_end, reason, status, request_group_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [borrower_id, item_id, requested_start, requested_end, reason, status, group_id]
      );

      created.push({ request_id: ins.insertId, item_id, item_name: itemMeta.name });

      const owner_id = itemMeta.owner_id;
      if (!ownerAgg.has(owner_id)) ownerAgg.set(owner_id, { count: 0, itemNames: [] });
      const agg = ownerAgg.get(owner_id);
      agg.count += 1;
      agg.itemNames.push(itemMeta.name);
    }

    if (!created.length) {
      return res.status(409).json({ error: "No items could be requested (all failed).", failed_items: failed });
    }

    for (const [owner_id, agg] of ownerAgg.entries()) {
      const sampleNames = agg.itemNames.slice(0, 3).join(", ");
      const more = agg.itemNames.length > 3 ? ` +${agg.itemNames.length - 3} more` : "";
      createNotification(
        owner_id,
        "New basket request",
        `${borrowerName} requested ${agg.count} item(s): ${sampleNames}${more}`,
        "request"
      ).catch(err => {
        console.error("Notification failed:", err);
      });
    }

    res.json({
      message: "Basket request submitted",
      request_group_id: group_id,
      created_requests: created,
      failed_items: failed,
    });
  } catch (err) {
    console.error("request-group error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- CONDITION IMAGES ROUTES --------------------

// Upload a new condition image for a borrow request
app.post(
  "/api/borrowrequest/:id/condition-image",
  authenticateToken,
  uploadConditionImage.single("image"),
  async (req, res) => {
    try {
      const borrowRequestId = Number(req.params.id); 
      const { image_type } = req.body;

      if (!borrowRequestId || !["Before", "After"].includes(image_type)) {
        return res.status(400).json({ error: "Invalid borrow request ID or image type" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      // fetch item_id from borrowrequests
      const [borrowRequest] = await query(
        "SELECT request_id,item_id FROM borrowrequests WHERE request_id = ?",
        [borrowRequestId]
      );

      if (!borrowRequest) {
        return res.status(400).json({ error: "Borrow request not found" });
      }

      const itemId = borrowRequest.item_id;
      const filename = req.file.filename;

      // insert into conditionimages
      await query(
        `INSERT INTO conditionimages (item_id, borrow_request_id, filename, image_type)
         VALUES (?, ?, ?, ?)`,
        [itemId, borrowRequestId, filename, image_type]
      );

      res.json({ message: "Condition image uploaded successfully", image: { image_url: `/uploads/condition-images/${filename}`, image_type } });
    } catch (err) {
      console.error("condition-image upload error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

//Get all condition images for a borrow request

app.get("/api/borrowrequest/:id/condition-images", authenticateToken, async (req, res) => {
  const borrow_request_id = Number(req.params.id);
  if (!borrow_request_id) {
    return res.status(400).json({ error: "Invalid borrow request ID" });
  }

  try {
    console.log("Borrow request ID:", borrow_request_id);

    const sql = `
      SELECT 
        id,
        CONCAT('/uploads/condition-images/', filename) AS image_url,
        image_type,
        created_at
      FROM conditionimages
      WHERE borrow_request_id = ${borrow_request_id}
      ORDER BY created_at ASC
    `;

    const [images] = await query(sql);

    res.json({ images });
  } catch (err) {
    console.error("get condition images error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- Condition Images --------------------
// GET all condition images for an item
app.get("/api/condition-images/:item_id", authenticateToken, async (req, res) => {
  const item_id = Number(req.params.item_id);
  if (!item_id) return res.status(400).json({ error: "Invalid item_id" });

  try {
    const images = await query(
      `SELECT image_id AS id,
              CONCAT('/uploads/condition-images/', filename) AS image_url,
              image_type, 
              timestamp AS created_at
       FROM conditionimages
       WHERE item_id = ?
       ORDER BY created_at ASC`,
      [item_id]
    );

    res.json({ images });
  } catch (err) {
    console.error("get condition images error:", err);
    res.status(500).json({ error: "Failed to fetch condition images" });
  }
});

// POST a new condition image for an item
app.post(
  "/api/condition-images/:item_id",
  authenticateToken,
  uploadConditionImage.single("image"),
  async (req, res) => {
    const item_id = Number(req.params.item_id);
    if (!item_id) return res.status(400).json({ error: "Invalid item_id" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const filename = req.file.filename;
      const image_type = req.body.image_type === "After" ? "After" : "Before"; 

      const result = await query(
        `INSERT INTO conditionimages (item_id, borrow_request_id, filename, image_type)
         VALUES (?, NULL, ?, ?)`,
        [item_id, filename, image_type]
      );

      res.json({
        ok: true,
        image: { id: result.insertId, item_id, image_url: `/uploads/condition-images/${filename}`, image_type, created_at: new Date() },
      });
    } catch (err) {
      console.error("upload condition image error:", err);
      res.status(500).json({ error: "Failed to upload condition image" });
    }
  }
);
//Request-cancel

app.put("/api/request-cancel", authenticateToken, async (req, res) => {
  const { request_id } = req.body;
  if (!request_id) return res.status(400).json({ error: "request_id is required" });

  try {
    await autoMarkOverdue();

    const rows = await query(
      `
      SELECT br.request_id, br.status, br.borrower_id, br.item_id,
             i.owner_id, i.name AS item_name
      FROM borrowrequests br
      JOIN items i ON br.item_id = i.item_id
      WHERE br.request_id = ?
      LIMIT 1
      `,
      [request_id]
    );

    if (!rows.length) return res.status(404).json({ error: "Request not found" });

    const r = rows[0];

    // only the borrower can cancel (or admin)
    if (!isAdmin(req) && Number(r.borrower_id) !== Number(req.user.userId)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    if (r.status === "Cancelled") {
      return res.json({ message: "Request already cancelled." });
    }

    // allow cancel when Pending OR Approved
    if (!["Pending", "Approved"].includes(r.status)) {
      return res.status(409).json({ 
        error: `Cannot cancel. Current status is ${r.status}.` 
      });
    }

    await query(
      `
      UPDATE borrowrequests
      SET status = 'Cancelled'
      WHERE request_id = ?
      `,
      [request_id]
    );

    // notify owner
    createNotification(
      r.owner_id,
      "Request cancelled",
      `A student cancelled their request for "${r.item_name}".`,
      "cancelled"
    ).catch(err => {
    console.error("Notification failed:", err);
  });

    // notify borrower 
    createNotification(
      r.borrower_id,
      "Request cancelled",
      `You cancelled your request for "${r.item_name}".`,
      "cancelled"
    ).catch(err => {
    console.error("Notification failed:", err);
  });

    res.json({ message: "Request cancelled successfully." });
  } catch (err) {
    console.error("request-cancel error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/my-requests", authenticateToken, async (req, res) => {
  try {
    await autoMarkOverdue();

    const borrowRequests = await query(
      `
      SELECT br.request_id, br.item_id, br.status, br.requested_start, br.requested_end,
             br.reason, br.rejectionReason,
             br.request_group_id,
             br.checked_out_at, br.returned_at,
             i.name AS item_name, i.image_url
      FROM borrowrequests br
      JOIN items i ON br.item_id = i.item_id
      WHERE br.borrower_id = ?
      ORDER BY br.request_id DESC
      `,
      [req.user.userId]
    );

    res.json({ requests: borrowRequests });
  } catch (err) {
    console.error("my-requests error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Owner incoming requests (owner view) / Admin can see all requests here 
app.get("/api/item-requests", authenticateToken, async (req, res) => {
  try {
    await autoMarkOverdue();

    // Only faculty/admin should access incoming requests
    if (!isStaff(req)) return res.status(403).json({ error: "Forbidden" });

    let sql = `
      SELECT br.request_id, br.item_id, br.status, br.requested_start, br.requested_end,
             br.reason, br.rejectionReason,
             br.request_group_id,
             br.checked_out_at, br.returned_at,
             br.created_at,
             i.name AS item_name, i.image_url,
             u.first_name, u.last_name, u.username AS borrower_name
      FROM borrowrequests br
      JOIN items i ON br.item_id = i.item_id
      JOIN users u ON br.borrower_id = u.user_id
    `;

    const params = [];

    // Faculty (tool owner): only requests for their items
    // Admin can sees everything
    if (!isAdmin(req)) {
      sql += ` WHERE i.owner_id = ? `;
      params.push(req.user.userId);
    }

    sql += ` ORDER BY br.request_id DESC `;

    const borrowRequests = await query(sql, params);
    res.json({ requests: borrowRequests });
  } catch (err) {
    console.error("item-requests error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// OWNER ITEMS (filters)
// Admin can see all items here (for dropdown)
app.get("/api/owner/items", authenticateToken, async (req, res) => {
  try {
    let items;
    if (isAdmin(req)) {
      items = await query(
        `SELECT item_id, name
         FROM items
         ORDER BY name ASC`
      );
    } else {
      items = await query(
        `SELECT item_id, name
         FROM items
         WHERE owner_id = ?
         ORDER BY name ASC`,
        [req.user.userId]
      );
    }

    res.json({ items });
  } catch (err) {
    console.error("owner items error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// OWNER BOOKING HISTORY (Faculty => own items, Admin => ALL)
app.get("/api/owner/booking-history", authenticateToken, async (req, res) => {
  try {
    await autoMarkOverdue();

    const { search = "", status = "", from = "", to = "", item_id = "" } = req.query;

    const where = [];
    const params = [];

    // Faculty: only their owned items
    // Admin: see everything (no owner filter)
    if (!isAdmin(req)) {
      where.push("i.owner_id = ?");
      params.push(req.user.userId);
    }

    if (status && String(status).trim()) {
      where.push("br.status = ?");
      params.push(String(status).trim());
    }
    if (item_id && !isNaN(Number(item_id))) {
      where.push("br.item_id = ?");
      params.push(Number(item_id));
    }
    if (from && String(from).trim()) {
      where.push("br.requested_start >= ?");
      params.push(String(from).trim());
    }
    if (to && String(to).trim()) {
      where.push("br.requested_start <= ?");
      params.push(String(to).trim());
    }

    if (search && String(search).trim()) {
      const s = `%${String(search).trim()}%`;
      where.push(`
        (
          u.email LIKE ?
          OR u.student_id LIKE ?
          OR u.username LIKE ?
          OR u.first_name LIKE ?
          OR u.last_name LIKE ?
          OR CONCAT(u.first_name, ' ', u.last_name) LIKE ?
        )
      `);
      params.push(s, s, s, s, s, s);
    }

    const sql = `
      SELECT
        br.request_id,
        br.item_id,
        i.name AS item_name,
        i.image_url AS item_image_url,

        br.status,
        br.requested_start,
        br.requested_end,
        br.reason,
        br.rejectionReason,
        br.request_group_id,
        br.checked_out_at,
        br.returned_at,

        u.user_id AS borrower_user_id,
        u.first_name,
        u.last_name,
        u.username AS borrower_username,
        u.email AS borrower_email,
        u.student_id AS borrower_student_id,

        owner.user_id AS owner_user_id,
        owner.username AS owner_username,
        owner.email AS owner_email
      FROM borrowrequests br
      JOIN items i ON br.item_id = i.item_id
      JOIN users u ON br.borrower_id = u.user_id
      JOIN users owner ON i.owner_id = owner.user_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY br.request_id DESC
      LIMIT 500
    `;

    const rows = await query(sql, params);
    res.json({ requests: rows });
  } catch (err) {
    console.error("owner booking history error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ADMIN: all requests with filters
app.get("/api/admin/requests", authenticateToken, async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });

    await autoMarkOverdue();

    const { q = "", status = "", start = "", end = "" } = req.query;

    let sql = `
      SELECT br.*,
             i.name AS item_name, i.image_url, i.owner_id,
             owner.username AS owner_name,
             u.first_name, u.last_name, u.username AS borrower_name,
             u.email, u.student_id
      FROM borrowrequests br
      JOIN items i ON br.item_id = i.item_id
      JOIN users u ON br.borrower_id = u.user_id
      JOIN users owner ON i.owner_id = owner.user_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ` AND br.status = ?`;
      params.push(status);
    }

    if (q) {
      const like = `%${q}%`;
      sql += ` AND (
        u.email LIKE ? OR u.username LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.student_id LIKE ?
      )`;
      params.push(like, like, like, like, like);
    }

    if (start) {
      sql += ` AND br.requested_start >= ?`;
      params.push(start);
    }
    if (end) {
      sql += ` AND br.requested_end <= ?`;
      params.push(end);
    }

    sql += ` ORDER BY br.request_id DESC LIMIT 1000`;

    const rows = await query(sql, params);
    res.json({ requests: rows });
  } catch (err) {
    console.error("admin requests error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ADMIN: reports summary
app.get("/api/admin/reports/summary", authenticateToken, async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });

    await autoMarkOverdue();

    const statusCounts = await query(`
      SELECT status, COUNT(*) AS count
      FROM borrowrequests
      GROUP BY status
    `);

    const topTools = await query(`
      SELECT i.item_id, i.name, COUNT(*) AS total_requests
      FROM borrowrequests br
      JOIN items i ON br.item_id = i.item_id
      GROUP BY i.item_id, i.name
      ORDER BY total_requests DESC
      LIMIT 10
    `);

    const topBorrowers = await query(`
      SELECT u.user_id, u.first_name, u.last_name, u.email, u.student_id, COUNT(*) AS total_requests
      FROM borrowrequests br
      JOIN users u ON br.borrower_id = u.user_id
      GROUP BY u.user_id, u.first_name, u.last_name, u.email, u.student_id
      ORDER BY total_requests DESC
      LIMIT 10
    `);

    res.json({ statusCounts, topTools, topBorrowers });
  } catch (err) {
    console.error("admin reports error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// APPROVE/REJECT (Pending only) - Owner OR Admin
app.put("/api/request-status", authenticateToken, async (req, res) => {
  const { request_id, status, decision_note } = req.body;

  if (!request_id || !status) return res.status(400).json({ error: "request_id and status are required." });
  if (decision_note && String(decision_note).length > 500) {
    return res.status(400).json({ error: "Decision note too long (max 500 chars)." });
  }
  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ error: "This endpoint supports only Approved or Rejected." });
  }

  try {
    await autoMarkOverdue();

    const rows = await query(
      `
      SELECT br.request_id, br.item_id, br.borrower_id, br.requested_start, br.requested_end,
       br.status AS current_status,
       i.owner_id,
       i.name AS item_name,
       u.email
	FROM borrowrequests br
	JOIN items i ON br.item_id = i.item_id
	JOIN users u ON br.borrower_id = u.user_id
	WHERE br.request_id = ?
	LIMIT 1
      `,
      [request_id]
    );

    if (!rows.length) return res.status(404).json({ error: "Request not found" });

    const reqRow = rows[0];

    if (!isAdmin(req) && Number(reqRow.owner_id) !== Number(req.user.userId)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    if (reqRow.current_status !== "Pending") {
      return res.status(409).json({ error: `Cannot change status from ${reqRow.current_status}.` });
    }

    if (status === "Approved") {
      const conflicts = await query(
        `
SELECT br.request_id, u.email
FROM borrowrequests br
JOIN users u ON br.borrower_id = u.user_id
WHERE br.item_id = ?
  AND br.status IN ('Approved','CheckedOut','Overdue')
  AND br.request_id <> ?
  AND br.requested_start < ?
  AND br.requested_end > ?
LIMIT 1;
        `,
        [reqRow.item_id, request_id, reqRow.requested_end, reqRow.requested_start]
      );

      if (conflicts.length) {
        return res.status(409).json({
          error: "Cannot approve. This item is already booked for an overlapping time range.",
        });
      }
    }

    await query(`UPDATE borrowrequests SET status = ?, rejectionReason = ? WHERE request_id = ?`, [
      status,
      decision_note || null,
      request_id,
    ]);

    if (status === "Approved") {

	sendApprovedEmail(reqRow.email, reqRow.item_name)
        .catch(err => console.error("Returned email failed:", err));

      createNotification(
        reqRow.borrower_id,
        "Request approved",
        `Your request for "${reqRow.item_name}" was approved.`,
        "approved"
      ).catch(err => {
    console.error("Notification failed:", err);
  });
    } else {
      const notePart = decision_note ? ` Note: ${decision_note}` : "";

	sendRejectedEmail(reqRow.email, reqRow.item_name, notePart)
  	.catch(err => console.error("Returned email failed:", err));

      createNotification(
        reqRow.borrower_id,
        "Request rejected",
        `Your request for "${reqRow.item_name}" was rejected.${notePart}`,
        "rejected"
      ).catch(err => {
    console.error("Notification failed:", err);
  });
    }

    res.json({ message: "Request status updated successfully." });
  } catch (err) {
    console.error("request-status error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// CHECKOUT - Owner OR Admin
app.put("/api/request-checkout", authenticateToken, async (req, res) => {
  const { request_id } = req.body;
  if (!request_id) return res.status(400).json({ error: "request_id is required" });

  try {
    await autoMarkOverdue();

    const rows = await query(
      `
      SELECT br.request_id, br.status, br.borrower_id,
             i.owner_id, i.name AS item_name
      FROM borrowrequests br
      JOIN items i ON br.item_id = i.item_id
      WHERE br.request_id = ?
      LIMIT 1
      `,
      [request_id]
    );

    if (!rows.length) return res.status(404).json({ error: "Request not found" });
    const r = rows[0];

    if (!isAdmin(req) && Number(r.owner_id) !== Number(req.user.userId)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    if (r.status !== "Approved") {
      return res.status(409).json({ error: `Cannot checkout. Current status is ${r.status}.` });
    }

    await query(
      `
      UPDATE borrowrequests
      SET status = 'CheckedOut', checked_out_at = NOW()
      WHERE request_id = ?
      `,
      [request_id]
    );

    createNotification(
      r.borrower_id,
      "Item checked out",
      `Your booking for "${r.item_name}" has been checked out.`,
      "checkedout"
    ).catch(err => console.error("Notification failed:", err));

    // Get borrower email for checkout notification
    query(
      `SELECT u.email FROM users u WHERE u.user_id = ?`,
      [r.borrower_id]
    ).then(rows => {
      if (rows[0]?.email) {
        sendCheckedOutEmail(rows[0].email, r.item_name)
          .catch(err => console.error("Checkout email failed:", err));
      }
    }).catch(err => console.error("Checkout email query failed:", err));

    res.json({ message: "Checked out successfully" });
  } catch (err) {
    console.error("request-checkout error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// RETURN - Owner OR Admin
app.put("/api/request-return", authenticateToken, async (req, res) => {
  const { request_id } = req.body;
  if (!request_id) return res.status(400).json({ error: "request_id is required" });

  try {
    await autoMarkOverdue();

    const rows = await query(
      `
      SELECT br.request_id, 
       br.status, 
       br.borrower_id,
       u.email AS borrower_email,
       i.owner_id, 
       i.name AS item_name
	FROM borrowrequests br
	JOIN items i ON br.item_id = i.item_id
	JOIN users u ON br.borrower_id = u.user_id
	WHERE br.request_id = ?
	LIMIT 1;
      `,
      [request_id]
    );

    if (!rows.length) return res.status(404).json({ error: "Request not found" });
    const r = rows[0];

    if (!isAdmin(req) && Number(r.owner_id) !== Number(req.user.userId)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    if (!["CheckedOut", "Overdue"].includes(r.status)) {
      return res.status(409).json({ error: `Cannot return. Current status is ${r.status}.` });
    }

    await query(
      `
      UPDATE borrowrequests
      SET status = 'Returned', returned_at = NOW()
      WHERE request_id = ?
      `,
      [request_id]
    );

	 sendReturnedEmail(r.borrower_email, r.item_name)
  	.catch(err => console.error("Returned email failed:", err));

    createNotification(
      r.borrower_id,
      "Item returned",
      `Your booking for "${r.item_name}" has been marked returned.`,
      "returned"
    ).catch(err => {
    console.error("Notification failed:", err);
  });

    res.json({ message: "Returned successfully" });
  } catch (err) {
    console.error("request-return error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


//OVERDUE LIST
app.get("/api/overdue-requests", authenticateToken, async (req, res) => {
  try {
    await autoMarkOverdue();

    if (isAdmin(req)) {
      const overdue = await query(
        `
        SELECT br.request_id, br.item_id, br.status, br.requested_start, br.requested_end,
               br.checked_out_at, br.request_group_id,
               i.name AS item_name, i.image_url,
               u.first_name, u.last_name, u.username AS borrower_name,
               owner.username AS owner_name
        FROM borrowrequests br
        JOIN items i ON br.item_id = i.item_id
        JOIN users u ON br.borrower_id = u.user_id
        JOIN users owner ON i.owner_id = owner.user_id
        WHERE br.status = 'Overdue'
        ORDER BY br.requested_end ASC
        `
      );
      return res.json({ requests: overdue });
    }

    const overdue = await query(
      `
      SELECT br.request_id, br.item_id, br.status, br.requested_start, br.requested_end,
             br.checked_out_at, br.request_group_id,
             i.name AS item_name, i.image_url,
             u.first_name, u.last_name, u.username AS borrower_name
      FROM borrowrequests br
      JOIN items i ON br.item_id = i.item_id
      JOIN users u ON br.borrower_id = u.user_id
      WHERE i.owner_id = ?
        AND br.status = 'Overdue'
      ORDER BY br.requested_end ASC
      `,
      [req.user.userId]
    );

    res.json({ requests: overdue });
  } catch (err) {
    console.error("overdue-requests error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- FORGOT / RESET PASSWORD --------------------
 
// Store reset tokens in memory for simplicity
const resetTokens = new Map(); // token -> { userId, email, expires }
 
app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });
 
  try {
    const rows = await query("SELECT user_id, email FROM users WHERE email = ? LIMIT 1", [email]);
    
    if (!rows.length) return res.json({ message: "If that email exists, a reset link has been sent." });
 
    const user = rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 1000 * 60 * 60; // 1 hour
 
    resetTokens.set(token, { userId: user.user_id, email: user.email, expires });
 
    const resetUrl = `${FRONTEND_URL}/reset-password/${token}`;
 
    await mailer.sendMail({
      from: `"ToolShare" <${GMAIL_USER}>`,
      to: user.email,
      subject: "ToolShare: Password Reset Request",
      text: `You requested a password reset.\n\nClick the link below (expires in 1 hour):\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
      html: `
        <p>You requested a password reset.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>
      `,
    });
 
    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("forgot-password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
 
app.post("/api/auth/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
 
  if (!token || !password) return res.status(400).json({ error: "Token and password are required." });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });
 
  const entry = resetTokens.get(token);
 
  if (!entry) return res.status(400).json({ error: "Invalid or expired reset token." });
  if (Date.now() > entry.expires) {
    resetTokens.delete(token);
    return res.status(400).json({ error: "Reset token has expired. Please request a new one." });
  }
 
  try {
    const hashed = await bcrypt.hash(password, 10);
    await query("UPDATE users SET password = ? WHERE user_id = ?", [hashed, entry.userId]);
    resetTokens.delete(token);
    res.json({ message: "Password reset successfully." });
  } catch (err) {
    console.error("reset-password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- Error handling (multer + generic) --------------------
app.use((err, req, res, next) => {
  if (err?.message?.includes("Only JPEG/PNG/WebP")) {
    return res.status(400).json({ error: err.message });
  }
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large (max 5MB)" });
  }
  return res.status(500).json({ error: "Server error" });
});

// -------------------- ADMIN: USERS --------------------
app.get("/api/admin/users", authenticateToken, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });
  try {
    const users = await query(
      `SELECT user_id, first_name, last_name, username, email, student_id, user_type
       FROM users ORDER BY user_id DESC`
    );
    res.json({ users });
  } catch (err) {
    console.error("admin get users error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/admin/users/:id", authenticateToken, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });
  const userId = Number(req.params.id);
  if (!userId) return res.status(400).json({ error: "Invalid user id" });
  if (userId === req.user.userId)
    return res.status(400).json({ error: "Cannot delete your own account" });
  try {
    await query(`DELETE FROM users WHERE user_id = ?`, [userId]);
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("admin delete user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- ADMIN: CATEGORIES --------------------
app.delete("/api/admin/categories/:id", authenticateToken, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });
  const categoryId = Number(req.params.id);
  if (!categoryId) return res.status(400).json({ error: "Invalid category id" });
  try {
    await query(`UPDATE items SET category_id = NULL WHERE category_id = ?`, [categoryId]);
    await query(`DELETE FROM categories WHERE category_id = ?`, [categoryId]);
    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error("admin delete category error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- ADMIN: FACULTIES --------------------
app.get("/api/admin/faculties", authenticateToken, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });
  try {
    const faculties = await query(`SELECT * FROM faculties ORDER BY faculty_id ASC`);
    res.json({ faculties });
  } catch (err) {
    console.error("admin get faculties error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/admin/faculties", authenticateToken, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });
  const { name, description } = req.body;
  if (!name || !String(name).trim())
    return res.status(400).json({ error: "Faculty name is required." });
  try {
    await query(
      `INSERT INTO faculties (name, description) VALUES (?, ?)`,
      [String(name).trim(), description || null]
    );
    res.json({ message: "Faculty created" });
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "Faculty already exists." });
    console.error("admin create faculty error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/admin/faculties/:id", authenticateToken, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });
  const facultyId = Number(req.params.id);
  if (!facultyId) return res.status(400).json({ error: "Invalid faculty id" });
  if (facultyId === 1)
    return res.status(400).json({ error: "Cannot delete the default General faculty." });
  try {
    await query(`UPDATE items SET faculty_id = 1 WHERE faculty_id = ?`, [facultyId]);
    await query(`DELETE FROM faculties WHERE faculty_id = ?`, [facultyId]);
    res.json({ message: "Faculty deleted" });
  } catch (err) {
    console.error("admin delete faculty error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- Start Server --------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://54.85.60.202:${PORT}`);
});
