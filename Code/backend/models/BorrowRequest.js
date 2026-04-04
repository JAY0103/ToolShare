// models/BorrowRequest.js
const { query } = require("../config/database");

const BorrowRequest = {
  // Check for scheduling conflicts
  hasConflict: (item_id, start, end, excludeId = null) => {
    const sql = excludeId
      ? `SELECT 1 FROM borrowrequests
         WHERE item_id=? AND status IN ('Approved','CheckedOut','Overdue')
           AND request_id <> ? AND requested_start < ? AND requested_end > ? LIMIT 1`
      : `SELECT 1 FROM borrowrequests
         WHERE item_id=? AND status IN ('Approved','CheckedOut','Overdue')
           AND requested_start < ? AND requested_end > ? LIMIT 1`;

    const params = excludeId
      ? [item_id, excludeId, end, start]
      : [item_id, end, start];

    return query(sql, params).then((r) => r.length > 0);
  },

  create: ({ item_id, borrower_id, requested_start, requested_end, reason, status, request_group_id }) =>
    query(
      `INSERT INTO borrowrequests
         (item_id, borrower_id, requested_start, requested_end, reason, status, request_group_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [item_id, borrower_id, requested_start, requested_end, reason, status, request_group_id || null]
    ),

  createGroup: (borrower_id, reason) =>
    query(
      "INSERT INTO request_groups (borrower_id, requested_start, requested_end, reason) VALUES (?, NULL, NULL, ?)",
      [borrower_id, reason]
    ).then((r) => r.insertId),

  findById: (id) =>
    query(
      `SELECT br.*, i.owner_id, i.name AS item_name, u.email AS borrower_email
       FROM borrowrequests br
       JOIN items i ON br.item_id = i.item_id
       JOIN users u ON br.borrower_id = u.user_id
       WHERE br.request_id = ? LIMIT 1`,
      [id]
    ).then((r) => r[0] || null),

  getByBorrower: (borrower_id) =>
    query(
      `SELECT br.request_id, br.item_id, br.status, br.requested_start, br.requested_end,
              br.reason, br.rejectionReason, br.request_group_id,
              br.checked_out_at, br.returned_at,
              i.name AS item_name, i.image_url
       FROM borrowrequests br
       JOIN items i ON br.item_id = i.item_id
       WHERE br.borrower_id = ?
       ORDER BY br.request_id DESC`,
      [borrower_id]
    ),

  getByOwner: (owner_id) =>
    query(
      `SELECT br.request_id, br.item_id, br.status, br.requested_start, br.requested_end,
              br.reason, br.rejectionReason, br.request_group_id,
              br.checked_out_at, br.returned_at, br.created_at,
              i.name AS item_name, i.image_url,
              u.first_name, u.last_name, u.username AS borrower_name
       FROM borrowrequests br
       JOIN items i ON br.item_id = i.item_id
       JOIN users u ON br.borrower_id = u.user_id
       WHERE i.owner_id = ?
       ORDER BY br.request_id DESC`,
      [owner_id]
    ),

  getAll: () =>
    query(
      `SELECT br.request_id, br.item_id, br.status, br.requested_start, br.requested_end,
              br.reason, br.rejectionReason, br.request_group_id,
              br.checked_out_at, br.returned_at, br.created_at,
              i.name AS item_name, i.image_url,
              u.first_name, u.last_name, u.username AS borrower_name
       FROM borrowrequests br
       JOIN items i ON br.item_id = i.item_id
       JOIN users u ON br.borrower_id = u.user_id
       ORDER BY br.request_id DESC`
    ),

  getOwnerHistory: ({ owner_id, isAdmin, search, status, item_id, from, to }) => {
    const where  = [];
    const params = [];

    if (!isAdmin) { where.push("i.owner_id = ?"); params.push(owner_id); }
    if (status)   { where.push("br.status = ?");  params.push(status); }
    if (item_id)  { where.push("br.item_id = ?"); params.push(Number(item_id)); }
    if (from)     { where.push("br.requested_start >= ?"); params.push(from); }
    if (to)       { where.push("br.requested_start <= ?"); params.push(to); }

    if (search) {
      const s = `%${search}%`;
      where.push(`(u.email LIKE ? OR u.student_id LIKE ? OR u.username LIKE ?
                   OR u.first_name LIKE ? OR u.last_name LIKE ?
                   OR CONCAT(u.first_name,' ',u.last_name) LIKE ?)`);
      params.push(s, s, s, s, s, s);
    }

    const sql = `
      SELECT br.request_id, br.item_id, i.name AS item_name, i.image_url AS item_image_url,
             br.status, br.requested_start, br.requested_end,
             br.reason, br.rejectionReason, br.request_group_id,
             br.checked_out_at, br.returned_at,
             u.user_id AS borrower_user_id, u.first_name, u.last_name,
             u.username AS borrower_username, u.email AS borrower_email,
             u.student_id AS borrower_student_id,
             owner.user_id AS owner_user_id, owner.username AS owner_username, owner.email AS owner_email
      FROM borrowrequests br
      JOIN items i  ON br.item_id   = i.item_id
      JOIN users u  ON br.borrower_id = u.user_id
      JOIN users owner ON i.owner_id = owner.user_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY br.request_id DESC
      LIMIT 500`;

    return query(sql, params);
  },

  getAdminFiltered: ({ q, status, start, end }) => {
    let sql = `
      SELECT br.*, i.name AS item_name, i.image_url, i.owner_id,
             owner.username AS owner_name,
             u.first_name, u.last_name, u.username AS borrower_name, u.email, u.student_id
      FROM borrowrequests br
      JOIN items i ON br.item_id = i.item_id
      JOIN users u ON br.borrower_id = u.user_id
      JOIN users owner ON i.owner_id = owner.user_id
      WHERE 1=1`;

    const params = [];
    if (status) { sql += " AND br.status = ?"; params.push(status); }
    if (q) {
      const like = `%${q}%`;
      sql += " AND (u.email LIKE ? OR u.username LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.student_id LIKE ?)";
      params.push(like, like, like, like, like);
    }
    if (start) { sql += " AND br.requested_start >= ?"; params.push(start); }
    if (end)   { sql += " AND br.requested_end   <= ?"; params.push(end); }
    sql += " ORDER BY br.request_id DESC LIMIT 1000";

    return query(sql, params);
  },

  updateStatus: (request_id, status, rejectionReason = null) =>
    query(
      "UPDATE borrowrequests SET status=?, rejectionReason=? WHERE request_id=?",
      [status, rejectionReason, request_id]
    ),

  setCheckedOut: (request_id) =>
    query(
      "UPDATE borrowrequests SET status='CheckedOut', checked_out_at=NOW() WHERE request_id=?",
      [request_id]
    ),

  setReturned: (request_id) =>
    query(
      "UPDATE borrowrequests SET status='Returned', returned_at=NOW() WHERE request_id=?",
      [request_id]
    ),

  getOverdue: (isAdminFlag, owner_id) => {
    if (isAdminFlag) {
      return query(
        `SELECT br.request_id, br.item_id, br.status, br.requested_start, br.requested_end,
                br.checked_out_at, br.request_group_id,
                i.name AS item_name, i.image_url,
                u.first_name, u.last_name, u.username AS borrower_name,
                owner.username AS owner_name
         FROM borrowrequests br
         JOIN items i ON br.item_id = i.item_id
         JOIN users u ON br.borrower_id = u.user_id
         JOIN users owner ON i.owner_id = owner.user_id
         WHERE br.status = 'Overdue'
         ORDER BY br.requested_end ASC`
      );
    }
    return query(
      `SELECT br.request_id, br.item_id, br.status, br.requested_start, br.requested_end,
              br.checked_out_at, br.request_group_id,
              i.name AS item_name, i.image_url,
              u.first_name, u.last_name, u.username AS borrower_name
       FROM borrowrequests br
       JOIN items i ON br.item_id = i.item_id
       JOIN users u ON br.borrower_id = u.user_id
       WHERE i.owner_id = ? AND br.status = 'Overdue'
       ORDER BY br.requested_end ASC`,
      [owner_id]
    );
  },

  countActiveByBorrower: (borrower_id) =>
    query(
      "SELECT COUNT(*) AS count FROM borrowrequests WHERE borrower_id=? AND status IN ('Pending','Approved','CheckedOut','Overdue')",
      [borrower_id]
    ).then((r) => r[0]?.count || 0),

  getCheckedOutPastDue: () =>
    query(
      `SELECT br.request_id, br.borrower_id,
              i.name AS item_name, u.email AS borrower_email
       FROM borrowrequests br
       JOIN items i ON br.item_id = i.item_id
       JOIN users u ON br.borrower_id = u.user_id
       WHERE br.status = 'CheckedOut' AND br.requested_end < NOW()`
    ),

  markOverdueBatch: () =>
    query(
      "UPDATE borrowrequests SET status='Overdue' WHERE status='CheckedOut' AND requested_end < NOW()"
    ),

  // For condition images
  findSimpleById: (id) =>
    query("SELECT request_id, item_id FROM borrowrequests WHERE request_id=? LIMIT 1", [id]).then(
      (r) => r[0] || null
    ),
};

module.exports = BorrowRequest;
