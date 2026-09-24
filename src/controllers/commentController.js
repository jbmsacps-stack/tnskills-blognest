const Comment = require("../models/Comment");
const Blog = require("../models/Blog");
const AppError = require("../utils/AppError");

const createComment = async (req, res, next) => {
    try {
        const { content } = req.validated || req.body;
        const { blogId } = req.params;

        if (!content) {
            throw new AppError("Comment content is required", 400, "BAD_REQUEST");
        }

        const blog = await Blog.findOne({
            _id: blogId,
            status: "published"
        });

        if (!blog) {
            throw new AppError("Blog not found", 404, "NOT_FOUND");
        }

        const comment = await Comment.create({
            content,
            author: req.user.userId,
            blog: blogId
        });

        const populatedComment = await comment.populate(
            "author",
            "name"
        );

        res.status(201).json({
            message: "Comment added successfully",
            comment: populatedComment
        });
    } catch (error) {
        next(error);
    }
};

const getComments = async (req, res, next) => {
    try {
        const blog = await Blog.findById(req.params.blogId).select("status");
        if (!blog || blog.status !== "published") throw new AppError("Blog not found", 404, "NOT_FOUND");
        const comments = await Comment.find({
            blog: req.params.blogId
        })
            .populate("author", "name")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: comments.length,
            comments
        });

    } catch (error) {
        next(error);
    }
};

const deleteComment = async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            throw new AppError("Comment not found", 404, "NOT_FOUND");
        }

        if (comment.author.toString() !== req.user.userId && !["editor", "admin"].includes(req.user.role)) {
            throw new AppError("You are not allowed to delete this comment", 403, "FORBIDDEN");
        }

        await Comment.findByIdAndDelete(req.params.commentId);

        res.status(200).json({
            message: "Comment deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createComment,
    getComments,
    deleteComment
};
