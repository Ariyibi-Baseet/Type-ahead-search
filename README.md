# Country Typeahead

A debounced country autocomplete built with **React / Next.js (App Router, TypeScript)**, querying the public [REST Countries API](https://restcountries.com). Built as a screening task submission for Expert Listing's Frontend Engineer role.

**Live demo:** _add your Vercel URL here after deploying_

## Features

- Debounced input (300ms) with a minimum query length of 2 characters
- Loading, empty, and error states, each visually and semantically distinct
- Full keyboard navigation: `↑`/`↓` to move, `Enter` to select, `Escape` to close, `Home`/`End` to jump
- Out-of-order / stale response protection via `AbortController` **and** a request-id guard, so a slow earlier request can never clobber a faster later one
- Accessible combobox markup (`role="combobox"`, `aria-expanded`, `aria-activedescendant`, `role="listbox"`/`role="option"`)

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
npm run test      # Jest + React Testing Library
npm run build     # production build
npm run lint
```

## Project structure

```
src/
  app/page.tsx                       # renders the component
  components/CountryTypeahead.tsx    # UI: input, listbox, keyboard handling
  hooks/useDebouncedValue.ts         # generic debounce hook
  hooks/useCountrySearch.ts          # fetch lifecycle, abort + stale-response handling
  lib/countries.ts                   # API client + response shaping
  __tests__/CountryTypeahead.test.tsx
```

## Write-up (screening task)

**Tradeoffs.** I debounced input at 300ms and set a two-character minimum before querying, trading a little perceived responsiveness for far fewer wasted requests. Race conditions are handled two ways: an `AbortController` cancels the previous in-flight request on every new keystroke, and a monotonically increasing request-id ref double-checks that only the latest response is ever applied to state, so a slow early response can never overwrite a faster later one. REST Countries returns a 404 for "no matches" rather than an empty array, so I model that as a distinct `NoResultsError` instead of a generic error, keeping the empty and error UI states meaningfully different. Keyboard support follows the ARIA combobox pattern (roving `aria-activedescendant`, Arrow/Home/End/Enter/Escape) rather than moving DOM focus, so screen readers and browser autofill behave correctly.

**Scaling and hardening.** For high traffic I'd add a thin proxy/cache layer (Redis, keyed by normalized query) in front of the public API, since country data barely changes and this cuts external calls dramatically. I'd add client-side response caching (SWR/React Query) so repeated queries in a session are free, rate-limit the client (leading-edge debounce + max in-flight requests), add retry-with-backoff for 5xx/network failures, and serve from a CDN edge function to cut latency for a global user base. I'd also add telemetry (latency, error rate, cache hit rate) to catch API degradation early.

**Testing.** I used Jest + React Testing Library with fake timers and a mocked `fetch` to test debounce timing precisely, loading/empty/error states, out-of-order response resolution (resolving an older request after a newer one and asserting the newer result wins), and full keyboard navigation (arrow keys + Enter). I'd add Playwright e2e tests against the real API and axe-core for automated accessibility checks in CI.

_(283 words)_
