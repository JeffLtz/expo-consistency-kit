const { RuleTester } = require("eslint");
const rule = require("../../lib/rules/no-animated-view-wrapping-pressable");

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-animated-view-wrapping-pressable", rule, {
  valid: [
    // The correct pattern: animate the Pressable directly.
    `const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
     const s = useAnimatedStyle(() => ({}));
     const X = () => (
       <AnimatedPressable style={[s, { flex: 1 }]}>
         <Text>ok</Text>
       </AnimatedPressable>
     );`,
    // Animated wrapper with an animated style but no pressable inside.
    `const s = useAnimatedStyle(() => ({}));
     const X = () => (
       <Animated.View style={s}>
         <View><Text>ok</Text></View>
       </Animated.View>
     );`,
    // Animated wrapper around a pressable, but only an entering animation —
    // no useAnimatedStyle style, which is what triggers the Fabric bug.
    `const X = () => (
       <Animated.View entering={FadeIn}>
         <Pressable><Text>ok</Text></Pressable>
       </Animated.View>
     );`,
    // Plain (non-animated) style object.
    `const X = () => (
       <Animated.View style={{ flex: 1 }}>
         <Pressable><Text>ok</Text></Pressable>
       </Animated.View>
     );`,
    // Pressable without Text children (SVG/icons render fine under the bug).
    `const s = useAnimatedStyle(() => ({}));
     const X = () => (
       <Animated.View style={s}>
         <Pressable><Icon /></Pressable>
       </Animated.View>
     );`,
  ],
  invalid: [
    {
      // The exact shape that shipped the invisible-text bug (whiplash PR #42).
      code: `const s = useAnimatedStyle(() => ({ transform: [{ scale: 1 }] }));
             const X = () => (
               <Animated.View style={s}>
                 <Pressable><Text>invisible on iOS</Text></Pressable>
               </Animated.View>
             );`,
      errors: [{ messageId: "wrapped" }],
    },
    {
      // Animated style inside a style array.
      code: `const s = useAnimatedStyle(() => ({}));
             const X = () => (
               <Animated.View style={[{ flex: 1 }, s]}>
                 <Pressable><Text>hi</Text></Pressable>
               </Animated.View>
             );`,
      errors: [{ messageId: "wrapped" }],
    },
    {
      // Array-of-animated-styles indirection: style={tileStyles[i]} inside a
      // map — the shape found on the whiplash home tiles.
      code: `const a = useAnimatedStyle(() => ({}));
             const b = useAnimatedStyle(() => ({}));
             const tileStyles = [a, b];
             const X = () => items.map((item, i) => (
               <Animated.View key={i} style={tileStyles[i]}>
                 <Pressable><Text>{item}</Text></Pressable>
               </Animated.View>
             ));`,
      errors: [{ messageId: "wrapped" }],
    },
    {
      // Conditional style expression.
      code: `const s = useAnimatedStyle(() => ({}));
             const X = ({ on }) => (
               <Animated.View style={on ? s : { flex: 1 }}>
                 <Pressable><Text>hi</Text></Pressable>
               </Animated.View>
             );`,
      errors: [{ messageId: "wrapped" }],
    },
    {
      // TouchableOpacity counts as a pressable; raw JSXText counts as text.
      code: `const s = useAnimatedStyle(() => ({}));
             const X = () => (
               <Animated.View style={s}>
                 <TouchableOpacity>tap me</TouchableOpacity>
               </Animated.View>
             );`,
      errors: [{ messageId: "wrapped" }],
    },
    {
      // Nested animated wrappers each get their own report (both carry
      // useAnimatedStyle transforms above the same Pressable).
      code: `const outer = useAnimatedStyle(() => ({}));
             const inner = useAnimatedStyle(() => ({}));
             const X = () => (
               <Animated.View style={outer}>
                 <Animated.View style={inner}>
                   <Pressable><Text>hi</Text></Pressable>
                 </Animated.View>
               </Animated.View>
             );`,
      errors: [{ messageId: "wrapped" }, { messageId: "wrapped" }],
    },
  ],
});

console.log("ok  no-animated-view-wrapping-pressable");
