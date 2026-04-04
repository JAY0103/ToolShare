// routes/auth.js
const express        = require("express");
const router         = express.Router();
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");

router.post("/register",                    authController.register);
router.post("/login",                       authController.login);
router.get( "/getUser", authenticateToken,  authController.getUser);
router.post("/auth/forgot-password",        authController.forgotPassword);
router.post("/auth/reset-password/:token",  authController.resetPassword);

module.exports = router;
