# Migration validation

Validated on 2026-10-03 using Node.js 24.19.0.

## Passed

- Next.js 16.3.8 production build.
- Frontend TypeScript check and backend TypeScript build.
- API integration with a real isolated SQLite database: correct/incorrect login, unauthorized access, role restrictions, ticket creation, assignment, comments, search, dashboard and persistence after restart.
- Next.js standalone startup, deep route HTTP responses and real login through the same-origin API rewrite.
- Compose YAML parsing and service wiring checks.
- GitHub Actions: production Docker image builds and full Compose startup with MySQL 8.4.
- Real MySQL integration: login, permissions, ticket CRUD, assignment, comments, dashboard, search and persistence after API restart.
- Git whitespace checks.

## Pending

- Browser interaction verification in GitHub Actions: the first run found ambiguous form select labels. Accessible names have been corrected; a fresh run must pass before merging.
- Hosted deploy preview with the intended frontend/API services.

The original static Vite hosting configuration must be replaced with a Next.js-compatible server/adapter. Existing SQLite records require an explicit export/import plan if switching to MySQL.
