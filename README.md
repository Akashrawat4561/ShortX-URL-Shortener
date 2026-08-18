# ShortX — Modern Full-Stack URL Shortener & Analytics Platform

ShortX is a modern MERN-stack URL shortener application featuring custom short codes, live alias availability checks, expiration timers, guest & authenticated workspaces, traffic analytics, and built-in resilience (MongoDB with automatic in-memory fallback).

---

## 🚀 Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
npm install
npm start
```
The Express backend server runs on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The Vite development server runs on `http://localhost:5173`.

---

## 🛠️ Build & Verification

- **Build Frontend**: `cd frontend && npm run build`
- **Lint Frontend**: `cd frontend && npm run lint`
- **Check Backend Syntax**: `cd backend && node --check server.js`

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/urlshortener
BASE_URL=http://localhost:5000
JWT_SECRET=shortx_production_jwt_secret_key_2026
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=
```

---

## 🌐 Production Deployment

Refer to [`production_hardening_and_deployment.md`](./production_hardening_and_deployment.md) for full deployment instructions for Vercel, Render, Railway, or unified single-host hosting.
