# BlogNest API

BlogNest is a CommonJS Node.js, Express 5, and MongoDB blogging API.

## Features

- JWT authentication with bcrypt password hashing
- Blog drafts, publishing, search, category/tag filters, pagination, views, and likes
- Comments and ownership-aware moderation
- Roles: admin, editor, author, and reader
- Centralized JSON errors, input validation/sanitization, and per-area rate limits
- Metadata-only media associations (no file upload or storage)
- Optional Gemini blog draft generation; generated content is returned for review and is never saved or published automatically

## Run

1. Copy .env.example to .env and set MONGODB_URI and a strong JWT_SECRET.
2. Run npm install.
3. Run npm run dev for development or npm start for production.

Use Node.js 18 or newer.

The server listens on port 5000 unless PORT is set. Configure CORS_ORIGINS as a comma-separated list of browser origins. If unset, cross-origin browser requests are disabled.

## Roles and permissions

| Role | Permissions |
| --- | --- |
| Admin | Manage users and roles; create, edit, delete any blog; moderate comments and media |
| Editor | Create/edit/delete any blog; moderate comments and manage blog media; cannot change roles |
| Author | Create, edit, delete, and publish own blogs; manage own media |
| Reader | Read published blogs, search/filter, view comments, like posts, and comment when authenticated |

Registration always creates a reader; callers cannot set a role. Admins change roles through PATCH /api/users/:userId/role. Legacy accounts with the old user role are treated as authors to preserve their existing author permissions. Accounts without a role are treated as readers.

For a fresh installation, register the first user, then have the database operator promote that account once using the trusted MongoDB administration console (for example: db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })). There is no public bootstrap-admin endpoint. After that, role changes use the authenticated admin API.

Authenticated requests send Authorization: Bearer <token>.

## API endpoints

### Authentication

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | /api/auth/register | Public, strict auth limit |
| POST | /api/auth/login | Public, strict auth limit |
| GET | /api/auth/me | Authenticated |
| PATCH | /api/auth/me | Authenticated profile update |

Registration body:

    {"name":"A. Writer","email":"writer@example.com","password":"A-strong-password"}

Profile update body accepts only name, bio, and HTTPS avatarUrl fields, for example: {"bio":"Cloud writer","avatarUrl":"https://cdn.example.com/avatar.png"}. A role cannot be changed through the profile endpoint.

### Blogs

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | /api/blogs?page=1&limit=10 | Public, published only |
| GET | /api/blogs/search?q=cloud&page=1&limit=10 | Public |
| GET | /api/blogs/filter?category=Technology&tag=cloud | Public |
| GET | /api/blogs/my-blogs | Authenticated |
| GET | /api/blogs/manage | Editor/admin |
| GET | /api/blogs/:id | Public, published only (increments views) |
| POST | /api/blogs | Author, editor, admin |
| PUT | /api/blogs/:id | Author (own), editor, admin |
| DELETE | /api/blogs/:id | Author (own), editor, admin |
| POST | /api/blogs/:id/like | Authenticated |

Create body:

    {"title":"Cloud Computing Basics","content":"Draft text or Markdown","category":"Technology","tags":["cloud","infrastructure"],"status":"draft"}

Status accepts draft or published. Blog content is stored as plain text/Markdown and is not rendered as trusted HTML by this API.

### Comments

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | /api/comments/:blogId | Public for published blog |
| POST | /api/comments/:blogId | Authenticated, comment rate limit |
| DELETE | /api/comments/:commentId | Comment author, editor, admin |

Comment body: {"content":"Useful article!"}.

### Users (admin only)

| Method | Endpoint | Body |
| --- | --- | --- |
| GET | /api/users | — |
| PATCH | /api/users/:userId/role | {"role":"reader"}

Allowed roles are admin, editor, author, and reader.

### Media metadata

No file is uploaded or stored. Register metadata for an already-hosted file using POST /api/media (author/editor/admin; owner checks apply):

    {"filename":"cover.webp","originalName":"Cover.webp","mimeType":"image/webp","size":84000,"url":"https://cdn.example.com/cover.webp","altText":"Clouds above a data center","blogId":"<blog ObjectId>"}

MIME types accepted: JPEG, PNG, WebP, GIF, and PDF. Maximum declared size is 10 MiB. GET /api/media/blog/:blogId lists metadata for a published blog; owners and editors/admins may also view draft media.

### AI blog generation

Set GEMINI_API_KEY. POST /api/ai/blog/generate requires author/editor/admin and has a strict AI rate limit.

    {"topic":"Introduction to Cloud Computing","tone":"professional","length":"medium","category":"Technology","keywords":["cloud computing","AWS","Azure"]}

Length accepts short, medium, or long. The response is a draft-shaped object with title, content, category, tags, and status: draft. It is not stored or published. Gemini provider failures are returned as safe application errors; credentials are never returned.

## Validation, sanitization, and errors

Validation rejects unknown fields on auth/blog/comment/AI payloads, invalid types, oversized values, invalid email/password lengths, unsupported enums, and invalid pagination/search inputs. Input sanitization removes control characters and markup from plain text metadata. Blog content is preserved as plain text/Markdown; clients that render it as HTML must apply an allowlist HTML sanitizer before rendering.

Errors use this shape:

    {"success":false,"message":"Human readable error","error":{"code":"VALIDATION_ERROR"}}

Common status codes: 400 bad request, 401 unauthenticated, 403 forbidden, 404 missing route/resource, 409 duplicate value, 413 oversized body, 422 invalid fields, 429 rate limited, 500 unexpected error, and 502/503/504 AI service errors. Production responses do not contain stack traces.

## Environment variables

See .env.example for configuration. Required: MONGODB_URI, JWT_SECRET. Gemini generation uses GEMINI_API_KEY and GEMINI_MODEL (default: gemini-3.8-flash). It calls the Gemini v1beta generateContent endpoint with a fixed 30-second timeout. Rate limits use built-in defaults and do not require environment variables.

Never commit .env or place API credentials in source code.

## Test

Run `npm test` for provider-independent Gemini tests covering successful parsing, missing credentials, invalid credentials, provider rate limits, malformed/empty output, timeouts, and network errors. These tests mock the provider and never use the configured API key.

## Postman: generate a blog draft

- Method: `POST`
- URL: `http://localhost:5000/api/ai/blog/generate`
- Headers: `Authorization: Bearer <author/editor/admin JWT>` and `Content-Type: application/json`
- Body (raw JSON):

      {
        "topic": "Introduction to Cloud Computing",
        "tone": "professional",
        "length": "medium",
        "category": "Technology",
        "keywords": ["cloud computing", "AWS", "Azure"]
      }

A successful request returns `success: true` and a `data` draft object with `status: "draft"`. The API does not save or publish it. If Google rejects the configured credential, verify that a valid `GEMINI_API_KEY` is set in the server's `.env`, then restart the server. Never send that key from Postman or frontend code.
