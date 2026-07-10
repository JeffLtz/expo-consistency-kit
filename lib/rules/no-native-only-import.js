/**
 * Bans importing/requiring native-only modules anywhere except a designated
 * guarded wrapper. A module-scope `require("some-native-module")` hard-crashes
 * Expo Go at load time (the native code isn't bundled there) and typically
 * has no implementation on web. Such modules must be required lazily, inside
 * a try/catch, behind a Platform check, in exactly one wrapper module — and
 * that file is exempted via a per-file override in the flat config.
 *
 * Covers static imports, dynamic import(), and require() calls uniformly
 * (the built-in no-restricted-imports misses require()).
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow importing native-only modules outside their guarded wrapper (crashes Expo Go at require time, missing on web)",
      url: "https://github.com/JeffLtz/expo-consistency-kit/blob/main/docs/rules/no-native-only-import.md",
    },
    schema: [
      {
        type: "object",
        properties: {
          modules: {
            type: "array",
            items: { type: "string" },
            description: "Module names that may only be required in the guarded wrapper",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      banned:
        "'{{name}}' is a native-only module: requiring it crashes at load time in Expo Go and it does not exist on web. " +
        "Require it lazily inside a Platform-guarded try/catch in a single wrapper module, and exempt that file with a per-file override in eslint.config.js.",
    },
  },
  create(context) {
    const banned = new Set(context.options[0]?.modules ?? []);
    const check = (node, source) => {
      if (source?.type === "Literal" && banned.has(source.value)) {
        context.report({
          node,
          messageId: "banned",
          data: { name: source.value },
        });
      }
    };
    return {
      ImportDeclaration(node) {
        check(node, node.source);
      },
      ImportExpression(node) {
        check(node, node.source);
      },
      CallExpression(node) {
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "require" &&
          node.arguments.length > 0
        ) {
          check(node, node.arguments[0]);
        }
      },
    };
  },
};
