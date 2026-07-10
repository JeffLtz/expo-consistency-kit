# no-animated-view-wrapping-pressable

Disallow a reanimated `Animated.View` with a `useAnimatedStyle` style wrapping
a `Pressable` that contains `Text`.

## The bug

On iOS with the New Architecture (Fabric), this shape makes any nested
`<Text>` render **invisible** — the button box, borders, and SVG children
still draw; only the text disappears:

```tsx
// ❌ Text renders blank on iOS New Arch
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));

<Animated.View style={[{ flex: 1 }, animatedStyle]}>
  <Pressable onPress={onSelect}>
    <Text>440 Hz</Text>
  </Pressable>
</Animated.View>
```

It is not a font or styling issue — inline fonts, utility classes, and
hardcoded strings all fail equally under the wrapper. Diagnosed live
on-device: the text rendered the moment the wrapper was removed.

**Why a lint rule:** JS-level tests cannot catch this. The `Text` still
"exists" in the virtual test tree; only Fabric's native rendering drops it.
A static check is the only automated guard.

## The fix

Animate the `Pressable` directly. Multiple animated styles compose in one
style array:

```tsx
// ✅ animate the pressable itself
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

<AnimatedPressable
  onPress={onSelect}
  style={[animatedStyle, { flex: 1, borderRadius: 16 }]}
>
  <Text>440 Hz</Text>
</AnimatedPressable>
```

(Note: don't pass `className` to the created component — see
[no-classname-on-animated-component](no-classname-on-animated-component.md).)

## What the rule detects

- `Animated.View` whose `style` references a `useAnimatedStyle` result:
  directly, in a style array, through a conditional/logical expression, or
  through an array-of-styles indirection (`const styles = [a, b]` →
  `style={styles[i]}`).
- Containing a descendant `Pressable`/`Touchable*` that contains a descendant
  `Text`/`Animated.Text` or raw JSX text.

## Known blind spot

The rule is per-file and cannot see through component indirection — an
`Animated.View` wrapping `<MyButton />` that internally renders a `Pressable`
will not be flagged. It's a tripwire for the shapes that actually ship, not a
proof.

## Options

```js
"expo-consistency/no-animated-view-wrapping-pressable": ["error", {
  // Component names treated as pressables.
  pressables: ["Pressable", "TouchableOpacity", "MyPressable"],
}]
```

## Origin

Shipped in whiplash-expo (choice buttons on three screens; fixed in PR #42,
then found again on the home tiles by this rule's first run, July 2026).
