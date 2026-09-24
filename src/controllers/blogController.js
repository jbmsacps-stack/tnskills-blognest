const Blog = require("../models/Blog");
const { escapeRegex, pagination } = require("../utils/safeInput");
const AppError = require("../utils/AppError");

const createBlog = async (req, res, next) => {
    try {
        const {
            title,
            content,
            category,
            tags,
            status
        } = req.validated || req.body;

        if (!title || !title.trim()) {
            throw new AppError("Blog title is required", 400, "BAD_REQUEST");
        }

        if (!content || !content.trim()) {
            throw new AppError("Blog content is required", 400, "BAD_REQUEST");
        }

        const blogStatus = status || "draft";

        if (!["draft", "published"].includes(blogStatus)) {
            throw new AppError("Invalid blog status", 400, "BAD_REQUEST");
        }

        const blog = await Blog.create({
            title: title.trim(),
            content: content.trim(),
            author: req.user.userId,
            category: category?.trim() || "General",
            tags: Array.isArray(tags) ? tags : [],
            status: blogStatus
        });

        const populatedBlog = await blog.populate(
            "author",
            "name email"
        );

        res.status(201).json({
            message: "Blog created successfully",
            blog: populatedBlog
        });

    } catch (error) {
        next(error);
    }
};

const getManageableBlogs = async (req, res, next) => {
    try {
        const blogs = await Blog.find().populate("author", "name email").sort({ updatedAt: -1 }).limit(100);
        res.json({ count: blogs.length, blogs });
    } catch (error) { next(error); }
};

const getBlogs = async (req, res, next) => {
    try {
        const { page, limit } = pagination(req.query);

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
        next(error);
    }
};

const searchBlogs = async (req, res, next) => {
    try {
        const { q } = req.query;

        if (typeof q !== "string" || !q.trim() || q.length > 100) {
            throw new AppError("Search query must be between 1 and 100 characters", 400, "INVALID_QUERY");
        }

        const { page, limit } = pagination(req.query);

        const skip = (page - 1) * limit;
        const searchTerm = q.trim();

        const filter = {
            status: "published",
            $or: [
                { title: { $regex: escapeRegex(searchTerm), $options: "i" } },
                { content: { $regex: escapeRegex(searchTerm), $options: "i" } },
                { category: { $regex: escapeRegex(searchTerm), $options: "i" } },
                { tags: { $regex: escapeRegex(searchTerm), $options: "i" } }
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
        next(error);
    }
};

const filterBlogs = async (req, res, next) => {
    try {
        const { category, tag } = req.query;

        if ((!category && !tag) || (category !== undefined && typeof category !== "string") || (tag !== undefined && typeof tag !== "string") || (category && category.length > 80) || (tag && tag.length > 40)) {
            throw new AppError("Provide a valid category or tag", 400, "INVALID_QUERY");
        }

        const { page, limit } = pagination(req.query);

        const skip = (page - 1) * limit;

        const filter = {
            status: "published"
        };

        if (category) {
            filter.category = {
                $regex: `^${escapeRegex(category.trim())}$`,
                $options: "i"
            };
        }

        if (tag) {
            filter.tags = {
                $regex: `^${escapeRegex(tag.trim())}$`,
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
        next(error);
    }
};

const getMyBlogs = async (req, res, next) => {
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
        next(error);
    }
};

const getBlogById = async (req, res, next) => {
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
            throw new AppError("Blog not found", 404, "NOT_FOUND");
        }

        res.status(200).json({
            blog
        });

    } catch (error) {
        next(error);
    }
};

const updateBlog = async (req, res, next) => {
    try {
        const { title, content, category, tags, status } = req.validated || req.body;

        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            throw new AppError("Blog not found", 404, "NOT_FOUND");
        }

        // Only the author can update the blog
        if (blog.author.toString() !== req.user.userId && !["editor", "admin"].includes(req.user.role)) {
            throw new AppError("You are not allowed to update this blog", 403, "FORBIDDEN");
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
        next(error);
    }
};

const deleteBlog = async (req, res, next) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            throw new AppError("Blog not found", 404, "NOT_FOUND");
        }

        // Only the author can delete the blog
        if (blog.author.toString() !== req.user.userId && !["editor", "admin"].includes(req.user.role)) {
            throw new AppError("You are not allowed to delete this blog", 403, "FORBIDDEN");
        }

        await Blog.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Blog deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

const toggleLike = async (req, res, next) => {
    try {
        const blog = await Blog.findOne({
            _id: req.params.id,
            status: "published"
        });

        if (!blog) {
            throw new AppError("Blog not found", 404, "NOT_FOUND");
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
        next(error);
    }
};

module.exports = {
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
};
