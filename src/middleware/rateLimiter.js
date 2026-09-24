const rateLimit = require("express-rate-limit");

const createLimiter = (prefix, defaults) => rateLimit({
    windowMs: Number(process.env[`${prefix}_RATE_WINDOW_MS`]) || defaults.windowMs,
    limit: Number(process.env[`${prefix}_RATE_LIMIT`]) || defaults.limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Please try again later.", error: { code: "RATE_LIMITED" } }
});

module.exports = {
    generalLimiter: createLimiter("GENERAL", { windowMs: 15 * 60 * 1000, limit: 300 }),
    authLimiter: createLimiter("AUTH", { windowMs: 15 * 60 * 1000, limit: 20 }),
    commentLimiter: createLimiter("COMMENT", { windowMs: 60 * 60 * 1000, limit: 30 }),
    aiLimiter: createLimiter("AI", { windowMs: 60 * 60 * 1000, limit: 5 })
};
