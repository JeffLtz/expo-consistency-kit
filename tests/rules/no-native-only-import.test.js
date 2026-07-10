const { RuleTester } = require("eslint");
const rule = require("../../lib/rules/no-native-only-import");

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const OPTS = [{ modules: ["react-native-audio-api"] }];

tester.run("no-native-only-import", rule, {
  valid: [
    // Unlisted modules are fine in any form.
    { code: `import { View } from "react-native";`, options: OPTS },
    { code: `const x = require("react-native");`, options: OPTS },
    { code: `const m = import("expo-haptics");`, options: OPTS },
    // With no configured modules the rule is a no-op.
    { code: `import audio from "react-native-audio-api";` },
    // Non-literal requires are out of scope (can't be checked statically).
    { code: `const x = require(name);`, options: OPTS },
  ],
  invalid: [
    {
      // Static import.
      code: `import { AudioContext } from "react-native-audio-api";`,
      options: OPTS,
      errors: [{ messageId: "banned" }],
    },
    {
      // require() at module scope — the exact form that crashed Expo Go
      // (whiplash PR #43).
      code: `const { AudioContext } = require("react-native-audio-api");`,
      options: OPTS,
      errors: [{ messageId: "banned" }],
    },
    {
      // Dynamic import().
      code: `const p = import("react-native-audio-api");`,
      options: OPTS,
      errors: [{ messageId: "banned" }],
    },
    {
      // Side-effect import.
      code: `import "react-native-audio-api";`,
      options: OPTS,
      errors: [{ messageId: "banned" }],
    },
  ],
});

console.log("ok  no-native-only-import");
