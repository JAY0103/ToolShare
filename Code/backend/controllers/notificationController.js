// controllers/notificationController.js
const Notification = require("../models/Notification");

const notificationController = {
  getNotifications: async (req, res) => {
    try {
      const userId       = req.user.userId;
      const notifications = await Notification.getForUser(userId);
      const unreadCount  = await Notification.getUnreadCount(userId);
      res.json({ notifications, unreadCount });
    } catch (err) {
      console.error("notifications get error:", err);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  },

  markRead: async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: "Invalid notification id" });

    try {
      await Notification.markRead(id, req.user.userId);
      res.json({ ok: true });
    } catch (err) {
      console.error("notifications read error:", err);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  },

  markAllRead: async (req, res) => {
    try {
      await Notification.markAllRead(req.user.userId);
      res.json({ ok: true });
    } catch (err) {
      console.error("notifications read-all error:", err);
      res.status(500).json({ error: "Failed to mark all as read" });
    }
  },
};

module.exports = notificationController;
