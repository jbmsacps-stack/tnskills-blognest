const test = require("node:test");
const assert = require("node:assert/strict");
const { generateBlog } = require("../src/services/geminiService");

const originalKey = process.env.GEMINI_API_KEY;
const originalModel = process.env.GEMINI_MODEL;
const originalTimeout = process.env.GEMINI_TIMEOUT_MS;
const originalFetch = global.fetch;
const originalConsoleError = console.error;

const request = () => generateBlog({ topic: "Cloud computing", tone: "professional", length: "medium", category: "Technology", keywords: ["cloud"] });
const response = (status, payload) => ({ ok: status >= 200 && status < 300, status, json: async () => payload });
const success = (text) => response(200, { candidates: [{ content: { parts: [{ text }] } }] });

test.beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key-never-real";
    process.env.GEMINI_MODEL = "gemini-3.8-flash";
    process.env.GEMINI_TIMEOUT_MS = "100";
    console.error = () => {};
});

test.afterEach(() => {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = originalModel;
    if (originalTimeout === undefined) delete process.env.GEMINI_TIMEOUT_MS;
    else process.env.GEMINI_TIMEOUT_MS = originalTimeout;
});

test("generates a draft from fenced JSON and sends the configured model/request", async () => {
    let captured;
    global.fetch = async (url, options) => {
        captured = { url, options, body: JSON.parse(options.body) };
        return success('```json\n{"title":"Cloud Basics","content":"Draft text","tags":["cloud"]}\n```');
    };
    const result = await request();
    assert.equal(result.status, "draft");
    assert.equal(result.title, "Cloud Basics");
    assert.match(captured.url, /\/v1beta\/models\/gemini-3\.8-flash:generateContent$/);
    assert.equal(captured.options.headers["x-goog-api-key"], "test-key-never-real");
    assert.equal(captured.body.contents[0].role, "user");
    assert.equal(captured.body.generationConfig.responseMimeType, "application/json");
});

test("missing API key returns AI_UNAVAILABLE", async () => {
    delete process.env.GEMINI_API_KEY;
    await assert.rejects(request, (error) => error.code === "AI_UNAVAILABLE" && error.statusCode === 503);
});

test("HTTP 429 maps to AI_RATE_LIMITED", async () => {
    global.fetch = async () => response(429, { error: { status: "RESOURCE_EXHAUSTED" } });
    await assert.rejects(request, (error) => error.code === "AI_RATE_LIMITED" && error.statusCode === 429);
});

test("invalid credential gives a safe server diagnostic and no provider details", async () => {
    let logged;
    console.error = (...args) => { logged = args; };
    global.fetch = async () => response(400, { error: { code: 400, message: "Invalid key test-key-never-real" } });
    await assert.rejects(request, (error) => error.code === "AI_PROVIDER_ERROR" && error.statusCode === 502 && !error.message.includes("test-key"));
    assert.equal(JSON.stringify(logged).includes("test-key-never-real"), false);
    assert.equal(JSON.stringify(logged).includes("Invalid key [redacted]"), true);
});

test("malformed and empty provider content map to AI_INVALID_RESPONSE", async (t) => {
    await t.test("malformed JSON", async () => {
        global.fetch = async () => success("not json");
        await assert.rejects(request, (error) => error.code === "AI_INVALID_RESPONSE");
    });
    await t.test("empty candidates", async () => {
        global.fetch = async () => response(200, { candidates: [] });
        await assert.rejects(request, (error) => error.code === "AI_INVALID_RESPONSE");
    });
    await t.test("invalid response shape", async () => {
        global.fetch = async () => success('{"title":"Only title"}');
        await assert.rejects(request, (error) => error.code === "AI_INVALID_RESPONSE");
    });
});

test("network failure and timeout are mapped", async (t) => {
    await t.test("network", async () => {
        global.fetch = async () => { throw new TypeError("network unavailable"); };
        await assert.rejects(request, (error) => error.code === "AI_PROVIDER_ERROR" && error.statusCode === 502);
    });
    await t.test("timeout", async () => {
        global.fetch = async () => { throw Object.assign(new Error("aborted"), { name: "AbortError" }); };
        await assert.rejects(request, (error) => error.code === "AI_TIMEOUT" && error.statusCode === 504);
    });
});
