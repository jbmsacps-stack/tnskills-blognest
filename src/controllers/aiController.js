const AppError = require("../utils/AppError");
const { generateBlog } = require("../services/geminiService");
const { text, only } = require("../middleware/validationMiddleware");

const sanitizePromptText = (value) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/<[^>]*>/g, "").trim();

const generateBlogDraft = async (req, res, next) => {
    try {
        const body = req.body;
        if (!body || typeof body !== "object" || Array.isArray(body)) throw new AppError("Request body must be an object", 400, "INVALID_BODY");
        only(body, ["topic", "tone", "length", "category", "keywords"]);
        const topic = sanitizePromptText(text(body.topic, "Topic", 3, 180));
        const tone = body.tone === undefined ? "professional" : sanitizePromptText(text(body.tone, "Tone", 3, 40));
        const length = body.length === undefined ? "medium" : body.length;
        if (!["short", "medium", "long"].includes(length)) throw new AppError("Length must be short, medium, or long", 422, "VALIDATION_ERROR");
        const category = body.category === undefined ? "General" : sanitizePromptText(text(body.category, "Category", 1, 80));
        const keywords = body.keywords === undefined ? [] : body.keywords;
        if (!Array.isArray(keywords) || keywords.length > 10) throw new AppError("Keywords must be an array of at most 10 items", 422, "VALIDATION_ERROR");
        const safeKeywords = keywords.map((word) => sanitizePromptText(text(word, "Keyword", 1, 40)));
        const data = await generateBlog({ topic, tone, length, category, keywords: safeKeywords });
        res.json({ success: true, data });
    } catch (error) { next(error); }
};

module.exports = { generateBlogDraft };
