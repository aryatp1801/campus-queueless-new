# Campus QueueLess — fresh Student + Staff project

This starter project separates the student token experience and staff queue dashboard.

## Folder layout
- `frontend/` — static HTML/CSS/JavaScript. Deploy to Netlify.
- `backend/` — Node.js + Express API. Deploy to Render.
- `frontend/config.js` — set your actual Render URL here after backend deployment.

## Features in this starter
- Separate Student and Staff pages, plus a landing page.
- Student can take one active token and view shared queue overview.
- Staff can sign in, select a counter, call next token, and complete a token.
- Health check at `/health`.

## Important limitations
This is an MVP starter. Queue records and sessions are stored in server memory, so they reset when Render restarts or redeploys. For real ongoing campus use, connect MongoDB Atlas and update the server to persist tokens, and use a proper database-backed session/authentication system. Do not use this starter with real student personal data until persistence, security, and access controls have been reviewed.

## 1. Create a GitHub repository
1. Create a new empty repository on GitHub, e.g. `campus-queueless-new`.
2. Upload the `backend` and `frontend` folders and this README. Keep the folder names.
3. Do not upload passwords or secrets to GitHub.

## 2. Deploy backend to Render
1. In Render, create **New + → Web Service**, connect your GitHub repository.
2. Set **Root Directory** to `backend`.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add Environment Variables:
   - `STAFF_USERNAME` = your chosen staff username
   - `STAFF_PASSWORD` = a strong password
   - `STAFF_SECRET` = a long random secret string
   - `FRONTEND_ORIGIN` = your Netlify URL(s), comma-separated; for example `https://your-student-site.netlify.app,https://your-staff-site.netlify.app`
6. Deploy. Open `https://YOUR-RENDER-SERVICE.onrender.com/health`. It should display `OK`.

## 3. Connect frontend to Render
1. Open `frontend/config.js`.
2. Replace `https://YOUR-RENDER-SERVICE.onrender.com` with your real Render service URL. Do not add a trailing slash.
3. Save and upload the changed file to GitHub.

## 4. Deploy to Netlify
1. In Netlify, choose **Add new site → Import an existing project** and connect your GitHub repository.
2. Set **Base directory** to `frontend`.
3. Leave build command blank.
4. Set publish directory to `.` (current frontend folder).
5. Deploy. The landing page is `index.html`, student page is `/student.html`, staff page is `/staff.html`.
6. If you want separate Netlify URLs, create two Netlify sites from the same repository and set each site's publish directory to `frontend`. You can use redirects to make each site open its intended page, or simply share the `/student.html` and `/staff.html` links. Keep both sites listed in `FRONTEND_ORIGIN`.

## Staff demo account
There is no hard-coded production password. You must set `STAFF_USERNAME`, `STAFF_PASSWORD`, and `STAFF_SECRET` in Render's environment settings before staff login works.

## Troubleshooting
- Student page says backend URL is not configured: edit `frontend/config.js`.
- Staff login says not configured: set all three staff environment variables in Render.
- CORS error: ensure `FRONTEND_ORIGIN` contains the exact deployed Netlify origins, without page paths.
- Queue resets: expected in this starter because it uses in-memory storage; connect MongoDB for persistence.
