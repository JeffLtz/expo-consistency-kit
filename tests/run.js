// RuleTester throws on any failing case, so simply requiring each suite runs
// it; reaching the final log means everything passed.
require("./rules/no-animated-view-wrapping-pressable.test");
require("./rules/no-classname-on-animated-component.test");
require("./rules/no-native-only-import.test");

console.log("\nall rule tests passed");
