const { RuleTester } = require("eslint");
const rule = require("../../lib/rules/no-classname-on-animated-component");

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-classname-on-animated-component", rule, {
  valid: [
    // className on core components is fine — nativewind registers these.
    `const X = () => <View className="p-4"><Text className="text-lg">hi</Text></View>;`,
    // Animated components with explicit styles are the endorsed pattern.
    `const X = () => <Animated.View style={{ alignItems: "center" }} />;`,
    `const AP = Animated.createAnimatedComponent(Pressable);
     const X = () => <AP style={[s, { padding: 16 }]} />;`,
    // Custom components may accept className however they like.
    `const X = () => <Card className="p-4" />;`,
    // Imports not matching the configured patterns are not treated as animated.
    `import Button from "./components/button";
     const X = () => <Button className="p-4" />;`,
  ],
  invalid: [
    {
      // Applied on iOS, silently dropped on web (whiplash result banner).
      code: `const X = () => <Animated.View className="items-center" />;`,
      errors: [{ messageId: "classname" }],
    },
    {
      // Dropped on web (whiplash home headings rendered left-aligned).
      code: `const X = () => <Animated.Text className="text-center">hi</Animated.Text>;`,
      errors: [{ messageId: "classname" }],
    },
    {
      // Locally created animated component (the shape whiplash PR #42
      // shipped — choice buttons rendered unstyled on web).
      code: `const AP = Animated.createAnimatedComponent(Pressable);
             const X = () => <AP className="rounded-2xl" />;`,
      errors: [{ messageId: "classname" }],
    },
    {
      // Bare createAnimatedComponent import form.
      code: `const AP = createAnimatedComponent(Pressable);
             const X = () => <AP className="rounded-2xl" />;`,
      errors: [{ messageId: "classname" }],
    },
    {
      // Shared-module import matching the default "animated-pressable" pattern.
      code: `import AnimatedPressable from "@/components/animated-pressable";
             const X = () => <AnimatedPressable className="p-4" />;`,
      errors: [{ messageId: "classname" }],
    },
    {
      // Custom importPatterns option.
      code: `import Fancy from "@/ui/fancy-animated";
             const X = () => <Fancy className="p-4" />;`,
      options: [{ importPatterns: ["fancy-animated"] }],
      errors: [{ messageId: "classname" }],
    },
  ],
});

console.log("ok  no-classname-on-animated-component");
