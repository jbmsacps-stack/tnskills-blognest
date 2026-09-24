const mongoose = require("mongoose");
const AppError = require("../utils/AppError");

const errorHandler = (error, req, res, next) => {
    if (res.headersSent) return next(error);

    let err = error;
    if (error instanceof mongoose.Error.CastError) {
        err = new AppError("Invalid resource identifier", 400, "INVALID_ID");
    } else if (error instanceof mongoose.Error.ValidationError) {
        err = new AppError("Request validation failed", 422, "VALIDATION_ERROR");
    } else if (error?.code === 11000) {
        err = new AppError("A record with this value already exists", 409, "DUPLICATE_VALUE");
    } else if (error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError") {
        err = new AppError("Invalid or expired token", 401, "INVALID_TOKEN");
    } else if (error?.type === "entity.too.large") {
        err = new AppError("Request body is too large", 413, "PAYLOAD_TOO_LARGE");
    } else if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        err = new AppError("Malformed JSON request body", 400, "BAD_REQUEST");
    } else if (!(error instanceof AppError)) {
        err = new AppError("An unexpected error occurred", 500, "INTERNAL_ERROR");
    }

    const safeLog = String(error.stack || error.message || error.name)
        .replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, "[redacted database URI]")
        .replace(/Bearer\s+[^\s]+/gi, "Bearer [redacted]")
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted email]");
    console.error(`[${req.method} ${req.path}] ${safeLog}`);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message,
        error: { code: err.code || "INTERNAL_ERROR" }
    });
};

module.exports = errorHandler;
