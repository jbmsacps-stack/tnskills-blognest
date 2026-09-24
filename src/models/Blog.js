const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },

        content: {
            type: String,
            required: true
        },

        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        category: {
            type: String,
            trim: true,
            default: "General"
        },

        tags: [
            {
                type: String,
                trim: true
            }
        ],

        status: {
            type: String,
            enum: ["draft", "published"],
            default: "draft"
        },

        views: {
            type: Number,
            default: 0,
            min: 0
        },

        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        media: [{ type: mongoose.Schema.Types.ObjectId, ref: "Media" }],
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Blog", blogSchema);
