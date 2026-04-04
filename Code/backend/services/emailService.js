// services/emailService.js
const nodemailer = require("nodemailer");

const GMAIL_USER = process.env.GMAIL_USER || "toolsharecapstone@gmail.com";
const GMAIL_PASS = process.env.GMAIL_PASS || "";

const mailer = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: { user: GMAIL_USER, pass: GMAIL_PASS },
});

const send = (to, subject, text, html) => {
  if (!to) return Promise.resolve();
  return mailer.sendMail({ from: `"ToolShare" <${GMAIL_USER}>`, to, subject, text, html });
};

const emailService = {
  sendApproved: (to, itemName) =>
    send(
      to,
      "ToolShare: Request Approved",
      `Your ToolShare booking for ${itemName} has been approved.`,
      `<p>Your booking for <strong>${itemName}</strong> has been <b>approved</b>.</p>`
    ),

  sendRejected: (to, itemName, reason) =>
    send(
      to,
      "ToolShare: Request Rejected",
      `Your ToolShare booking for ${itemName} was rejected.\nReason: ${reason}`,
      `<p>Your booking for <strong>${itemName}</strong> was <b>rejected</b>.</p><p>Reason: ${reason}</p>`
    ),

  sendCheckedOut: (to, itemName) =>
    send(
      to,
      "ToolShare: Item Checked Out",
      `Your booking for ${itemName} has been checked out. Please return it by the agreed end date.`,
      `<p>Your booking for <strong>${itemName}</strong> has been <b>checked out</b>.</p><p>Please return it by the agreed end date.</p>`
    ),

  sendReturned: (to, itemName) =>
    send(
      to,
      "ToolShare: Item Returned",
      `Your ToolShare booking for ${itemName} has been marked as returned.`,
      `<p>Your booking for <strong>${itemName}</strong> has been marked as <b>returned</b>.</p>`
    ),

  sendOverdue: (to, itemName) =>
    send(
      to,
      "ToolShare: Item Overdue",
      `Your booking for ${itemName} is now overdue. Please return it immediately.`,
      `<p>Your booking for <strong>${itemName}</strong> is <b style="color:red">overdue</b>.</p><p>Please return it immediately.</p>`
    ),

  sendPasswordReset: (to, resetUrl) =>
    send(
      to,
      "ToolShare: Password Reset Request",
      `Click the link to reset your password (expires in 1 hour):\n${resetUrl}`,
      `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 1 hour.</p>`
    ),
};

module.exports = emailService;
