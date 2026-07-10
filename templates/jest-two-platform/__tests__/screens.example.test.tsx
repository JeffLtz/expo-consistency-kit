/**
 * Screen smoke tests — every test here runs under BOTH jest projects
 * (jest-expo/ios and jest-expo/web), so a module that only works on one
 * platform, or a Platform branch that throws on the other, fails in CI.
 *
 * Assertions stringify the rendered tree instead of using RNTL queries
 * because the web project renders react-native-web host elements (divs),
 * which RNTL's getByText/findByText cannot match.
 *
 * TODO(app): replace the imports and route map with your screens, and the
 * asserted strings with text those screens render.
 */
import { renderRouter, screen } from "expo-router/testing-library";

import HomeScreen from "@/app/index";
// import OtherScreen from "@/app/other";

// Pass an explicit route map, NOT the real app directory — a root _layout
// that returns null until fonts load would hang these tests.
const routes = {
  index: HomeScreen,
  // other: OtherScreen,
};

// renderRouter turns fake timers on; restore real ones before RNTL's
// auto-cleanup hook runs or unmounting deadlocks on the web project.
afterEach(() => {
  jest.useRealTimers();
});

const renderedText = () => JSON.stringify(screen.toJSON());

test("home screen renders", () => {
  renderRouter(routes, { initialUrl: "/" });
  expect(renderedText()).toContain("TODO: some text your home screen shows");
});
