# no-native-only-import

Disallow importing native-only modules outside their guarded wrapper.

## The bug

Some libraries ship native code with no JS fallback and no web
implementation (`react-native-audio-api`, bluetooth/ML/camera SDKs, …). A
module-scope import of one:

```ts
// ❌ crashes Expo Go the moment this file is imported
import { AudioContext } from "react-native-audio-api";
```

hard-crashes **Expo Go** at load time ("Failed to install …: The native
module could not be found") because the native binary isn't bundled there —
and typically throws or breaks bundling on **web**.

## The fix: the guarded-wrapper pattern

Exactly one module is allowed to touch the library. It requires it lazily,
behind a Platform check, inside try/catch, with a no-op fallback:

```ts
// hooks/useAudioEngine.ts — the ONE file allowed to require it
function createAudioContext(): AudioContextLike {
  if (Platform.OS === "web") {
    const AC = (globalThis as any).AudioContext;
    return AC ? new AC() : createSilentContext();
  }
  try {
    const { AudioContext } = require("react-native-audio-api");
    return new AudioContext();
  } catch {
    // Expo Go / missing native module: degrade silently instead of crashing.
    return createSilentContext();
  }
}
```

Everything else goes through the wrapper's API. The wrapper file is exempted
with a per-file override:

```js
// eslint.config.js
{
  rules: {
    "expo-consistency/no-native-only-import": [
      "error",
      { modules: ["react-native-audio-api"] },
    ],
  },
},
{
  files: ["hooks/useAudioEngine.ts"],
  rules: {
    "expo-consistency/no-native-only-import": "off",
    // the lazy require is intentional there:
    "@typescript-eslint/no-require-imports": "off",
  },
},
```

## What the rule detects

Static `import`, dynamic `import()`, and `require()` calls with a literal
module name in the configured list — the built-in `no-restricted-imports`
misses `require()`, which is exactly the form the guarded pattern uses (and
the form that shipped the crash).

## Testing the guard

Pair this rule with a regression test that simulates Expo Go (see the
[jest template](../../templates/jest-two-platform/README.md)):

```tsx
jest.mock("react-native-audio-api", () => {
  throw new Error("Cannot find native module (simulated Expo Go)");
});
// render the screen, trigger the code path, assert no crash
```

## Origin

whiplash-expo PR #43, July 2026: a module-scope require crashed on device the
moment a tone played, while web worked perfectly.
