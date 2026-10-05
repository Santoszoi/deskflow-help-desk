# Architecture and decisions

## Why separate the frontend and API?

Next.js App Router renders the React interface and handles navigation. Express owns authentication, ticket rules and SQL access. The browser calls same-origin `/api` routes, forwarded by Next.js to the API. Database credentials stay on the server.

The UI can be deployed on Netlify independently of the API on Render. The trade-off is additional configuration: rewrite targets, service availability and direct API CORS origins. The earlier Vite migration is described in [deployment notes](DEPLOYMENT.md).

Code: [Next.js configuration](../client/next.config.js), [interface](../client/src/DeskFlow.tsx), [API](../server/src/index.ts).

## How do records persist?

The asynchronous database adapter executes real parameterized queries: `mysql2` with a connection pool for MySQL; `better-sqlite3` with foreign keys and WAL mode for SQLite. Tables: `users`, `tickets`, `ticket_comments`, `ticket_history`.

Hosted MySQL on Aiven stores records independently of Render deployments and uses verified TLS. Docker uses a named database volume; local SQLite uses a database file. Refreshing the browser reloads API records. Backups and recovery are separate responsibilities; SQLite records are not automatically migrated to MySQL.

Code: [database adapter/schema](../server/src/lib/db.ts), [TLS configuration](../server/src/lib/mysql-tls.ts). See [validation](VALIDATION.md) for automated checks and owner-reported hosted persistence checks.

## Where are permissions enforced?

The API verifies bearer JWT signatures using HS256 and recognizes an explicit role list. Login verifies bcrypt password hashes. Staff tokens expire after eight hours; visitor tokens after one hour.

| Role | Current behavior |
| --- | --- |
| Requester (`USER`) | Lists and opens their own tickets; creates tickets and comments on accessible tickets. Cannot perform staff updates. |
| Agent / administrator | Access the support queue and change classification, assignment and status. These roles share the current ticket-management capabilities. |
| Visitor | Receives fixed fictional records through a separate handler. Writes are rejected and operational tickets are not queried. |

Ownership is checked for ticket details and comments. Requester lists and dashboard queries are scoped by requester ID. Staff updates are rejected for requesters. Hiding controls in the UI complements these API checks; it does not replace them.

Code: [`auth`, `canSeeTicket` and routes](../server/src/index.ts), [visitor handler](../server/src/lib/visitor.ts), [API tests](../tests/api.test.mjs).

## Why isolate the visitor demonstration?

It allows reviewers to inspect the interface without exposing operational data. The visitor handler runs before operational routes and is enabled only with `DEMO_SEED=true`. Its fixed records do not test SQL persistence; database tests and the staff workflow cover that separately.

Netlify team protection is an additional frontend gate, not API protection: the API has its own public endpoint and authentication. Publishing local fictional screenshots does not require removing that gate.

## Current limits and next engineering work

- Role claims live in tokens; immediate revocation after role changes is not implemented.
- Remove or rotate demo accounts before handling real data. Disabling seeding does not remove existing accounts.
- Review token storage, login rate limiting, account lifecycle and backup restoration before production use.
- Review multi-step ticket/history writes for transaction boundaries and failure recovery.
- Extract feature modules from the large interface component to improve maintainability.
- Passing CI is not a complete security, load or accessibility audit.

## Media provenance

The screenshots and video show the real local application with isolated fictional visitor fixtures. They are not design mockups. Mobile screenshots use a 390 × 844 viewport. The video shows read-only navigation, not a complete editable ticket lifecycle.
