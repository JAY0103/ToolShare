// models/Notification.js
const { query } = require("../config/database");

const ALLOWED_TYPES = new Set([
  "info","request","approved","rejected","cancelled",
  "checkedout","returned","overdue",
]);

const Notification = {
  create: (user_id, title, message, type = "info") => {
    const safeType = ALLOWED_TYPES.has(String(type).toLowerCase())
      ? String(type).toLowerCase()
      : "info";
    return query(
      "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
      [user_id, title, message, safeType]
    );
  },

  getForUser: (user_id) =>
    query(
      `SELECT notification_id, title, message, type, is_read, created_at
       FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 20`,
      [user_id]
    ),

  getUnreadCount: (user_id) =>
    query(
      "SELECT COUNT(*) AS unreadCount FROM notifications WHERE user_id=? AND is_read=0",
      [user_id]
    ).then((r) => r[0]?.unreadCount || 0),

  markRead: (notification_id, user_id) =>
    query(
      "UPDATE notifications SET is_read=1 WHERE notification_id=? AND user_id=?",
      [notification_id, user_id]
    ),

  markAllRead: (user_id) =>
    query("UPDATE notifications SET is_read=1 WHERE user_id=?", [user_id]),
};

module.exports = Notification;
