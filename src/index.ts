/**
 * @file RevivifAI ESLint configuration for TypeScript projects.
 * @description Provides a comprehensive, modern ESLint flat config for TypeScript
 *   projects with strict type checking, JSDoc enforcement, import sorting, and
 *   Prettier compatibility.
 * @module @revivifai/eslint-config
 */

// @ts-check

import type { Linter, Rule } from "eslint";

import eslint from "@eslint/js";
import markdown from "@eslint/markdown";
import wrap from "@seahax/eslint-plugin-wrap";
import stylistic from "@stylistic/eslint-plugin";
import jsdoc from "eslint-plugin-jsdoc";
import perfectionist from "eslint-plugin-perfectionist";
import unicorn from "eslint-plugin-unicorn";
import yml from "eslint-plugin-yml";
import tseslint from "typescript-eslint";

// ────────────────────────────────────────────────────────────────────────
// Keep A Changelog Plugin (v1.1.0 specification)
// https://keepachangelog.com/en/1.1.0/
// ────────────────────────────────────────────────────────────────────────

/**
 * Get the source text from the ESLint context.
 * ESLint 10+ provides sourceCode.text directly.
 * @param context - The ESLint rule context.
 * @returns The source text of the file being linted.
 */
function getSourceText(context: Rule.RuleContext): string {
  const sourceCode = context.sourceCode as { text?: string };

  if (typeof sourceCode.text === "string") {
    return sourceCode.text;
  }

  return context.sourceCode.getText();
}

/**
 * Keep A Changelog ESLint plugin implementing v1.1.0 specification.
 */
