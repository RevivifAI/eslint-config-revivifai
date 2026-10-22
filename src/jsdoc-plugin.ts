/**
 * @file JSDoc plugin override for RevivifAI ESLint config.
 * @description Wraps eslint-plugin-jsdoc to allow complete sentences ending
 *   with `;` or `:` in descriptions. The upstream rule hardcodes `[.?!]` as
 *   sentence terminators, which flags valid colon/semicolon endings.
 * @module @revivifai/eslint-config/jsdoc-plugin
 */

// @ts-check

import type { ESLint, Rule } from "eslint";

import jsdoc from "eslint-plugin-jsdoc";

interface ReportDescriptorWithMessage {
  loc?: {
    start: {
      line: number;
    };
  };
  message?: string;
  node?: unknown;
}

interface CommentNode {
  type: string;
  value?: string;
}

/**
 * Extracts the description text from a JSDoc comment's raw value.
 * Strips leading `*` and whitespace from each line and stops at the first tag.
 * @param commentValue - The raw comment value (text between `/**` and the closing marker).
 * @returns The description text, or an empty string if none.
 */
function extractDescription(commentValue: string): string {
  const lines = commentValue.split("\n");
  const descriptionLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.replace(/^\s*\*?\s?/u, "").trimEnd();

    if (trimmed.startsWith("@")) {
      break;
    }

    descriptionLines.push(trimmed);
  }

  return descriptionLines.join("\n").trim();
}

/**
 * Returns the last non-empty line of a text block.
 * @param text - The text to inspect.
 * @returns The last non-empty line, or `undefined` if none.
 */
function getLastNonEmptyLine(text: string): string | undefined {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);

  return lines[lines.length - 1];
}

const originalRule = jsdoc.rules?.["require-description-complete-sentence"];

if (!originalRule) {
  throw new Error("eslint-plugin-jsdoc is missing the require-description-complete-sentence rule");
}

const requireDescriptionCompleteSentence: Rule.RuleModule = {
  meta: originalRule.meta,
  create(context) {
    const proxiedContext = Object.create(context) as Rule.RuleContext;

    Object.defineProperty(proxiedContext, "report", {
      configurable: true,
      enumerable: true,
      value: (descriptor: Rule.ReportDescriptor) => {
        const descriptorWithMessage = descriptor as ReportDescriptorWithMessage;
        const node = descriptorWithMessage.node as CommentNode | undefined;

        if (
          descriptorWithMessage.message === "Sentences must end with a period."
          && node?.type === "Block"
          && typeof node.value === "string"
        ) {
          const description = extractDescription(node.value);
          const lastLine = getLastNonEmptyLine(description);

          if (lastLine && (lastLine.endsWith(";") || lastLine.endsWith(":"))) {
            return;
          }
        }

        context.report(descriptor);
      },
      writable: true,
    });

    return originalRule.create(proxiedContext);
  },
};

const jsdocPlugin: ESLint.Plugin = {
  ...jsdoc,
  rules: {
    ...jsdoc.rules,
    "require-description-complete-sentence": requireDescriptionCompleteSentence,
  },
};

export default jsdocPlugin;
