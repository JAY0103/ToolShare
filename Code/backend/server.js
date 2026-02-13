// server.js
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

// Constants
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "toolshare-2025-final-project";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Create app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

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

// Helper: Query function
const query = async (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Helper: Transaction wrapper (uses the same connection)
const withTransaction = async (fn) => {
  return new Promise((resolve, reject) => {
    db.beginTransaction(async (err) => {
      if (err) return reject(err);
      try {
        const result = await fn();
        db.commit((commitErr) => {
          if (commitErr) {
            return db.rollback(() => reject(commitErr));
          }
          resolve(result);
        });
      } catch (e) {
        db.rollback(() => reject(e));
      }
    });
  });
};

// JWT Auth Middleware
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

// Multer config for local upload storage
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// -------------------- Notifications Helpers --------------------
const createNotification = async (user_id, title, message, type = "info") => {
  await query(
    `INSERT INTO notifications (user_id, title, message, type)
     VALUES (?, ?, ?, ?)`,
    [user_id, title, message, type]
  );
};

// -------------------- Overdue Auto Mark --------------------
const autoMarkOverdue = async () => {
  await query(`
    UPDATE borrowrequests
    SET status = 'Overdue'
    WHERE status = 'CheckedOut'
      AND requested_end < NOW()
  `);
};

// -------------------- ROUTES --------------------
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
    console.error("Register error:", err);
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

// -------------------- Notifications Routes --------------------
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

// GET categories for dropdown
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

// Optional: faculty can create categories
app.post("/api/categories", authenticateToken, async (req, res) => {
  const { name, description } = req.body;
  if (!name || !String(name).trim()) return res.status(400).json({ error: "Category name is required." });

  try {
    const u = await query(`SELECT user_type FROM users WHERE user_id = ? LIMIT 1`, [req.user.userId]);
    if (!u[0] || String(u[0].user_type).toLowerCase() !== "faculty") {
      return res.status(403).json({ error: "Only faculty can create categories." });
    }

    await query(
      `INSERT INTO categories (name, description)
       VALUES (?, ?)`,
      [String(name).trim(), description || null]
    );

    res.json({ message: "Category created" });
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Category already exists." });
    }
    console.error("create category error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- ITEMS --------------------

// ITEMS GET ALL includes category_name
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

// ITEMS CREATE accepts category_id
app.post("/api/items", authenticateToken, upload.single("image"), async (req, res) => {
  const { name, description, serial_number, category_id } = req.body;
  const owner_id = req.user.userId;

  if (!name || !description) {
    return res.status(400).json({ error: "Name and description are required." });
  }

  try {
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

// ITEMS: DELETE (OWNER ONLY)
app.delete("/api/items/:id", authenticateToken, async (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  if (!itemId) return res.status(400).json({ error: "Invalid item id" });

  try {
    const rows = await query("SELECT * FROM items WHERE item_id = ? AND owner_id = ?", [
      itemId,
      req.user.userId,
    ]);
    const item = rows[0];
    if (!item) return res.status(404).json({ error: "Item not found or not owned by you." });

    await query("DELETE FROM items WHERE item_id = ? AND owner_id = ?", [itemId, req.user.userId]);

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("delete item error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// AVAILABILITY includes category_name
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

// EDIT ITEM can update category_id too
app.put("/api/edit-item", authenticateToken, async (req, res) => {
  const { item_id, name, description, category_id } = req.body;
  const userId = req.user.userId;

  if (!item_id || !name) return res.status(400).json({ error: "Item ID and name are required." });

  try {
    const catId = category_id ? Number(category_id) : null;

    await query(
      `UPDATE items
       SET name = ?, description = ?, category_id = ?
       WHERE item_id = ? AND owner_id = ?`,
      [name, description || null, catId || null, item_id, userId]
    );

    res.json({ message: "Item updated successfully" });
  } catch (err) {
    console.error("edit-item error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- BORROW / BOOKINGS --------------------
// (Everything below is your existing lifecycle + cart logic)

app.post("/api/book-item", authenticateToken, async (req, res) => {
  const { item_id, requested_start, requested_end, reason } = req.body;
  const borrower_id = req.user.userId;

  if (!item_id || !requested_start || !requested_end || !reason) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const start = new Date(requested_start);
  const end = new Date(requested_end);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return res.status(400).json({ error: "Invalid date format." });
  if (end <= start) return res.status(400).json({ error: "End time must be after start time." });

  try {
    await autoMarkOverdue();

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

    const result = await query(
      `INSERT INTO borrowrequests (borrower_id, item_id, requested_start, requested_end, reason, status, request_group_id)
       VALUES (?, ?, ?, ?, ?, 'Pending', NULL)`,
      [borrower_id, item_id, requested_start, requested_end, reason]
    );

    // Notification to item owner
    const metaRows = await query(
      `
      SELECT i.owner_id, i.name AS item_name,
             u.first_name, u.last_name, u.username
      FROM items i
      JOIN users u ON u.user_id = ?
      WHERE i.item_id = ?
      LIMIT 1
      `,
      [borrower_id, item_id]
    );

    if (metaRows.length > 0) {
      const m = metaRows[0];
      const borrowerName =
        `${m.first_name || ""} ${m.last_name || ""}`.trim() ||
        m.username ||
        "A student";

      await createNotification(
        m.owner_id,
        "New borrow request",
        `${borrowerName} requested "${m.item_name}".`,
        "warning"
      );
    }

    res.json({ message: "Borrow request submitted successfully", request_id: result.insertId });
  } catch (err) {
    console.error("book-item error:", err);
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

    const borrowerRows = await query(
      `SELECT first_name, last_name, username FROM users WHERE user_id = ? LIMIT 1`,
      [borrower_id]
    );
    const b = borrowerRows[0] || {};
    const borrowerName =
      `${b.first_name || ""} ${b.last_name || ""}`.trim() ||
      b.username ||
      "A student";

    const result = await withTransaction(async () => {
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

        const itemRows = await query(
          `SELECT item_id, owner_id, name FROM items WHERE item_id = ? LIMIT 1`,
          [item_id]
        );
        if (itemRows.length === 0) {
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

        if (conflicts.length > 0) {
          failed.push({ item_id, error: "Item already booked for that time range" });
          continue;
        }

        const ins = await query(
          `INSERT INTO borrowrequests
             (borrower_id, item_id, requested_start, requested_end, reason, status, request_group_id)
           VALUES (?, ?, ?, ?, ?, 'Pending', ?)`,
          [borrower_id, item_id, requested_start, requested_end, reason, group_id]
        );

        created.push({
          request_id: ins.insertId,
          item_id,
          item_name: itemMeta.name,
        });

        const owner_id = itemMeta.owner_id;
        if (!ownerAgg.has(owner_id)) {
          ownerAgg.set(owner_id, { count: 0, itemNames: [] });
        }
        const agg = ownerAgg.get(owner_id);
        agg.count += 1;
        agg.itemNames.push(itemMeta.name);
      }

      if (created.length === 0) {
        const err = new Error("No items could be requested (all failed).");
        err.code = "NO_CREATED";
        err.failed = failed;
        throw err;
      }

      for (const [owner_id, agg] of ownerAgg.entries()) {
        const sampleNames = agg.itemNames.slice(0, 3).join(", ");
        const more = agg.itemNames.length > 3 ? ` +${agg.itemNames.length - 3} more` : "";
        await createNotification(
          owner_id,
          "New cart request",
          `${borrowerName} requested ${agg.count} item(s): ${sampleNames}${more}`,
          "warning"
        );
      }

      return { group_id, created, failed };
    });

    res.json({
      message: "Cart request submitted",
      request_group_id: result.group_id,
      created_requests: result.created,
      failed_items: result.failed,
    });
  } catch (err) {
    if (err?.code === "NO_CREATED") {
      return res.status(409).json({
        error: err.message,
        failed_items: err.failed || [],
      });
    }

    console.error("request-group error:", err);
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

app.get("/api/item-requests", authenticateToken, async (req, res) => {
  try {
    await autoMarkOverdue();

    const borrowRequests = await query(
      `
      SELECT br.request_id, br.item_id, br.status, br.requested_start, br.requested_end,
             br.reason, br.rejectionReason,
             br.request_group_id,
             br.checked_out_at, br.returned_at,
             i.name AS item_name, i.image_url,
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
  } catch (err) {
    console.error("item-requests error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/request-status", authenticateToken, async (req, res) => {
  const { request_id, status, decision_note } = req.body;

  if (!request_id || !status) {
    return res.status(400).json({ error: "request_id and status are required." });
  }

  if (decision_note && String(decision_note).length > 500) {
    return res.status(400).json({ error: "Decision note too long (max 500 chars)." });
  }

  try {
    await autoMarkOverdue();

    const rows = await query(
      `
      SELECT br.request_id, br.item_id, br.borrower_id, br.requested_start, br.requested_end,
             br.status AS current_status,
             i.name AS item_name
      FROM borrowrequests br
      JOIN items i ON br.item_id = i.item_id
      WHERE br.request_id = ? AND i.owner_id = ?
      `,
      [request_id, req.user.userId]
    );

    if (rows.length === 0) return res.status(403).json({ error: "Not allowed" });

    const reqRow = rows[0];

    if (!["Pending", "Approved", "Rejected", "CheckedOut", "Returned", "Overdue"].includes(reqRow.current_status)) {
      return res.status(409).json({ error: "Invalid current request status" });
    }

    if (status === "Approved") {
      const conflicts = await query(
        `
        SELECT 1
        FROM borrowrequests
        WHERE item_id = ?
          AND status IN ('Approved','CheckedOut','Overdue')
          AND request_id <> ?
          AND requested_start < ?
          AND requested_end > ?
        LIMIT 1
        `,
        [reqRow.item_id, request_id, reqRow.requested_end, reqRow.requested_start]
      );

      if (conflicts.length > 0) {
        return res.status(409).json({
          error: "Cannot approve. This item is already booked for an overlapping time range.",
        });
      }
    }

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "This endpoint supports only Approved or Rejected." });
    }

    await query(
      `UPDATE borrowrequests SET status = ?, rejectionReason = ? WHERE request_id = ?`,
      [status, decision_note || null, request_id]
    );

    if (String(status).toLowerCase() === "approved") {
      await createNotification(
        reqRow.borrower_id,
        "Request approved",
        `Your request for "${reqRow.item_name}" was approved.`,
        "success"
      );
    } else if (String(status).toLowerCase() === "rejected") {
      const notePart = decision_note ? ` Note: ${decision_note}` : "";
      await createNotification(
        reqRow.borrower_id,
        "Request rejected",
        `Your request for "${reqRow.item_name}" was rejected.${notePart}`,
        "danger"
      );
    }

    res.json({ message: "Request status updated successfully." });
  } catch (err) {
    console.error("request-status error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

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
      WHERE br.request_id = ? AND i.owner_id = ?
      LIMIT 1
      `,
      [request_id, req.user.userId]
    );

    if (rows.length === 0) return res.status(403).json({ error: "Not allowed" });

    const r = rows[0];
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

    await createNotification(
      r.borrower_id,
      "Item checked out",
      `Your booking for "${r.item_name}" has been checked out.`,
      "info"
    );

    res.json({ message: "Checked out successfully" });
  } catch (err) {
    console.error("request-checkout error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/request-return", authenticateToken, async (req, res) => {
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
      WHERE br.request_id = ? AND i.owner_id = ?
      LIMIT 1
      `,
      [request_id, req.user.userId]
    );

    if (rows.length === 0) return res.status(403).json({ error: "Not allowed" });

    const r = rows[0];
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

    await createNotification(
      r.borrower_id,
      "Item returned",
      `Your booking for "${r.item_name}" has been marked returned.`,
      "success"
    );

    res.json({ message: "Returned successfully" });
  } catch (err) {
    console.error("request-return error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/overdue-requests", authenticateToken, async (req, res) => {
  try {
    await autoMarkOverdue();

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

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
