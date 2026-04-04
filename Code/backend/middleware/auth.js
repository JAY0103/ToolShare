// middleware/auth.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "";

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

const roleLower = (req) => String(req.user?.role || "").toLowerCase();
const isAdmin  = (req) => roleLower(req) === "admin";
const isStaff  = (req) => ["faculty", "admin"].includes(roleLower(req));

module.exports = { authenticateToken, isAdmin, isStaff };
