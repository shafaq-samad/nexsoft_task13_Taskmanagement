# TaskBoard Workspace

TaskBoard Workspace is a full-stack Kanban application built with React, TypeScript, Vite, and Express. It demonstrates role-based access control, authenticated task workflows, project management, and a polished UI designed to read like a real product instead of a tutorial demo.

## Live Demo

Add your deployed URL here once the app is hosted.

## Screenshots

Add 2 to 4 screenshots here after deployment.

## Tech Stack

- React 19
- TypeScript
- Vite
- Express
- JSON file persistence for local/demo data
- Lucide icons
- Motion for UI transitions
- React Router for routing and 404 handling

## What It Does

- Authenticates users with JWT sessions
- Enforces server-side role-based permissions for Admin, Project Manager, and Team Member roles
- Creates, edits, filters, and deletes tasks inside a Kanban workflow
- Supports project-level organization and board filtering
- Persists state in a local JSON database for demo portability
- Includes a production-style auth screen, workspace shell, and accessible modals

## Architecture

- Client: React app composed from hooks, contexts, and feature components
- Server: Express API with route modules for auth, users, projects, and tasks
- Storage: `db.json` file-backed persistence for local development and review builds
- Routing: React Router handles the home route and 404 fallback

## Local Setup

### Prerequisites

- Node.js 20 or newer

### Install

```bash
npm install
```

### Environment

Copy [.env.example](.env.example) to `.env` and set:

- `JWT_SECRET` to a strong random value
- `PORT` if you want to override the default

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Typecheck

```bash
npm run lint
```

## Deployment

The recommended production guide is in [DEPLOYMENT.md](DEPLOYMENT.md). It covers Railway, Render, and Docker/Fly.io setups.

Note for deploying frontend separately (Vercel) and backend elsewhere (Render):

- Set `VITE_API_BASE_URL` in your Vercel project env vars to the full backend URL (for example `https://your-backend.onrender.com`).
- The frontend uses this value to prefix `/api/*` requests when present; otherwise it will call relative paths.

If you receive a 404 on `/api/auth/login` after deploying the frontend, ensure the backend is running at the URL you set and that `VITE_API_BASE_URL` is configured in Vercel.

## Feature Highlights

- Role-aware task and project management
- Authenticated workspace sessions
- Accessible modal dialogs
- Motion-based UI polish
- Local avatar assets and optimized static metadata
- Error boundary and 404 route

## Notes

This project is intentionally demo-friendly, but the structure is close to what you would use for a real internal product dashboard.
