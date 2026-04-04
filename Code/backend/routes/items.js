// routes/items.js
const express        = require("express");
const router         = express.Router();
const itemController = require("../controllers/itemController");
const { authenticateToken } = require("../middleware/auth");
const { upload, uploadConditionImage } = require("../middleware/upload");

// Categories
router.get( "/categories",      authenticateToken, itemController.getCategories);
router.post("/categories",      authenticateToken, itemController.createCategory);

// Items
router.get( "/items",           authenticateToken, itemController.getItems);
router.get( "/items/availability", authenticateToken, itemController.getAvailableItems);
router.post("/items",           authenticateToken, upload.single("image"), itemController.addItem);
router.put( "/edit-item",       authenticateToken, itemController.editItem);
router.delete("/items/:id",     authenticateToken, itemController.deleteItem);

// Condition images — by borrow request
router.post(
  "/borrowrequest/:id/condition-image",
  authenticateToken,
  uploadConditionImage.single("image"),
  itemController.uploadConditionImageForRequest
);
router.get(
  "/borrowrequest/:id/condition-images",
  authenticateToken,
  itemController.getConditionImagesForRequest
);

// Condition images — by item
router.get( "/condition-images/:item_id", authenticateToken, itemController.getConditionImagesForItem);
router.post(
  "/condition-images/:item_id",
  authenticateToken,
  uploadConditionImage.single("image"),
  itemController.uploadConditionImageForItem
);

module.exports = router;
