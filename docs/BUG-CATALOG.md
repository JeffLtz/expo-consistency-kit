# Bug catalog

Every cross-platform bug class this kit knows about: symptom, root cause,
how it was proven, and what guards it now. When a new one bites, add an entry
(template at the bottom) — this file is the kit's institutional memory.

---

## 1. Invisible Text under an animated wrapper (iOS New Architecture)

- **Symptom:** Buttons render (box, borders, SVG icons) but their text is
  blank — iOS only, web fine.
- **Root cause:** reanimated `Animated.View` whose style includes a
  `useAnimatedStyle()` result wrapping a `Pressable` — Fabric drops nested
  `Text` rendering. Not a font/styling issue.
- **Proven:** live on-device (text appeared the moment the wrapper was
  removed), whiplash-expo PR #42, May–July 2026. Found *again* on another
  screen by the lint rule's first run.
- **Guard:** [`no-animated-view-wrapping-pressable`](rules/no-animated-view-wrapping-pressable.md).
  JS-level tests cannot catch this (the Text exists in the virtual tree).
- **Fix pattern:** `Animated.createAnimatedComponent(Pressable)` with the
  animated styles in the pressable's own style array.

## 2. Native-only module crashes Expo Go at require time

- **Symptom:** "Failed to install <module>: The native module could not be
  found" hard-crash on device/Expo Go the moment a feature is used; web fine.
- **Root cause:** module-scope `require()`/`import` of a library with no JS
  fallback (`react-native-audio-api`).
- **Proven:** whiplash-expo PR #43, July 2026.
- **Guards:** [`no-native-only-import`](rules/no-native-only-import.md) +
  a jest regression test that mocks the module to throw at require time
  (simulating Expo Go) and asserts the screen survives.
- **Fix pattern:** one guarded wrapper — lazy require, Platform check,
  try/catch, silent no-op fallback.

## 3. nativewind className on reanimated components

- **Symptom:** an element is styled on one platform and unstyled on the other
  — no warning, no error. Observed as: unstyled cards, missing tint, missing
  screen padding, left-aligned headings (web); after a `cssInterop`
  "fix": unstyled tiles, misaligned pulse ring, stretched pills (iOS).
- **Root cause:** nativewind v4 resolves `className` on `Animated.View`/
  `Animated.Text`/`createAnimatedComponent(...)` on iOS but drops it on web;
  registering the component with `cssInterop` inverts the breakage onto
  native.
- **Proven:** side-by-side simulator + Chrome screenshots with a git-stash
  baseline A/B, whiplash-expo, 2026-07-09.
- **Guard:** [`no-classname-on-animated-component`](rules/no-classname-on-animated-component.md).
- **Fix pattern:** explicit style objects on all animated components;
  className only on plain `View`/`Text`/`Pressable`; animated text = plain
  `Text` inside an `Animated.View`.

## 4. react-native-svg percentage sizing paints past bounds (iOS)

- **Symptom:** an SVG-backed element (gradient pill) draws a "trail" past its
  intended bounds / stretches oddly — iOS only, web fine.
- **Root cause:** `<Svg width="100%" height="100%">` resolves percentages
  differently on native than in the DOM.
- **Proven:** whiplash-expo SpherePill, on-simulator screenshots, 2026-07-09.
  A sibling component sized numerically (`width={size}`) rendered perfectly,
  isolating the variable.
- **Guard:** none static yet (percentage props on `Svg` would be a lintable
  shape if it recurs — candidate rule).
- **Fix pattern:** measure the wrapper with `onLayout`, store `{w, h}` state,
  render the `Svg` (and inner shapes) with numeric dimensions once measured.

## 5. Stale dev client ≠ current native config

- **Symptom:** old app icon / splash, or native modules missing, despite the
  JS being current.
- **Root cause:** icons, splash, and native modules live in the *built* dev
  client; Metro only ships JS. Anything changed via app.json/config plugins
  needs a rebuild.
- **Fix pattern:** `npx expo run:ios` (with `LANG=en_US.UTF-8` for
  CocoaPods) whenever native config changes.

---

## Adding an entry

```md
## N. <one-line name>

- **Symptom:** what a developer/user actually sees, per platform.
- **Root cause:** the mechanism, one paragraph max.
- **Proven:** how it was isolated (A/B, on-device, screenshots), where, when.
- **Guard:** lint rule / test / symptom-table row — or "none yet" + candidate.
- **Fix pattern:** the transplantable code idiom.
```

Then: RuleTester case if lintable, CHANGELOG line with the story.
