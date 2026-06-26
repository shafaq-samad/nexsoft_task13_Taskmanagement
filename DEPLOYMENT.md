# Enterprise Task Management System — Production Deployment Guide

This guide outlines step-by-step instructions on deploying this Full-Stack Node.js/Express + React/Vite system to popular modern cloud web hosting platforms like **Render**, **Railway**, or **Fly.io**.

---

## 📋 Table of Contents
1. [Production Environment Variables](#1-production-environment-variables)
2. [Platform: Railway Deployment (Recommended)](#2-platform-railway-deployment-recommended)
3. [Platform: Render Deployment](#3-platform-render-deployment)
4. [Platform: Docker & Fly.io Deployment](#4-platform-docker--flyio-deployment)
5. [Database Durability in Cloud Run Environments](#5-database-durability-in-cloud-run-environments)

---

## 1. Production Environment Variables

Before deploying, ensure you configure these environment variables in your hosting provider's dashboard for production security:

| Variable | Description | Example / Recommended Value |
|:---|:---|:---|
| `NODE_ENV` | Tells Express/Vite to run in performance mode | `production` |
| `PORT` | The port the container will bind to | `3000` or auto-injected by host |
| `JWT_SECRET` | Cryptographically secure string to sign authentications | *Generate a secure random string (e.g. `openssl rand -hex 32`)* |
| `GEMINI_API_KEY` | Optional. Key for Gemini API services | *Your Gemini API Key* |
| `APP_URL` | Your live deployment URL (useful for self-reference) | `https://your-app-name.up.railway.app` |

---

## 2. Platform: Railway Deployment (Recommended)

Railway is excellent for full-stack Node.js environments as it automatically detects the project layout, supports simple file system volumes (for persistent JSON databases), and configures network bindings.

### Step-by-Step:
1. **Push Code to GitHub:**
   Commit and push your workspace files to a private or public GitHub repository.
2. **Create a New Project on Railway:**
   - Log in to [Railway.app](https://railway.app/).
   - Click **New Project** -> **Deploy from GitHub repo** and select your repository.
3. **Configure Environment Variables:**
   - Click on the newly created service card in Railway.
   - Go to the **Variables** tab.
   - Click **Add Variable** and input:
     - `NODE_ENV=production`
     - `JWT_SECRET=YOUR_SECURE_GENERATED_SECRET_HERE`
     - `PORT=3000` (Railway will automatically map incoming traffic to this port).
4. **Define persistent storage (Optional - for db.json):**
   - If using the local file database `db.json` and want to preserve changes across deploys:
   - Go to **Settings** on your service card -> **Volumes** -> **Add Volume**.
   - Set mount path to `/workspace` or make sure the server writes inside the mapped volume directory. (By default, Railway disk mounts persist file mutations flawlessly).
5. **Start Command:**
   - Railway will read `package.json` scripts. Because `type: "module"` is configured, it will run `npm run build` and then `npm start` (`node dist/server.cjs`) automatically.
   - If it doesn't, specify `node dist/server.cjs` as the **Start Command** in settings.

---

## 3. Platform: Render Deployment

Render is a highly popular cloud service with excellent support for single-repo full-stack Node.js apps as a **Web Service**.

### Step-by-Step:
1. **Push to GitHub:**
   Commit and push your workspace to your GitHub repository.
2. **Create Web Service on Render:**
   - Log in to [Render.com](https://render.com/).
   - Click **New +** -> **Web Service**.
   - Connect your GitHub account and select your repository.
3. **Configure Build & Start Commands:**
   - **Runtime:** `Node`
   - **Region:** Choose a region nearest to your target users (e.g., Oregon, Frankfurt).
   - **Branch:** `main` or `master`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start` (which runs `node dist/server.cjs`)
4. **Configure Environment Variables:**
   - Scroll down to the **Environment** section or click the **Env Groups** tab.
   - Add the following keys:
     - `NODE_ENV` = `production`
     - `JWT_SECRET` = `your_strong_production_secret_key`
     - `PORT` = `10000` (Render binds Web Services to a port of their choosing, standardizing `PORT` automatically).
5. **Persistent Disk (Optional):**
   - If using `db.json` storage, add a **Disk Volume** under the Render service **Disks** section.
   - Mount Path: `/opt/render/project/src/data` (Ensure you update the server save location to point to this persistent volume mount).
6. **Deploy:**
   - Click **Create Web Service**. Render will pull your repository, install dependencies, build the React bundle + Express server, and launch the unified full-stack application.

---

## 4. Platform: Docker & Fly.io Deployment

Fly.io hosts full-stack apps in lightweight virtual machines. It is extremely fast and natively reads Docker containers.

### Create a `Dockerfile` in root:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
# If database is saved relative to process.cwd():
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

### Step-by-Step Deploy:
1. Install Fly CLI and sign in (`fly auth login`).
2. Run `fly launch` in your workspace root.
3. Fly.io will automatically scan the Dockerfile, assign a deployment name, and ask for deployment region.
4. Set secrets via terminal:
   ```bash
   fly secrets set JWT_SECRET="your_strong_secret" NODE_ENV="production"
   ```
5. Deploy using `fly deploy`.

---

## 5. Database Durability in Cloud Run / Production Environments

While this system uses a robust local file database synchronization (`db.json`) which is outstanding for single-server containers, virtual machines, and local developments:

> ⚠️ **Scale-out Warning:** In highly distributed, scale-to-zero production environments (like AWS Fargate or Google Cloud Run without persistent disk mounts), container instances are ephemeral. Local files written to disk are destroyed when instances shut down or scale down.

### Recommendations for High Availability Production Scale:
- **Relational Databases (PostgreSQL / MySQL):** Integrate an ORM like **Prisma** or **Drizzle** pointing to a managed DB (e.g. Supabase, Neon, or Railway PG).
- **NoSQL Databases (Cloud Firestore / MongoDB):** Utilize the `@google-cloud/firestore` SDK or MongoDB Atlas to sync user-authored tasks with centralized storage.
