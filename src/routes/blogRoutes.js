const express = require("express");

const {
    createBlog,
    getBlogs,
    getBlogById,
    updateBlog
} = require("../controllers/blogController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getBlogs);

router.get("/:id", getBlogById);

router.post("/", protect, createBlog);

router.put("/:id", protect, updateBlog);

module.exports = router;