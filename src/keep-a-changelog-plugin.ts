/**
 * @file Keep A Changelog ESLint plugin implementing v1.1.0 specification.
 * @description Enforces changelog format per https://keepachangelog.com/en/1.1.0/
 * @module @revivifai/eslint-config/keep-a-changelog-plugin
 */

// @ts-check

import type { Rule } from "eslint";

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
export const keepAChangelogPlugin = {
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

    /**
     * Rule: no-duplicate-headings
     * Per KAC v1.1.0: Each category should appear at most once per version section.
     * Detects duplicate category headings like having two "Added" sections under "[Unreleased]".
     */
    "no-duplicate-headings": {
      create(context: Rule.RuleContext) {
        return {
          Document() {
            const text = getSourceText(context);
            const lines = text.split("\n");
            const validCategories = [
              "Added",
              "Changed",
              "Deprecated",
              "Removed",
              "Fixed",
              "Security",
            ];

            // Track categories seen per version section
            // Key = version string (e.g., "[Unreleased]", "1.0.0")
            // Value = Set of categories seen in that version
            const versionCategories = new Map<string, Set<string>>();
            let currentVersion: string | null = null;

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];

              // Check for version heading (## [Unreleased] or ## [1.0.0] or ## 1.0.0)
              const versionMatch = /^##\s+(?:\[)?([^\]\s]+)(?:\])?/.exec(line);

              if (versionMatch) {
                currentVersion = versionMatch[1];

                if (!versionCategories.has(currentVersion)) {
                  versionCategories.set(currentVersion, new Set());
                }
              }

              // Check for category heading (### Added, ### Changed, etc.)
              const categoryMatch = new RegExp(`^###\\s+(${validCategories.join("|")})\\s*$`).exec(line);

              if (categoryMatch && currentVersion !== null) {
                const category = categoryMatch[1];
                const seenInVersion = versionCategories.get(currentVersion);

                if (seenInVersion?.has(category)) {
                  context.report({
                    loc: { column: 0, line: i + 1 },
                    message: `Duplicate category "${category}" under version "${currentVersion}". Each category should appear at most once per version section.`,
                  });
                } else {
                  seenInVersion?.add(category);
                }
              }
            }
          },
        };
      },
      meta: {
        docs: {
          description: "Disallow duplicate category headings within the same version section",
          recommended: true,
        },
        type: "problem" as const,
      },
    },
  },
};
