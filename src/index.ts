/**
 * @file RevivifAI ESLint configuration for TypeScript projects.
 * @description Provides a comprehensive, modern ESLint flat config for TypeScript
 *   projects with strict type checking, JSDoc enforcement, import sorting, and
 *   Prettier compatibility.
 * @module @revivifai/eslint-config
 */

// @ts-check

import type { Linter } from "eslint";

import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import jsdoc from "eslint-plugin-jsdoc";
import perfectionist from "eslint-plugin-perfectionist";
import unicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";

/**
 * Options for configuring the RevivifAI ESLint config.
 */
export interface RevivifaiEslintOptions {
  /**
   * Additional ignore patterns.
   */
  ignores?: string[];

  /**
   * Whether to enable JSDoc enforcement rules.
   * @default true
   */
  jsdoc?: boolean;

  /**
   * Whether to enable Perfectionist import/member sorting.
   * @default true
   */
  perfectionist?: boolean;

  /**
   * Root directory for the project. Used for tsconfig resolution.
   * @default process.cwd()
   */
  tsconfigRootDir?: string;

  /**
   * Files to include for type-checked linting.
   * @default ["**\/*.ts", "**\/*.tsx"]
   */
  typeCheckingFiles?: string[];

  /**
   * Whether to enable Unicorn rules.
   * @default true
   */
  unicorn?: boolean;
}

/**
 * Creates the RevivifAI ESLint flat config array.
 *
 * @param options - Configuration options.
 * @returns ESLint flat config array.
 * @example
 * ```typescript
 * // eslint.config.js
 * import { createConfig } from "@revivifai/eslint-config";
 *
 * export default createConfig({
 *   tsconfigRootDir: import.meta.dirname,
 * });
 * ```
 */
