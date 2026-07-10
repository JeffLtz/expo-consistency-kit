# Changelog

## 0.2.0 — 2026-07-09

- `no-static-svg-id` — static react-native-svg def ids (`id="vignette"`)
  collide across expo-router-mounted screens on web, where ids are
  document-global; `url(#...)` then resolves into a hidden screen and Chrome
  paints the gradient/mask fill black. Navigation-dependent, so a direct load
  looks fine and iOS (per-Svg-tree id scoping) never breaks. Extracted from
  mantra PR #5, where navigating Welcome → Begin blacked out the aurora and a
  Playwright A/B showed every gradient id duplicated once per mounted screen.
  Fix: derive ids from a sanitized `useId()` per instance.

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
