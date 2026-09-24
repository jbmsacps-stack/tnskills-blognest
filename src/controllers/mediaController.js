const Media = require("../models/Media");
const Blog = require("../models/Blog");
const AppError = require("../utils/AppError");

const createMediaMetadata = async (req, res, next) => {
    try {
        const { filename, originalName, mimeType, size, url, altText, blogId } = req.body || {};
        const keys = ["filename", "originalName", "mimeType", "size", "url", "altText", "blogId"];
        if (Object.keys(req.body || {}).some((key) => !keys.includes(key))) throw new AppError("Unexpected media field", 422, "UNEXPECTED_FIELD");
        if (![filename, originalName, mimeType, url, blogId].every((v) => typeof v === "string" && v.trim()) || !Number.isInteger(size) || size < 1 || size > 10485760) throw new AppError("Required media metadata is missing or invalid", 422, "VALIDATION_ERROR");
        if (filename.length > 255 || originalName.length > 255 || url.length > 2048 || (req.body.altText !== undefined && (typeof req.body.altText !== "string" || req.body.altText.length > 250))) throw new AppError("Media metadata exceeds the allowed size", 422, "VALIDATION_ERROR");
        if (!/^https?:\/\//i.test(url) && (!url.startsWith("/") || url.startsWith("//"))) throw new AppError("Media URL must be an absolute HTTP(S) URL or app path", 422, "VALIDATION_ERROR");
        if (/^https?:\/\//i.test(url)) {
            try { if (!new URL(url).hostname) throw new Error("Invalid URL"); }
            catch { throw new AppError("Media URL must be valid HTTP(S)", 422, "VALIDATION_ERROR"); }
        }
        const blog = await Blog.findById(blogId);
        if (!blog) throw new AppError("Blog not found", 404, "NOT_FOUND");
        if (blog.author.toString() !== req.user.userId && !["admin", "editor"].includes(req.user.role)) throw new AppError("You cannot manage media for this blog", 403, "FORBIDDEN");
        const media = await Media.create({ filename, originalName, mimeType, size, url, altText, blog: blogId, uploadedBy: req.user.userId });
        blog.media.push(media._id);
        await blog.save();
        res.status(201).json({ success: true, data: media });
    } catch (error) { next(error); }
};

const getBlogMedia = async (req, res, next) => {
    try {
        const blog = await Blog.findById(req.params.blogId);
        if (!blog) throw new AppError("Blog not found", 404, "NOT_FOUND");
        if (blog.status !== "published" && blog.author.toString() !== req.user?.userId && !["admin", "editor"].includes(req.user?.role)) throw new AppError("Blog not found", 404, "NOT_FOUND");
        const media = await Media.find({ blog: blog._id }).sort({ createdAt: 1 });
        res.json({ success: true, data: media });
    } catch (error) { next(error); }
};

module.exports = { createMediaMetadata, getBlogMedia };
