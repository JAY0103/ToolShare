// models/Category.js
const { query } = require("../config/database");

const Category = {
  getAll: () =>
    query("SELECT category_id, name, description, auto_approve FROM categories ORDER BY name ASC"),

  findByName: (name) =>
    query("SELECT category_id, auto_approve FROM categories WHERE name=? LIMIT 1", [name]).then(
      (r) => r[0] || null
    ),

  findById: (id) =>
    query("SELECT category_id, name, auto_approve FROM categories WHERE category_id=? LIMIT 1", [id]).then(
      (r) => r[0] || null
    ),

  create: (name, description) =>
    query("INSERT INTO categories (name, description) VALUES (?, ?)", [name, description || null]),

  delete: (id) => query("DELETE FROM categories WHERE category_id=?", [id]),

  nullifyOnItems: (id) => query("UPDATE items SET category_id=NULL WHERE category_id=?", [id]),
};

module.exports = Category;
