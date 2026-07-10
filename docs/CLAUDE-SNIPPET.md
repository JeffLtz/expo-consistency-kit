# CLAUDE.md snippet for consuming repos

Paste this into the `CLAUDE.md` of a repo using expo-consistency-kit so
coding agents follow the conventions without rediscovering them:

```md
## Cross-platform conventions (expo-consistency-kit)

This app runs on web AND native from the same code. A fix made while looking
at one platform is unverified on the other — both must be checked for UI
changes.

- Never put nativewind `className` on reanimated components (`Animated.View`,
  `Animated.Text`, or anything from `createAnimatedComponent`) — it silently
  applies on only one platform. Use explicit style objects. Do NOT "fix" this
  with cssInterop registration; that breaks native. className on plain
  View/Text/Pressable is fine.
- Never wrap a Pressable containing Text in an Animated.View that carries a
  useAnimatedStyle style — nested Text renders invisible on iOS New
  Architecture. Animate the Pressable directly
  (Animated.createAnimatedComponent), composing animated styles in its style
  array.
- Native-only modules (see the no-native-only-import list in
  eslint.config.js) may only be required inside their guarded wrapper module
  (lazy require + Platform check + try/catch + no-op fallback).
- Size react-native-svg elements numerically, not with percentage strings —
  percentages paint past bounds on iOS. Measure with onLayout if needed.
- ESLint enforces these (expo-consistency/* rules). Jest runs every test
  under both jest-expo/ios and jest-expo/web — keep tests passing on both
  projects.
- Before declaring a UI change done, verify it on web (expo start --web +
  browser screenshot) AND iOS (simulator screenshot). If something looks
  wrong, use the baseline A/B: git stash the change, screenshot, pop,
  screenshot, compare — to separate pre-existing breakage from regressions.
```

Adjust the guarded-wrapper path and module list to match the repo.
