const Blog = require("../models/Blog");

const createBlog = async (req, res) => {
    try {
        const { title, content, category, tags, status } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                message: "Title and content are required"
            });
        }

        const blog = await Blog.create({
            title,
            content,
            category,
            tags,
            status,
            author: req.user.userId
        });

        res.status(201).json({
            message: "Blog created successfully",
            blog
        });
    } catch (error) {
        console.error("Create blog error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ status: "published" })
            .populate("author", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: blogs.length,
            blogs
        });
    } catch (error) {
        console.error("Get blogs error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    createBlog,
    getBlogs
};