import assert from "node:assert/strict";
import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";

import { ESLint } from "eslint";

import { createConfig } from "../dist/index.js";

const repoRoot = path.resolve(import.meta.dirname, "..");
const fixturePath = path.join(repoRoot, "src", "__test-jsdoc-cases.ts");

const fixture = `/** Example: */
export function singleLine(): void {
  // no-op
}

/**
 * Multi line paragraph without colon
 * More text:
 */
export function multiLine(): void {
  // no-op
}

/**
 * Missing terminator
 */
export function missingTerminator(): void {
  // no-op
}
`;

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
    (message) => message.ruleId === "jsdoc/require-description-complete-sentence",
  );

  assert.equal(
    jsdocErrors.length,
    1,
    `Expected exactly one jsdoc error (for the missing terminator), got ${jsdocErrors.length}: ${JSON.stringify(jsdocErrors)}`,
  );
  assert.equal(
    jsdocErrors[0].line,
    15,
    `Expected the jsdoc error on line 15, got line ${jsdocErrors[0].line}`,
  );
} finally {
  await unlink(fixturePath);
}
