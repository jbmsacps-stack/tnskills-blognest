const AppError = require("../utils/AppError");

const generateBlog = async ({ topic, tone, length, category, keywords }) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) throw new AppError("AI generation is not configured", 503, "AI_UNAVAILABLE");

    const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey
            },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: `Write an original ${length} blog post in a ${tone} tone about "${topic}". Category: ${category}. Keywords: ${keywords.join(", ") || "none"}. Return only valid JSON in exactly this structure: {"title":"...","content":"...","category":"...","tags":["..."],"status":"draft"}. Do not wrap the JSON in Markdown unless necessary.` }]
                }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            const providerMessage = String(payload?.error?.message || response.statusText || "Unknown Gemini error")
                .split(apiKey).join("[redacted]");
            console.error("Gemini API error:", { status: response.status, message: providerMessage });

            if (response.status === 429) throw new AppError("AI provider is rate limited; try again later", 429, "AI_RATE_LIMITED");
            throw new AppError("AI provider could not generate content", 502, "AI_PROVIDER_ERROR");
        }

        const generatedText = payload?.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || "")
            .join("")
            .trim();
        if (!generatedText) throw new AppError("AI provider returned an empty response", 502, "AI_INVALID_RESPONSE");

        const jsonText = generatedText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        let blog;
        try {
            blog = JSON.parse(jsonText);
        } catch {
            throw new AppError("AI provider returned an invalid response", 502, "AI_INVALID_RESPONSE");
        }

        if (!blog || typeof blog !== "object" || Array.isArray(blog)
            || typeof blog.title !== "string" || typeof blog.content !== "string"
            || (blog.tags !== undefined && !Array.isArray(blog.tags))) {
            throw new AppError("AI provider returned an invalid response", 502, "AI_INVALID_RESPONSE");
        }

        return {
            title: blog.title.slice(0, 150),
            content: blog.content.slice(0, 100000),
            category: typeof blog.category === "string" ? blog.category.slice(0, 80) : category,
            tags: (blog.tags || []).filter((tag) => typeof tag === "string").slice(0, 20),
            status: "draft"
        };
    } catch (error) {
        if (error instanceof AppError) throw error;
        if (error.name === "AbortError") throw new AppError("AI generation timed out", 504, "AI_TIMEOUT");
        console.error("Gemini network error:", error.name || "Request failed");
        throw new AppError("AI provider could not generate content", 502, "AI_PROVIDER_ERROR");
    } finally {
        clearTimeout(timeout);
    }
};

module.exports = { generateBlog };
