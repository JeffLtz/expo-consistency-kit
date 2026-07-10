# Verification playbook: eyeball both platforms before merging

> **A fix made while looking at one platform is unverified on the other.**
> Both of this kit's founding bugs were one-platform fixes: an iOS fix that
> unstyled web, then a web fix that broke iOS in five different ways.

This playbook is the loop that caught those. Everything below is runnable
copy-paste; the scripts live in [`templates/verification/`](../templates/verification/).

## 0. When to run it

Any change that touches shared UI code — components, styles, animations,
layout. Lint and tests gate the known bug classes; this loop is for the
unknown ones. It takes ~5 minutes on web and ~10 with the simulator.

## 1. Web: Playwright driving system Chrome (no browser download)

Start the dev server:

```bash
npx expo start --web --port 8090
```

`playwright-core` with `channel: "chrome"` uses your installed Chrome, so
there's no 100 MB browser fetch. One-time setup in a scratch dir:

```bash
mkdir -p /tmp/pw && cd /tmp/pw && npm init -y && npm i playwright-core
```

Then drive the app with [`drive-web.js`](../templates/verification/drive-web.js):

```bash
node drive-web.js http://localhost:8090
```

It renders the page, screenshots it, and logs any `pageerror`. Adapt the
click/assert section to reach your changed screen. Read the screenshots —
don't just check the exit code.

## 2. iOS simulator: build once, then deep links + screenshots

Build a dev client on the booted simulator (only needed when native deps
change; JS updates hot-reload through Metro):

```bash
# CocoaPods requires UTF-8 — without this, `pod install` dies with
# "Unicode Normalization not appropriate for ASCII-8BIT"
export LANG=en_US.UTF-8

npx expo run:ios
```

If the dev client opens pointing at the wrong Metro port, redirect it:

```bash
xcrun simctl openurl booted \
  "exp+<your-scheme>://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8090"
```

Navigate without touching the UI — expo-router routes are deep-linkable:

```bash
xcrun simctl openurl booted "<your-scheme>://frequency"
xcrun simctl io booted screenshot /tmp/ios-frequency.png
```

For actual taps (no idb/applesimutils needed),
[`sim-click.sh`](../templates/verification/sim-click.sh) clicks at fractional
window coordinates via AppleScript (requires Accessibility permission for
your terminal):

```bash
./sim-click.sh 0.5 0.30   # tap the center of the screen, 30% down
xcrun simctl io booted screenshot /tmp/ios-after-tap.png
```

Iterate: click → screenshot → look. Fractions are relative to the Simulator
window, so eyeball the first screenshot to calibrate.

## 3. The baseline A/B (the step that catches YOUR regressions)

When a screen looks wrong, determine whether *your change* broke it or it was
already broken — stash, screenshot, restore:

```bash
git stash push -m baseline -- path/to/changed-file.tsx
# wait for hot reload, then screenshot both platforms
git stash pop
# screenshot again, diff by eye
```

This one trick separated "pre-existing iOS bug" from "my web fix broke iOS"
in the incidents this kit was born from. Without it you will misattribute
breakage and "fix" the wrong thing.

## 4. What to look at (not just "does it render")

- **Side-by-side, same viewport width.** Differences hide in comparison, not
  in either screenshot alone.
- Styling presence: paddings, tints, border radii — the nativewind failure
  mode is *silent* style dropping, so a screen can "work" while unstyled.
- Alignment: centered vs. stretched children (a dropped `items-center`
  stretches children full-width on exactly one platform).
- Full state flow, not just the landing state: drive ready → active →
  finished. Two of the whiplash bugs only appeared in later states.
- Console: web `pageerror`s, Metro warnings.

## 5. Known cross-platform traps (check the catalog first)

Before debugging from scratch, scan [BUG-CATALOG.md](BUG-CATALOG.md) — if
your symptom is there, the root cause and fix are too.
