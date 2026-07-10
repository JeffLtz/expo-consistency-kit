/**
 * Regression test for the Expo Go crash class: a native-only module throws
 * at require time when its native code isn't in the binary. The app's
 * guarded wrapper (lazy require + Platform check + try/catch + no-op
 * fallback) must survive that instead of crashing the screen.
 *
 * On the ios jest project this exercises the guarded-require path directly.
 * On the web project the module must never be touched at all — if any import
 * path reaches it, this mock throws and the render fails.
 *
 * Prove the test's worth once: remove the try/catch in your wrapper and
 * watch the ios project fail while web passes.
 *
 * TODO(app): swap the module name, screen import, testID, and assertions.
 */
import { fireEvent, renderRouter, screen } from "expo-router/testing-library";
import { Platform } from "react-native";

import FeatureScreen from "@/app/feature";

// babel-jest hoists this above the imports, so it applies before any of them
// can require the module.
jest.mock("some-native-only-module", () => {
  throw new Error("Cannot find native module (simulated Expo Go)");
});

afterEach(() => {
  jest.useRealTimers();
});

test("feature screen survives a missing native module", () => {
  renderRouter({ feature: FeatureScreen }, { initialUrl: "/feature" });
  expect(JSON.stringify(screen.toJSON())).toContain("TODO: ready-state text");

  if (Platform.OS !== "web") {
    // RNTL events only reach real react-native components, so ios-only.
    fireEvent.press(screen.getByTestId("start-button"));
    expect(JSON.stringify(screen.toJSON())).toContain(
      "TODO: active-state text",
    );
  }
});
