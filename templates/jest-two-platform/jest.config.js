// Every test runs twice: once with Platform.OS === "ios" and once against
// react-native-web in jsdom, so both sides of every Platform branch execute.
// See README.md in this folder for the symptom table before debugging.
const shared = {
  setupFilesAfterEnv: ["<rootDir>/jest/setup.ts"],
  testMatch: ["<rootDir>/__tests__/**/*.test.{ts,tsx}"],
  moduleNameMapper: {
    // Metro uses react-native-svg-transformer for .svg imports; jest doesn't.
    // These must come before the @/ alias — first match wins.
    "\\.svg$": "<rootDir>/jest/svg-mock.js",
    "\\.css$": "<rootDir>/jest/style-mock.js",
    "^@/(.*)$": "<rootDir>/$1",
  },
  transformIgnorePatterns: [
    // jest-expo's default, extended with nativewind + its css-interop runtime.
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind|react-native-css-interop)",
  ],
};

module.exports = {
  projects: [
    // Fake timers on ios keep infinite withRepeat animations from stalling
    // tests; on web (jsdom) they deadlock reanimated's rAF loop during
    // unmount, so that project runs real timers.
    {
      ...shared,
      preset: "jest-expo/ios",
      displayName: "ios",
      fakeTimers: { enableGlobally: true },
    },
    {
      ...shared,
      preset: "jest-expo/web",
      displayName: "web",
      // setupFiles overrides the preset's, so re-include jest-expo's own.
      setupFiles: [
        "jest-expo/src/preset/setup-web.js",
        "<rootDir>/jest/setup-web-env.js",
      ],
    },
  ],
};
