require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    const missing = ["MONGODB_URI", "JWT_SECRET"].filter((name) => !process.env[name]?.trim());
    if (missing.length) {
        console.error(`Cannot start BlogNest API; missing required configuration: ${missing.join(", ")}`);
        process.exitCode = 1;
        return;
    }
    await connectDB();

    app.listen(PORT, () => {
        console.log(`BlogNest API running on port ${PORT}`);
    });
};

startServer();
