# Hosting the Next.js migration

## Netlify frontend with the existing Express API

Use a deploy preview for this branch before changing production.

The branch includes `netlify.toml` with base `client`, publish `.next`, Node.js 24 and the existing Render API origin. These file settings override the old Vite build settings for this branch. The linked Netlify project is `deskflow-help-desk-app` (site ID `8cda1c1a-9c15-4e49-9e37-480b5320c0a8`). The existing API returned HTTP 200 from `/api/health` on 2026-10-03; that health response alone does not verify its database engine or deploy the new backend.

1. Confirm the intended Netlify project is linked to `Santoszoi/deskflow-help-desk`.
2. Set the base directory to `client`.
3. Set the build command to `npm run build` and publish directory to `.next`.
4. Set Node.js version to `24`.
5. Set the build variable `API_INTERNAL_URL` to the HTTPS origin of your Express API, without `/api` or a trailing slash. The prior frontend used `https://deskflow-help-desk.onrender.com/api`; verify that backend's health and use `https://deskflow-help-desk.onrender.com` if retaining that service.
6. Enable the official `@netlify/plugin-nextjs` adapter. This migration declares it explicitly in `netlify.toml`: the existing Vite site did not activate it automatically and served a 404 despite a successful build. Do not keep the old SPA `/* -> /index.html` redirect.
7. Build a branch/deploy preview and check login, dashboard, creation, updates, comments, deep-link refresh and mobile navigation.
8. Only publish to production once that preview passes and you have a backup/recovery plan for the API/database.

The frontend runs on Netlify; the Express API and persistent MySQL/SQLite database run on a separate service. Netlify frontend settings alone do not create a MySQL server.

## All services together

For a machine with Docker Compose, use the repository's `Dockerfile`, `server/Dockerfile` and `docker-compose.yml`. Local setup exposes only `127.0.0.1:3000`; add HTTPS reverse-proxy and domain settings for internet hosting. Do not expose MySQL or API host ports by default.

## Data preservation

The application can still use `DB_CLIENT=sqlite` with its existing SQLite file. Switching to MySQL creates a separate database; it does not transfer existing records. Back up and validate an explicit export/import before switching real business data.
