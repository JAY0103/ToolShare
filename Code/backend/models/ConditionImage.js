// models/ConditionImage.js
const { query } = require("../config/database");

const ConditionImage = {
  create: ({ item_id, borrow_request_id, filename, image_type }) =>
    query(
      "INSERT INTO conditionimages (item_id, borrow_request_id, filename, image_type) VALUES (?, ?, ?, ?)",
      [item_id, borrow_request_id || null, filename, image_type]
    ),

  getByRequestId: (borrow_request_id) =>
    query(
      `SELECT id,
              CONCAT('/uploads/condition-images/', filename) AS image_url,
              image_type, created_at
       FROM conditionimages
       WHERE borrow_request_id=?
       ORDER BY created_at ASC`,
      [borrow_request_id]
    ),

  getByItemId: (item_id) =>
    query(
      `SELECT image_id AS id,
              CONCAT('/uploads/condition-images/', filename) AS image_url,
              image_type, timestamp AS created_at
       FROM conditionimages
       WHERE item_id=?
       ORDER BY created_at ASC`,
      [item_id]
    ),
};

module.exports = ConditionImage;
