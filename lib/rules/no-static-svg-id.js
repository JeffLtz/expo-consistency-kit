/**
 * react-native-svg def ids (`<LinearGradient id="...">`, `<Mask id="...">`, …)
 * must be unique per component instance, because on web they land in a
 * document-global id namespace and expo-router keeps previously-visited
 * screens mounted in the DOM. Two mounted screens that both define
 * `id="vignette"` collide: a `fill="url(#vignette)"` resolves to the FIRST
 * matching element in document order — inside the hidden screen — which
 * Chrome treats as an invalid paint, so the gradient/mask fill turns black or
 * vanishes. It only breaks *after navigation* (a direct load has one screen
 * mounted, one set of ids), so "load the page and look" verification passes.
 * iOS (react-native-svg) scopes ids per Svg tree, so the bug is structurally
 * invisible there.
 *
 * This rule flags a static `id` on an SVG def-creating component imported from
 * react-native-svg — a string literal, an expression-free template literal, or
 * an identifier that resolves to a module-scope string `const` (all three
 * shapes shipped in mantra). Dynamic ids (anything carrying an expression) are
 * left alone; the endorsed fix derives every id from a sanitized `useId()`:
 *   const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
 *   <RadialGradient id={`vignette-${uid}`} />
 */

// Def-creating react-native-svg components: those that mint an id other
// elements reference via url(#...). Referencing elements (Rect/Path/…) are not
// listed — their `fill`/`mask` strings are not `id` attributes.
const DEF_COMPONENTS = new Set([
  "LinearGradient",
  "RadialGradient",
  "Mask",
  "Pattern",
  "ClipPath",
  "Filter",
  "Marker",
]);

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow static id attributes on react-native-svg def components (document-global ids collide across router-mounted screens on web, painting fills black); derive ids from a sanitized useId()",
      url: "https://github.com/JeffLtz/expo-consistency-kit/blob/main/docs/rules/no-static-svg-id.md",
    },
    schema: [],
    messages: {
      staticId:
        "'{{name}}' has a static SVG def id — on web these ids are document-global and expo-router keeps previous screens mounted, so a second instance of this id makes url(#...) resolve to the hidden screen's element and Chrome paints the fill black (only after navigation; a direct load looks fine). iOS scopes ids per Svg tree so the bug is invisible there. " +
        "Derive the id from a sanitized useId() per instance: const uid = useId().replace(/[^a-zA-Z0-9]/g, \"\"); id={`{{name}}-${uid}`}.",
    },
  },
  create(context) {
    // Local names bound to a def-creating react-native-svg import (handles
    // aliasing: `import { Mask as M }` → local "M").
    const svgDefNames = new Set();
    // Module-scope `const NAME = "literal"` bindings → the shape-2 indirection.
    const moduleStringConsts = new Set();
    const usages = [];

    const isStaticIdValue = (value) => {
      if (!value) return false;
      // id="vignette"
      if (value.type === "Literal") return typeof value.value === "string";
      if (value.type === "JSXExpressionContainer") {
        const expr = value.expression;
        // id={"vignette"}
        if (expr.type === "Literal") return typeof expr.value === "string";
        // id={`vignette`} — template literal with no ${} expressions
        if (expr.type === "TemplateLiteral") return expr.expressions.length === 0;
        // id={GRADIENT_ID} where GRADIENT_ID is a module-scope string const
        if (expr.type === "Identifier") return moduleStringConsts.has(expr.name);
      }
      return false;
    };

    return {
      ImportDeclaration(node) {
        if (node.source.value !== "react-native-svg") return;
        for (const spec of node.specifiers) {
          if (
            spec.type === "ImportSpecifier" &&
            DEF_COMPONENTS.has(spec.imported.name)
          ) {
            svgDefNames.add(spec.local.name);
          }
        }
      },
      VariableDeclaration(node) {
        // Only module-scope consts feed the identifier-resolution shape.
        if (node.parent.type !== "Program") return;
        for (const decl of node.declarations) {
          if (
            decl.id.type === "Identifier" &&
            decl.init &&
            decl.init.type === "Literal" &&
            typeof decl.init.value === "string"
          ) {
            moduleStringConsts.add(decl.id.name);
          }
        }
      },
      JSXOpeningElement(node) {
        if (node.name.type !== "JSXIdentifier") return;
        const name = node.name.name;
        const idAttr = node.attributes.find(
          (attr) =>
            attr.type === "JSXAttribute" &&
            attr.name.type === "JSXIdentifier" &&
            attr.name.name === "id",
        );
        if (!idAttr) return;
        usages.push({ node, name, value: idAttr.value });
      },
      "Program:exit"() {
        for (const { node, name, value } of usages) {
          if (!svgDefNames.has(name)) continue;
          if (isStaticIdValue(value)) {
            context.report({ node, messageId: "staticId", data: { name } });
          }
        }
      },
    };
  },
};
