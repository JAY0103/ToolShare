// routes/notifications.js
const express                  = require("express");
const router                   = express.Router();
const notificationController   = require("../controllers/notificationController");
const { authenticateToken }    = require("../middleware/auth");

router.get( "/notifications",             authenticateToken, notificationController.getNotifications);
router.put( "/notifications/:id/read",    authenticateToken, notificationController.markRead);
router.put( "/notifications/read-all",    authenticateToken, notificationController.markAllRead);

module.exports = router;
