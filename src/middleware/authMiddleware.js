const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const normalizeRole = require("../utils/normalizeRole");

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError("Authentication required", 401, "UNAUTHORIZED");
        }

        const token = authHeader.split(" ")[1];

        if (!process.env.JWT_SECRET) throw new AppError("Authentication service is not configured", 500, "INTERNAL_ERROR");
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        const user = await User.findById(decoded.userId).select("name email role");
        if (!user) throw new AppError("User account is unavailable", 401, "UNAUTHORIZED");
        // Pre-RBAC accounts with role=user retain author capabilities. Missing roles are readers.
        const role = normalizeRole(user.role);
        req.user = { userId: user._id.toString(), role, name: user.name, email: user.email };

        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return next(new AppError("Invalid or expired token", 401, "INVALID_TOKEN"));
        }
        return next(error);
    }
};

module.exports = protect;
