const express = require("express");
const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { createMediaMetadata, getBlogMedia } = require("../controllers/mediaController");
const sanitizeInput = require("../middleware/sanitizeMiddleware");

const router = express.Router();
router.post("/", protect, requireRole("author", "editor", "admin"), sanitizeInput, createMediaMetadata);
router.get("/blog/:blogId", getBlogMedia);
module.exports = router;
