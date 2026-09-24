const plainTextFields = new Set(["name", "email", "title", "category", "altText", "filename", "originalName", "mimeType", "tone", "bio"]);
const clean = (value) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/<\/?(?:script|style|iframe|object|embed)[^>]*>/gi, "");

const sanitizeInput = (req, res, next) => {
    const walk = (value, key) => {
        if (typeof value === "string") {
            if (key === "password") return value;
            const safe = clean(value);
            // Preserve blog Markdown; comments and metadata are plain text and lose markup.
            if (key === "content" && !req.baseUrl.startsWith("/api/comments")) return safe;
            return plainTextFields.has(key) || key === "tag" || key === "keyword" || key === "content" ? safe.replace(/<[^>]*>/g, "").trim() : safe;
        }
        if (Array.isArray(value)) return value.map((item) => walk(item, key === "tags" ? "tag" : key === "keywords" ? "keyword" : key));
        if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, walk(child, childKey)]));
        return value;
    };
    if (req.body && typeof req.body === "object") req.body = walk(req.body, "");
    next();
};

module.exports = sanitizeInput;
