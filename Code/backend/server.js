// server.js
require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const path    = require("path");

const { startScheduler } = require("./services/overdueScheduler");

// ── Route modules ──────────────────────────────────────────
const authRoutes          = require("./routes/auth");
const itemRoutes          = require("./routes/items");
const bookingRoutes       = require("./routes/bookings");
const notificationRoutes  = require("./routes/notifications");
const adminRoutes         = require("./routes/admin");

// ── App setup ──────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ─────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ message: "ToolShare Backend Running!" }));
app.use("/api", authRoutes);
app.use("/api", itemRoutes);
app.use("/api", bookingRoutes);
app.use("/api", notificationRoutes);
app.use("/api", adminRoutes);

// ── Global error handler (multer + generic) ────────────────
app.use((err, req, res, next) => {
  if (err?.message?.includes("Only JPEG/PNG/WebP"))
    return res.status(400).json({ error: err.message });
  if (err?.code === "LIMIT_FILE_SIZE")
    return res.status(400).json({ error: "File too large (max 5MB)" });
  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "Server error" });
});

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  startScheduler();
});
