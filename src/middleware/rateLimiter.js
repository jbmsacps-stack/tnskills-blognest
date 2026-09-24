const rateLimit = require("express-rate-limit");
const AppError = require("../utils/AppError");

const createLimiter = (prefix, defaults) => rateLimit({
    windowMs: Number(process.env[`${prefix}_RATE_WINDOW_MS`]) || defaults.windowMs,
    limit: Number(process.env[`${prefix}_RATE_LIMIT`]) || defaults.limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (req, res, next) => {
        const resetAt = req.rateLimit?.resetTime;
        if (resetAt instanceof Date) res.setHeader("Retry-After", Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000)));
        next(new AppError("Too many requests. Please try again later.", 429, "RATE_LIMITED"));
    }
});

module.exports = {
    generalLimiter: createLimiter("GENERAL", { windowMs: 15 * 60 * 1000, limit: 300 }),
    authLimiter: createLimiter("AUTH", { windowMs: 15 * 60 * 1000, limit: 20 }),
    commentLimiter: createLimiter("COMMENT", { windowMs: 60 * 60 * 1000, limit: 30 }),
    aiLimiter: createLimiter("AI", { windowMs: 60 * 60 * 1000, limit: 5 })
};
