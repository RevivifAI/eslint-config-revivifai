// @ts-check

/**
 * @file ESLint configuration for this package itself.
 * @description Mirrors the formatting/lint settings produced by this package's
 *   own `createConfig`, but restricted to only the ESLint core, official
 *   `@eslint/*` plugins (JS, JSON, Markdown), and the `@stylistic/eslint-plugin`.
 *   The third-party plugins shipped by this package (jsdoc, perfectionist,
 *   unicorn, yml, wrap, keep-a-changelog) are intentionally NOT applied to
 *   this repository's own source.
 */

import json from "@eslint/json";
import eslint from "@eslint/js";
import markdown from "@eslint/markdown";
import stylistic from "@stylistic/eslint-plugin";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

const tsconfigRootDir = import.meta.dirname;

const stylisticBase = stylistic.configs.customize({
  arrowParens: true,
  blockSpacing: true,
  braceStyle: "1tbs",
  commaDangle: "always-multiline",
  indent: 2,
  jsx: false,
  quotes: "double",
  semi: true,
});

export default defineConfig([
  // ── Global ignores ────────────────────────────────────────────────────
  {
    ignores: [
      "dist/",
      "node_modules/",
      ".pnpm-store/",
      "coverage/",
      "pnpm-lock.yaml",
    ],
  },

  // ── Base JS recommended rules (JS/TS files only) ──────────────────────
  { files: ["**/*.{js,mjs,cjs,ts,tsx,mts,cts}"], ...eslint.configs.recommended },

  // ── TypeScript strict + stylistic (type-checked) ──────────────────────
  ...tseslint.configs.strictTypeChecked.map((c) => ({
    files: ["**/*.{ts,tsx,mts,cts}"],
    ...c,
  })),
  ...tseslint.configs.stylisticTypeChecked.map((c) => ({
    files: ["**/*.{ts,tsx,mts,cts}"],
    ...c,
  })),

  // ── Type-aware parser config ──────────────────────────────────────────
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.js"],
        },
        tsconfigRootDir,
      },
    },
  },

  // ── Disable type-checked rules on non-TypeScript files ─────────────────
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs", "**/*.md", "**/*.json", "**/*.jsonc", "**/*.json5", "**/*.yml", "**/*.yaml"],
    ...tseslint.configs.disableTypeChecked,
  },

  // ── Project-wide ESLint core / typescript-eslint rule overrides ───────
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/consistent-indexed-object-style": "error",
      "@typescript-eslint/no-confusing-void-expression": ["error", { ignoreArrowShorthand: true }],
      "@typescript-eslint/no-deprecated": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: true }],
      "@typescript-eslint/no-redundant-type-constituents": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/prefer-literal-enum-member": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/require-array-sort-compare": "error",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowBoolean: true, allowNumber: true },
      ],
      "@typescript-eslint/return-await": ["error", "in-try-catch"],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/unbound-method": ["error", { ignoreStatic: true }],
      curly: ["error", "all"],
      eqeqeq: ["error", "always"],
      "no-console": "warn",
      "no-eval": "error",
      "no-implied-eval": "off",
      "no-return-await": "off",
      "no-throw-literal": "off",
      "no-useless-escape": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", next: "*", prev: ["const", "let", "var"] },
        { blankLine: "any", next: ["const", "let", "var"], prev: ["const", "let", "var"] },
        { blankLine: "any", next: ["const", "let", "var"], prev: ["block", "case", "default"] },
        { blankLine: "always", next: ["const", "let", "var"], prev: "*" },
        { blankLine: "any", next: ["const", "let", "var"], prev: ["const", "let", "var"] },
      ],
      "prefer-arrow-callback": "error",
      "prefer-const": "error",
      "prefer-template": "error",
    },
  },

  // ── Test file relaxations ─────────────────────────────────────────────
  {
    files: ["test/**/*.ts", "tests/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/unbound-method": "off",
      "no-console": "off",
    },
  },

  // ── Stylistic formatting (JS/TS files only) ───────────────────────────
  { files: ["**/*.{js,mjs,cjs,ts,tsx,mts,cts}"], ...stylisticBase },
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx,mts,cts}"],
    rules: {
      "@stylistic/array-bracket-spacing": ["error", "never"],
      "@stylistic/array-element-newline": "off",
      "@stylistic/comma-dangle": [
        "error",
        {
          arrays: "always-multiline",
          enums: "always-multiline",
          exports: "always-multiline",
          functions: "always-multiline",
          generics: "always-multiline",
          imports: "always-multiline",
          objects: "always-multiline",
          tuples: "always-multiline",
        },
      ],
      "@stylistic/comma-spacing": ["error", { after: true, before: false }],
      "@stylistic/computed-property-spacing": [
        "error",
        "never",
        { enforceForClassMembers: true },
      ],
      "@stylistic/function-call-spacing": ["error", "never"],
      "@stylistic/function-paren-newline": ["error", "multiline-arguments"],
      "@stylistic/key-spacing": ["error", { afterColon: true, beforeColon: false }],
      "@stylistic/keyword-spacing": ["error", { after: true, before: true, overrides: {} }],
      "@stylistic/linebreak-style": ["error", "unix"],
      "@stylistic/lines-between-class-members": [
        "error",
        "always",
        { exceptAfterSingleLine: false },
      ],
      "@stylistic/max-len": [
        "error",
        {
          code: 100, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreUrls: true,
        },
      ],
      "@stylistic/member-delimiter-style": [
        "error",
        {
          multiline: { delimiter: "semi", requireLast: true },
          singleline: { delimiter: "semi", requireLast: false },
        },
      ],
      "@stylistic/no-mixed-spaces-and-tabs": "error",
      "@stylistic/no-multi-spaces": ["error", { ignoreEOLComments: false }],
      "@stylistic/no-multiple-empty-lines": ["error", { max: 1, maxBOF: 0, maxEOF: 0 }],
      "@stylistic/no-tabs": "error",
      "@stylistic/no-trailing-spaces": [
        "error",
        { ignoreComments: false, skipBlankLines: false },
      ],
      "@stylistic/object-curly-newline": [
        "error",
        {
          ExportDeclaration: { consistent: true, minProperties: 4, multiline: true },
          ImportDeclaration: { consistent: true, minProperties: 4, multiline: true },
          ObjectExpression: { consistent: true, minProperties: 4, multiline: true },
          ObjectPattern: { consistent: true, minProperties: 4, multiline: true },
        },
      ],
      "@stylistic/object-curly-spacing": ["error", "always"],
      "@stylistic/object-property-newline": ["error", { allowAllPropertiesOnSameLine: true }],
      "@stylistic/operator-linebreak": ["error", "before", { overrides: { "=": "none" } }],
      "@stylistic/padded-blocks": [
        "error",
        { blocks: "never", classes: "never", switches: "never" },
        { allowSingleLineBlocks: true },
      ],
      "@stylistic/quote-props": [
        "error",
        "as-needed",
        { keywords: false, numbers: false, unnecessary: true },
      ],
      "@stylistic/semi-spacing": ["error", { after: true, before: false }],
      "@stylistic/semi-style": ["error", "last"],
      "@stylistic/space-before-blocks": "error",
      "@stylistic/space-before-function-paren": [
        "error",
        { anonymous: "always", asyncArrow: "always", named: "never" },
      ],
      "@stylistic/space-in-parens": ["error", "never"],
      "@stylistic/spaced-comment": [
        "error",
        "always",
        {
          block: { balanced: true, exceptions: ["-", "+"], markers: ["=", "!", ":", "::"] },
          line: { exceptions: ["-", "+"], markers: ["=", "!", "/"] },
        },
      ],
      "@stylistic/switch-colon-spacing": ["error", { after: true, before: false }],
      "@stylistic/template-curly-spacing": ["error", "never"],
      "@stylistic/type-annotation-spacing": ["error", { after: true, before: false }],
    },
  },

  // ── Markdown linting (official @eslint/markdown language plugin) ──────
  ...markdown.configs.recommended.map((c) => ({
    ...c,
    files: ["**/*.md"],
  })),

  // ── JSON linting (official @eslint/json language plugin) ──────────────
  {
    files: ["**/*.json"],
    ignores: ["package-lock.json", "pnpm-lock.yaml"],
    language: "json/json",
    plugins: { json },
    rules: {
      "json/no-duplicate-keys": "error",
      "json/no-empty-keys": "error",
      "json/no-unnormalized-keys": "error",
      "json/no-unsafe-values": "error",
      "json/top-level-interop": "error",
    },
  },
  {
    files: ["**/*.jsonc", "**/tsconfig*.json", "**/.vscode/*.json"],
    language: "json/jsonc",
    plugins: { json },
    rules: {
      "json/no-duplicate-keys": "error",
      "json/no-empty-keys": "error",
    },
  },
  {
    files: ["**/*.json5"],
    language: "json/json5",
    plugins: { json },
    rules: {
      "json/no-duplicate-keys": "error",
      "json/no-empty-keys": "error",
    },
  },
]);
