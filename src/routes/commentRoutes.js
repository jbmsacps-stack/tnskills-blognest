const express = require("express");

const {
    createComment,
    getComments
} = require("../controllers/commentController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:blogId", getComments);

router.post("/:blogId", protect, createComment);

module.exports = router;