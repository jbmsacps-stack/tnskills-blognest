const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");
const commentRoutes = require("./routes/commentRoutes");
const userRoutes = require("./routes/userRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const aiRoutes = require("./routes/aiRoutes");
const { generalLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorMiddleware");

const app = express();
const allowedOrigins = process.env.CORS_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean);

// Middleware
app.use(helmet());
app.use(cors({ origin: allowedOrigins?.length ? allowedOrigins : false }));
app.use(express.json({ limit: "1mb" }));
morgan.token("safe-url", (req) => req.originalUrl.split("?")[0]);
app.use(morgan(":method :safe-url :status :response-time ms"));
app.use("/api", generalLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/ai", aiRoutes);

// Health check
app.get("/", (req, res) => {
    res.json({
        message: "BlogNest API is running"
    });
});

app.use((req, res) => res.status(404).json({ success: false, message: "Route not found", error: { code: "NOT_FOUND" } }));
app.use(errorHandler);

module.exports = app;
