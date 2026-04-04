// routes/admin.js
const express          = require("express");
const router           = express.Router();
const adminController  = require("../controllers/adminController");
const { authenticateToken, isAdmin } = require("../middleware/auth");

// Admin-only guard middleware applied to all routes in this file
const adminOnly = (req, res, next) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });
  next();
};

router.use(authenticateToken, adminOnly);

// Users
router.get(   "/admin/users",              adminController.getAllUsers);
router.put(   "/admin/users/:id/role",     adminController.updateUserRole);
router.delete("/admin/users/:id",          adminController.deleteUser);

// Categories
router.post(  "/admin/categories",         adminController.createCategory);
router.delete("/admin/categories/:id",     adminController.deleteCategory);

// Faculties
router.get(   "/admin/faculties",          adminController.getFaculties);
router.post(  "/admin/faculties",          adminController.createFaculty);
router.delete("/admin/faculties/:id",      adminController.deleteFaculty);

// Requests & reports
router.get(   "/admin/requests",           adminController.getAllRequests);
router.get(   "/admin/reports/summary",    adminController.getReportsSummary);

module.exports = router;
