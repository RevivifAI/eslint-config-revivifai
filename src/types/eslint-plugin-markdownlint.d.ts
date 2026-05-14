/**
 * Type declarations for eslint-plugin-markdownlint.
 */

declare module "eslint-plugin-markdownlint" {
  import type { Linter } from "eslint";

  interface MarkdownlintPlugin {
    configs: {
      recommended: {
        plugins: string[];
        rules: Record<string, Linter.RuleEntry>;
      };
    };
    rules: Record<string, Linter.RuleRecord>;
  }

  const markdownlint: MarkdownlintPlugin;
  export default markdownlint;
}

declare module "eslint-plugin-markdownlint/parser.js" {
  interface MarkdownlintAst {
    body: unknown[];
    code: string;
    comments: unknown[];
    end: number;
    loc: {
      end: { column: number; line: number };
      start: { column: number; line: number };
    };
    range: number[];
    start: number;
    tokens: unknown[];
    type: "Program";
  }

  interface MarkdownlintParser {
    meta: { name: string };
    parseForESLint(code: string, options?: object): {
      ast: MarkdownlintAst;
      scopeManager: null;
      visitorKeys: null;
    };
  }

  const parser: MarkdownlintParser;
  export default parser;
}
