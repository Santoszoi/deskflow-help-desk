# Hosting DeskFlow

## Current hosted environment

Verified October 4, 2026:

| Component | Service |
| --- | --- |
| Next.js frontend | https://deskflow-help-desk-app.netlify.app |
| Express API | https://deskflow-help-desk.onrender.com |
| Database | Aiven MySQL with verified TLS |

The frontend currently requires Netlify team access. Application demo credentials do not bypass that protection. The Render health endpoint returned `database: mysql`, and the owner confirmed that a ticket survived an API redeploy. These are demonstration checks, not a production-readiness certification.

## Netlify frontend with the existing Express API

Use a deploy preview for future frontend changes before changing production.

The `main` branch includes `netlify.toml` with base `client`, publish `.next`, Node.js 24 and the Render API origin. These settings replace the former Vite build configuration. The linked Netlify project is `deskflow-help-desk-app`.

1. Confirm the intended Netlify project is linked to `Santoszoi/deskflow-help-desk`.
2. Set the base directory to `client`.
3. Set the build command to `npm run build` and publish directory to `.next`.
4. Set Node.js version to `24`.
5. Set the build variable `API_INTERNAL_URL` to the HTTPS origin of your Express API, without `/api` or a trailing slash. The prior frontend used `https://deskflow-help-desk.onrender.com/api`; verify that backend's health and use `https://deskflow-help-desk.onrender.com` if retaining that service.
6. Enable the official `@netlify/plugin-nextjs` adapter. This migration declares it explicitly in `netlify.toml`: the existing Vite site did not activate it automatically and served a 404 despite a successful build. Do not keep the old SPA `/* -> /index.html` redirect.
7. Build a branch/deploy preview and check login, dashboard, creation, updates, comments, deep-link refresh and mobile navigation.
8. Only publish to production once that preview passes and you have a backup/recovery plan for the API/database.

The frontend runs on Netlify; the Express API and persistent MySQL/SQLite database run on a separate service. Netlify frontend settings alone do not create a MySQL server.

## Render API and Aiven MySQL

Configure the API service's environment using values from the selected database service:

| Variable | Value |
| --- | --- |
| `DB_CLIENT` | `mysql` |
| `DB_HOST`, `DB_PORT` | Provider host and port |
| `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Credentials and database from the same service |
| `DB_SSL` | `true` |
| `DB_SSL_CA` | Complete provider CA PEM, including BEGIN/END lines and real line breaks |
| `JWT_SECRET` | Existing application secret; do not replace during a database configuration change |
| `DEMO_SEED` | `true` only for intentional sample accounts on an empty user table |

Alternatively, use `DB_SSL_CA_PATH` for a mounted CA file; do not set both CA options. Certificate verification remains enabled. Never put database credentials in frontend variables, source control or screenshots. Copy the complete password exactly, including any leading underscore; enter only the password in `DB_PASSWORD`, not a connection URI.

After saving and deploying, check `/api/health`, sign in through the frontend, create a fictional ticket and comment, assign an agent, and resolve the ticket. Refresh to verify saved state. Redeploy the API and confirm the same ticket remains. A successful build alone does not verify database access.

For `Access denied for user`, verify that host, user and password belong to the same running service. For a certificate-chain error, check the provider CA and TLS settings rather than disabling verification. Disabling `DEMO_SEED` does not delete or secure already-created demonstration accounts.

## All services together

For a machine with Docker Compose, use the repository's `Dockerfile`, `server/Dockerfile` and `docker-compose.yml`. Local setup exposes only `127.0.0.1:3000`; add HTTPS reverse-proxy and domain settings for internet hosting. Do not expose MySQL or API host ports by default.

## Data preservation

The application can still use `DB_CLIENT=sqlite` with its existing SQLite file. Switching to MySQL creates a separate database; it does not transfer existing records. Back up and validate an explicit export/import before switching real business data.
