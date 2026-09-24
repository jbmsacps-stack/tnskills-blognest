const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
    filename: { type: String, required: true, trim: true, maxlength: 255 },
    originalName: { type: String, required: true, trim: true, maxlength: 255 },
    mimeType: { type: String, required: true, enum: ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"] },
    size: { type: Number, required: true, min: 1, max: 10485760 },
    url: { type: String, required: true, trim: true, maxlength: 2048 },
    altText: { type: String, trim: true, maxlength: 250, default: "" },
    blog: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

module.exports = mongoose.model("Media", mediaSchema);
