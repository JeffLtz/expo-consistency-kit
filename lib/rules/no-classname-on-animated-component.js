/**
 * nativewind does not resolve className on reanimated components consistently
 * across platforms (verified empirically on iOS simulator + web):
 * - <Animated.View className> / <Animated.Text className>: applied on iOS,
 *   silently dropped on web (elements lose their tint, padding, centering in
 *   the browser).
 * - Animated.createAnimatedComponent(...) results: className dropped on web;
 *   registering the component with cssInterop fixes web but breaks native
 *   style processing (unstyled elements, misaligned layouts on iOS).
 *
 * The only behavior that is identical everywhere is passing explicit style
 * objects, so this rule bans className on Animated.* JSX and on any component
 * created via createAnimatedComponent (including imports matching the
 * configured shared-module patterns).
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow className on reanimated components (nativewind resolves it differently per platform); use explicit style objects",
      url: "https://github.com/JeffLtz/expo-consistency-kit/blob/main/docs/rules/no-classname-on-animated-component.md",
    },
    schema: [
      {
        type: "object",
        properties: {
          importPatterns: {
            type: "array",
            items: { type: "string" },
            description:
              "Substrings of import paths whose default/named imports are treated as animated components (default: [\"animated-pressable\"])",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      classname:
        "'{{name}}' is a reanimated component, and nativewind does not resolve className on reanimated components the same way on web and native — the styles are silently dropped on at least one platform. " +
        "Pass explicit style objects in the style array instead.",
    },
  },
  create(context) {
    const importPatterns = context.options[0]?.importPatterns ?? [
      "animated-pressable",
    ];
    const animatedNames = new Set();
    const usages = [];

    return {
      VariableDeclarator(node) {
        if (node.id.type !== "Identifier" || !node.init) return;
        const init = node.init;
        if (
          init.type === "CallExpression" &&
          ((init.callee.type === "MemberExpression" &&
            init.callee.property.type === "Identifier" &&
            init.callee.property.name === "createAnimatedComponent") ||
            (init.callee.type === "Identifier" &&
              init.callee.name === "createAnimatedComponent"))
        ) {
          animatedNames.add(node.id.name);
        }
      },
      ImportDeclaration(node) {
        if (
          typeof node.source.value === "string" &&
          importPatterns.some((p) => node.source.value.includes(p))
        ) {
          for (const spec of node.specifiers) {
            animatedNames.add(spec.local.name);
          }
        }
      },
      JSXOpeningElement(node) {
        let name = null;
        if (node.name.type === "JSXIdentifier") {
          name = node.name.name;
        } else if (
          node.name.type === "JSXMemberExpression" &&
          node.name.object.type === "JSXIdentifier" &&
          node.name.object.name === "Animated"
        ) {
          name = `Animated.${node.name.property.name}`;
        }
        if (!name) return;
        const hasClassName = node.attributes.some(
          (attr) =>
            attr.type === "JSXAttribute" && attr.name.name === "className",
        );
        if (hasClassName) usages.push({ node, name });
      },
      "Program:exit"() {
        for (const { node, name } of usages) {
          if (animatedNames.has(name) || name.startsWith("Animated.")) {
            context.report({
              node,
              messageId: "classname",
              data: { name },
            });
          }
        }
      },
    };
  },
};
