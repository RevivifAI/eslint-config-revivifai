/**
 * @file JSDoc plugin override for RevivifAI ESLint config.
 * @description Wraps eslint-plugin-jsdoc to allow complete sentences ending
 *   with `;` or `:` in descriptions. The upstream rule hardcodes `[.?!]` as
 *   sentence terminators, which flags valid colon/semicolon endings. The
 *   override inspects each description paragraph's final non-empty line so
 *   single-line and multi-line comments are handled consistently.
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
  messageId?: string;
  node?: unknown;
}

interface CommentNode {
  type: string;
  value?: string;
  loc?: {
    start: {
      line: number;
    };
    end: {
      line: number;
    };
  };
}

interface DescriptionParagraph {
  text: string;
  startLine: number;
  endLine: number;
}

const SENTENCE_END_PATTERN = /end\s+(?:with\s+)?(?:a\s+)?(?:period|full stop|punctuation)/iu;
const SENTENCE_END_ID_PATTERN = /period|full.?stop|endWith/iu;
const ACCEPTED_TERMINATOR_PATTERN = /[;:]\s*$/u;

/**
 * Extracts description paragraphs from a JSDoc comment's raw value.
 * Strips leading `*` and whitespace from each line and stops at the first tag.
 * @param commentValue - The raw comment value (text between `/**` and the closing marker).
 * @param commentStartLine - The source line where the comment starts.
 * @returns Description paragraphs with their source line ranges.
 */
function extractDescriptionParagraphs(
  commentValue: string,
  commentStartLine: number,
): DescriptionParagraph[] {
  const paragraphs: DescriptionParagraph[] = [];
  let currentLines: string[] = [];
  let paragraphStartLine = 0;
  let paragraphEndLine = 0;

  const flushParagraph = (): void => {
    if (currentLines.length === 0) {
      return;
    }

    paragraphs.push({
      endLine: paragraphEndLine,
      startLine: paragraphStartLine,
      text: currentLines.join("\n"),
    });
    currentLines = [];
  };

  for (const [index, rawLine] of commentValue.split("\n").entries()) {
    const line = rawLine.replace(/^\s*\*?\s?/u, "").trimEnd();
    const sourceLine = commentStartLine + index;

    if (line.length === 0) {
      flushParagraph();
      continue;
    }

    if (line.trimStart().startsWith("@")) {
      flushParagraph();
      paragraphStartLine = sourceLine;
      currentLines = [line];
      paragraphEndLine = sourceLine;
      continue;
    }

    if (currentLines.length === 0) {
      paragraphStartLine = sourceLine;
    }

    currentLines.push(line);
    paragraphEndLine = sourceLine;
  }

  flushParagraph();

  return paragraphs;
}

/**
 * Finds the paragraph targeted by a report location.
 * @param paragraphs - Description paragraphs extracted from the comment.
 * @param reportedLine - The source line reported by ESLint, if known.
 * @param isSingleLine - Whether the comment occupies a single source line.
 * @returns The matching paragraph, or `undefined` if none can be identified.
 */
function findReportedParagraph(
  paragraphs: DescriptionParagraph[],
  reportedLine: number | undefined,
  isSingleLine: boolean,
): DescriptionParagraph | undefined {
  if (paragraphs.length === 0) {
    return undefined;
  }

  if (paragraphs.length === 1) {
    const [onlyParagraph] = paragraphs;

    if (isSingleLine || reportedLine === undefined) {
      return onlyParagraph;
    }

    if (reportedLine >= onlyParagraph.startLine && reportedLine <= onlyParagraph.endLine) {
      return onlyParagraph;
    }

    return undefined;
  }

  if (reportedLine === undefined) {
    return undefined;
  }

  const exactMatch = paragraphs.find((paragraph) => paragraph.startLine === reportedLine);

  if (exactMatch) {
    return exactMatch;
  }

  const containingMatch = paragraphs.find(
    (paragraph) => reportedLine >= paragraph.startLine && reportedLine <= paragraph.endLine,
  );

  if (containingMatch) {
    return containingMatch;
  }

  const nextMatch = paragraphs.find((paragraph) => paragraph.startLine > reportedLine);

  if (nextMatch) {
    return nextMatch;
  }

  const precedingParagraphs = paragraphs.filter((paragraph) => paragraph.endLine < reportedLine);

  return precedingParagraphs[precedingParagraphs.length - 1];
}

/**
 * Returns whether a paragraph's final non-empty line ends with an accepted terminator.
 * @param paragraph - The paragraph to inspect.
 * @returns `true` when the final line ends with `;` or `:`.
 */
function endsWithAcceptedTerminator(paragraph: DescriptionParagraph): boolean {
  const lines = paragraph.text.split("\n").filter((line) => line.trim().length > 0);
  const lastLine = lines.at(-1);

  return lastLine !== undefined && ACCEPTED_TERMINATOR_PATTERN.test(lastLine);
}

/**
 * Returns whether a report targets the sentence-ending period check.
 * @param message - The reported message text.
 * @param messageId - The reported message identifier, when available.
 * @returns `true` when the report is for a missing sentence-ending terminator.
 */
function isSentenceEndReport(message: string | undefined, messageId: string | undefined): boolean {
  if (message !== undefined && SENTENCE_END_PATTERN.test(message)) {
    return true;
  }

  return messageId !== undefined && SENTENCE_END_ID_PATTERN.test(messageId);
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
          !isSentenceEndReport(descriptorWithMessage.message, descriptorWithMessage.messageId)
          || node?.type !== "Block"
          || typeof node.value !== "string"
          || !node.loc
        ) {
          context.report(descriptor);
          return;
        }

        const commentStartLine = node.loc.start.line;
        const isSingleLine = node.loc.start.line === node.loc.end.line;
        const reportedLine = descriptorWithMessage.loc?.start.line;
        const paragraphs = extractDescriptionParagraphs(node.value, commentStartLine);
        const paragraph = findReportedParagraph(paragraphs, reportedLine, isSingleLine);

        // Suppress only when the offending description paragraph itself ends
        // with `;` or `:`. Checking the reported line's raw source text is
        // unreliable because ESLint may point at the opening line, a tag line,
        // or one line past the paragraph depending on the comment shape.
        if (paragraph && endsWithAcceptedTerminator(paragraph)) {
          return;
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
