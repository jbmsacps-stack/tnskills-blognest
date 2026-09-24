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
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(
            Math.max(parseInt(req.query.limit) || 10, 1),
            50
        );

        const skip = (page - 1) * limit;

        const filter = {
            status: "published"
        };

        const [blogs, totalBlogs] = await Promise.all([
            Blog.find(filter)
                .populate("author", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            Blog.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalBlogs / limit);

        res.status(200).json({
            count: blogs.length,
            pagination: {
                currentPage: page,
                limit,
                totalBlogs,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            },
            blogs
        });

    } catch (error) {
        console.error("Get blogs error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const searchBlogs = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || !q.trim()) {
            return res.status(400).json({
                message: "Search query is required"
            });
        }

        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(
            Math.max(parseInt(req.query.limit) || 10, 1),
            50
        );

        const skip = (page - 1) * limit;
        const searchTerm = q.trim();

        const filter = {
            status: "published",
            $or: [
                { title: { $regex: searchTerm, $options: "i" } },
                { content: { $regex: searchTerm, $options: "i" } },
                { category: { $regex: searchTerm, $options: "i" } },
                { tags: { $regex: searchTerm, $options: "i" } }
            ]
        };

        const [blogs, totalBlogs] = await Promise.all([
            Blog.find(filter)
                .populate("author", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            Blog.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalBlogs / limit);

        res.status(200).json({
            count: blogs.length,
            query: searchTerm,
            pagination: {
                currentPage: page,
                limit,
                totalBlogs,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            },
            blogs
        });

    } catch (error) {
        console.error("Search blogs error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const filterBlogs = async (req, res) => {
    try {
        const { category, tag } = req.query;

        if (!category && !tag) {
            return res.status(400).json({
                message: "Category or tag is required"
            });
        }

        const page = Math.max(parseInt(req.query.page) || 1, 1);

        const limit = Math.min(
            Math.max(parseInt(req.query.limit) || 10, 1),
            50
        );

        const skip = (page - 1) * limit;

        const filter = {
            status: "published"
        };

        if (category) {
            filter.category = {
                $regex: `^${category.trim()}$`,
                $options: "i"
            };
        }

        if (tag) {
            filter.tags = {
                $regex: `^${tag.trim()}$`,
                $options: "i"
            };
        }

        const [blogs, totalBlogs] = await Promise.all([
            Blog.find(filter)
                .populate("author", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            Blog.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalBlogs / limit);

        res.status(200).json({
            count: blogs.length,

            filters: {
                category: category || null,
                tag: tag || null
            },

            pagination: {
                currentPage: page,
                limit,
                totalBlogs,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            },

            blogs
        });

    } catch (error) {
        console.error("Filter blogs error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getMyBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({
            author: req.user.userId
        })
            .populate("author", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: blogs.length,
            blogs
        });

    } catch (error) {
        console.error("Get my blogs error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findOneAndUpdate(
            {
                _id: req.params.id,
                status: "published"
            },
            {
                $inc: { views: 1 }
            },
            {
                new: true
            }
        ).populate("author", "name email");

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

const toggleLike = async (req, res) => {
    try {
        const blog = await Blog.findOne({
            _id: req.params.id,
            status: "published"
        });

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found"
            });
        }

        const userId = req.user.userId;

        const alreadyLiked = blog.likes.some(
            (user) => user.toString() === userId
        );

        if (alreadyLiked) {
            blog.likes = blog.likes.filter(
                (user) => user.toString() !== userId
            );

            await blog.save();

            return res.status(200).json({
                message: "Blog unliked successfully",
                liked: false,
                likes: blog.likes.length
            });
        }

        blog.likes.push(userId);

        await blog.save();

        res.status(200).json({
            message: "Blog liked successfully",
            liked: true,
            likes: blog.likes.length
        });

    } catch (error) {
        console.error("Toggle like error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    createBlog,
    getBlogs,
    searchBlogs,
    filterBlogs,
    getMyBlogs,
    getBlogById,
    updateBlog,
    deleteBlog,
    toggleLike
};