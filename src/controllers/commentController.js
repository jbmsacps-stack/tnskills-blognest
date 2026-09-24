const Comment = require("../models/Comment");
const Blog = require("../models/Blog");

const createComment = async (req, res) => {
    try {
        const { content } = req.body;
        const { blogId } = req.params;

        if (!content) {
            return res.status(400).json({
                message: "Comment content is required"
            });
        }

        const blog = await Blog.findOne({
            _id: blogId,
            status: "published"
        });

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found"
            });
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
        console.error("Create comment error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getComments = async (req, res) => {
    try {
        console.log("1. Getting comments...");
        console.log("Blog ID:", req.params.blogId);

        const comments = await Comment.find({
            blog: req.params.blogId
        })
            .populate("author", "name")
            .sort({ createdAt: -1 });

        console.log("2. Comments query completed");
        console.log("Comments found:", comments.length);

        res.status(200).json({
            count: comments.length,
            comments
        });

    } catch (error) {
        console.error("Get comments error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        if (comment.author.toString() !== req.user.userId) {
            return res.status(403).json({
                message: "You are not allowed to delete this comment"
            });
        }

        await Comment.findByIdAndDelete(req.params.commentId);

        res.status(200).json({
            message: "Comment deleted successfully"
        });
    } catch (error) {
        console.error("Delete comment error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    createComment,
    getComments,
    deleteComment
};