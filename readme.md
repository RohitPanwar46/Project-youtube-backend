# YouTube Clone — Backend

This repository contains the **backend** for the YouTube Clone project by Rohit. It's a production-ready Express API designed to be reusable and scalable, with media storage handled by Cloudinary and data persisted in MongoDB.

**Deployed (Render):** [https://project-youtube-backend-1.onrender.com](https://project-youtube-backend-1.onrender.com)

**Repository (frontend uses this backend):** [https://github.com/RohitPanwar46/Project-youtube-backend](https://github.com/RohitPanwar46/Project-youtube-backend)

---

## Table of contents

* [Quick overview](#quick-overview)
* [Tech stack](#tech-stack)
* [Environment variables](#environment-variables)
* [Getting started (local)](#getting-started-local)
* [Available scripts](#available-scripts)
* [API endpoints (overview)](#api-endpoints-overview)
* [Auth flow & tokens](#auth-flow--tokens)
* [Testing with curl / Postman](#testing-with-curl--postman)
* [Folder structure (high-level)](#folder-structure-high-level)
* [Notes & tips](#notes--tips)
* [Contact](#contact)

---

## Quick overview

* **Server:** Express.js
* **DB:** MongoDB (Mongoose + aggregate pipelines v2)
* **File uploads:** multer + Cloudinary
* **Auth:** JWT + bcrypt (access & refresh token flows)
* **Other:** CORS enabled, Prettier for formatting

The API exposes endpoints for users, videos, playlists, comments, likes, subscriptions, dashboard stats and basic healthcheck.

---

## Tech stack

* Node.js + Express
* MongoDB with Mongoose (aggregation pipelines v2 used in queries)
* Cloudinary for media storage
* multer for multipart uploads
* jsonwebtoken (JWT), bcrypt
* cors, prettier

---

## Environment variables

Create a `.env` file at the backend project root and set the following keys (these names match the values used in your project):

```
PORT
CLOUDINARY_API_SECRET
MONGODB_URI
CORS_ORIGIN
ACCESS_TOKEN_SECRET
ACCESS_TOKEN_EXPIRY
REFRESH_TOKEN_SECRET
REFRESH_TOKEN_EXPIRY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

> **Important:** You originally listed both `MONGO_URI` and `MONGODB_URI` in different places. Make sure your `.env` key matches what `app.js` / your config expects (verify in code). Also `CLOUDINARY_API_SECRET` is listed twice above — keep only one correct value.

---

## Getting started (local)

**Prerequisites:** Node.js v16+ (recommended), npm or yarn, MongoDB (Atlas or local)

```bash
# clone repo
git clone https://github.com/RohitPanwar46/Project-youtube-backend.git
cd Project-youtube-backend

# install dependencies
npm install

# create .env (see "Environment variables" section)

# run in development
npm run dev

# or run production start (if configured)
npm start
```

If you use nodemon in dev, `npm run dev` typically starts nodemon; check `package.json` scripts for exact commands.

---

## Available scripts

(Verify these in `package.json` — example common scripts below)

```json
{
  "scripts": {
    "dev": "nodemon app.js",
    "start": "node app.js",
    "lint": "prettier --check .",
    "format": "prettier --write ."
  }
}
```

---

## API endpoints (overview)

Base URL: `https://project-youtube-backend-1.onrender.com/api/v1`

> Protected endpoints require a valid access token (via `Authorization: Bearer <accessToken>`). Verify middleware `verifyJwt` is used in the route files.

### Users (`/users`)

* `POST /users/register` — register user (supports avatar/cover upload)
* `POST /users/login` — login (returns access + refresh tokens)
* `POST /users/logout` — logout (protected)
* `POST /users/refresh-token` — refresh access token
* `POST /users/change-password` — change password (protected)
* `GET  /users/get-user` — get current logged user (protected)
* `PATCH /users/update-details` — update user details (protected)
* `PATCH /users/avatar` — update avatar (protected, upload)
* `PATCH /users/cover-image` — update cover image (protected, upload)
* `GET /users/c/:username` — get channel/profile by username
* `GET /users/history` — get watch history (protected)

### Videos (`/videos`)

* Upload, list, get single video, update, delete — see `routes/video.routes.js` for full list.

### Likes (`/likes`)

* `GET /likes/count/:videoId` — get likes count for a video
* `POST /likes/toggle/v/:videoId` — toggle video like (protected)
* `POST /likes/toggle/c/:commentId` — toggle comment like (protected)
* `POST /likes/toggle/t/:tweetId` — toggle tweet like (protected)
* `GET /likes/videos` — get liked videos for a user (protected)

### Playlists (`/playlists`)

* `POST /playlists` — create playlist (protected)
* `GET /playlists/:playlistId` — get playlist by id
* `PATCH /playlists/:playlistId` — update playlist
* `DELETE /playlists/:playlistId` — delete playlist
* `PATCH /playlists/add/:videoId/:playlistId` — add video to playlist
* `PATCH /playlists/remove/:videoId/:playlistId` — remove video from playlist
* `GET /playlists/user/playlist` — get user's playlists (protected)

### Comments (`/comments`)

* `GET /comments/:videoId` — list comments for a video
* `POST /comments/:videoId` — add comment (protected)
* `DELETE /comments/c/:commentId` — delete comment (protected)
* `PATCH /comments/c/:commentId` — update comment (protected)

### Subscriptions (`/subscriptions`)

* `GET /subscriptions/c/:channelId` — get channel subscribers
* `POST /subscriptions/c/:channelId` — toggle subscription (protected)
* `GET /subscriptions/u/:subscriberId` — get user's subscriptions (protected)

### Dashboard (`/dashboard`)

* `GET /dashboard/stats` — channel stats (protected)
* `GET /dashboard/videos` — user's channel videos (protected)

### Tweets (`/tweets`)

* Micro-post style endpoints for social features (create, list, update, delete). See `routes/tweet.routes.js`.

### Healthcheck (`/healthcheck`)

* `GET /healthcheck/` — simple service health check

---

## Auth flow & tokens

* The backend uses **JWT** for protecting routes.
* On login, the API returns an **access token** (short lived) and a **refresh token** (longer lived).
* Use the access token in requests as: `Authorization: Bearer <accessToken>`
* To get a new access token, call `POST /users/refresh-token` with the refresh token (check your implementation details for where the refresh token is expected — header, cookie or body).

---

## Testing with curl / Postman

### Register (example)

```bash
curl -X POST "https://project-youtube-backend-1.onrender.com/api/v1/users/register" \
  -H "Content-Type: multipart/form-data" \
  -F "username=demo" \
  -F "email=demo@example.com" \
  -F "password=YourPassword123" \
  -F "avatar=@/path/to/avatar.jpg"
```

### Login (example)

```bash
curl -X POST "https://project-youtube-backend-1.onrender.com/api/v1/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"YourPassword123"}'
```

### Protected request (example)

```bash
curl -H "Authorization: Bearer <ACCESS_TOKEN>" \
  "https://project-youtube-backend-1.onrender.com/api/v1/videos"
```

Use Postman to create a collection and set an environment variable for your `accessToken` so you can easily test protected routes.

---

## Folder structure (high-level)

(Adapt to your actual project layout if different.)

```
Project-youtube-backend/
├─ controllers/
├─ models/
├─ routes/
│  ├─ user.routes.js
│  ├─ video.routes.js
│  ├─ comment.routes.js
│  ├─ playlist.routes.js
│  ├─ like.routes.js
│  ├─ subscription.routes.js
│  ├─ tweet.routes.js
│  └─ dashboard.routes.js
├─ middlewares/
├─ services/ (cloudinary, uploads, jwt helpers)
├─ utils/
├─ app.js
└─ package.json
```

From the files you provided, the project uses route files like: `comment.routes.js`, `dashboard.routes.js`, `healthcheck.routes.js`, `like.routes.js`, `playlist.routes.js`, `subscription.routes.js`, `tweet.routes.js`, `user.routes.js` and the main `app.js` to mount routes under `/api/v1`.

---

## Notes & tips

* Confirm the exact env variable names used in `app.js` and configuration files — mismatch between `MONGO_URI` and `MONGODB_URI` will cause connection failures.
* If you deploy to Render, add the same env keys in the Render dashboard.
* Keep `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` strong and private.
* Rate-limit uploads and API endpoints if you expect significant traffic (e.g., express-rate-limit or a CDN in front).
* Use Cloudinary folders and transformations to keep media organized and optimized.

---

## Contact

**Author:** Rohit

* Backend repo: [https://github.com/RohitPanwar46/Project-youtube-backend](https://github.com/RohitPanwar46/Project-youtube-backend)
* Deployed backend: [https://project-youtube-backend-1.onrender.com](https://project-youtube-backend-1.onrender.com)
* Email: [freelancerrohit46@gmail.com](mailto:freelancerrohit46@gmail.com)
* Email (alternate): [rkmali845@gmail.com](mailto:rkmali845@gmail.com)
* LinkedIn: [https://www.linkedin.com/in/rohit-panwar-094b4133a](https://www.linkedin.com/in/rohit-panwar-094b4133a)