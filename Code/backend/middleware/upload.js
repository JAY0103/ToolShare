// middleware/upload.js
const path   = require("path");
const fs     = require("fs");
const multer = require("multer");
const crypto = require("crypto");

const allowedMime = new Set(["image/jpeg", "image/png", "image/webp"]);

function createImageUploader(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext  = path.extname(file.originalname || "").toLowerCase() || ".jpg";
      const safe = crypto.randomBytes(12).toString("hex");
      cb(null, `${Date.now()}-${safe}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
      if (!allowedMime.has(file.mimetype))
        return cb(new Error("Only JPEG/PNG/WebP images are allowed"));
      cb(null, true);
    },
  });
}

const uploadsDir          = path.join(__dirname, "../uploads");
const conditionUploadsDir = path.join(uploadsDir, "condition-images");

const upload               = createImageUploader(uploadsDir);
const uploadConditionImage = createImageUploader(conditionUploadsDir);

module.exports = { upload, uploadConditionImage, createImageUploader };
