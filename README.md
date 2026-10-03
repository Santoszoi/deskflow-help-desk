# DeskFlow

**Help desk and ticket management application built with React, TypeScript and Node.js.**

DeskFlow is a full-stack portfolio project that brings ticket creation, assignment, status tracking and support dashboards into one application. It demonstrates front-end development alongside an Express API and persistent SQLite storage.

## Project links

- [Source code](https://github.com/Santoszoi/deskflow-help-desk)
- [Author's portfolio](https://marcossolutions.com.br)
- [Contact Marcos](mailto:marcosrony.neves@gmail.com)

The portfolio link is the author's website, not a direct link to the DeskFlow application. This README does not claim that the deployed application is currently available or production-ready.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Front-end | React 19, TypeScript, Vite, React Router |
| Styling | CSS |
| Icons | Lucide React |
| API | Node.js, Express 5, TypeScript |
| Database | SQLite with better-sqlite3 |
| Authentication | JSON Web Tokens and bcryptjs |

This repository does not currently include Next.js, Tailwind CSS, MySQL or a Docker Compose environment.

## Features

- Sign-in with administrator, agent and user roles.
- Dashboard with total, open, resolved and critical ticket counts.
- Ticket creation with category and priority.
- Ticket assignment and status changes.
- Search by ticket ID, title or description.
- Filters by status and priority.
- Ticket comments and a history of changes.
- Role-based API permissions.
- Responsive layout.
- Sample users and tickets seeded when the database is first created.

The current application interface is in Brazilian Portuguese.

## Architecture

The React application sends requests to an Express API. The API handles authentication and ticket operations, and stores data in SQLite.

During local development, Vite forwards requests beginning with `/api` to `http://localhost:3333`. In production mode, the Express server can also serve the compiled front-end from `client/dist`.

## Run locally

Use **Node.js 24 LTS** and npm. The SQLite dependency is a native module; if its binary cannot be installed automatically, your operating system may require native build tools.

### 1. Clone and install

```bash
git clone https://github.com/Santoszoi/deskflow-help-desk.git
cd deskflow-help-desk
npm run install:all
```

### 2. Point the front-end to the local API

In `client/src/main.tsx`, replace the existing hosted API URL:

```ts
const API = 'https://deskflow-help-desk.onrender.com/api';
```

with:

```ts
const API = '/api';
```

This step is necessary: the checked-in front-end currently targets the hosted API. Starting the local server alone does not change that URL.

### 3. Configure the server environment

The server reads `PORT` and `JWT_SECRET` from the process environment. The file `server/.env.example` documents these variables; copying it to `.env` alone will not load them with the current scripts.

For example, in **PowerShell**:

```powershell
$env:PORT = "3333"
$env:JWT_SECRET = node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
npm run dev
```

Or in **Bash**:

```bash
export PORT=3333
export JWT_SECRET="$(node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))")"
npm run dev
```

Keep the server environment set when restarting it. Never commit a real JWT secret.

Open the address shown by Vite, normally **http://localhost:5173**. The API runs on **http://localhost:3333**.

### 4. Sign in with a demo account

For a local demonstration, the seeded accounts use the password `123456`.

| Role | Email |
| --- | --- |
| Administrator | `admin@deskflow.local` |
| Agent | `ana@deskflow.local` |
| Agent | `carlos@deskflow.local` |
| User | `usuario@deskflow.local` |

These are public demonstration credentials, not suitable for real business data. Account names above reflect the seed data in the repository.

## Build and serve locally

After configuring the environment and the API URL as described above:

```bash
npm run build
npm start
```

Open **http://localhost:3333**. The server serves `client/dist` when that directory exists.

## Database

The SQLite database is created at:

```text
server/data/helpdesk.db
```

Tables: `users`, `tickets`, `ticket_history` and `ticket_comments`.

## Repository structure

```text
deskflow-help-desk/
├── client/
│   ├── src/
│   │   ├── main.tsx
│   │   └── styles.css
│   ├── vite.config.ts
│   └── package.json
├── server/
│   ├── src/index.ts
│   ├── .env.example
│   └── package.json
├── package.json
└── README.md
```

## Current scope and next steps

This is a portfolio application. The repository does not currently contain an automated test suite, Docker configuration or a formal accessibility audit.

Before using it with real customers, review authentication and authorization, replace demonstration accounts, require a strong JWT secret, restrict CORS, configure HTTPS and test backup and recovery.

Planned improvements include automated tests, configurable API URLs, SLA tracking, attachments and deployment documentation.

## Author

**Marcos Neves** · Brasília, Brazil

[Portfolio](https://marcossolutions.com.br) · [LinkedIn](https://www.linkedin.com/in/marcos--neves) · [Email](mailto:marcosrony.neves@gmail.com)
