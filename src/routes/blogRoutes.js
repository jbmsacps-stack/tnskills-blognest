const express = require("express");

const {
    createBlog,
    getManageableBlogs,
    getBlogs,
    searchBlogs,
    filterBlogs,
    getMyBlogs,
    getBlogById,
    updateBlog,
    deleteBlog,
    toggleLike
} = require("../controllers/blogController");

const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { validate, blogBody } = require("../middleware/validationMiddleware");
const sanitizeInput = require("../middleware/sanitizeMiddleware");

const router = express.Router();

router.get("/", getBlogs);

router.get("/search", searchBlogs);

router.get("/filter", filterBlogs);

router.get("/my-blogs", protect, getMyBlogs);
router.get("/manage", protect, requireRole("editor", "admin"), getManageableBlogs);

router.post("/:id/like", protect, toggleLike);

router.get("/:id", getBlogById);

router.post("/", protect, requireRole("author", "editor", "admin"), sanitizeInput, validate(blogBody), createBlog);

router.put("/:id", protect, requireRole("author", "editor", "admin"), sanitizeInput, validate(blogBody), updateBlog);

router.delete("/:id", protect, requireRole("author", "editor", "admin"), deleteBlog);

module.exports = router;
