// services/notificationService.js
const Notification = require("../models/Notification");

// Fire-and-forget wrapper — callers never need to await notifications
const notify = (user_id, title, message, type) =>
  Notification.create(user_id, title, message, type).catch((err) =>
    console.error("Notification failed:", err)
  );

module.exports = { notify };
