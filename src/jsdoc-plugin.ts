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
}

const originalRule = jsdoc.rules?.["require-description-complete-sentence"];

if (!originalRule) {
  throw new Error("eslint-plugin-jsdoc is missing the require-description-complete-sentence rule");
}

const requireDescriptionCompleteSentence: Rule.RuleModule = {
  meta: originalRule.meta,
  create(context) {
    const sourceCode = context.sourceCode;
    const proxiedContext = Object.create(context) as Rule.RuleContext;

    Object.defineProperty(proxiedContext, "report", {
      configurable: true,
      enumerable: true,
      value: (descriptor: Rule.ReportDescriptor) => {
        const descriptorWithMessage = descriptor as ReportDescriptorWithMessage;

        if (
          descriptorWithMessage.message === "Sentences must end with a period."
          && descriptorWithMessage.loc
        ) {
          const line = sourceCode.lines[descriptorWithMessage.loc.start.line - 1];

          if (line && (line.trimEnd().endsWith(";") || line.trimEnd().endsWith(":"))) {
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
