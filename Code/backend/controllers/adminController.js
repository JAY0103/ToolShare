// controllers/adminController.js
const User            = require("../models/User");
const Category        = require("../models/Category");
const BorrowRequest   = require("../models/BorrowRequest");
const { query }       = require("../config/database");
const { autoMarkOverdue } = require("../services/overdueScheduler");

const adminController = {
  // -------------------- USERS --------------------
  getAllUsers: async (req, res) => {
    try {
      const users = await User.getAll();
      res.json({ users });
    } catch (err) {
      console.error("admin get users error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  updateUserRole: async (req, res) => {
    const userId    = Number(req.params.id);
    const { user_type } = req.body;
    const allowed   = new Set(["Student", "Faculty", "Admin"]);

    if (!userId) return res.status(400).json({ error: "Invalid user id" });
    if (!allowed.has(String(user_type))) return res.status(400).json({ error: "Invalid role" });

    try {
      await User.updateRole(userId, user_type);
      res.json({ message: "Role updated" });
    } catch (err) {
      console.error("role update error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  deleteUser: async (req, res) => {
    const userId = Number(req.params.id);
    if (!userId) return res.status(400).json({ error: "Invalid user id" });
    if (userId === req.user.userId)
      return res.status(400).json({ error: "Cannot delete your own account" });

    try {
      await User.delete(userId);
      res.json({ message: "User deleted" });
    } catch (err) {
      console.error("admin delete user error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  // -------------------- CATEGORIES --------------------
  createCategory: async (req, res) => {
    const { name, description } = req.body;
    if (!name || !String(name).trim())
      return res.status(400).json({ error: "Category name is required." });

    try {
      await Category.create(String(name).trim(), description);
      res.json({ message: "Category created" });
    } catch (err) {
      if (err?.code === "ER_DUP_ENTRY")
        return res.status(409).json({ error: "Category already exists." });
      console.error("admin create category error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  deleteCategory: async (req, res) => {
    const categoryId = Number(req.params.id);
    if (!categoryId) return res.status(400).json({ error: "Invalid category id" });

    try {
      await Category.nullifyOnItems(categoryId);
      await Category.delete(categoryId);
      res.json({ message: "Category deleted" });
    } catch (err) {
      console.error("admin delete category error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  // -------------------- FACULTIES --------------------
  getFaculties: async (req, res) => {
    try {
      const faculties = await query("SELECT * FROM faculties ORDER BY faculty_id ASC");
      res.json({ faculties });
    } catch (err) {
      console.error("admin get faculties error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  createFaculty: async (req, res) => {
    const { name, description } = req.body;
    if (!name || !String(name).trim())
      return res.status(400).json({ error: "Faculty name is required." });

    try {
      await query(
        "INSERT INTO faculties (name, description) VALUES (?, ?)",
        [String(name).trim(), description || null]
      );
      res.json({ message: "Faculty created" });
    } catch (err) {
      if (err?.code === "ER_DUP_ENTRY")
        return res.status(409).json({ error: "Faculty already exists." });
      console.error("admin create faculty error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  deleteFaculty: async (req, res) => {
    const facultyId = Number(req.params.id);
    if (!facultyId) return res.status(400).json({ error: "Invalid faculty id" });
    if (facultyId === 1)
      return res.status(400).json({ error: "Cannot delete the default General faculty." });

    try {
      await query("UPDATE items SET faculty_id=1 WHERE faculty_id=?", [facultyId]);
      await query("DELETE FROM faculties WHERE faculty_id=?", [facultyId]);
      res.json({ message: "Faculty deleted" });
    } catch (err) {
      console.error("admin delete faculty error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  // -------------------- REQUESTS --------------------
  getAllRequests: async (req, res) => {
    try {
      await autoMarkOverdue();
      const { q = "", status = "", start = "", end = "" } = req.query;
      const requests = await BorrowRequest.getAdminFiltered({ q, status, start, end });
      res.json({ requests });
    } catch (err) {
      console.error("admin requests error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  // -------------------- REPORTS --------------------
  getReportsSummary: async (req, res) => {
    try {
      await autoMarkOverdue();

      const statusCounts = await query(
        "SELECT status, COUNT(*) AS count FROM borrowrequests GROUP BY status"
      );

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
  },
};

module.exports = adminController;
