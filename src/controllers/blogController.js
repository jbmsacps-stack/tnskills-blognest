const Blog = require("../models/Blog");

const createBlog = async (req, res) => {
    // your existing code
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

const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findOne({
            _id: req.params.id,
            status: "published"
        }).populate("author", "name email");

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found"
            });
        }

        res.status(200).json({
            blog
        });
    } catch (error) {
        console.error("Get blog error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const updateBlog = async (req, res) => {
    try {
        const { title, content, category, tags, status } = req.body;

        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found"
            });
        }

        // Only the author can update the blog
        if (blog.author.toString() !== req.user.userId) {
            return res.status(403).json({
                message: "You are not allowed to update this blog"
            });
        }

        blog.title = title ?? blog.title;
        blog.content = content ?? blog.content;
        blog.category = category ?? blog.category;
        blog.tags = tags ?? blog.tags;
        blog.status = status ?? blog.status;

        await blog.save();

        res.status(200).json({
            message: "Blog updated successfully",
            blog
        });
    } catch (error) {
        console.error("Update blog error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found"
            });
        }

        // Only the author can delete the blog
        if (blog.author.toString() !== req.user.userId) {
            return res.status(403).json({
                message: "You are not allowed to delete this blog"
            });
        }

        await Blog.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Blog deleted successfully"
        });
    } catch (error) {
        console.error("Delete blog error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    createBlog,
    getBlogs,
    getBlogById,
    updateBlog,
    deleteBlog
};