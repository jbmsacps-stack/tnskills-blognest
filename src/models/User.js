const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        bio: { type: String, trim: true, maxlength: 500, default: "" },
        avatarUrl: { type: String, trim: true, maxlength: 2048, default: "" },

        role: {
            type: String,
            enum: ["admin", "editor", "author", "reader"],
            default: "reader"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
