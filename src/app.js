const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/api/auth", authRoutes);

// Health check
app.get("/", (req, res) => {
    res.json({
        message: "BlogNest API is running"
    });
});

module.exports = app;