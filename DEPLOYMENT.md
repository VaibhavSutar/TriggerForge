# TriggerForge Deployment Guide

This guide explains how to deploy the TriggerForge monorepo to production using generous **free tier** hosting providers. 

We will deploy the **Next.js Frontend to Vercel**, the **Fastify Backend to Render**, and use **Neon** for the PostgreSQL Database.

---

## 🏗️ 1. Database Setup (Neon DB)

Neon offers serverless Postgres with an excellent free tier.

1. Go to [neon.tech](https://neon.tech/) and create a free account.
2. Create a new project (e.g., "triggerforge-db").
3. Once the database is created, copy the `Connection String` (it starts with `postgresql://`).
4. Keep this connection string handy, you will need it for the Backend deployment.

---

## ⚙️ 2. Backend Deployment (Render)

Render allows you to deploy Node.js Web Services for free.

1. Go to [render.com](https://render.com/) and create a free account.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub account and select your `TriggerForge` repository.
4. **Configuration Settings**:
    * **Name**: `triggerforge-api` (or similar)
    * **Region**: Choose one close to you or your Neon database.
    * **Branch**: `main`
    * **Root Directory**: `apps/server` (Important!)
    * **Runtime**: `Node`
    * **Build Command**: `pnpm install && pnpm run generate && pnpm run build`
    * **Start Command**: `pnpm run start`
5. **Environment Variables** (Add these under Advanced):
    * `PORT`: `4000`
    * `DATABASE_URL`: *(Paste your Neon Connection String here)*
    * `JWT_SECRET`: *(Generate a secure random string)*
    * `GOOGLE_CLIENT_ID`: *(Your Google OAuth Client ID)*
    * `GOOGLE_CLIENT_SECRET`: *(Your Google OAuth Secret)*
    * `GOOGLE_REDIRECT_URI`: `https://your-production-backend-url.onrender.com/auth/google/callback`
    * `GEMINI_API_KEY`: *(Your Gemini API Key)*
    * `OPENAI_API_KEY`: *(Your OpenAI API Key if used)*
6. Click **Create Web Service**. Render will now build and deploy your Express/Fastify API.
7. Once deployed, copy your Render application URL (e.g., `https://triggerforge-api.onrender.com`).

> **Important Prisma Note**: After deployment, you must initialize the database schema. While Render builds the app, the easiest way to push the schema is locally via your own machine pointing to production, OR adding `npx prisma db push` to your Render Build Command (`pnpm install && npx prisma db push && pnpm run build`).

---

## 🌐 3. Frontend Deployment (Vercel)

Vercel is the best place to host Next.js frontends and is completely free for hobbyists.

1. Go to [vercel.com](https://vercel.com/) and create a free account.
2. Click **Add New...** and select **Project**.
3. Import your `TriggerForge` GitHub repository.
4. **Configuration Settings**:
    * **Framework Preset**: `Next.js`
    * **Root Directory**: `apps/web` (Important! Click 'Edit' next to Root Directory and select `apps/web`).
    * **Install Command** (Override): `cd ../.. && pnpm install`
    * **Build Command** (Override): `cd ../.. && npx turbo run build --filter=@triggerforge/web`
5. **Environment Variables**:
    * `NEXT_PUBLIC_API_URL`: *(Paste your Render backend URL here, e.g., `https://triggerforge-api.onrender.com`)*
    * `NEXT_PUBLIC_API_BASE`: *(Same as above, keep both just in case)*
6. Click **Deploy**.

---

## 🔗 4. Final Wiring

Now that both are deployed, you need to ensure they can talk to each other.

1. **Google OAuth Callback**: Ensure you update your Google Cloud Console Credentials. The Authorized Redirect URI must point to your *Render Backend URL* (e.g., `https://triggerforge-api.onrender.com/auth/google/callback`).
2. **CORS Configuration**: Your Fastify backend is currently set to `origin: "*"` which handles CORS natively. For production security later, you should restrict this to your specific Vercel URL.

**Congratulations! TriggerForge is now live for free! 🎉**
