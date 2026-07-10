# Changelog

## 0.1.0 — 2026-07-09

Initial release, extracted from whiplash-expo after a week in which two
cross-platform bugs shipped in opposite directions: an iOS text-rendering fix
(PR #42) silently unstyled the same buttons on web, and the web fix for
*that* broke five more things on iOS. Everything here is what stopped the
whack-a-mole:

- `no-animated-view-wrapping-pressable` — invisible Text on iOS New Arch
  under reanimated wrappers (undetectable by JS-level tests).
- `no-classname-on-animated-component` — nativewind className silently
  dropped on one platform for reanimated components; cssInterop registration
  breaks the other.
- `no-native-only-import` — module-scope requires of native-only modules
  crash Expo Go; enforces the guarded-wrapper pattern.
- jest two-platform template (jest-expo/ios + jest-expo/web) with every
  landmine documented by symptom.
- Verification playbook: Playwright + system Chrome, simctl deep links +
  screenshots, AppleScript tap helper, git-stash baseline A/B.
- Bug catalog seeded with five bug classes, each proven on-device.
