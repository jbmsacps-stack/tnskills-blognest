const express = require("express");

const {
    registerUser,
    loginUser,
    getMe,
    updateMe
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const { validate, authBody } = require("../middleware/validationMiddleware");
const { authLimiter } = require("../middleware/rateLimiter");
const sanitizeInput = require("../middleware/sanitizeMiddleware");
const { profileBody } = require("../middleware/validationMiddleware");

const router = express.Router();

router.post("/register", authLimiter, sanitizeInput, validate(authBody("register")), registerUser);
router.post("/login", authLimiter, sanitizeInput, validate(authBody("login")), loginUser);
router.get("/me", protect, getMe);
router.patch("/me", protect, sanitizeInput, validate(profileBody), updateMe);

module.exports = router;
