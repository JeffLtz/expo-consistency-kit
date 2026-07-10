const { RuleTester } = require("eslint");
const rule = require("../../lib/rules/no-static-svg-id");

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-static-svg-id", rule, {
  valid: [
    // The endorsed fix: id derived from a sanitized useId() per instance.
    `import { RadialGradient } from "react-native-svg";
     const X = () => {
       const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
       const vignetteId = \`vignette-\${uid}\`;
       return <RadialGradient id={vignetteId} cx="50%" cy="44%" r="75%" />;
     };`,
    // Template literal carrying the uid expression inline.
    `import { LinearGradient } from "react-native-svg";
     const X = ({ uid }) => <LinearGradient id={\`blob-magenta-\${uid}\`} />;`,
    // A prop / non-module-const identifier is dynamic — not flagged.
    `import { Mask } from "react-native-svg";
     const X = ({ maskId }) => <Mask id={maskId} />;`,
    // Call expression is dynamic.
    `import { ClipPath } from "react-native-svg";
     const X = () => <ClipPath id={makeId("clip")} />;`,
    // Referencing elements (fill="url(#...)") are not id attributes on defs.
    `import { Rect } from "react-native-svg";
     const X = () => <Rect fill="url(#vignette)" />;`,
    // A static id on something NOT imported from react-native-svg is ignored
    // (e.g. a DOM/label element that legitimately owns a stable id).
    `const X = () => <label id="email">Email</label>;`,
    // Def component name that wasn't imported from react-native-svg.
    `const LinearGradient = require("./local");
     const X = () => <LinearGradient id="whatever" />;`,
  ],
  invalid: [
    {
      // Shape 1 — string-literal id (mantra AuroraBackground.tsx, pre-fix).
      code: `import { RadialGradient, Rect, Defs } from "react-native-svg";
             const X = () => (
               <Defs>
                 <RadialGradient id="vignette" cx="50%" cy="44%" r="75%" />
               </Defs>
             );`,
      errors: [{ messageId: "staticId" }],
    },
    {
      // Shape 2 — module-scope string const (mantra AffirmationText.tsx,
      // pre-fix: const GRADIENT_ID = "electricFill" / MASK_ID = "riseMask").
      code: `import { LinearGradient, Mask } from "react-native-svg";
             const GRADIENT_ID = "electricFill";
             const MASK_ID = "riseMask";
             const X = () => (
               <>
                 <LinearGradient id={GRADIENT_ID} x1="0" y1="0" x2="1" y2="1" />
                 <Mask id={MASK_ID} x="0" y="0" width={W} height={H} />
               </>
             );`,
      errors: [{ messageId: "staticId" }, { messageId: "staticId" }],
    },
    {
      // Expression-free template literal is just as static as a string.
      code: `import { Pattern } from "react-native-svg";
             const X = () => <Pattern id={\`dots\`} />;`,
      errors: [{ messageId: "staticId" }],
    },
    {
      // Aliased import still resolves to a def component.
      code: `import { Mask as M } from "react-native-svg";
             const X = () => <M id="riseMask" />;`,
      errors: [{ messageId: "staticId" }],
    },
  ],
});

console.log("ok  no-static-svg-id");
