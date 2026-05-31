import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  // Global ignores — must be a standalone config object with only `ignores`.
  globalIgnores([
    // Next.js build output
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Sub-project directory (separate app, not linted here)
    "seerah-app/**",
    // Utility scripts — CommonJS / Node.js, not Next.js app code
    "scripts/**",
    // Backup / staging pages — not shipped
    "app/**/page-old-backup.tsx",
    "app/**/page-working.tsx",
  ]),

  ...nextVitals,
  ...nextTs,

  // Project-wide rule overrides
  {
    rules: {
      // ── React Hooks ───────────────────────────────────────────────────────
      // set-state-in-effect fires on many valid patterns: hydration mounts
      // (setMounted), URL-sync (setActiveTab), eager cache reads, and lazy
      // loader prop-sync. All intentional — turned off to keep the output clean.
      "react-hooks/set-state-in-effect": "off",

      // immutability flags DOM element property mutations (e.g. audioEl.volume = x)
      // stored in refs and forward-refs captured by effects — both valid patterns.
      "react-hooks/immutability": "off",

      // purity flags Date.now() in useRef() initializers and inside effect bodies,
      // which is a well-established idiomatic React pattern.
      "react-hooks/purity": "off",

      // ── TypeScript ────────────────────────────────────────────────────────
      // Allow `any` in the few places it is genuinely needed (streaming APIs,
      // Stripe's own type gaps). Real bugs are caught by tsc --noEmit.
      "@typescript-eslint/no-explicit-any": "warn",

      // Unused vars are warnings, not errors. Shadowed _ prefix is fine.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],

      // CommonJS require is forbidden in .ts/.tsx but harmless in scripts (already
      // excluded above). Keep as error for app code.
      "@typescript-eslint/no-require-imports": "error",

      // ── React ─────────────────────────────────────────────────────────────
      // Unescaped entities are a style concern, not a runtime risk.
      "react/no-unescaped-entities": "warn",
    },
  },
]);

export default eslintConfig;
