# BlogNest API

> A modular blogging REST API built with **Node.js, Express 5, MongoDB, JWT, bcrypt, and optional Gemini AI**.

BlogNest is designed as a backend for a modern blogging/CMS application. It provides authentication, role-based access control, blog CRUD, publishing, search and filtering, comments, likes, media metadata, validation, sanitization, rate limiting, centralized error handling, and optional AI-assisted blog drafting.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Run the API](#run-the-api)
- [Health Check](#health-check)
- [Authentication](#authentication)
- [Roles and Permissions](#roles-and-permissions)
- [Quick Postman Test](#quick-postman-test)
- [API Reference](#api-reference)
- [Blog Workflow](#blog-workflow)
- [Comments](#comments-1)
- [Media Metadata](#media-metadata)
- [AI Blog Generation](#ai-blog-generation)
- [Validation and Sanitization](#validation-and-sanitization)
- [Security](#security)
- [Rate Limits](#rate-limits)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [Important Notes](#important-notes)

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js 18+ | JavaScript runtime |
| Express 5 | REST API framework |
| MongoDB | Database |
| Mongoose | MongoDB ODM |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| Helmet | HTTP security headers |
| CORS | Cross-origin request control |
| Morgan | HTTP request logging |
| express-rate-limit | Rate limiting |
| Gemini API | Optional AI blog generation |
| Node.js Test Runner | Gemini service tests |

The project uses **CommonJS** modules and runs from `src/server.js`.

---

# Architecture

BlogNest follows a layered backend structure:

```text
Client / Postman / Frontend
          |
          v
      Express API
          |
          +-------------------+
          | Middleware        |
          |-------------------|
          | CORS              |
          | Helmet            |
          | Rate limiting     |
          | JWT authentication|
          | Role checking     |
          | Sanitization      |
          | Validation        |
          | Error handling    |
          +-------------------+
                    |
                    v
                Routes
                    |
                    v
              Controllers
             /     |      \
            v      v       v
         Models  Services  Utils
            |
            v
         MongoDB

Optional:
Controllers -> Gemini Service -> Google Gemini API
```

The application entry point loads environment variables, validates required configuration, connects to MongoDB, and starts the Express server.

---

# Features

## 1. JWT Authentication

BlogNest uses JSON Web Tokens for authenticated API requests.

### Registration

Users register with:

- Name
- Email
- Password

Passwords are hashed with `bcryptjs` before being stored.

Registration **always creates a reader**. A client cannot submit `"role": "admin"` or another privileged role during registration.

### Login

A successful login returns:

- JWT token
- User ID
- Name
- Email
- Role

Use the token in later requests:

```text
Authorization: Bearer YOUR_TOKEN
```

### Current User

Authenticated users can retrieve their profile with:

```text
GET /api/auth/me
```

They can update only:

- `name`
- `bio`
- `avatarUrl`

Roles cannot be changed through the profile endpoint.

---

## 2. Role-Based Access Control

BlogNest has four roles:

| Role | Main capabilities |
|---|---|
| `admin` | Manage users/roles, manage any blog, moderate comments, manage media |
| `editor` | Manage any blog, moderate comments, manage blog media |
| `author` | Create and manage their own blogs and media, publish their own blogs |
| `reader` | Read published blogs, search/filter, like and comment when authenticated |

### Permission model

```text
                 ADMIN
              /    |    \
             /     |     \
          EDITOR  AUTHOR  USER MANAGEMENT
            |       |
            |       +---- Own blogs
            |       +---- Own media
            |
            +------------ Any blog
            +------------ Comment moderation
            +------------ Media management

          READER
             |
             +------------ Read
             +------------ Search
             +------------ Filter
             +------------ Like
             +------------ Comment
```

### Important

There is no public endpoint that lets someone create an administrator.

For a fresh installation, register the account first, then promote the intended account using the repository's `src/scripts/makeAdmin.js` script or the trusted MongoDB administration console.

After an administrator exists, role changes can be performed through:

```text
PATCH /api/users/:userId/role
```

---

# Project Structure

```text
src/
├── config/
│   └── db.js
│
├── controllers/
│   ├── aiController.js
│   ├── authController.js
│   ├── blogController.js
│   ├── commentController.js
│   ├── mediaController.js
│   └── userController.js
│
├── middleware/
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   ├── rateLimiter.js
│   ├── roleMiddleware.js
│   ├── sanitizeMiddleware.js
│   └── validationMiddleware.js
│
├── models/
│   ├── Blog.js
│   ├── Comment.js
│   ├── Media.js
│   └── User.js
│
├── routes/
│   ├── aiRoutes.js
│   ├── authRoutes.js
│   ├── blogRoutes.js
│   ├── commentRoutes.js
│   ├── mediaRoutes.js
│   └── userRoutes.js
│
├── scripts/
│   └── makeAdmin.js
│
├── services/
│   └── geminiService.js
│
├── utils/
│   ├── AppError.js
│   ├── normalizeRole.js
│   └── safeInput.js
│
├── app.js
└── server.js

test/
└── geminiService.test.js
```

### What each layer does

| Layer | Responsibility |
|---|---|
| `routes/` | Defines HTTP methods, paths, middleware, and access rules |
| `controllers/` | Handles requests and application logic |
| `models/` | Defines MongoDB/Mongoose data structures |
| `middleware/` | Authentication, authorization, validation, sanitization, rate limiting, errors |
| `services/` | External integrations such as Gemini |
| `utils/` | Reusable helpers and application errors |
| `config/` | Database connection |
| `scripts/` | Administrative utilities |
| `test/` | Automated provider-independent tests |

---

# Requirements

- Node.js **18 or newer**
- MongoDB running locally or a reachable MongoDB deployment
- npm
- Postman for manual API testing
- Gemini API key only if AI generation is required

---

# Installation

Clone the repository and enter the project directory:

```bash
npm install
```

Create a `.env` file in the project root.

At minimum:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/blognest
JWT_SECRET=replace-this-with-a-long-random-secret
```

Optional:

```env
CORS_ORIGINS=http://localhost:3000
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.8-flash
```

> Never commit `.env` or expose API keys in frontend code.

---

# Run the API

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

Expected startup output:

```text
MongoDB connected successfully
BlogNest API running on port 5000
```

If `PORT` is changed, replace `5000` in the Postman URLs below with your configured port.

---

# Health Check

The simplest test is:

### Request

```http
GET http://localhost:5000/
```

### Expected response

```json
{
  "message": "BlogNest API is running"
}
```

If this works, the Express server is reachable.

---

# Quick Postman Test

This section is designed for a **fast 5–10 minute demonstration**.

## Step 1 — Register

### Method

```text
POST
```

### URL

```text
http://localhost:5000/api/auth/register
```

### Body → raw → JSON

```json
{
  "name": "BlogNest Author",
  "email": "author@example.com",
  "password": "StrongPass123!"
}
```

### Expected

You should receive a successful registration response containing the new user's ID and role.

New registrations start as:

```text
reader
```

---

## Step 2 — Promote the test user

The repository includes:

```text
src/scripts/makeAdmin.js
```

That script promotes the configured `ADMIN_EMAIL` account to `admin`.

For a quick local demonstration:

1. Set `ADMIN_EMAIL` in `src/scripts/makeAdmin.js` to the email you registered.
2. Run:

```bash
node src/scripts/makeAdmin.js
```

3. Log in again.

You can alternatively promote a user directly through your trusted MongoDB administration console.

---

## Step 3 — Login

### Method

```text
POST
```

### URL

```text
http://localhost:5000/api/auth/login
```

### Body

```json
{
  "email": "author@example.com",
  "password": "StrongPass123!"
}
```

### Important

Copy the returned `token`.

For authenticated requests add:

```text
Authorization: Bearer YOUR_TOKEN
```

In Postman you can create a collection variable:

```text
token
```

and use:

```text
Bearer {{token}}
```

---

## Step 4 — Check the logged-in user

### Method

```text
GET
```

### URL

```text
http://localhost:5000/api/auth/me
```

### Header

```text
Authorization: Bearer YOUR_TOKEN
```

This confirms that JWT authentication and role resolution are working.

---

## Step 5 — Create a blog

### Method

```text
POST
```

### URL

```text
http://localhost:5000/api/blogs
```

### Headers

```text
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

### Body

```json
{
  "title": "Cloud Computing Basics",
  "content": "Cloud computing provides on-demand access to computing resources such as servers, storage, databases, and networking.",
  "category": "Technology",
  "tags": ["cloud", "technology", "computing"],
  "status": "published"
}
```

Copy the returned blog `_id`.

Call it:

```text
BLOG_ID
```

---

## Step 6 — Get all published blogs

### Method

```text
GET
```

### URL

```text
http://localhost:5000/api/blogs?page=1&limit=10
```

No authentication is required.

---

## Step 7 — Open the blog

### Method

```text
GET
```

### URL

```text
http://localhost:5000/api/blogs/BLOG_ID
```

Replace `BLOG_ID` with the ID returned from the create request.

Every successful public blog retrieval increments its `views` counter.

---

## Step 8 — Like the blog

### Method

```text
POST
```

### URL

```text
http://localhost:5000/api/blogs/BLOG_ID/like
```

### Header

```text
Authorization: Bearer YOUR_TOKEN
```

The same endpoint toggles the like:

```text
First request  -> liked
Second request -> unliked
```

---

## Step 9 — Add a comment

### Method

```text
POST
```

### URL

```text
http://localhost:5000/api/comments/BLOG_ID
```

### Headers

```text
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

### Body

```json
{
  "content": "Useful introduction to cloud computing!"
}
```

Copy the returned comment `_id` if you want to test deletion.

---

## Step 10 — Get comments

### Method

```text
GET
```

### URL

```text
http://localhost:5000/api/comments/BLOG_ID
```

No authentication is required for comments on published blogs.

---

## Step 11 — Search

### Method

```text
GET
```

### URL

```text
http://localhost:5000/api/blogs/search?q=cloud&page=1&limit=10
```

Search checks published blogs across:

- title
- content
- category
- tags

---

## Step 12 — Filter

### By category

```http
GET http://localhost:5000/api/blogs/filter?category=Technology
```

### By tag

```http
GET http://localhost:5000/api/blogs/filter?tag=cloud
```

### By both

```http
GET http://localhost:5000/api/blogs/filter?category=Technology&tag=cloud
```

---

## Step 13 — Generate an AI draft

Only required if Gemini is configured.

### Method

```text
POST
```

### URL

```text
http://localhost:5000/api/ai/blog/generate
```

### Headers

```text
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

### Body

```json
{
  "topic": "Introduction to Cloud Computing",
  "tone": "professional",
  "length": "medium",
  "category": "Technology",
  "keywords": ["cloud computing", "AWS", "Azure"]
}
```

The response is returned as a draft.

It is **not automatically saved or published**.

---

# Postman Quick-Test Table

| # | What to test | Method | URL | Auth |
|---:|---|---|---|---|
| 1 | Server health | GET | `http://localhost:5000/` | No |
| 2 | Register | POST | `/api/auth/register` | No |
| 3 | Login | POST | `/api/auth/login` | No |
| 4 | Current user | GET | `/api/auth/me` | Yes |
| 5 | Create blog | POST | `/api/blogs` | Author/Admin |
| 6 | List blogs | GET | `/api/blogs?page=1&limit=10` | No |
| 7 | Get blog | GET | `/api/blogs/:id` | No |
| 8 | Like/unlike | POST | `/api/blogs/:id/like` | Yes |
| 9 | Add comment | POST | `/api/comments/:blogId` | Yes |
| 10 | Get comments | GET | `/api/comments/:blogId` | No |
| 11 | Search | GET | `/api/blogs/search?q=cloud` | No |
| 12 | Filter | GET | `/api/blogs/filter?category=Technology` | No |
| 13 | My blogs | GET | `/api/blogs/my-blogs` | Yes |
| 14 | AI draft | POST | `/api/ai/blog/generate` | Author/Admin |

---

# API Reference

## Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a reader account |
| POST | `/api/auth/login` | Public | Authenticate and receive JWT |
| GET | `/api/auth/me` | Authenticated | Get current profile |
| PATCH | `/api/auth/me` | Authenticated | Update profile |

### Register

```json
{
  "name": "A. Writer",
  "email": "writer@example.com",
  "password": "A-strong-password"
}
```

### Update profile

```json
{
  "name": "Cloud Writer",
  "bio": "Cloud technology writer",
  "avatarUrl": "https://cdn.example.com/avatar.png"
}
```

Only HTTPS avatar URLs are accepted.

---

# Blogs

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/blogs` | Public | List published blogs |
| GET | `/api/blogs/search` | Public | Search published blogs |
| GET | `/api/blogs/filter` | Public | Filter by category/tag |
| GET | `/api/blogs/my-blogs` | Authenticated | List current user's blogs |
| GET | `/api/blogs/manage` | Editor/Admin | List manageable blogs |
| GET | `/api/blogs/:id` | Public | Read a published blog and increment views |
| POST | `/api/blogs` | Author/Editor/Admin | Create blog |
| PUT | `/api/blogs/:id` | Author/Editor/Admin | Update blog |
| DELETE | `/api/blogs/:id` | Author/Editor/Admin | Delete blog |
| POST | `/api/blogs/:id/like` | Authenticated | Like/unlike blog |

### Create blog

```json
{
  "title": "Cloud Computing Basics",
  "content": "Draft text or Markdown",
  "category": "Technology",
  "tags": ["cloud", "infrastructure"],
  "status": "draft"
}
```

`status` accepts:

```text
draft
published
```

Blog content is stored as text/Markdown. It is **not treated as trusted HTML**.

### Pagination

```text
/api/blogs?page=1&limit=10
```

- Default page: `1`
- Default limit: `10`
- Maximum limit: `50`

The response includes:

```json
{
  "currentPage": 1,
  "limit": 10,
  "totalBlogs": 1,
  "totalPages": 1,
  "hasNextPage": false,
  "hasPreviousPage": false
}
```

### Search

```text
/api/blogs/search?q=cloud&page=1&limit=10
```

Search is case-insensitive and checks title, content, category, and tags.

Search input is escaped before being used in a MongoDB regular expression.

### Filtering

```text
/api/blogs/filter?category=Technology
```

```text
/api/blogs/filter?tag=cloud
```

```text
/api/blogs/filter?category=Technology&tag=cloud
```

---

# Blog Ownership

Authors can modify and delete their own blogs.

Editors and administrators can modify and delete blogs owned by other users.

```text
Author
  |
  +--> Own blog --> Edit/Delete
  |
  +--> Someone else's blog --> Forbidden

Editor/Admin
  |
  +--> Any blog --> Edit/Delete
```

This ownership check is performed in the controller rather than relying only on the route role check.

---

# Views

Opening:

```text
GET /api/blogs/:id
```

does two things:

1. Retrieves the published blog.
2. Increments its `views` counter.

Draft blogs cannot be retrieved through the public blog endpoint.

---

# Likes

Likes are authenticated and user-specific.

```http
POST /api/blogs/:id/like
```

The API checks whether the current user's ID already exists in the blog's likes list.

```text
Not liked
   |
   | POST
   v
Liked
   |
   | POST again
   v
Not liked
```

The response reports:

- `liked`
- total `likes`

---

# Comments

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/comments/:blogId` | Public for published blog | Read comments |
| POST | `/api/comments/:blogId` | Authenticated | Add comment |
| DELETE | `/api/comments/:commentId` | Comment author/Editor/Admin | Delete comment |

### Add comment

```json
{
  "content": "Useful article!"
}
```

Comments are limited to 500 characters.

### Comment ownership

A comment can be deleted by:

- Its author
- An editor
- An admin

A different reader cannot delete another user's comment.

---

# User Administration

Admin-only routes:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/users` | List users |
| PATCH | `/api/users/:userId/role` | Change user role |

### Change role

```json
{
  "role": "author"
}
```

Allowed roles:

```text
admin
editor
author
reader
```

Only administrators can use these endpoints.

---

# Media Metadata

BlogNest does **not** upload or store files.

Instead, it stores metadata describing a file that already exists elsewhere.

This makes the API responsible for the relationship between a blog and its external media without implementing a file-storage service.

### Register media metadata

```http
POST /api/media
```

### Body

```json
{
  "filename": "cover.webp",
  "originalName": "Cover.webp",
  "mimeType": "image/webp",
  "size": 84000,
  "url": "https://cdn.example.com/cover.webp",
  "altText": "Clouds above a data center",
  "blogId": "BLOG_ID"
}
```

### Supported MIME types

```text
image/jpeg
image/png
image/webp
image/gif
application/pdf
```

### Size

Maximum declared size:

```text
10 MiB
```

### Retrieve media

```http
GET /api/media/blog/:blogId
```

Published blog media can be viewed publicly.

Draft media is restricted to the blog owner, editors, and administrators.

---

# AI Blog Generation

BlogNest optionally integrates with Google Gemini.

### Endpoint

```http
POST /api/ai/blog/generate
```

### Required role

```text
author
editor
admin
```

### Request

```json
{
  "topic": "Introduction to Cloud Computing",
  "tone": "professional",
  "length": "medium",
  "category": "Technology",
  "keywords": [
    "cloud computing",
    "AWS",
    "Azure"
  ]
}
```

### Length values

```text
short
medium
long
```

### Response concept

```json
{
  "success": true,
  "data": {
    "title": "Cloud Computing Basics",
    "content": "...",
    "category": "Technology",
    "tags": ["cloud", "computing"],
    "status": "draft"
  }
}
```

### Important design decision

The AI-generated blog is **not saved automatically**.

The workflow is:

```text
User
  |
  v
POST /api/ai/blog/generate
  |
  v
Gemini
  |
  v
Generated draft
  |
  v
User reviews/edits
  |
  v
POST /api/blogs
```

This prevents an AI response from being automatically published as production content.

### AI failures

Provider failures are converted into safe application errors.

Examples include:

```text
AI_UNAVAILABLE
AI_RATE_LIMITED
AI_PROVIDER_ERROR
AI_INVALID_RESPONSE
AI_TIMEOUT
```

The configured API key is never returned to the client.

---

# Validation and Sanitization

BlogNest uses two separate protections:

## Validation

Validation checks whether input has the correct structure.

Examples:

- Required fields
- String types
- Minimum/maximum lengths
- Email format
- Password length
- Blog status
- Tag array size
- Pagination values
- Allowed profile fields
- Allowed AI fields

Unknown fields are rejected.

For example, a registration request containing:

```json
{
  "name": "Writer",
  "email": "writer@example.com",
  "password": "StrongPass123!",
  "role": "admin"
}
```

is rejected because `role` is not an accepted registration field.

## Sanitization

Sanitization removes unsafe control characters and markup from relevant plain-text input.

Blog content is preserved as text/Markdown rather than being trusted as HTML.

If a frontend converts Markdown or content into HTML, it should use an **allowlist-based HTML sanitizer** before rendering it.

---

# Security

BlogNest includes several security layers:

### Helmet

Adds HTTP security headers.

### CORS

Cross-origin browser requests are controlled through:

```env
CORS_ORIGINS=http://localhost:3000
```

Multiple origins can be comma-separated.

### JWT verification

Protected endpoints require:

```text
Authorization: Bearer <token>
```

The token is verified against `JWT_SECRET`.

### Password hashing

Passwords are never stored as plaintext.

`bcryptjs` is used before persistence.

### Input validation

Unexpected fields and invalid values are rejected.

### Input sanitization

Unsafe markup/control characters are removed from applicable fields.

### Regex protection

Search strings are escaped before being used in MongoDB regular expressions.

### Safe errors

Unexpected errors are converted into generic production responses instead of exposing stack traces.

### Credential protection

Gemini API credentials are kept server-side and are never accepted from frontend/Postman requests as request data.

---

# Rate Limits

BlogNest has multiple rate-limit areas.

| Limiter | Default window | Default limit |
|---|---:|---:|
| General API | 15 minutes | 300 requests |
| Authentication | 15 minutes | 20 requests |
| Comments | 1 hour | 30 requests |
| AI generation | 1 hour | 5 requests |

The general limiter applies to `/api`.

The stricter limiters are applied to their respective operations.

A rate-limited response uses:

```text
429 Too Many Requests
```

and includes a `Retry-After` header when available.

---

# Error Handling

BlogNest uses a consistent JSON error structure:

```json
{
  "success": false,
  "message": "Human readable error",
  "error": {
    "code": "VALIDATION_ERROR"
  }
}
```

### Common status codes

| Status | Meaning |
|---:|---|
| 400 | Bad request |
| 401 | Authentication required/invalid |
| 403 | Forbidden |
| 404 | Resource or route not found |
| 409 | Duplicate value |
| 413 | Request body too large |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Unexpected server error |
| 502 | AI/provider error |
| 503 | AI service unavailable |
| 504 | AI request timeout |

---

# Testing

Run:

```bash
npm test
```

The Gemini tests are provider-independent.

They mock the provider request and do not use the real configured API key.

The tests cover cases including:

- Successful JSON parsing
- Fenced JSON responses
- Missing API credentials
- Invalid credentials
- Provider rate limiting
- Malformed AI output
- Empty AI output
- Invalid response structures
- Network failures
- Request timeouts

This allows the AI service's error handling to be tested without consuming Gemini API quota.

---

# Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | No | Server port; defaults to `5000` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign/verify JWTs |
| `CORS_ORIGINS` | No | Allowed browser origins |
| `GEMINI_API_KEY` | Only for AI | Gemini API credential |
| `GEMINI_MODEL` | No | Gemini model; defaults to `gemini-3.8-flash` |

Example:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/blognest
JWT_SECRET=replace-with-a-long-random-secret
CORS_ORIGINS=http://localhost:3000
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-3.8-flash
```

Do not commit credentials.

---

# Useful Postman Variables

For repeated testing, create a Postman environment with:

| Variable | Example |
|---|---|
| `baseUrl` | `http://localhost:5000` |
| `token` | JWT returned by login |
| `blogId` | Blog `_id` |
| `commentId` | Comment `_id` |
| `userId` | User `_id` |

Then requests become easier to reuse:

```text
{{baseUrl}}/api/blogs
```

```text
{{baseUrl}}/api/blogs/{{blogId}}
```

```text
{{baseUrl}}/api/comments/{{blogId}}
```

```text
{{baseUrl}}/api/blogs/{{blogId}}/like
```

For protected requests:

```text
Authorization: Bearer {{token}}
```

---

# Recommended Demo Flow

For a project presentation, this sequence demonstrates the core system without testing every endpoint:

```text
1. GET /
      ↓
2. POST /api/auth/register
      ↓
3. Promote account to author/admin
      ↓
4. POST /api/auth/login
      ↓
5. GET /api/auth/me
      ↓
6. POST /api/blogs
      ↓
7. GET /api/blogs
      ↓
8. GET /api/blogs/:id
      ↓
9. POST /api/blogs/:id/like
      ↓
10. POST /api/comments/:blogId
      ↓
11. GET /api/comments/:blogId
      ↓
12. GET /api/blogs/search?q=cloud
      ↓
13. GET /api/blogs/filter?category=Technology
      ↓
14. POST /api/ai/blog/generate
```

This demonstrates:

- Server availability
- Registration
- Authentication
- JWT authorization
- Role-based access
- CRUD
- Publishing
- Views
- Likes
- Comments
- Search
- Filtering
- AI-assisted drafting

---

# Important Notes

### 1. MongoDB is required

The server validates `MONGODB_URI` before starting and connects to MongoDB before listening for requests.

### 2. JWT secret is required

The server will not start without:

```env
JWT_SECRET=...
```

### 3. AI is optional

The main BlogNest API can run without `GEMINI_API_KEY`.

Only the AI generation endpoint requires Gemini configuration.

### 4. AI output is never automatically published

Generated content must be reviewed and saved through the normal blog workflow.

### 5. Media is metadata-only

BlogNest does not upload files. It stores metadata and a reference URL/path.

### 6. Blog content is not trusted HTML

If a frontend renders blog content as HTML, it must sanitize the generated HTML using an appropriate allowlist sanitizer.

### 7. `.env` must stay private

Never commit:

```text
.env
```

or put API keys in source code.

---

# Summary

BlogNest provides a complete backend foundation for a blogging/CMS application:

```text
Authentication
     +
Authorization
     +
Blog Management
     +
Search & Filtering
     +
Comments
     +
Likes & Views
     +
Media Metadata
     +
Validation & Sanitization
     +
Rate Limiting
     +
Centralized Errors
     +
Optional Gemini AI
     =
BlogNest API
```

The API is intentionally structured so that authentication, authorization, business logic, database models, external AI integration, and reusable middleware remain separated and maintainable.
