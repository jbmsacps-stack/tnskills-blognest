require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

const ADMIN_EMAIL = "joshuabaskar106@gmail.com";

const makeAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const user = await User.findOne({
            email: ADMIN_EMAIL
        });

        if (!user) {
            console.log("User not found:", ADMIN_EMAIL);
            process.exit(1);
        }

        user.role = "admin";
        await user.save();

        console.log(`Admin role assigned to ${user.email}`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("Failed:", error.message);
        process.exit(1);
    }
};

makeAdmin();