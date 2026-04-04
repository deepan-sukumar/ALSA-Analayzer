# Vercel Full-Stack Deployment Guide (Next.js + Express)

This guide outlines the steps to deploy a monorepo-style project with a Next.js frontend and an Express.js backend using Vercel's **`experimentalServices`** feature.

## 1. Recommended Folder Structure

To ensure Vercel can independently build and route both services, reorganize your project as follows:

```text
/ (Root)
├── vercel.json           <-- Main deployment configuration
├── frontend/             <-- Next.js application
│   ├── package.json
│   ├── next.config.ts
│   ├── src/
│   └── public/
└── backend/              <-- Express API
    ├── package.json
    └── index.js          <-- Entry point (exported app)
```

> [!IMPORTANT]
> You must move all your current root-level Next.js files (like `src/`, `public/`, `next.config.ts`, `package.json`, etc.) into a new subdirectory named `/frontend`.

---

## 2. Updated Configuration Files

### `vercel.json`
I have already created this file in your root directory. It tells Vercel how to route traffic and where the services live.

```json
{
  "version": 2,
  "experimentalServices": {
    "frontend": {
      "entrypoint": "frontend",
      "routePrefix": "/"
    },
    "backend": {
      "entrypoint": "backend/index.js",
      "routePrefix": "/api"
    }
  }
}
```

### `backend/index.js`
Your backend must export the `app` object instead of calling `app.listen()`. Vercel strips the `/api` prefix before sending the request to your backend, so you can define routes normally.

```javascript
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// This will respond to "/api" (because of routePrefix in vercel.json)
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running' });
});

// This will respond to "/api/health"
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = app; // CRITICAL for Vercel Serverless
```

---

## 3. Important Vercel Dashboard Settings

Before deploying, you **MUST** configure your project in the Vercel Dashboard:

1.  Go to **Project Settings** > **Build & Deployment**.
2.  Find the **Framework Preset** dropdown.
3.  Select **"Services"**.
4.  Ensure your **Root Directory** in Vercel is set to the absolute root `/` (not `/frontend`).

---

## 4. Local Development

To run both services locally as they would behave on Vercel (including routing), use the [Vercel CLI](https://vercel.com/download):

```bash
vercel dev
```

The CLI will automatically detect your `experimentalServices` and start both the Next.js and Express servers simultaneously.

---

## 5. Common Mistakes to Avoid

| Mistake | Consequence | Fix |
| :--- | :--- | :--- |
| **Using `app.listen()`** | Serverless function hangs or times out. | Remove `app.listen()` and use `module.exports = app;`. |
| **Incorrect Root** | Vercel sees the root as a Next.js app and ignores the backend. | Set Framework Preset to **"Services"** in Dashboard. |
| **Relative Path Imports** | Backend can't find files if the path is wrong. | Ensure all imports in `backend/` are relative to the `backend/` folder. |
| **CORS Issues** | Frontend can't talk to backend locally. | Use `vercel dev` for local dev or add `cors` middleware to your Express app. |
| **Route Prefix Mismatch** | `/api/users` 404s. | Remember that if `routePrefix` is `/api`, any path in `backend/index.js` is relative to that (e.g., `app.get('/users')` handles `/api/users`). |
