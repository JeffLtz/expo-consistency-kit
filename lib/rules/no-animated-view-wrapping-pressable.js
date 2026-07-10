/**
 * On iOS with the New Architecture (Fabric), a reanimated <Animated.View>
 * whose style includes a useAnimatedStyle() result and that wraps a
 * <Pressable> makes any nested <Text> render invisible — the box, borders,
 * and SVG children still show; only Text disappears. The bug is invisible to
 * JS-level tests (the Text still exists in the virtual tree), so a static
 * check is the only automated guard.
 *
 * Fix: animate the Pressable directly via
 * `Animated.createAnimatedComponent(Pressable)` and put the animated style(s)
 * in the pressable's style array — multiple useAnimatedStyle results compose
 * in one array.
 *
 * This rule is a per-file tripwire, not a proof: it cannot see through
 * component indirection (an Animated.View wrapping a custom component that
 * renders its own Pressable will not be flagged).
 */

const DEFAULT_PRESSABLES = [
  "Pressable",
  "TouchableOpacity",
  "TouchableHighlight",
  "TouchableWithoutFeedback",
];
const TEXTS = new Set(["Text", "Animated.Text"]);

function jsxName(node) {
  if (node.type === "JSXIdentifier") return node.name;
  if (node.type === "JSXMemberExpression")
    return `${jsxName(node.object)}.${node.property.name}`;
  return null;
}

function walk(node, cb, seen = new Set()) {
  if (!node || typeof node.type !== "string" || seen.has(node)) return;
  seen.add(node);
  cb(node);
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child.type === "string") walk(child, cb, seen);
      }
    } else if (value && typeof value.type === "string") {
      walk(value, cb, seen);
    }
  }
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow a reanimated Animated.View with a useAnimatedStyle style wrapping a Pressable that contains Text (text renders invisible on iOS New Architecture)",
      url: "https://github.com/JeffLtz/expo-consistency-kit/blob/main/docs/rules/no-animated-view-wrapping-pressable.md",
    },
    schema: [
      {
        type: "object",
        properties: {
          pressables: {
            type: "array",
            items: { type: "string" },
            description:
              "Component names treated as pressables (default: Pressable and the Touchable* family)",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      wrapped:
        "On iOS (New Architecture), an <Animated.View> with a useAnimatedStyle style that wraps a <{{pressable}}> makes nested <Text> render invisible. " +
        "Use `const AnimatedPressable = Animated.createAnimatedComponent(Pressable)` and put the animated style(s) directly in the pressable's style array " +
        "(multiple animated styles compose in one array). " +
        "False positive? Add an eslint-disable comment for this rule with a reason.",
    },
  },
  create(context) {
    const pressables = new Set(
      context.options[0]?.pressables ?? DEFAULT_PRESSABLES,
    );
    const animatedStyleNames = new Set();
    const candidates = [];

    const isAnimatedStyleExpr = (expr) => {
      if (!expr) return false;
      switch (expr.type) {
        case "Identifier":
          return animatedStyleNames.has(expr.name);
        case "MemberExpression":
          // e.g. style={tileStyles[i]} where tileStyles is an array of
          // useAnimatedStyle results
          return (
            expr.object.type === "Identifier" &&
            animatedStyleNames.has(expr.object.name)
          );
        case "ArrayExpression":
          return expr.elements.some(isAnimatedStyleExpr);
        case "ConditionalExpression":
          return (
            isAnimatedStyleExpr(expr.consequent) ||
            isAnimatedStyleExpr(expr.alternate)
          );
        case "LogicalExpression":
          return isAnimatedStyleExpr(expr.left) || isAnimatedStyleExpr(expr.right);
        default:
          return false;
      }
    };

    return {
      VariableDeclarator(node) {
        if (node.id.type !== "Identifier" || !node.init) return;
        if (
          node.init.type === "CallExpression" &&
          node.init.callee.type === "Identifier" &&
          node.init.callee.name === "useAnimatedStyle"
        ) {
          animatedStyleNames.add(node.id.name);
        } else if (
          node.init.type === "ArrayExpression" &&
          node.init.elements.length > 0 &&
          node.init.elements.every(
            (el) =>
              el && el.type === "Identifier" && animatedStyleNames.has(el.name),
          )
        ) {
          // `const tileStyles = [tileStyle0, tileStyle1]` so that
          // `style={tileStyles[i]}` is detectable.
          animatedStyleNames.add(node.id.name);
        }
      },
      JSXElement(node) {
        if (jsxName(node.openingElement.name) !== "Animated.View") return;
        const styleAttr = node.openingElement.attributes.find(
          (attr) => attr.type === "JSXAttribute" && attr.name.name === "style",
        );
        if (styleAttr?.value?.type === "JSXExpressionContainer") {
          candidates.push({ node, style: styleAttr.value.expression });
        }
      },
      "Program:exit"() {
        for (const { node, style } of candidates) {
          if (!isAnimatedStyleExpr(style)) continue;
          const found = [];
          for (const child of node.children) {
            walk(child, (desc) => {
              if (
                desc.type === "JSXElement" &&
                pressables.has(jsxName(desc.openingElement.name))
              ) {
                found.push(desc);
              }
            });
          }
          for (const pressable of found) {
            let hasText = false;
            for (const child of pressable.children) {
              walk(child, (desc) => {
                if (
                  (desc.type === "JSXElement" &&
                    TEXTS.has(jsxName(desc.openingElement.name))) ||
                  (desc.type === "JSXText" && /\S/.test(desc.value))
                ) {
                  hasText = true;
                }
              });
            }
            if (hasText) {
              context.report({
                node: node.openingElement,
                messageId: "wrapped",
                data: { pressable: jsxName(pressable.openingElement.name) },
              });
              break;
            }
          }
        }
      },
    };
  },
};
