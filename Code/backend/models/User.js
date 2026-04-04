// models/User.js
const { query } = require("../config/database");
const bcrypt    = require("bcryptjs");

const User = {
  findByEmail: (email) =>
    query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]).then((r) => r[0] || null),

  findById: (id) =>
    query(
      "SELECT user_id, username, email, first_name, last_name, user_type FROM users WHERE user_id = ? LIMIT 1",
      [id]
    ).then((r) => r[0] || null),

  create: async ({ first_name, last_name, student_id, username, email, password }) => {
    const hashed = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (first_name, last_name, student_id, username, email, password, user_type)
       VALUES (?, ?, ?, ?, ?, ?, 'Student')`,
      [first_name, last_name, student_id, username, email, hashed]
    );
    return result.insertId;
  },

  getAll: () =>
    query(
      "SELECT user_id, first_name, last_name, username, email, student_id, user_type FROM users ORDER BY user_id DESC"
    ),

  updateRole: (userId, user_type) =>
    query("UPDATE users SET user_type = ? WHERE user_id = ?", [user_type, userId]),

  updatePassword: async (userId, plainPassword) => {
    const hashed = await bcrypt.hash(plainPassword, 10);
    return query("UPDATE users SET password = ? WHERE user_id = ?", [hashed, userId]);
  },

  delete: (userId) => query("DELETE FROM users WHERE user_id = ?", [userId]),

  verifyPassword: (plain, hashed) => bcrypt.compare(plain, hashed),
};

module.exports = User;
