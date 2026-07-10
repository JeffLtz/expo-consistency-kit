# Releasing

Publishing to npm is automated: publishing a GitHub release triggers
`.github/workflows/publish.yml`, which runs the tests and runs
`npm publish --provenance`.

## Cutting a release

1. Bump `version` in `package.json` **and** in `meta.version` in
   `lib/index.js` (they must match).
2. Add a section to `CHANGELOG.md` (`## X.Y.Z — YYYY-MM-DD`) describing the
   changes.
3. Open a PR, get it green, merge to `main`.
4. Tag and release:

   ```bash
   git tag vX.Y.Z <merge-commit>
   git push origin vX.Y.Z
   gh release create vX.Y.Z --title "vX.Y.Z" --notes "<changelog section>"
   ```

   Publishing the release kicks off the workflow; a few minutes later verify
   with `npm view expo-consistency-kit version`.

## npm auth (the `NPM_TOKEN` secret)

The workflow authenticates with a repo secret named `NPM_TOKEN`:

- Create it at <https://www.npmjs.com/settings/jeffltz/tokens> →
  **Generate New Token** → **Granular Access Token**, permission
  **Read and write**, scoped to only the `expo-consistency-kit` package.
- Store it: `gh secret set NPM_TOKEN --repo JeffLtz/expo-consistency-kit`
  (or repo Settings → Secrets and variables → Actions).
- Tokens expire; npm emails a reminder. Rotating = generate a new token and
  re-run `gh secret set`.

## Manual publish (fallback)

If CI is unavailable, publish from an interactive terminal — the npm account
uses a passkey for 2FA, so npm opens a browser to approve (no OTP codes):

```bash
npm ci && npm test
npm publish
```

A non-interactive shell (CI without the token, or an agent's sandbox) fails
with `EOTP`; only an interactive terminal or the `NPM_TOKEN` path works.

## Pre-publish sanity checks

- `npm test` — all rule tests pass.
- `npm pack --dry-run` — tarball contains only `lib/`, `docs/`,
  `templates/`, `README.md`, `CHANGELOG.md`, `LICENSE` (the `files`
  allowlist in package.json). Note `docs/` and `templates/` ship to npm —
  don't put repo-internal notes there; keep those at the repo root.
