# DeskFlow

Responsive help desk and ticket management portfolio application built with **Next.js, React, TypeScript, Express and SQL databases**.

[Source](https://github.com/Santoszoi/deskflow-help-desk) · [Marcos Solutions portfolio](https://marcossolutions.com.br)

## Features

- Administrator, agent and requester roles with JWT authentication.
- Ticket creation, asset identification, category and priority.
- Search, status and priority filters.
- Assignment, status updates, comments and history.
- Dashboard totals, status/priority summaries and recent updates.
- Responsive interface in Brazilian Portuguese.
- SQLite for local development and existing databases; real MySQL queries with `mysql2` for Docker.

## Architecture

The Next.js App Router serves the React interface. Next.js navigation replaces the former React Router setup. Browser requests use same-origin `/api`; a Next.js rewrite forwards them to the Express API. The API uses parameterized SQL with either SQLite or MySQL. Docker Compose starts three services: the Next.js app, Express API and MySQL 8.4.

The frontend was migrated from Vite. Installing a dependency alone is not the integration: the repository includes App Router pages, a root layout, Next.js scripts and a tested production build.

## Requirements

- Node.js 24 LTS and npm for local development.
- Docker with Docker Compose v2 for the container setup.

## Local setup (SQLite)

The Next.js migration is currently on `feat/nextjs-docker-mysql`, under review in [PR #1](https://github.com/Santoszoi/deskflow-help-desk/pull/1).

```bash
git clone --branch feat/nextjs-docker-mysql https://github.com/Santoszoi/deskflow-help-desk.git
cd deskflow-help-desk
npm run install:all
npm run setup
npm run dev
```

Open **http://localhost:3000**. The API listens on port 3333. `npm run setup` creates ignored `.env` files with random secrets and enables local demonstration data. Existing files are preserved. Server scripts load `server/.env` automatically.

### Production build on your machine

```bash
npm run build
npm start
```

The frontend start script copies static assets to the Next.js standalone output before starting it. The API is started alongside the frontend.

## Docker with MySQL

```bash
npm run setup
docker compose up --build -d
```

Open **http://localhost:3000**. The web port is bound to localhost. The database and API have no host ports; the application reaches them through the internal Compose network. The database uses a named volume. Health checks control startup ordering.

```bash
docker compose ps
docker compose logs -f
docker compose down
```

`docker compose down` retains the MySQL volume. **Do not use `down -v` if you need its data.** Existing SQLite records are not automatically copied to MySQL. Back up `server/data/helpdesk.db` before switching databases; the MySQL environment starts with its own data.

Changing password environment variables after initial MySQL initialization does not change credentials in an existing database volume. Rotate database credentials explicitly rather than deleting a populated volume.

## Demo users

When `DEMO_SEED=true`, an empty database receives public demonstration accounts with password `123456`:

| Role | Email |
| --- | --- |
| Administrator | `admin@deskflow.local` |
| Agent | `ana@deskflow.local` |
| Agent | `Marcos@deskflow.local` |
| Requester | `usuario@deskflow.local` |

These credentials are for portfolio demonstrations. For real customer data, disable demo seeding, provision individual users, configure HTTPS and review authentication, permissions, backups and recovery. This migration does not claim production readiness or a completed accessibility audit.

## Configuration

| Variable | Purpose |
| --- | --- |
| `DB_CLIENT` | `sqlite` (default) or `mysql` |
| `SQLITE_PATH` | Optional SQLite file path |
| `DB_HOST`, `DB_PORT` | MySQL host and port |
| `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL credentials and database |
| `JWT_SECRET` | Required, at least 32 characters in production |
| `DEMO_SEED` | Enable public sample accounts explicitly |
| `CORS_ORIGIN` | Optional comma-separated direct API browser origins |
| `API_INTERNAL_URL` | Next.js API rewrite target; set when building the frontend |

Compose sets `DB_CLIENT=mysql`. To run the API against your own MySQL server without Docker, set the MySQL variables in `server/.env` and create the database/user first. The API creates its four tables and executes actual database queries; it never returns simulated query success.

## Tests

```bash
npm run typecheck
npm run build
npm test
npm run test:web
```

The web integration test checks deep routes, standalone startup and the same-origin API login proxy.

With the Compose services running, `npm run test:compose` verifies real MySQL operations and persistence after restarting the API. After `npx playwright install chromium`, `npm run test:browser` checks the interface workflow and mobile layout. GitHub Actions runs these checks on this branch and uploads browser screenshots. See [validation results](docs/VALIDATION.md) and [deployment instructions](docs/DEPLOYMENT.md).

The API integration test starts an isolated SQLite database, checks login, ticket creation, assignment, comments, dashboard, filters, role restrictions and persistence after restart.

To exercise the same workflow with a disposable MySQL database, set `TEST_DB_CLIENT=mysql`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` and `DB_NAME` before `npm test`. **Use a dedicated test database:** the test adds sample users and tickets.

## Deployment changes

This version needs a Next.js server (or a compatible Next.js hosting adapter) and the Express API. The old Vite `client/dist` static deployment instructions no longer apply. Express remains a separate API and does not serve the frontend. Update hosting build/publish settings before deploying this branch. Existing hosted services are not changed by this code migration.

## Author

**Marcos Neves** · Brasília, DF, Brazil

[Portfolio](https://marcossolutions.com.br) · [LinkedIn](https://www.linkedin.com/in/marcos--neves) · [Email](mailto:marcosrony.neves@gmail.com)
