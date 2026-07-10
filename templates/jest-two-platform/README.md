# jest two-platform template

Runs **every test twice**: once under `jest-expo/ios` (`Platform.OS ===
"ios"`) and once under `jest-expo/web` (react-native-web in jsdom). Both
sides of every `Platform` branch execute on every PR — that's how a
"works on web, crashes on native" module gets caught before a device does.

**Honest limitation:** JS-level tests cannot reproduce native *rendering*
bugs (e.g. Fabric's invisible-Text bug — the Text still "exists" in the
virtual tree). The ESLint rules guard those; these tests guard crashes,
render exceptions, and Platform-branch regressions.

## Install

```bash
npm i -D jest-expo jest @types/jest @testing-library/react-native react-test-renderer
```

`react-test-renderer` must **exactly** match your React version (check
`npm ls react`).

Copy `jest.config.js` and the `jest/` folder to your repo root, adapt the
`TODO(app)` markers, and add `"test": "jest"` to your scripts.

## Symptom table — read this when a test fails mysteriously

Every row below fired for real during this template's extraction. Search by
the error text:

| You see | Cause | Fix (already in this template) |
|---|---|---|
| `window.matchMedia is not a function` (web) | reanimated reads it at import time; jsdom doesn't implement it | polyfill in `jest/setup.ts` **before** requiring reanimated |
| `Exceeded timeout of 5000 ms for a hook` in RNTL's afterEach (web) | unmounting an expo-router `ExpoRoot` deadlocks under react-native-web + react-test-renderer | `RNTL_SKIP_AUTO_CLEANUP=true` in `jest/setup-web-env.js` (web project `setupFiles`) — fresh jsdom per file makes cleanup redundant |
| preset behavior vanished after adding `setupFiles` | project-level `setupFiles` **overrides** the preset's | re-list `jest-expo/src/preset/setup-web.js` alongside your own |
| `getByText`/`findByText` finds nothing (web only) | RNTL queries can't match react-native-web's `div` host elements | assert via `JSON.stringify(screen.toJSON()).toContain(...)`; gate `fireEvent` to `Platform.OS !== "web"` |
| SVG import renders `Element type is invalid ... got: object` | metro's `react-native-svg-transformer` doesn't run under jest; and the `@/` alias mapper swallowed the `.svg` mapper | `.svg`/`.css` mappers **before** `^@/(.*)$` in `moduleNameMapper` — first match wins |
| test hangs / infinite timers (ios) | screens run infinite `withRepeat` animations | global fake timers on the ios project only (RNTL v13 auto-advances them in `findBy*`) |
| test hangs in cleanup (web) with fake timers | reanimated's rAF loop + fake timers deadlock unmount on jsdom | web project uses real timers; also note `renderRouter` force-enables fake timers — restore with `afterEach(() => jest.useRealTimers())` in test files |
| tests hang waiting for fonts | root `_layout` returns `null` until `useFonts` resolves | pass an explicit route map to `renderRouter`, not the real app dir |

## The Expo Go regression test

`__tests__/native-module-fallback.example.test.tsx` mocks a native-only
module to **throw at require time** — exactly what Expo Go does — then
drives the feature and asserts the screen survives. On the ios project this
exercises your guarded-require path; on web it proves the module is never
touched at all. Prove the test's worth once: remove your try/catch guard
locally and watch the ios project fail.
