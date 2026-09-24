const AppError = require("../utils/AppError");

const validate = (validator) => (req, res, next) => {
    try {
        req.validated = validator(req);
        next();
    } catch (error) {
        next(error instanceof AppError ? error : new AppError(error.message || "Invalid request", 422, "VALIDATION_ERROR"));
    }
};

const objectBody = (req) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) throw new AppError("Request body must be a JSON object", 400, "INVALID_BODY");
    return req.body;
};

const only = (obj, allowed) => {
    const unexpected = Object.keys(obj).filter((key) => !allowed.includes(key));
    if (unexpected.length) throw new AppError(`Unexpected field: ${unexpected[0]}`, 422, "UNEXPECTED_FIELD");
};

const text = (value, label, min, max) => {
    if (typeof value !== "string") throw new AppError(`${label} must be text`, 422, "VALIDATION_ERROR");
    const trimmed = value.trim();
    if (trimmed.length < min || trimmed.length > max) throw new AppError(`${label} must be between ${min} and ${max} characters`, 422, "VALIDATION_ERROR");
    return trimmed;
};

const password = (value) => {
    if (typeof value !== "string" || value.length < 8 || value.length > 128) throw new AppError("Password must be between 8 and 128 characters", 422, "VALIDATION_ERROR");
    return value;
};

const authBody = (kind) => (req) => {
    const body = objectBody(req);
    const keys = kind === "register" ? ["name", "email", "password"] : ["email", "password"];
    only(body, keys);
    const result = { email: text(body.email, "Email", 3, 254).toLowerCase(), password: password(body.password) };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) throw new AppError("Enter a valid email address", 422, "VALIDATION_ERROR");
    if (kind === "register") result.name = text(body.name, "Name", 2, 80);
    return result;
};

const blogBody = (req) => {
    const body = objectBody(req);
    only(body, ["title", "content", "category", "tags", "status"]);
    const result = {};
    if (body.title !== undefined) result.title = text(body.title, "Title", 1, 150);
    if (body.content !== undefined) result.content = text(body.content, "Content", 1, 100000);
    if (body.category !== undefined) result.category = text(body.category, "Category", 1, 80);
    if (body.tags !== undefined) {
        if (!Array.isArray(body.tags) || body.tags.length > 20) throw new AppError("Tags must be an array of at most 20 items", 422, "VALIDATION_ERROR");
        result.tags = body.tags.map((tag) => text(tag, "Tag", 1, 40));
    }
    if (body.status !== undefined) {
        if (!["draft", "published"].includes(body.status)) throw new AppError("Status must be draft or published", 422, "VALIDATION_ERROR");
        result.status = body.status;
    }
    if (req.method === "POST" && (!result.title || !result.content)) throw new AppError("Title and content are required", 422, "VALIDATION_ERROR");
    if (!Object.keys(result).length) throw new AppError("Provide at least one blog field", 422, "VALIDATION_ERROR");
    return result;
};

const commentBody = (req) => {
    const body = objectBody(req); only(body, ["content"]);
    return { content: text(body.content, "Comment", 1, 500) };
};

const profileBody = (req) => {
    const body = objectBody(req); only(body, ["name", "bio", "avatarUrl"]);
    const result = {};
    if (body.name !== undefined) result.name = text(body.name, "Name", 2, 80);
    if (body.bio !== undefined) result.bio = text(body.bio, "Bio", 0, 500);
    if (body.avatarUrl !== undefined) {
        result.avatarUrl = text(body.avatarUrl, "Avatar URL", 0, 2048);
        if (result.avatarUrl && !/^https:\/\//i.test(result.avatarUrl)) throw new AppError("Avatar URL must use HTTPS", 422, "VALIDATION_ERROR");
    }
    if (!Object.keys(result).length) throw new AppError("Provide at least one profile field", 422, "VALIDATION_ERROR");
    return result;
};

module.exports = { validate, authBody, blogBody, commentBody, profileBody, objectBody, only, text };
