const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const normalizeRole = require("../utils/normalizeRole");

const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.validated || req.body;

        // Validate required fields
        if (!email || !password) {
            throw new AppError("Email and password are required", 400, "BAD_REQUEST");
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
        }

        // Create JWT
        const token = jwt.sign(
            {
                userId: user._id,
                role: normalizeRole(user.role)
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

const registerUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.validated || req.body;

        // Validate required fields
        if (!name || !email || !password) {
            throw new AppError("Name, email and password are required", 400, "BAD_REQUEST");
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            throw new AppError("User with this email already exists", 409, "DUPLICATE_VALUE");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");

        if (!user) {
            throw new AppError("User not found", 404, "NOT_FOUND");
        }

        const profile = user.toObject();
        profile.role = normalizeRole(user.role);
        res.status(200).json({ user: profile });
    } catch (error) {
        next(error);
    }
};

const updateMe = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.user.userId, req.validated, { new: true, runValidators: true }).select("-password");
        if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
        res.json({ success: true, user });
    } catch (error) { next(error); }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateMe
};
