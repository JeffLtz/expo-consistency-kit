// Unmounting an expo-router ExpoRoot deadlocks under react-native-web +
// react-test-renderer, so RNTL's per-test auto-cleanup would time out on the
// web project. Skip it there — each test file gets a fresh jsdom anyway.
// Must run in setupFiles (before @testing-library/react-native is imported).
process.env.RNTL_SKIP_AUTO_CLEANUP = "true";
