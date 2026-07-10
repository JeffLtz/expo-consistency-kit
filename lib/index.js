const noAnimatedViewWrappingPressable = require("./rules/no-animated-view-wrapping-pressable");
const noClassnameOnAnimatedComponent = require("./rules/no-classname-on-animated-component");
const noNativeOnlyImport = require("./rules/no-native-only-import");
const noStaticSvgId = require("./rules/no-static-svg-id");

const plugin = {
  meta: { name: "expo-consistency-kit", version: "0.2.0" },
  rules: {
    "no-animated-view-wrapping-pressable": noAnimatedViewWrappingPressable,
    "no-classname-on-animated-component": noClassnameOnAnimatedComponent,
    "no-native-only-import": noNativeOnlyImport,
    "no-static-svg-id": noStaticSvgId,
  },
};

// Flat-config preset. `no-native-only-import` is intentionally absent — it
// does nothing without a configured module list, so consumers add it
// explicitly (see README).
plugin.configs = {
  recommended: {
    plugins: { "expo-consistency": plugin },
    rules: {
      "expo-consistency/no-animated-view-wrapping-pressable": "error",
      "expo-consistency/no-classname-on-animated-component": "error",
      "expo-consistency/no-static-svg-id": "error",
    },
  },
};

module.exports = plugin;
