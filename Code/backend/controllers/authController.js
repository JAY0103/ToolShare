// controllers/authController.js
const jwt                  = require("jsonwebtoken");
const User                 = require("../models/User");
const emailService         = require("../services/emailService");
const passwordResetService = require("../services/passwordResetService");

const JWT_SECRET    = process.env.JWT_SECRET || "";
const FRONTEND_URL  = process.env.FRONTEND_URL || "http://54.85.60.202";

const makeToken = (userId, email, role) =>
  jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: "24h" });

const authController = {
  register: async (req, res) => {
    const { first_name, last_name, student_id, username, email, password } = req.body;

    if (!first_name || !last_name || !student_id || !username || !email || !password)
      return res.status(400).json({ error: "All fields are required." });

    try {
      const userId = await User.create({ first_name, last_name, student_id, username, email, password });
      const token  = makeToken(userId, email, "Student");

      res.json({
        message: "Registered successfully.",
        token,
        user: { user_id: userId, email, user_type: "Student" },
      });
    } catch (err) {
      if (err?.code === "ER_DUP_ENTRY") {
        const msg = String(err?.sqlMessage || "");
        if (msg.includes("email"))    return res.status(409).json({ error: "Email already exists." });
        if (msg.includes("username")) return res.status(409).json({ error: "Username already exists." });
        return res.status(409).json({ error: "Duplicate entry." });
      }
      console.error("Register error:", err);
      res.status(500).json({ error: "Error registering user." });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "All fields are required." });

    try {
      const user = await User.findByEmail(email);
      if (!user || !(await User.verifyPassword(password, user.password)))
        return res.status(401).json({ error: "Invalid email or password" });

      const token = makeToken(user.user_id, user.email, user.user_type);
      res.json({
        message: "Login successful",
        token,
        user: {
          user_id:    user.user_id,
          email:      user.email,
          first_name: user.first_name,
          last_name:  user.last_name,
          user_type:  user.user_type,
          username:   user.username,
          student_id: user.student_id,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  getUser: async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      res.json({ user: user || null });
    } catch (err) {
      console.error("getUser error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  forgotPassword: async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });

    try {
      const user = await User.findByEmail(email);
      if (!user) return res.json({ message: "If that email exists, a reset link has been sent." });

      const token    = await passwordResetService.createToken(user.user_id, user.email);
      const resetUrl = `${FRONTEND_URL}/reset-password/${token}`;

      await emailService.sendPasswordReset(user.email, resetUrl);
      res.json({ message: "If that email exists, a reset link has been sent." });
    } catch (err) {
      console.error("forgot-password error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  resetPassword: async (req, res) => {
    const { token }    = req.params;
    const { password } = req.body;

    if (!token || !password) return res.status(400).json({ error: "Token and password are required." });
    if (password.length < 6)  return res.status(400).json({ error: "Password must be at least 6 characters." });

    try {
      const entry = await passwordResetService.verifyToken(token);
      if (!entry) return res.status(400).json({ error: "Invalid or expired reset token." });

      await User.updatePassword(entry.user_id, password);
      await passwordResetService.deleteToken(token);
      res.json({ message: "Password reset successfully." });
    } catch (err) {
      console.error("reset-password error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
};

module.exports = authController;
