// controllers/itemController.js
const Item             = require("../models/Item");
const Category         = require("../models/Category");
const ConditionImage   = require("../models/ConditionImage");
const { autoMarkOverdue } = require("../services/overdueScheduler");
const { isAdmin, isStaff } = require("../middleware/auth");

const itemController = {
  getCategories: async (req, res) => {
    try {
      const categories = await Category.getAll();
      res.json({ categories });
    } catch (err) {
      console.error("get categories error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  createCategory: async (req, res) => {
    const { name, description } = req.body;
    if (!name || !String(name).trim())
      return res.status(400).json({ error: "Category name is required." });

    try {
      if (!isStaff(req)) return res.status(403).json({ error: "Only faculty/admin can create categories." });
      await Category.create(String(name).trim(), description);
      res.json({ message: "Category created" });
    } catch (err) {
      if (err?.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Category already exists." });
      console.error("create category error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  getItems: async (req, res) => {
    try {
      const items = await Item.getAll();
      res.json({ items });
    } catch (err) {
      console.error("get items error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  getAvailableItems: async (req, res) => {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: "start and end are required" });

    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return res.status(400).json({ error: "Invalid date format." });
    if (e <= s) return res.status(400).json({ error: "end must be after start." });

    try {
      await autoMarkOverdue();
      const items = await Item.getAvailable(start, end);
      res.json({ items });
    } catch (err) {
      console.error("availability error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  addItem: async (req, res) => {
    const { name, description, serial_number, category_id } = req.body;
    const owner_id = req.user.userId;

    if (!name || !String(name).trim() || !description || !String(description).trim())
      return res.status(400).json({ error: "Name and description are required." });

    try {
      if (!isStaff(req)) return res.status(403).json({ error: "Only faculty/admin can add items." });

      let cleanedSerial = typeof serial_number === "string" ? serial_number.trim() : "";
      if (!cleanedSerial) cleanedSerial = null;
      if (cleanedSerial && cleanedSerial.length > 15)
        return res.status(400).json({ error: "Serial number cannot be more than 15 characters." });

      const image_url = req.file ? `/uploads/${req.file.filename}` : null;
      await Item.create({
        name:        String(name).trim(),
        description: String(description).trim(),
        image_url,
        owner_id,
        serial_number: cleanedSerial,
        category_id:   category_id ? Number(category_id) : null,
      });

      res.json({ message: "Item added successfully" });
    } catch (err) {
      console.error("add item error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  editItem: async (req, res) => {
    const { item_id, name, description, category_id, serial_number, quantity } = req.body;

    if (!item_id || !name || !String(name).trim())
      return res.status(400).json({ error: "Item ID and name are required." });

    if (quantity !== undefined && (isNaN(Number(quantity)) || Number(quantity) < 0))
      return res.status(400).json({ error: "Quantity must be a non-negative number." });

    try {
      if (!isAdmin(req)) {
        const owned = await Item.findByIdAndOwner(item_id, req.user.userId);
        if (!owned) return res.status(403).json({ error: "Not allowed" });
      }

      let cleanedSerial = typeof serial_number === "string" ? serial_number.trim() : "";
      if (!cleanedSerial) cleanedSerial = null;
      if (cleanedSerial && cleanedSerial.length > 15)
        return res.status(400).json({ error: "Serial number cannot be more than 15 characters." });

      await Item.update({
        item_id,
        name:        String(name).trim(),
        description: description ? String(description).trim() : null,
        category_id: category_id ? Number(category_id) : null,
        serial_number: cleanedSerial,
        quantity:    quantity !== undefined ? Number(quantity) : null,
      });

      res.json({ message: "Item updated successfully" });
    } catch (err) {
      console.error("edit item error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  deleteItem: async (req, res) => {
    const itemId = parseInt(req.params.id, 10);
    if (!itemId) return res.status(400).json({ error: "Invalid item id" });

    try {
      if (!isAdmin(req)) {
        const owned = await Item.findByIdAndOwner(itemId, req.user.userId);
        if (!owned) return res.status(404).json({ error: "Item not found or not owned by you." });
      }
      await Item.delete(itemId);
      res.json({ message: "Item deleted successfully" });
    } catch (err) {
      console.error("delete item error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  // Condition images
  uploadConditionImageForRequest: async (req, res) => {
    try {
      const borrowRequestId = Number(req.params.id);
      const { image_type }  = req.body;

      if (!borrowRequestId || !["Before", "After"].includes(image_type))
        return res.status(400).json({ error: "Invalid borrow request ID or image type" });
      if (!req.file) return res.status(400).json({ error: "No image uploaded" });

      const BorrowRequest = require("../models/BorrowRequest");
      const borrowRequest = await BorrowRequest.findSimpleById(borrowRequestId);
      if (!borrowRequest) return res.status(400).json({ error: "Borrow request not found" });

      await ConditionImage.create({
        item_id:          borrowRequest.item_id,
        borrow_request_id: borrowRequestId,
        filename:         req.file.filename,
        image_type,
      });

      res.json({
        message: "Condition image uploaded successfully",
        image: {
          image_url:  `/uploads/condition-images/${req.file.filename}`,
          image_type,
        },
      });
    } catch (err) {
      console.error("condition-image upload error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  getConditionImagesForRequest: async (req, res) => {
    const borrow_request_id = Number(req.params.id);
    if (!borrow_request_id) return res.status(400).json({ error: "Invalid borrow request ID" });

    try {
      const images = await ConditionImage.getByRequestId(borrow_request_id);
      res.json({ images });
    } catch (err) {
      console.error("get condition images error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  getConditionImagesForItem: async (req, res) => {
    const item_id = Number(req.params.item_id);
    if (!item_id) return res.status(400).json({ error: "Invalid item_id" });

    try {
      const images = await ConditionImage.getByItemId(item_id);
      res.json({ images });
    } catch (err) {
      console.error("get condition images error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },

  uploadConditionImageForItem: async (req, res) => {
    const item_id = Number(req.params.item_id);
    if (!item_id)   return res.status(400).json({ error: "Invalid item_id" });
    if (!req.file)  return res.status(400).json({ error: "No file uploaded" });

    try {
      const image_type = req.body.image_type === "After" ? "After" : "Before";
      const result = await ConditionImage.create({
        item_id,
        borrow_request_id: null,
        filename:  req.file.filename,
        image_type,
      });

      res.json({
        ok: true,
        image: {
          id:         result.insertId,
          item_id,
          image_url:  `/uploads/condition-images/${req.file.filename}`,
          image_type,
          created_at: new Date(),
        },
      });
    } catch (err) {
      console.error("upload condition image error:", err);
      res.status(500).json({ error: "Failed to upload condition image" });
    }
  },
};

module.exports = itemController;
