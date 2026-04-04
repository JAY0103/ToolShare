// services/overdueScheduler.js
const BorrowRequest  = require("../models/BorrowRequest");
const { notify }     = require("./notificationService");
const emailService   = require("./emailService");

/**
 * Marks any CheckedOut requests past their end date as Overdue,
 * then sends notifications + emails.
 * Call this before any booking query that depends on current statuses.
 */
const autoMarkOverdue = async () => {
  const targets = await BorrowRequest.getCheckedOutPastDue();
  if (!targets.length) return;

  await BorrowRequest.markOverdueBatch();

  for (const r of targets) {
    notify(
      r.borrower_id,
      "Item overdue",
      `Your booking for "${r.item_name}" is overdue. Please return it immediately.`,
      "overdue"
    );
    emailService.sendOverdue(r.borrower_email, r.item_name).catch((err) =>
      console.error("Overdue email failed:", err)
    );
  }
};

/**
 * Start a periodic job (call once at server startup).
 * Runs autoMarkOverdue every 30 minutes.
 */
const startScheduler = () => {
  autoMarkOverdue(); // run immediately on startup
  setInterval(autoMarkOverdue, 30 * 60 * 1000);
  console.log("Overdue scheduler started (runs every 30 min).");
};

module.exports = { autoMarkOverdue, startScheduler };
