# expo-consistency-kit

ESLint plugin + jest templates + verification playbook for keeping Expo apps
consistent across web and native. Published to npm as `expo-consistency-kit`.

## Commands

- `npm test` — runs all rule tests via `tests/run.js` (requires `npm install`
  first; eslint is a devDependency).

## Layout

- `lib/` — the ESLint plugin. `lib/index.js` exports the rules and a
  `recommended` flat-config preset. Each rule lives in `lib/rules/` with a
  matching test in `tests/rules/` and doc in `docs/rules/`.
- `templates/` — files consumers copy into their apps (jest two-platform
  setup, verification scripts, CI snippet). Not executed in this repo.
- `docs/` — consumer-facing docs (playbook, bug catalog, rule docs).

## Publishing constraints

- **`docs/` and `templates/` ship in the npm tarball** (see `files` in
  package.json). Repo-internal docs (this file, RELEASING.md) stay at the
  repo root, which is excluded automatically.
- `meta.version` in `lib/index.js` must be kept in sync with
  `package.json` when bumping versions.
- Releases are published by CI when a GitHub release is created — see
  [RELEASING.md](RELEASING.md) for the full process, npm token setup, and
  the manual-publish fallback. Don't `npm publish` from an agent shell; the
  account's passkey 2FA makes non-interactive publishes fail with `EOTP`.