export function createConfig(options: RevivifaiEslintOptions = {}): Linter.Config[] {
  const {
    ignores = [],
    jsdoc: enableJsdoc = true,
    perfectionist: enablePerfectionist = true,
    tsconfigRootDir = process.cwd(),
    typeCheckingFiles = ["**/*.ts", "**/*.tsx"],
    unicorn: enableUnicorn = true,
  } = options;

  const configs: Linter.Config[] = [
    // ── Global ignores ──────────────────────────────────────────────────
    {
      ignores: [
        "dist/",
        "node_modules/",
        ".pnpm-store/",
        "coverage/",
        "*.js",
        "**/*.mjs",
        ...ignores,
      ],
    },

    // ── Base JS recommended rules ───────────────────────────────────────
    eslint.configs.recommended,

    // ── TypeScript strict + stylistic ───────────────────────────────────
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,

    // ── Type-aware linting config ───────────────────────────────────────
    {
      languageOptions: {
        parserOptions: {
          projectService: {
            allowDefaultProject: ["vitest.config.ts", "vite.config.ts", "eslint.config.js"],
          },
          tsconfigRootDir,
        },
      },
    },
  ];

  // ── Import / member sorting (perfectionist) ─────────────────────────
  if (enablePerfectionist) {
    configs.push(perfectionist.configs["recommended-natural"]);
  }

  // ── JSDoc linting ───────────────────────────────────────────────────
  if (enableJsdoc) {
    configs.push({
      files: typeCheckingFiles,
      plugins: { jsdoc },
      rules: {
        "jsdoc/check-access": "error",
        "jsdoc/check-alignment": "error",
        "jsdoc/check-line-alignment": "error",
        "jsdoc/check-param-names": "error",
        "jsdoc/check-property-names": "error",
        "jsdoc/check-tag-names": "error",
        "jsdoc/check-types": "error",
        "jsdoc/check-values": "error",
        "jsdoc/empty-tags": "error",
        "jsdoc/implements-on-classes": "error",
        "jsdoc/multiline-blocks": "error",
        "jsdoc/no-bad-blocks": "error",
        "jsdoc/no-defaults": "off",
        "jsdoc/no-multi-asterisks": "error",
        "jsdoc/no-undefined-types": "error",
        "jsdoc/require-description": "error",
        "jsdoc/require-description-complete-sentence": "error",
        "jsdoc/require-example": "off",
        "jsdoc/require-file-overview": "off",
        "jsdoc/require-jsdoc": [
          "error",
          {
            publicOnly: true,
            require: {
              ClassDeclaration: true,
              FunctionDeclaration: true,
              MethodDefinition: true,
            },
          },
        ],
        "jsdoc/require-param": "error",
        "jsdoc/require-param-description": "off",
        "jsdoc/require-param-name": "error",
        "jsdoc/require-param-type": "off",
        "jsdoc/require-property": "error",
        "jsdoc/require-property-description": "off",
        "jsdoc/require-property-name": "error",
        "jsdoc/require-property-type": "off",
        "jsdoc/require-returns": "error",
        "jsdoc/require-returns-check": "error",
        "jsdoc/require-returns-description": "off",
        "jsdoc/require-returns-type": "off",
        "jsdoc/require-throws": "off",
        "jsdoc/require-yields": "error",
        "jsdoc/require-yields-check": "error",
        "jsdoc/tag-lines": "off",
        "jsdoc/valid-types": "error",
      },
    });
  }

  // ── Unicorn rules ──────────────────────────────────────────────────
  if (enableUnicorn) {
    configs.push({
      files: typeCheckingFiles,
      plugins: { unicorn },
      rules: {
        "unicorn/no-object-as-default-exception": "off",
        // Prefer String.startsWith/endsWith over regex or indexOf
        "unicorn/prefer-string-starts-ends-with": "error",
        // Prefer switch over multiple else-if with simple equality comparisons
        "unicorn/prefer-switch": [
          "error",
          {
            emptyDefaultCase: "no-default-comment",
            minimumCases: 3,
          },
        ],
      },
    });
  }

  // ── Project-specific overrides ──────────────────────────────────────
  configs.push({
    rules: {
      "@typescript-eslint/consistent-indexed-object-style": "error",
      "@typescript-eslint/no-confusing-void-expression": ["error", { ignoreArrowShorthand: true }],
      // ── Deprecated API usage ────────────────────────────────────────
      "@typescript-eslint/no-deprecated": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: true }],
      "@typescript-eslint/no-redundant-type-constituents": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      // ── TypeScript strictness tuning ────────────────────────────────
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/prefer-literal-enum-member": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      // ── Correctness ───────────────────────────────────────────────────
      "@typescript-eslint/require-array-sort-compare": "error",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowBoolean: true,
          allowNumber: true,
        },
      ],
      "@typescript-eslint/return-await": ["error", "in-try-catch"],
      // ── Type safety ──────────────────────────────────────────────────
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/unbound-method": ["error", { ignoreStatic: true }],
      curly: ["error", "all"],
      eqeqeq: ["error", "always"],
      // ── General best practices ──────────────────────────────────────
      "no-console": "warn",
      "no-eval": "error",
      "no-implied-eval": "off", // covered by @typescript-eslint
      "no-return-await": "off", // covered by @typescript-eslint
      "no-throw-literal": "off", // covered by @typescript-eslint
      "no-useless-escape": "error",
      "no-var": "error",
      "object-shorthand": "error",
      // ── Whitespace around variable declarations ───────────────────────────
      // Require blank line after variable declarations, except:
      // - When followed by another variable declaration (keep grouped)
      // - At the start of a block (no leading blank line needed)
      // Also require blank line before variable declarations after non-variable
      // statements (e.g., after return, if, throw, etc.)
      "padding-line-between-statements": [
        "error",
        // Require blank line after variable declarations before non-variable statements
        { blankLine: "always", next: "*", prev: ["const", "let", "var"] },
        // Allow no blank line between consecutive variable declarations
        { blankLine: "any", next: ["const", "let", "var"], prev: ["const", "let", "var"] },
        // No blank line at start of block (after curly brace)
        { blankLine: "any", next: ["const", "let", "var"], prev: ["block", "case", "default"] },
        // Require blank line before variable declarations after non-variable statements
        { blankLine: "always", next: ["const", "let", "var"], prev: "*" },
        // Override: allow no blank line between consecutive variable declarations (both directions)
        { blankLine: "any", next: ["const", "let", "var"], prev: ["const", "let", "var"] },
      ],
      "prefer-arrow-callback": "error",
      "prefer-const": "error",
      "prefer-template": "error",
    },
  });

  // ── Test file overrides — relax strict rules that conflict with mocking ──
  configs.push({
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
  });

  // ── Disable formatting rules (let Prettier handle it) ──────────────
  configs.push(eslintConfigPrettier);

  return configs;
}

export default createConfig;
