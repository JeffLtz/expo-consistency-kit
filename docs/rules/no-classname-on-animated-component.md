# no-classname-on-animated-component

Disallow nativewind `className` on reanimated components — use explicit style
objects.

## The bug

nativewind (v4) does not resolve `className` on reanimated components
consistently across platforms. Verified empirically with side-by-side iOS
simulator and Chrome screenshots:

| Shape | iOS | web |
|---|---|---|
| `<Animated.View className="...">` | applied | **silently dropped** |
| `<Animated.Text className="...">` | applied | **silently dropped** |
| `createAnimatedComponent(X)` + `className` | applied | **silently dropped** |
| any of the above + `cssInterop(Component, { className: "style" })` | **breaks native style processing** | applied |

"Silently dropped" means no warning, no error — the element just renders
unstyled. In practice: choice buttons rendered as tiny unstyled text chips, a
result banner lost its tint, screens lost their horizontal padding, headings
lost their centering — each on exactly one platform, so nobody noticed until
the platforms were compared frame by frame.

The tempting fix — registering the component with `cssInterop` — inverts the
problem: web gets styled and native breaks (unstyled tiles, misaligned
layouts). Don't.

## The fix

Explicit style objects behave identically everywhere:

```tsx
// ❌ applied on iOS, dropped on web
<Animated.View entering={FadeInUp} className="items-center px-6">

// ✅ identical on both platforms
<Animated.View entering={FadeInUp} style={{ alignItems: "center", paddingHorizontal: 24 }}>
```

`className` on plain `View` / `Text` / `Pressable` is fine — nativewind
registers the core components on both platforms. If you need animated text
with utility classes, wrap a plain `Text` in an `Animated.View`:

```tsx
// ✅ entering animation + className, both resolved everywhere
<Animated.View entering={FadeIn}>
  <Text className="text-3xl text-center">Ear Training</Text>
</Animated.View>
```

## Options

```js
"expo-consistency/no-classname-on-animated-component": ["error", {
  // Substrings of import paths whose imports are treated as animated
  // components (for shared AnimatedPressable-style modules).
  importPatterns: ["animated-pressable"],
}]
```

## Origin

whiplash-expo, July 2026. The `AnimatedPressable` fix for the invisible-text
bug (see [no-animated-view-wrapping-pressable](no-animated-view-wrapping-pressable.md))
silently unstyled the same buttons on web; the cssInterop "fix" for that then
broke five different things on iOS. Explicit styles ended the whack-a-mole.
