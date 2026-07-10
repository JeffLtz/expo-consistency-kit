# no-static-svg-id

Disallow static `id` attributes on react-native-svg def components — derive
ids from a sanitized `useId()` so every instance is unique.

## The bug

SVG def ids (`<LinearGradient id>`, `<RadialGradient id>`, `<Mask id>`, …) are
**document-global on web**, and expo-router keeps previously-visited screens
mounted in the DOM. When a second mounted screen defines the same id, a
`fill="url(#vignette)"` resolves to the **first** matching element in document
order — inside the hidden screen — and Chrome treats that as an invalid paint:
the gradient/mask fill turns **black or vanishes**.

The nasty part is that it's **navigation-dependent**. A direct load of the
route has exactly one screen mounted (one set of ids) and renders perfectly —
so "load the page and look" verification passes. The break only appears after
you navigate *into* the screen from another one that already defined those ids.

iOS is always fine: react-native-svg scopes ids per `Svg` tree, so the id
namespace never collides across screens. The bug is structurally invisible on
native.

```tsx
// ❌ black aurora after navigating Welcome → Begin
<RadialGradient id="vignette" cx="50%" cy="44%" r="75%">…</RadialGradient>
<Rect fill="url(#vignette)" />

// ❌ module-scope string const — same collision, one indirection away
const GRADIENT_ID = "electricFill";
<LinearGradient id={GRADIENT_ID}>…</LinearGradient>
<TextLayer fill={`url(#${GRADIENT_ID})`} />
```

## The fix

Derive every def id from `useId()` per component instance, sanitized because
React's ids contain characters (`:`) that are invalid inside a `url(#...)`
reference:

```tsx
// ✅ unique per instance, identical behavior on both platforms
const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
const vignetteId = `vignette-${uid}`;

<RadialGradient id={vignetteId} cx="50%" cy="44%" r="75%">…</RadialGradient>
<Rect fill={`url(#${vignetteId})`} />
```

Any dynamic id — a template literal with an expression, a call, or a prop —
is left alone. The rule does not try to prove the dynamic part is actually
unique; `useId()` is, and that's the endorsed pattern.

## What the rule detects

A static `id` on a def-creating component imported from `react-native-svg`
(`LinearGradient`, `RadialGradient`, `Mask`, `Pattern`, `ClipPath`, `Filter`,
`Marker`), where the value is one of the three static shapes that shipped:

1. a string literal — `id="vignette"`,
2. an expression-free template literal — `` id={`vignette`} ``,
3. an identifier resolving to a module-scope string `const` — `id={GRADIENT_ID}`.

Referencing attributes like `fill="url(#...)"` are not `id` attributes and are
not flagged; only the def that *mints* the id is.

## Known blind spot

Like the other rules this is a per-file tripwire, not a proof. It requires the
component to be imported from `react-native-svg` in the same file, and it only
resolves module-scope string consts (not ids threaded through other modules or
computed at runtime). Escape hatch: `eslint-disable-next-line` with a reason.

## Origin

mantra, 2026-07-09 ([PR #5](https://github.com/JeffLtz/mantra/pull/5)).
Navigating Welcome → Begin turned the aurora background flat black; looping
Home → Begin again killed the affirmation text's gradient fill (outline-only
text). A Playwright A/B driving the real flow showed every gradient id
duplicated once per mounted screen (`blob-magenta`, `blob-blue`, `blob-cyan`,
`vignette`); a direct load of `/breathe` had one set and rendered fine. The
sanitized-`useId()` fix took duplicates to zero; the iOS simulator was
unchanged throughout.
