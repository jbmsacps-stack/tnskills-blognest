const express = require("express");

const {
    createComment,
    getComments,
    deleteComment
} = require("../controllers/commentController");

const protect = require("../middleware/authMiddleware");
const { validate, commentBody } = require("../middleware/validationMiddleware");
const { commentLimiter } = require("../middleware/rateLimiter");
const sanitizeInput = require("../middleware/sanitizeMiddleware");

const router = express.Router();

router.get("/:blogId", getComments);

router.post("/:blogId", protect, commentLimiter, sanitizeInput, validate(commentBody), createComment);

router.delete("/:commentId", protect, deleteComment);

module.exports = router;
