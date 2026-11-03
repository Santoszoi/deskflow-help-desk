# Ticket filter reliability

## Problem and change

On 2026-10-26, a browser regression test reproduced an out-of-order response bug on main commit `9c72409cc28132f1fb290c52159234b510c2c25b`: the response for `old` was deliberately held until `new` finished, then replaced the current results. The baseline failed because the old result was visible.

The filter effect now aborts superseded requests and ignores callbacks from inactive effects, including their loading/error updates. It retains the 250 ms debounce, clears obsolete rows while loading, and provides an accessible error message and retry button without resetting filters. Search has an explicit accessible name and the result heading announces state changes.

## Validation

- Client TypeScript check passed.
- Client production build passed with the existing locked dependencies; no TypeScript beta upgrade.
- Browser coverage uses the actual Next.js interface with intercepted, fictitious API responses. It does not validate the database or live backend.
- Regression: the latest query remains visible after an older response is released.
- Request behavior: typing `VPN & rede` with 20 ms between keystrokes issues one debounced request, with correctly encoded search; status and priority are combined.
- Recovery: HTTP 500, then a network failure, then a successful empty response, using the retry button.
- Browser runtime errors are checked. Mobile viewport is 390 x 844; horizontal overflow is checked.

The environment could not download the Chromium build bundled with Playwright 1.63.0 (invalid archive). Validation used Chrome for Testing headless shell 131.0.6778.204 via `TEST_CHROMIUM_PATH`. Re-run with Playwright's bundled browser in CI before merging. This is functional validation, not a production performance benchmark or a full accessibility audit.

## Reproduce

```sh
npm ci
npm ci --prefix client
npm run build --prefix client
npx playwright install chromium
```

In one terminal:

```sh
cd client
PORT=3100 npm start
```

In another terminal at the repository root:

```sh
npm run test:filters
```

`TEST_WEB_URL` overrides the default `http://127.0.0.1:3100`. `TEST_CHROMIUM_PATH` optionally selects a local browser. The test stores a Playwright trace and desktop/mobile screenshots in ignored `test-results/`. The trace records browser actions and network activity; it is not a Chrome CPU profile.

## Interview explanation

A debounce reduces request frequency but does not control response order. I reproduced a race by delaying one response, then issuing a newer query. Cleanup now cancels obsolete work and prevents stale callbacks from updating state. I verified the race, combined filters, and recovery from HTTP/network failures with browser tests using controlled API responses.
