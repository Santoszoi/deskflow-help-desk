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
- Chromium browser: login, dashboard, ticket creation, status update, comments, deep-route reload and mobile viewport without horizontal overflow or browser runtime errors.

GitHub Actions run: https://github.com/Santoszoi/deskflow-help-desk/actions/runs/37137157170

Tested application commit: `99e83adc25f8ec88c4a4c7de6953560a36b1bd44`.

## Hosted preview

Validated on 2026-10-03: Next.js build on Netlify using the explicit official Next.js adapter (runtime v5.16.1), real login through the same-origin API rewrite to the existing Render service, dashboard data, creation of demonstration ticket #5, status update, comment creation and persistence after refreshing the deep ticket route.

Preview: https://deploy-preview-1--deskflow-help-desk-app.netlify.app/tickets/5

Deploy: https://app.netlify.com/projects/deskflow-help-desk-app/deploys/6ac131efe3a0220007b0f37e

Application/configuration commit: `7298dfb17a0ccfb4f9e3368c2f2ae96aa86850cf`.

The hosted preview uses the existing Render backend. It does not prove that Render was migrated to MySQL; MySQL was verified separately by the Docker/CI tests. The site remains protected by the existing Netlify team access settings.

## Hosted MySQL verification — October 4, 2026

Application commit: `b4870791f1ff8e3ff345963d14c8124872949770`.

- Direct API health check: `{"ok":true,"service":"DeskFlow API","database":"mysql"}`.
- Direct hosted API checks: all four documented demo accounts authenticated successfully and could list tickets. Administrator and agent accounts returned five tickets; the requester returned three. No tickets were created or edited by these checks.
- Owner-provided Render screenshot: successful redeploy at 16:38:48 America/Sao_Paulo.
- Owner-reported interface checks: the test ticket remained after that redeploy; a comment remained after refresh; assignee and status remained after refresh; resolving the ticket updated the dashboard totals.
- Unauthenticated request to the Netlify frontend returned HTTP 401. Team protection still applies; the hosted demo is not publicly accessible through that URL.

These checks validate the observed workflow, not a complete security audit or backup restore. The comment was verified after refresh, not separately after a subsequent redeploy. Earlier SQLite records are not automatically imported into MySQL, and the old preview ticket URL is historical evidence rather than a guaranteed current record.

## Remaining work before customer use

- Provision individual accounts and retire public demo credentials.
- Test a database backup and restore.
- Review permissions and authentication under the intended deployment conditions.
- Make an explicit decision about public demo access; use fictional data only.
