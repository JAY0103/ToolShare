// services/passwordResetService.js
/**
 * DB-backed password reset tokens.
 * Requires a table:
 *
 *   CREATE TABLE password_reset_tokens (
 *     token      VARCHAR(64) PRIMARY KEY,
 *     user_id    INT NOT NULL,
 *     email      VARCHAR(255) NOT NULL,
 *     expires_at DATETIME NOT NULL,
 *     INDEX (user_id)
 *   );
 */
const crypto  = require("crypto");
const { query } = require("../config/database");

const passwordResetService = {
  createToken: async (userId, email) => {
    const token   = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Remove any existing token for this user first
    await query("DELETE FROM password_reset_tokens WHERE user_id=?", [userId]);
    await query(
      "INSERT INTO password_reset_tokens (token, user_id, email, expires_at) VALUES (?, ?, ?, ?)",
      [token, userId, email, expires]
    );
    return token;
  },

  verifyToken: async (token) => {
    const rows = await query(
      "SELECT * FROM password_reset_tokens WHERE token=? AND expires_at > NOW() LIMIT 1",
      [token]
    );
    return rows[0] || null; // returns { token, user_id, email } or null
  },

  deleteToken: (token) =>
    query("DELETE FROM password_reset_tokens WHERE token=?", [token]),
};

module.exports = passwordResetService;
