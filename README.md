# expo-consistency-kit

ESLint rules, jest templates, and a verification playbook for keeping Expo
apps consistent across **web and native**.

Every piece of this kit exists because a real cross-platform bug shipped: a
fix verified on one platform silently broke the other, twice, in opposite
directions. The kit encodes what was learned so the next app doesn't have to
relearn it. The stories live in [docs/BUG-CATALOG.md](docs/BUG-CATALOG.md);
the founding principle is one sentence:

> **A fix made while looking at one platform is unverified on the other.**

## What's inside

| Piece | What it guards |
|---|---|
| [4 ESLint rules](#eslint-rules) | Bug classes that are invisible to JS-level tests |
| [jest two-platform template](templates/jest-two-platform/) | Every test runs under both `Platform.OS === "ios"` and react-native-web |
| [CI workflow template](templates/ci.yml) | lint → typecheck → two-platform tests on every PR |
| [Verification playbook](docs/PLAYBOOK.md) | Runnable recipes for eyeballing both platforms before merging |
| [Bug catalog](docs/BUG-CATALOG.md) | Symptom → root cause → fix, for every bug class the kit knows about |
| [CLAUDE.md snippet](docs/CLAUDE-SNIPPET.md) | Paste into a consuming repo so coding agents follow the conventions |

## Quickstart (~5 minutes)

### 1. Install

```bash
npm i -D github:JeffLtz/expo-consistency-kit
```

(Or copy `lib/` into an `eslint-rules/` folder if you prefer vendoring.)

### 2. Wire the ESLint rules (flat config)

```js
// eslint.config.js
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const expoConsistency = require("expo-consistency-kit");

module.exports = defineConfig([
  expoConfig,
  expoConsistency.configs.recommended,
  {
    // Add this rule per-repo: list your native-only modules.
    rules: {
      "expo-consistency/no-native-only-import": [
        "error",
        { modules: ["react-native-audio-api"] },
      ],
    },
  },
  {
    // Exempt the one guarded wrapper that's allowed to touch them.
    files: ["hooks/useAudioEngine.ts"],
    rules: { "expo-consistency/no-native-only-import": "off" },
  },
]);
```

### 3. Copy the jest template

```bash
cp -R node_modules/expo-consistency-kit/templates/jest-two-platform/jest ./jest
cp node_modules/expo-consistency-kit/templates/jest-two-platform/jest.config.js .
npm i -D jest-expo jest @types/jest @testing-library/react-native react-test-renderer
```

Then read [the template README](templates/jest-two-platform/README.md) — it
contains a symptom table for every landmine in this setup (they *will* fire,
and each error message is listed with its fix).

### 4. Copy the CI workflow

```bash
mkdir -p .github/workflows
cp node_modules/expo-consistency-kit/templates/ci.yml .github/workflows/ci.yml
```

Add scripts to `package.json`:

```json
"test": "jest",
"typecheck": "tsc --noEmit"
```

### 5. Before merging UI changes, run the playbook

[docs/PLAYBOOK.md](docs/PLAYBOOK.md) — drive the change on web (Playwright +
system Chrome, no browser download) **and** the iOS simulator (deep links +
screenshots), with a baseline A/B recipe for catching regressions your change
introduces on the platform you weren't looking at.

## ESLint rules

| Rule | Bug class |
|---|---|
| [no-animated-view-wrapping-pressable](docs/rules/no-animated-view-wrapping-pressable.md) | reanimated `Animated.View` (useAnimatedStyle) wrapping a `Pressable` makes nested `Text` render **invisible on iOS New Architecture**. Invisible to JS-level tests — a static check is the only automated guard. |
| [no-classname-on-animated-component](docs/rules/no-classname-on-animated-component.md) | nativewind `className` on reanimated components is applied on iOS but **silently dropped on web** (and `cssInterop` registration breaks native). Explicit style objects are the only cross-platform behavior. |
| [no-native-only-import](docs/rules/no-native-only-import.md) | A module-scope `require()` of a native-only module **hard-crashes Expo Go** at load time and doesn't exist on web. Enforces the guarded-wrapper pattern. |
| [no-static-svg-id](docs/rules/no-static-svg-id.md) | A static react-native-svg def `id` collides across router-mounted screens on web (ids are document-global), so `url(#...)` resolves into a hidden screen and Chrome **paints the fill black** — only after navigation, so a direct load looks fine. iOS scopes ids per Svg tree. Derive ids from a sanitized `useId()`. |

Rules are deliberately per-file tripwires, not proofs — they favor simplicity
and catch the shapes that actually shipped. Escape hatch: an
`eslint-disable-next-line` comment with a reason.

## Growing the kit

When a new cross-platform bug bites in any app:

1. Add an entry to [docs/BUG-CATALOG.md](docs/BUG-CATALOG.md) — symptom, root
   cause, platforms, how it was proven.
2. If it's statically detectable, add a rule with a RuleTester case lifted
   verbatim from the real code that shipped it.
3. If it's a setup trap, add a row to the relevant symptom table.
4. One CHANGELOG line telling the story.

That loop is the whole point: the kit is institutional memory with an
installer.

## Development

```bash
npm install
npm test      # RuleTester suites — each case is a real bug that shipped
```

## License

MIT
