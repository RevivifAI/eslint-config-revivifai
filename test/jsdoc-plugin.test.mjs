import assert from "node:assert/strict";
import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";

import { ESLint } from "eslint";

import { createConfig } from "../dist/index.js";

const repoRoot = path.resolve(import.meta.dirname, "..");
const fixturePath = path.join(repoRoot, "src", "__test-jsdoc-cases.ts");

const fixture = `/** CASE single-line-semicolon: sentence ending with a semicolon; */
export function singleLineSemicolon(): void {
  return;
}

/** CASE single-line-colon: sentence ending with a colon: */
export function singleLineColon(): void {
  return;
}

/**
 * CASE multi-line-semicolon: first line without a terminator
 * Continues and ends with a semicolon;
 */
export function multiLineSemicolon(): void {
  return;
}

/**
 * CASE multi-line-colon: first line without a terminator
 * Continues and ends with a colon:
 */
export function multiLineColon(): void {
  return;
}

/**
 * CASE multi-paragraph-colon: first paragraph ends with a colon:
 *
 * Second paragraph ends with a period.
 */
export function multiParagraphColon(): void {
  return;
}

/**
 * CASE multi-paragraph-missing: first paragraph ends with a period.
 *
 * Second paragraph has no terminator
 */
export function multiParagraphMissing(): void {
  return;
}

/**
 * CASE tag-colon: description ends with a period.
 * @param value - Tag description with a colon:
 */
export function tagColon(value: string): void {
  void value;
}

/**
 * CASE tag-semicolon: description ends with a period.
 * @param value - Tag description with a semicolon;
 */
export function tagSemicolon(value: string): void {
  void value;
}

/**
 * CASE tag-missing: description ends with a period.
 * @param value - Tag description without a terminator
 */
export function tagMissing(value: string): void {
  void value;
}

/** CASE trailing-space-colon: sentence ending with a colon and spaces:   */
export function trailingSpaceColon(): void {
  return;
}

/** CASE control-missing: no terminator */
export function controlMissing(): void {
  return;
}
`;

const fixtureLines = fixture.split("\n");

const expectedFailingCases = [
  "multi-paragraph-missing",
  "tag-missing",
  "control-missing",
];

const expectedPassingCases = [
  "single-line-semicolon",
  "single-line-colon",
  "multi-line-semicolon",
  "multi-line-colon",
  "multi-paragraph-colon",
  "tag-colon",
  "tag-semicolon",
  "trailing-space-colon",
];

const caseByCommentStartLine = new Map();

for (const [index, line] of fixtureLines.entries()) {
  if (!line.startsWith("/**")) {
    continue;
  }

  for (let cursor = index; cursor < fixtureLines.length; cursor += 1) {
    const candidate = fixtureLines[cursor];
    const match = /CASE ([a-z-]+):/u.exec(candidate);

    if (match) {
      caseByCommentStartLine.set(index + 1, match[1]);
      break;
    }

    if (candidate.includes("*/")) {
      break;
    }
  }
}

const findCaseForReportedLine = (lineNumber) => {
  for (let index = Math.min(lineNumber, fixtureLines.length) - 1; index >= 0; index -= 1) {
    if (!fixtureLines[index].startsWith("/**")) {
      continue;
    }

    const caseId = caseByCommentStartLine.get(index + 1);

    if (caseId) {
      return caseId;
    }
  }

  return undefined;
};

const failingCases = [];
const passingCases = [];

await writeFile(fixturePath, fixture, "utf8");

try {
  const eslint = new ESLint({
    cwd: repoRoot,
    overrideConfigFile: true,
    overrideConfig: createConfig({
      css: false,
      tailwind: false,
      tsconfigRootDir: repoRoot,
    }),
  });

  const results = await eslint.lintFiles([fixturePath]);
  const messages = results.flatMap((result) => result.messages);
  const jsdocErrors = messages.filter(
    (message) => message.ruleId === "jsdoc/require-description-complete-sentence"
      && message.message === "Sentences must end with a period.",
  );

  for (const error of jsdocErrors) {
    const caseId = findCaseForReportedLine(error.line);

    if (caseId === undefined) {
      assert.fail(`Could not attribute jsdoc error to a fixture case: ${JSON.stringify(error)}`);
    }

    failingCases.push(caseId);
  }

  for (const caseId of expectedPassingCases) {
    if (!failingCases.includes(caseId)) {
      passingCases.push(caseId);
    }
  }
} finally {
  await unlink(fixturePath);
}

assert.deepEqual(
  failingCases.toSorted(),
  expectedFailingCases.toSorted(),
  `Expected jsdoc sentence-end errors only for ${expectedFailingCases.join(", ")}; got ${failingCases.length} error(s) for ${failingCases.join(", ")}`,
);

assert.deepEqual(
  passingCases.toSorted(),
  expectedPassingCases.toSorted(),
  `Expected no jsdoc sentence-end errors for ${expectedPassingCases.join(", ")}`,
);
