const express = require("express");
const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { aiLimiter } = require("../middleware/rateLimiter");
const { generateBlogDraft } = require("../controllers/aiController");
const sanitizeInput = require("../middleware/sanitizeMiddleware");

const router = express.Router();
router.post("/blog/generate", protect, requireRole("author", "editor", "admin"), aiLimiter, sanitizeInput, generateBlogDraft);
module.exports = router;
