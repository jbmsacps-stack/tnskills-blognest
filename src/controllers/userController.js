const User = require("../models/User");
const AppError = require("../utils/AppError");
const normalizeRole = require("../utils/normalizeRole");

const roles = ["admin", "editor", "author", "reader"];

const listUsers = async (req, res, next) => {
    try {
        const records = await User.find().select("name email role createdAt").sort({ createdAt: -1 });
        const users = records.map((user) => ({ ...user.toObject(), role: normalizeRole(user.role) }));
        res.json({ success: true, data: users });
    } catch (error) { next(error); }
};

const changeRole = async (req, res, next) => {
    try {
        const { role } = req.body || {};
        if (Object.keys(req.body || {}).some((key) => key !== "role") || !roles.includes(role)) {
            throw new AppError("Provide one valid role", 422, "VALIDATION_ERROR");
        }
        const user = await User.findByIdAndUpdate(req.params.userId, { role }, { new: true, runValidators: true }).select("name email role");
        if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
        res.json({ success: true, data: user });
    } catch (error) { next(error); }
};

module.exports = { listUsers, changeRole };
