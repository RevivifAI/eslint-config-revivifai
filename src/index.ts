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
import wrap from "@seahax/eslint-plugin-wrap";
import stylistic from "@stylistic/eslint-plugin";
import jsdoc from "eslint-plugin-jsdoc";
import markdownlint from "eslint-plugin-markdownlint";
import markdownlintParser from "eslint-plugin-markdownlint/parser.js";
import perfectionist from "eslint-plugin-perfectionist";
import unicorn from "eslint-plugin-unicorn";
import yml from "eslint-plugin-yml";
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
   * Whether to enable Stylistic formatting rules.
   * @default true
   */
  stylistic?: boolean;

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
    stylistic: enableStylistic = true,
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
        "pnpm-lock.yaml",
        "README.md",
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
          extraFileExtensions: [".yaml"],
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
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        { ignoreArrowShorthand: true },
      ],
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

  // ── YAML linting ───────────────────────────────────────────────────
  configs.push({
    files: ["**/*.yml", "**/*.yaml"],
    plugins: { yml },
    rules: {
      "yml/block-mapping": "error",
      "yml/block-sequence": "error",
      "yml/flow-mapping-curly-spacing": "error",
      "yml/flow-sequence-bracket-spacing": "error",
      // Core YAML rules
      "yml/indent": ["error", 2],
      "yml/key-spacing": "error",
      "yml/no-empty-document": "error",
      "yml/no-empty-key": "error",
      "yml/no-empty-mapping-value": "error",
      "yml/no-empty-sequence-entry": "error",
      "yml/no-irregular-whitespace": "error",
      "yml/no-multiple-empty-lines": "error",
      "yml/no-tab-indent": "error",
      "yml/quotes": ["error", { avoidEscape: true, prefer: "double" }],
      "yml/require-string-key": "error",
      "yml/sort-keys": "error",
      "yml/spaced-comment": "error",
    },
  } as Linter.Config);

  // ── Markdown linting ───────────────────────────────────────────────
  // Uses eslint-plugin-markdownlint with its custom parser.
  // Must be isolated from type-aware TS configs since Markdown is not TypeScript.
  configs.push({
    files: ["**/*.md"],
    languageOptions: {
      parser: markdownlintParser,
    },
    plugins: { markdownlint },
    rules: {
      ...markdownlint.configs.recommended.rules,
    },
  });

  // ── Stylistic formatting ───────────────────────────────────────────
  if (enableStylistic) {
    const stylisticConfig = stylistic.configs.customize({
      arrowParens: true,
      blockSpacing: true,
      braceStyle: "1tbs",
      commaDangle: "always-multiline",
      indent: 2,
      jsx: false,
      quotes: "double",
      semi: true,
    });

    configs.push(
      stylisticConfig,
      {
        rules: {
          // ── Array & object spacing ────────────────────────────────────────
          "@stylistic/array-bracket-spacing": ["error", "never"],
          "@stylistic/array-element-newline": "off",
          // ── Comma & delimiter styling ──────────────────────────────────
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
          // ── Function spacing ───────────────────────────────────────────
          "@stylistic/function-call-spacing": ["error", "never"],
          "@stylistic/function-paren-newline": ["error", "multiline-arguments"],
          // ── Keyword & key spacing ──────────────────────────────────────
          "@stylistic/key-spacing": ["error", { afterColon: true, beforeColon: false }],
          "@stylistic/keyword-spacing": ["error", { after: true, before: true, overrides: {} }],
          // ── Line & whitespace formatting ────────────────────────────────
          "@stylistic/linebreak-style": ["error", "unix"],
          // ── Padding & blocks ────────────────────────────────────────────
          "@stylistic/lines-between-class-members": [
            "error",
            "always",
            { exceptAfterSingleLine: false },
          ],
          "@stylistic/max-len": [
            "error",
            {
              code: 100,
              ignoreStrings: true,
              ignoreTemplateLiterals: true,
              ignoreUrls: true,
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
          // ── Quotes & props ──────────────────────────────────────────────
          "@stylistic/quote-props": [
            "error",
            "as-needed",
            { keywords: false, numbers: false, unnecessary: true },
          ],
          // ── Semicolons & parentheses ────────────────────────────────────
          "@stylistic/semi-spacing": ["error", { after: true, before: false }],
          "@stylistic/semi-style": ["error", "last"],
          "@stylistic/space-before-blocks": "error",
          "@stylistic/space-before-function-paren": [
            "error",
            { anonymous: "always", asyncArrow: "always", named: "never" },
          ],
          "@stylistic/space-in-parens": ["error", "never"],
          // ── Comments & template ─────────────────────────────────────────
          "@stylistic/spaced-comment": [
            "error",
            "always",
            {
              block: { balanced: true, exceptions: ["-", "+"], markers: ["=", "!", ":", "::"] },
              line: { exceptions: ["-", "+"], markers: ["=", "!", "/"] },
            },
          ],
          // ── Switch statements ───────────────────────────────────────────
          "@stylistic/switch-colon-spacing": ["error", { after: true, before: false }],
          "@stylistic/template-curly-spacing": ["error", "never"],
          // ── TypeScript-specific ─────────────────────────────────────────
          "@stylistic/type-annotation-spacing": ["error", { after: true, before: false }],
        },
      },
      wrap.config({ maxLen: 100 }),
    );
  }

  return configs;
}

export default createConfig;
