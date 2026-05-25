import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Apostrophes render fine in JSX; this rule is purely a markup style.
      "react/no-unescaped-entities": "off",
      // Conditional setState in an effect (e.g. measuring DOM on mount to
      // decide whether to render a "Read more" toggle) is a legitimate
      // pattern. Downgrade so lint stays green; real issues still show up.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