const keepAChangelogPlugin = {
  meta: {
    name: "keep-a-changelog",
    version: "1.0.0",
  },
  rules: {
    /**
     * Rule: no-empty-sections
     * Per KAC v1.1.0: Changelogs should be consistently updated.
     */
    "no-empty-sections": {
      create(context: Rule.RuleContext) {
        return {
          Document() {
            const text = getSourceText(context);
            const lines = text.split("\n");
            const categories = ["Added", "Changed", "Deprecated", "Removed", "Fixed", "Security"];

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const categoryMatch = new RegExp(`^###\\s+(${categories.join("|")})\\s*$`).exec(line);

              if (categoryMatch) {
                let hasNextContent = false;

                for (let j = i + 1; j < lines.length; j++) {
                  const nextLine = lines[j];

                  if (nextLine.trim() === "") {
                    continue;
                  }
                  if (nextLine.startsWith("- ") || nextLine.startsWith("* ")) {
                    hasNextContent = true;
                    break;
                  }
                  if (nextLine.startsWith("#")) {
                    break;
                  }
                }

                if (!hasNextContent) {
                  context.report({
                    loc: { column: 0, line: i + 1 },
                    message: `Empty category "${categoryMatch[1]}" should have at least one change item or be removed`,
                  });
                }
              }
            }
          },
        };
      },
      meta: {
        docs: {
          description: "Disallow empty change categories",
          recommended: true,
        },
        type: "problem" as const,
      },
    },

    /**
     * Rule: require-change-categories
     * Ensures changes are organized by standard categories per KAC v1.1.0.
     * Valid categories: Added, Changed, Deprecated, Removed, Fixed, Security.
     */
    "require-change-categories": {
      create(context: Rule.RuleContext) {
        return {
          Document() {
            const text = getSourceText(context);
            // Regex for changelog headings: categories, versions, dates
            // Matches: ## Added, ## Changed, ## 1.0.0, ## 2024-01-15, etc.
            // eslint-disable-next-line @stylistic/max-len
            const headingRegex = /^#{1,2}\s+(Added|Changed|Deprecated|Removed|Fixed|Security|Unreleased|\d+\.\d+\.\d+|\d{4}-\d{2}-\d{2})/gmu;
            const headings = text.match(headingRegex) ?? [];
            const validCategories = [
              "Added",
              "Changed",
              "Deprecated",
              "Removed",
              "Fixed",
              "Security",
            ];
            let hasValidCategory = false;

            for (const heading of headings) {
              for (const category of validCategories) {
                if (heading.includes(category)) {
                  hasValidCategory = true;
                  break;
                }
              }
            }

            if (!hasValidCategory && headings.length > 1) {
              context.report({
                loc: { column: 0, line: 1 },
                message: "Changelog should use standard categories: Added, Changed, Deprecated, Removed, Fixed, Security",
              });
            }
          },
        };
      },
      meta: {
        docs: {
          description: "Require changes to be organized by Keep A Changelog v1.1.0 categories",
          recommended: true,
        },
        type: "problem" as const,
      },
    },

    /**
     * Rule: require-change-item-format
     * Per KAC v1.1.0: Changelogs are for humans - use imperative mood.
     */
    "require-change-item-format": {
      create(context: Rule.RuleContext) {
        const imperativeVerbs = [
          "add", "allow", "build", "bump", "change", "create", "deprecate",
          "drop", "enable", "expose", "extend", "fix", "improve", "implement",
          "increase", "introduce", "make", "merge", "move", "prevent",
          "remove", "rename", "replace", "require", "resolve", "restore",
          "revert", "show", "simplify", "support", "switch", "turn", "update",
          "upgrade", "use",
        ];

        return {
          Document() {
            const text = getSourceText(context);
            const lines = text.split("\n");

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const listItemMatch = /^[\s]*[-*]\s+(.+)/.exec(line);

              if (listItemMatch) {
                const itemText = listItemMatch[1].toLowerCase();
                const firstWord = itemText.split(/\s+/)[0];

                if (!imperativeVerbs.includes(
                  firstWord,
                ) && !firstWord.startsWith("[") && !firstWord.startsWith("{")) {
                  context.report({
                    loc: { column: 0, line: i + 1 },
                    message: `Change item should start with an imperative verb (e.g., "Add", "Fix", "Update"). Found: "${firstWord}"`,
                  });
                }
              }
            }
          },
        };
      },
      meta: {
        docs: {
          description: "Require change items to use imperative mood per Keep A Changelog v1.1.0",
          recommended: true,
        },
        type: "suggestion" as const,
      },
    },

    /**
     * Rule: require-date-format
     * Per KAC v1.1.0: Dates should use ISO format (YYYY-MM-DD).
     */
    "require-date-format": {
      create(context: Rule.RuleContext) {
        return {
          Document() {
            const text = getSourceText(context);
            const lines = text.split("\n");

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              // Match version lines like "## [1.0.0] - 2024-01-15" or "## 1.0.0 (2024-01-15)"
              // eslint-disable-next-line @stylistic/max-len
              const versionDateMatch = /^##\s+(?:\[)?(\d+\.\d+\.\d+)(?:\])?[\s-()]+(\d{4}-\d{2}-\d{2})/.exec(
                line,
              );

              if (versionDateMatch) {
                const dateStr = versionDateMatch[2];
                const dateParts = dateStr.split("-").map(Number);
                const month = dateParts[1];
                const day = dateParts[2];

                if (month < 1 || month > 12 || day < 1 || day > 31) {
                  context.report({
                    loc: { column: 0, line: i + 1 },
                    message: `Invalid date format: ${dateStr}. Use YYYY-MM-DD format per Keep A Changelog v1.1.0.`,
                  });
                }
              }
            }
          },
        };
      },
      meta: {
        docs: {
          description: "Require ISO date format (YYYY-MM-DD) for version headers",
          recommended: true,
        },
        type: "problem" as const,
      },
    },

    /**
     * Rule: require-linkable-versions
     * Per KAC v1.1.0: Versions and sections should be linkable.
     */
    "require-linkable-versions": {
      create(context: Rule.RuleContext) {
        return {
          Document() {
            const text = getSourceText(context);
            const lines = text.split("\n");

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              // Check for version headers without link format
              const unlinkedVersionMatch = /^##\s+(\d+\.\d+\.\d+)\s*[-(]/.exec(line);

              if (unlinkedVersionMatch) {
                context.report({
                  loc: { column: 0, line: i + 1 },
                  message: `Consider using linkable version format "[${unlinkedVersionMatch[1]}]" instead of plain "${unlinkedVersionMatch[1]}"`,
                });
              }
            }
          },
        };
      },
      meta: {
        docs: {
          description: "Suggest using linkable version references (e.g., [1.0.0])",
          recommended: false,
        },
        type: "suggestion" as const,
      },
    },

    /**
     * Rule: require-semantic-versioning-order
     * Per KAC v1.1.0: The latest version comes first (reverse chronological order).
     */
    "require-semantic-versioning-order": {
      create(context: Rule.RuleContext) {
        return {
          Document() {
            const text = getSourceText(context);
            const lines = text.split("\n");
            const versionPattern = /^##\s+(?:\[)?(\d+)\.(\d+)\.(\d+)/;
            const versions: { line: number; major: number; minor: number; patch: number }[] = [];

            for (let i = 0; i < lines.length; i++) {
              const match = versionPattern.exec(lines[i]);

              if (match) {
                versions.push({
                  line: i + 1,
                  major: Number.parseInt(match[1], 10),
                  minor: Number.parseInt(match[2], 10),
                  patch: Number.parseInt(match[3], 10),
                });
              }
            }

            for (let i = 0; i < versions.length - 1; i++) {
              const current = versions[i];
              const next = versions[i + 1];
              const currentTotal = current.major * 1000000 + current.minor * 1000 + current.patch;
              const nextTotal = next.major * 1000000 + next.minor * 1000 + next.patch;

              if (currentTotal < nextTotal) {
                context.report({
                  loc: { column: 0, line: current.line },
                  message: `Version ${current.major}.${current.minor}.${current.patch} should come after ${next.major}.${next.minor}.${next.patch} (latest version first per Keep A Changelog v1.1.0)`,
                });
              }
            }
          },
        };
      },
      meta: {
        docs: {
          description: "Require versions to be listed in reverse chronological order (latest first)",
          recommended: true,
        },
        type: "suggestion" as const,
      },
    },

    /**
     * Rule: require-unreleased-section
     * Per KAC v1.1.0: Keep an Unreleased section at the top to track upcoming changes.
     */
    "require-unreleased-section": {
      create(context: Rule.RuleContext) {
        return {
          Document() {
            const text = getSourceText(context);
            // Check for Unreleased section and versions
            const hasUnreleased = /^\[?Unreleased\]?[\s-]*$/gm.test(text)
              || /^##\s+\[?Unreleased\]?\s*$/gm.test(text);
            const hasVersions = /^##\s+(?:\[)?\d+\.\d+\.\d+/gm.test(text);

            if (hasVersions && !hasUnreleased) {
              context.report({
                loc: { column: 0, line: 1 },
                message: "Add [Unreleased] section to track upcoming changes (per Keep A Changelog v1.1.0)",
              });
            }
          },
        };
      },
      meta: {
        docs: {
          description: "Suggest having an [Unreleased] section for tracking upcoming changes",
          recommended: false,
        },
        type: "suggestion" as const,
      },
    },
  },
};

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
    // ── Global ignores (non-JS/TS files are handled by dedicated configs below) ─
    {
      ignores: [
        "dist/",
        "node_modules/",
        ".pnpm-store/",
        "coverage/",
        "*.js",
        "**/*.mjs",
        "pnpm-lock.yaml",
        // YAML and Markdown are handled by dedicated configs below
        // These patterns are only for global ignores, not for file-type-specific linting
        ...ignores,
      ],
    },

    // ── Base JS recommended rules (JS/TS files only) ───────────────────
    {
      ...eslint.configs.recommended,
      files: ["**/*.js", "**/*.cjs", "**/*.mjs", "**/*.ts", "**/*.tsx"],
    },

    // ── TypeScript strict + stylistic (applied to TS files only) ───────
    ...tseslint.configs.strictTypeChecked.map((config) => ({
      ...config,
      files: ["**/*.ts", "**/*.tsx"],
    })),
    ...tseslint.configs.stylisticTypeChecked.map((config) => ({
      ...config,
      files: ["**/*.ts", "**/*.tsx"],
    })),

    // ── Type-aware linting config ───────────────────────────────────────
    {
      files: ["**/*.ts", "**/*.tsx"],
      languageOptions: {
        parserOptions: {
          projectService: {
            allowDefaultProject: ["vitest.config.ts", "vite.config.ts", "eslint.config.js", "pnpm-workspace.yaml"],
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
        "unicorn/prefer-string-starts-ends-with": "error",
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

  // ── Project-specific overrides (TS files only) ──────────────────────
  configs.push({
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
  });

  // ── Test file overrides ─────────────────────────────────────────────
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
  // Extend yml plugin's flat/standard config so YAML files are parsed with
  // the YAML parser instead of ESLint's default JavaScript parser.
  for (const config of yml.configs["flat/standard"]) {
    configs.push({
      ...config,
      files: ["**/*.yml", "**/*.yaml"],
    });
  }

  configs.push({
    files: ["**/*.yml", "**/*.yaml"],
    plugins: { yml },
    rules: {
      "yml/block-mapping": "error",
      "yml/block-sequence": "error",
      "yml/flow-mapping-curly-spacing": "error",
      "yml/flow-sequence-bracket-spacing": "error",
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
      // Disable TypeScript type-checked rules for YAML files
      "@typescript-eslint/await-thenable": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-deprecated": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/prefer-literal-enum-member": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-optional-chain": "off",
      "@typescript-eslint/require-array-sort-compare": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/return-await": "off",
      "@typescript-eslint/switch-exhaustiveness-check": "off",
      "@typescript-eslint/unbound-method": "off",
      // Disable stylistic rules for YAML - they don't apply to YAML syntax
      "@stylistic/spaced-comment": "off",
      "@stylistic/max-len": "off",
    },
  });

  // ── Markdown linting ───────────────────────────────────────────────
  // Uses @eslint/markdown (ESLint 10+ native language support).
  // Isolated from TypeScript type checking since Markdown is not TypeScript.
  for (const config of markdown.configs.recommended) {
    configs.push({
      ...config,
      files: ["**/*.md"],
    });
  }

  // ── Disable ALL TypeScript linting for Markdown files ──────────────
  // Markdown is not TypeScript, so every @typescript-eslint/* rule is turned
  // off. We collect every rule name from the typescript-eslint plugin and
  // disable each one for *.md files. Also disables core/perfectionist rules
  // that are incompatible with the @eslint/markdown SourceCode object.
  const tsPluginRules = (tseslint.plugin as { rules?: Record<string, unknown> }).rules ?? {};
  const disabledTypescriptRulesForMarkdown: Linter.RulesRecord = Object.fromEntries(
    Object.keys(tsPluginRules).map((ruleName) => [`@typescript-eslint/${ruleName}`, "off"]),
  );

  configs.push({
    files: ["**/*.md"],
    rules: {
      ...disabledTypescriptRulesForMarkdown,
      "no-irregular-whitespace": "off",
      "perfectionist/sort-imports": "off",
      "perfectionist/sort-modules": "off",
      "perfectionist/sort-objects": "off",
      "perfectionist/sort-enums": "off",
      "perfectionist/sort-interfaces": "off",
      "perfectionist/sort-classes": "off",
      "perfectionist/sort-named-exports": "off",
      "perfectionist/sort-named-imports": "off",
      "perfectionist/sort-exports": "off",
      "perfectionist/sort-decorators": "off",
    },
  });

  // ── Keep A Changelog format enforcement (v1.1.0) ─────────────────────
  // Rules for CHANGELOG.md and HISTORY.md files following keepachangelog.com
  configs.push({
    files: ["**/CHANGELOG.md", "**/HISTORY.md", "**/NEWS.md", "**/RELEASES.md"],
    plugins: {
      "keep-a-changelog": keepAChangelogPlugin,
    },
    rules: {
      // Disable markdown/no-missing-label-refs for changelogs
      // Keep A Changelog format uses version references like [2.0.0] that may
      // reference versions not yet defined at the bottom of the file
      "markdown/no-missing-label-refs": "off",
      "keep-a-changelog/no-empty-sections": "error",
      "keep-a-changelog/require-change-categories": "warn",
      "keep-a-changelog/require-change-item-format": "warn",
      "keep-a-changelog/require-date-format": "error",
      "keep-a-changelog/require-linkable-versions": "off",
      "keep-a-changelog/require-semantic-versioning-order": "warn",
      "keep-a-changelog/require-unreleased-section": "off",
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
          "@stylistic/array-bracket-spacing": ["error", "never"],
          "@stylistic/array-element-newline": "off",
          // Disallow single-line blocks (e.g. `if (x) { return; }`).
          // This prevents both manual authoring and auto-fixers from collapsing
          // multi-line block statements onto a single line. Combined with
          // `padded-blocks` (without `allowSingleLineBlocks`) below, every
          // block body must occupy its own line(s).
          "@stylistic/brace-style": ["error", "1tbs", { allowSingleLine: false }],
          // Statements following control keywords (if/else/for/while/do)
          // without braces must be on the next line. With `curly: ["error", "all"]`
          // braces are always required, but this rule additionally enforces that
          // a block opening brace's body never shares a line with the brace.
          "@stylistic/nonblock-statement-body-position": ["error", "below"],
          // Always require the body of an `if` (and other block-bearing
          // statements) to be on its own line, never collapsed to one line.
          "@stylistic/block-spacing": ["error", "always"],
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
          // Use "ignore" for arrow to let @stylistic/arrow-spacing handle the '=>' token spacing.
          // This avoids circular fix conflicts between type-annotation-spacing and arrow-spacing.
          "@stylistic/type-annotation-spacing": [
            "error",
            {
              after: true,
              before: false,
              overrides: {
                arrow: "ignore",
              },
            },
          ],
        },
      },
      wrap.config({ maxLen: 100 }),
    );
  }

  return configs;
}

export default createConfig;
