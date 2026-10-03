# Migration validation

Validated on 2026-10-03 using Node.js 24.19.0.

## Passed

- Next.js 16.3.8 production build.
- Frontend TypeScript check and backend TypeScript build.
- API integration with a real isolated SQLite database: correct/incorrect login, unauthorized access, role restrictions, ticket creation, assignment, comments, search, dashboard and persistence after restart.
- Next.js standalone startup, deep route HTTP responses and real login through the same-origin API rewrite.
- Compose YAML parsing and service wiring checks.
- Git whitespace checks.

## Pending

- Docker image builds and full Compose startup: a Docker engine is unavailable in the execution environment.
- Integration workflow against a running MySQL 8.4 instance: no reachable MySQL server was available. The driver and SQL implementation are real, but this check must run before merging/deploying with MySQL.
- Visual browser interaction/hydration verification: the browser automation daemon failed to start, and the browser binary download failed in the execution environment. HTTP tests do not establish visual correctness.

The original static Vite hosting configuration must be replaced with a Next.js-compatible server/adapter. Existing SQLite records require an explicit export/import plan if switching to MySQL.
