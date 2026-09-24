const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: "Authentication required", error: { code: "UNAUTHORIZED" } });
    if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: "You are not allowed to perform this action", error: { code: "FORBIDDEN" } });
    next();
};

module.exports = requireRole;
