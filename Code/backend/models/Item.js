// models/Item.js
const { query } = require("../config/database");

const Item = {
  getAll: () =>
    query(`
      SELECT i.*, u.username AS owner_name, c.name AS category_name
      FROM items i
      JOIN users u ON i.owner_id = u.user_id
      LEFT JOIN categories c ON i.category_id = c.category_id
      ORDER BY i.item_id DESC
    `),

  getAvailable: (start, end) =>
    query(
      `SELECT i.*, u.username AS owner_name, c.name AS category_name
       FROM items i
       JOIN users u ON i.owner_id = u.user_id
       LEFT JOIN categories c ON i.category_id = c.category_id
       WHERE NOT EXISTS (
         SELECT 1 FROM borrowrequests br
         WHERE br.item_id = i.item_id
           AND br.status IN ('Approved','CheckedOut','Overdue')
           AND br.requested_start < ?
           AND br.requested_end   > ?
       )
       ORDER BY i.item_id DESC`,
      [end, start]
    ),

  getByOwner: (ownerId) =>
    query("SELECT item_id, name FROM items WHERE owner_id = ? ORDER BY name ASC", [ownerId]),

  getAllForAdmin: () =>
    query("SELECT item_id, name FROM items ORDER BY name ASC"),

  findById: (id) =>
    query("SELECT * FROM items WHERE item_id = ? LIMIT 1", [id]).then((r) => r[0] || null),

  findByIdAndOwner: (itemId, ownerId) =>
    query("SELECT item_id FROM items WHERE item_id = ? AND owner_id = ? LIMIT 1", [itemId, ownerId]).then(
      (r) => r[0] || null
    ),

  create: ({ name, description, image_url, owner_id, serial_number, category_id }) =>
    query(
      `INSERT INTO items (name, description, image_url, faculty_id, owner_id, serial_number, category_id)
       VALUES (?, ?, ?, 1, ?, ?, ?)`,
      [name, description, image_url, owner_id, serial_number || null, category_id || null]
    ),

  update: ({ item_id, name, description, category_id, serial_number, quantity }) =>
    query(
      `UPDATE items SET name=?, description=?, category_id=?, serial_number=?, quantity=? WHERE item_id=?`,
      [name, description || null, category_id || null, serial_number || null, quantity ?? null, item_id]
    ),

  delete: (itemId) => query("DELETE FROM items WHERE item_id = ?", [itemId]),
};

module.exports = Item;
