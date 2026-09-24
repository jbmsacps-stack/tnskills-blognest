const express = require("express");

const {
    createComment,
    getComments,
    deleteComment
} = require("../controllers/commentController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:blogId", getComments);

router.post("/:blogId", protect, createComment);

router.delete("/:commentId", protect, deleteComment);

module.exports = router;