const express = require("express");

const {
    createBlog,
    getBlogs,
    searchBlogs,
    filterBlogs,
    getBlogById,
    updateBlog,
    deleteBlog
} = require("../controllers/blogController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getBlogs);

router.get("/search", searchBlogs);

router.get("/filter", filterBlogs);

router.get("/:id", getBlogById);

router.post("/", protect, createBlog);

router.put("/:id", protect, updateBlog);

router.delete("/:id", protect, deleteBlog);

module.exports = router;