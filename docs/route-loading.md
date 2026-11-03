# Load screens when they are needed

The login, dashboard, ticket list, creation form and ticket detail previously lived in `DeskFlow.tsx`. Every route downloaded the entire application UI. The four authenticated screens now use `next/dynamic`, with shared authentication, API access and presentation helpers in `shared.tsx`. The loading fallback has `role="status"`.

## Production measurements

Measured on November 2, 2026 using Next.js 16.3.8, Webpack production builds and the same browser and API fixtures before and after the change.

| Route | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Login | 478,695 bytes | 468,706 bytes | 9,989 bytes (2.09%) |
| Dashboard | 478,695 bytes | 472,078 bytes | 6,617 bytes (1.38%) |

These are decoded JavaScript response sizes, including framework code. They are not compressed network transfer sizes, execution timings or Core Web Vitals. The application is small, so the absolute improvement is modest. Loading another screen adds a request on first use; this change defers code rather than eliminating it. Full measurements are in `route-loading-measurements.json`.

The browser test verifies that the dashboard's initial scripts do not contain the form, list or detail screen, then opens the form, submits a mocked ticket, visits its detail and returns to the list. It also checks keyboard activation and focus, direct route reload, visitor restrictions and runtime errors. API requests are intercepted: these checks do not validate real database persistence.

## Reproduce

```sh
npm run build --prefix client
PORT=3100 npm start --prefix client
```

In another terminal, using an installed Playwright browser:

```sh
TEST_WEB_URL=http://127.0.0.1:3100 node --test --test-concurrency=1 --test-timeout=60000 tests/route-loading.test.mjs tests/ticket-filters.test.mjs
```

Set `TEST_CHROMIUM_PATH` if using a separately installed Chromium executable. Validation here used Chrome Headless Shell 131 because the configured Playwright Chromium download returned an invalid archive; this is not a cross-browser accessibility audit. The report is written to `test-results/bundle-after.json`. For the original implementation, set `BUNDLE_BASELINE=1` to measure without enforcing the new split-screen assertions.

## Explain the decision in an interview

“I measured the JavaScript requested by the browser and found that unrelated screens were bundled together. I separated the screens with dynamic imports, kept shared state outside those modules, and checked the actual network responses. The dashboard downloaded 6,617 fewer decoded bytes initially. I also tested navigation, keyboard focus and visitor restrictions. This demonstrates code splitting, but it does not prove a particular improvement in loading time.”
