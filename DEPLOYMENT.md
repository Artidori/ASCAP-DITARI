# Deployment guide

## 1) Push to GitHub

From the project root:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

## 2) Frontend on Vercel

Create a new project in Vercel and select this GitHub repo.

Project settings:
- Root Directory: `frontend`
- Framework: React
- Build Command: `npm run build`
- Output Directory: `build`

Environment variables:
- `REACT_APP_BACKEND_URL=https://your-backend.onrender.com`
- `NPM_CONFIG_LEGACY_PEER_DEPS=true` (only if the build hits peer dependency conflicts)

## 3) Backend on Render

Create a new Web Service in Render and select the same GitHub repo.

Service settings:
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn server:app --host 0.0.0.0 --port 10000`

Environment variables:
- `MONGO_URL=your_mongodb_connection_string`
- `DB_NAME=your_database_name`
- `GEMINI_API_KEY=your_gemini_key`
- `ADMIN_PASSWORD=your_admin_password`
- `CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000`

## 4) Final URL update

After Render deploys successfully, copy the backend URL and update Vercel:

```
REACT_APP_BACKEND_URL=https://your-backend.onrender.com
```

## 5) Notes

- The frontend is already build-safe for Vercel.
- The backend expects `MONGO_URL`, `DB_NAME`, `GEMINI_API_KEY`, `ADMIN_PASSWORD`, and `CORS_ORIGINS`.
- If you want to remove the Emergent dependency completely, keep the Gemini fallback in `backend/server.py` or fully replace the AI integration layer.
- The project already includes example env files in:
  - `backend/.env.example`
  - `frontend/.env.example`
  - `backend/render.yaml`
