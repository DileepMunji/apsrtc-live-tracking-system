# 🚀 Deployment Guide

This guide describes how to deploy the APSRTC Live Bus Tracking System using **Render** (Backend) and **Vercel** (Frontend).

---

## 🏗️ 1. Backend Deployment (Render)

1.  **Push your latest code to GitHub.**
2.  Go to [Render Dashboard](https://dashboard.render.com/).
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  **Configure the Service:**
    *   **Name:** `apsrtc-backend` (or similar)
    *   **Root Directory:** `backend` (⚠️ IMPORTANT)
    *   **Runtime:** `Node`
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm start`
6.  **Environment Variables:**
    *   Click "Advanced" or "Environment" tab.
    *   Add the following keys from your `.env` file:
        *   `MONGODB_URI`: Your MongoDB Atlas connection string (e.g., `mongodb+srv://...`)
        *   `JWT_SECRET`: Your secret key
        *   `PORT`: `10000` (Render creates a port automatically, but good to set generic one or leave default)
7.  **Deploy Web Service.**
8.  **Copy the Backend URL** once deployed (e.g., `https://apsrtc-backend.onrender.com`).

---

## 🎨 2. Frontend Deployment (Vercel)

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  **Configure the Project:**
    *   **Framework Preset:** `Vite` (Should detect automatically)
    *   **Root Directory:** `frontend` (⚠️ IMPORTANT - Click "Edit" next to Root Directory and select `frontend`)
5.  **Environment Variables:**
    *   Expand the "Environment Variables" section.
    *   Add Key: `VITE_API_URL`
    *   Add Value: The **Render Backend URL** you just copied (e.g., `https://apsrtc-backend.onrender.com`) - **NO trailing slash**
6.  **Deploy.**

---

## ✅ 3. Verification

1.  Open your Vercel App URL (e.g., `https://apsrtc-frontend.vercel.app`).
2.  **Home Page:** Check if the "System Status" is **Online** (Green).
    *   *Note: Render free tier spins down after inactivity. It might take 30-60 seconds to wake up on the first request.*
3.  **Registration:** Try to register a new driver. If it succeeds, your full stack deployment is working!

---

## 🔧 Troubleshooting

*   **Status: Offline?**
    *   Check if the Render backend is running (view logs in Render dashboard).
    *   Verify `VITE_API_URL` in Vercel settings is correct (no typo, no extra spaces).
    *   Check Browser Console (F12) -> Network tab for failed API requests.
*   **CORS Error?**
    *   The backend is configured to accept all origins (`app.use(cors())`), so this should generally not happen unless the request is blocked by something else.
