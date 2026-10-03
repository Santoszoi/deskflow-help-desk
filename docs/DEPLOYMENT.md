# Hosting the Next.js migration

## Netlify frontend with the existing Express API

Use a deploy preview for this branch before changing production.

1. Confirm the intended Netlify project is linked to `Santoszoi/deskflow-help-desk`.
2. Set the base directory to `client`.
3. Set the build command to `npm run build` and publish directory to `.next`.
4. Set Node.js version to `24`.
5. Set the build variable `API_INTERNAL_URL` to the HTTPS origin of your Express API, without `/api` or a trailing slash. The prior frontend used `https://deskflow-help-desk.onrender.com/api`; verify that backend's health and use `https://deskflow-help-desk.onrender.com` if retaining that service.
6. Enable a Next.js-compatible Netlify runtime/adapter through framework detection. Do not keep the old SPA `/* -> /index.html` redirect.
7. Build a branch/deploy preview and check login, dashboard, creation, updates, comments, deep-link refresh and mobile navigation.
8. Only publish to production once that preview passes and you have a backup/recovery plan for the API/database.

The frontend runs on Netlify; the Express API and persistent MySQL/SQLite database run on a separate service. Netlify frontend settings alone do not create a MySQL server.

## All services together

For a machine with Docker Compose, use the repository's `Dockerfile`, `server/Dockerfile` and `docker-compose.yml`. Local setup exposes only `127.0.0.1:3000`; add HTTPS reverse-proxy and domain settings for internet hosting. Do not expose MySQL or API host ports by default.

## Data preservation

The application can still use `DB_CLIENT=sqlite` with its existing SQLite file. Switching to MySQL creates a separate database; it does not transfer existing records. Back up and validate an explicit export/import before switching real business data.
