/**
 * @file Custom security rules inspired by Microsoft ESLint SDL Plugin.
 * @description These rules are based on @microsoft/eslint-plugin-sdl but implemented
 *   locally to avoid an additional dependency on an unmaintained package.
 * @see https://github.com/microsoft/eslint-plugin-sdl
 * @module @revivifai/eslint-config/sdl-rules
 */

// @ts-check

import type { ESLint, Rule } from "eslint";

// ────────────────────────────────────────────────────────────────────────────────
// AST Utilities for Type-Checked Rules
// ────────────────────────────────────────────────────────────────────────────────

interface ParserServices {
  program: import("typescript").Program;
  esTreeNodeToTSNodeMap: Map<unknown, unknown>;
  tsNodeToESTreeNodeMap: Map<unknown, unknown>;
}

/**
 * Check if TypeScript parser services are available.
 */
function isTypeScriptParserServices(parserServices: unknown): parserServices is ParserServices {
  return Boolean(
    parserServices
    && typeof parserServices === "object"
    && "program" in parserServices
    && "esTreeNodeToTSNodeMap" in parserServices,
  );
}

/**
 * Get the TypeScript type checker if available.
 */
function getFullTypeChecker(context: Rule.RuleContext): import("typescript").TypeChecker | null {
  const parserServices = context.sourceCode.parserServices;

  if (!isTypeScriptParserServices(parserServices)) {
    return null;
  }

  return parserServices.program.getTypeChecker();
}

/**
 * Get the type string for a node using TypeScript type checker.
 */
function getNodeTypeAsString(
  typeChecker: import("typescript").TypeChecker | null,
  node: unknown,
  context: Rule.RuleContext,
): string {
  if (!typeChecker || !node) {
    return "any";
  }

  const parserServices = context.sourceCode?.parserServices;

  if (!parserServices || !isTypeScriptParserServices(parserServices)) {
    return "any";
  }

  const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);

  if (!tsNode) {
    return "any";
  }

  const tsType = typeChecker.getTypeAtLocation(tsNode as import("typescript").Node);

  return typeChecker.typeToString(tsType);
}

interface IdentifierNode {
  type: "Identifier";
  name: string;
}

interface MemberExpressionNode {
  type: "MemberExpression";
  object: unknown;
  property: { type: string; name?: string } | null;
}

interface LiteralNode {
  type: "Literal";
  value: string | number | boolean | null | undefined | RegExp;
}

function isIdentifier(node: unknown): node is IdentifierNode {
  return typeof node === "object" && node !== null && (node as { type?: string }).type === "Identifier";
}

function isMemberExpression(node: unknown): node is MemberExpressionNode {
  return typeof node === "object" && node !== null && (node as { type?: string }).type === "MemberExpression";
}

function isLiteral(node: unknown): node is LiteralNode {
  return typeof node === "object" && node !== null && (node as { type?: string }).type === "Literal";
}

/**
 * Check if a node is the document object.
 */
function isDocumentObject(
  node: unknown,
  context: Rule.RuleContext,
  typeChecker: import("typescript").TypeChecker | null,
): boolean {
  if (typeChecker) {
    const type = getNodeTypeAsString(typeChecker, node, context);

    return type === "Document";
  }

  // Best-effort checking without type information
  if (!node || typeof node !== "object") {
    return false;
  }

  if (isIdentifier(node)) {
    return node.name === "document";
  }

  if (isMemberExpression(node)) {
    const prop = node.property;

    if (!prop || prop.name !== "document") {
      return false;
    }

    const obj = node.object;

    if (!obj || typeof obj !== "object") {
      return false;
    }

    // window.document or obj.document where obj ends with "window"
    if (isIdentifier(obj) && obj.name.toLowerCase().endsWith("window")) {
      return true;
    }

    // obj.window.document where obj is this or globalThis
    if (isMemberExpression(obj)) {
      const innerProp = obj.property;

      if (!innerProp || innerProp.name !== "window") {
        return false;
      }

      const innerObj = obj.object;

      if (!innerObj || typeof innerObj !== "object") {
        return false;
      }

      return (innerObj as { type?: string }).type === "ThisExpression"
        || (isIdentifier(innerObj) && innerObj.name === "globalThis");
    }
  }

  return false;
}

/**
 * Check if a node might be an HTMLElement based on type.
 */
function mightBeHTMLElement(
  node: unknown,
  context: Rule.RuleContext,
  typeChecker: import("typescript").TypeChecker | null,
): boolean {
  const type = getNodeTypeAsString(typeChecker, node, context);

  return /HTML.*Element/.test(type) || type === "any";
}

// ────────────────────────────────────────────────────────────────────────────────
// SDL Security Plugin Definition
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Custom SDL security rules plugin.
 * Based on Microsoft's eslint-plugin-sdl for Security Development Lifecycle.
 */
export const sdlPlugin: ESLint.Plugin = {
  meta: {
    name: "@revivifai/sdl",
    version: "1.0.0",
  },
  rules: {
    // -------------------------------------------------------------------------
    // Rule: no-delete-var
    // Core ESLint rule - prevents use of `delete` on variables
    // -------------------------------------------------------------------------
    "no-delete-var": {
      meta: {
        docs: {
          description: "Disallow deleting variables using the `delete` operator",
          recommended: true,
        },
        type: "problem" as const,
        messages: {
          unexpected: "Variables cannot be deleted.",
        },
      },
      create(context: Rule.RuleContext) {
        return {

          UnaryExpression(node: { operator: string; argument: { type: string }; loc: Rule.RuleContext["sourceCode"]["ast"]["loc"] }) {
            if (node.operator === "delete" && node.argument.type === "Identifier") {
              context.report({
                loc: node.loc,
                messageId: "unexpected",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                node: node as any,
              });
            }
          },
        };
      },
    },

    // -------------------------------------------------------------------------
    // Rule: no-new-func
    // Prevents Function constructor (similar to eval)
    // -------------------------------------------------------------------------
    "no-new-func": {
      meta: {
        docs: {
          description: "Disallow `new Function()` constructor which is similar to `eval()` and allows code execution from strings",
          recommended: true,
        },
        type: "suggestion" as const,
        messages: {
          unexpected: "Do not use the Function constructor. It is similar to eval() and allows code execution from strings.",
        },
      },
      create(context: Rule.RuleContext) {
        return {

          NewExpression(node: { callee: { type: string; name: string }; loc: Rule.RuleContext["sourceCode"]["ast"]["loc"] }) {
            if (node.callee.type === "Identifier" && node.callee.name === "Function") {
              context.report({
                loc: node.loc,
                messageId: "unexpected",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                node: node as any,
              });
            }
          },
        };
      },
    },

    // -------------------------------------------------------------------------
    // Rule: no-inner-html
    // Detects innerHTML/outerHTML assignments and insertAdjacentHTML calls
    // -------------------------------------------------------------------------
    "no-inner-html": {
      meta: {
        docs: {
          description: "Disallow assignments to innerHTML/outerHTML properties or calls to insertAdjacentHTML method - these manipulate DOM directly without sanitization",
          recommended: true,
          url: "https://github.com/microsoft/eslint-plugin-sdl/blob/master/docs/rules/no-inner-html.md",
        },
        type: "suggestion" as const,
        messages: {
          noInnerHtml: "Do not write to DOM directly using innerHTML/outerHTML property",
          noInsertAdjacentHTML: "Do not write to DOM using insertAdjacentHTML method",
        },
      },
      create(context: Rule.RuleContext) {
        const typeChecker = getFullTypeChecker(context);

        return {
          // Handle element.insertAdjacentHTML(position, html)

          CallExpression(node: { callee: { type: string; property?: { type: string; name: string }; object: unknown }; arguments: unknown[]; loc: Rule.RuleContext["sourceCode"]["ast"]["loc"] }) {
            if (
              node.callee.type === "MemberExpression"

              && node.callee.property?.type === "Identifier"

              && node.callee.property.name === "insertAdjacentHTML"
              && node.arguments.length === 2
            ) {
              // Skip known false positive: insertAdjacentHTML('', '')
              const htmlArg = node.arguments[1];

              if (isLiteral(htmlArg) && htmlArg.value === "") {
                return;
              }

              if (mightBeHTMLElement(node.callee.object, context, typeChecker)) {
                context.report({
                  loc: node.loc,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  node: node.callee as any,
                  messageId: "noInsertAdjacentHTML",
                });
              }
            }
          },

          // Handle element.innerHTML = value or element.outerHTML = value

          AssignmentExpression(node: { left: { type: string; property?: { type: string; name: string }; object: unknown }; right: unknown; loc: Rule.RuleContext["sourceCode"]["ast"]["loc"] }) {
            if (
              node.left.type === "MemberExpression"

              && node.left.property?.type === "Identifier"
            ) {
              const propName = node.left.property.name;

              if (propName === "innerHTML" || propName === "outerHTML") {
                // Skip known false positive: element.innerHTML = ''
                if (isLiteral(node.right) && node.right.value === "") {
                  return;
                }

                if (mightBeHTMLElement(node.left.object, context, typeChecker)) {
                  context.report({
                    loc: node.loc,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    node: node.left as any,
                    messageId: "noInnerHtml",
                  });
                }
              }
            }
          },
        };
      },
    },

    // -------------------------------------------------------------------------
    // Rule: no-document-write
    // Detects document.write() and document.writeln() calls
    // -------------------------------------------------------------------------
    "no-document-write": {
      meta: {
        docs: {
          description: "Disallow document.write() and document.writeln() which manipulate DOM directly without sanitization",
          recommended: true,
          url: "https://github.com/microsoft/eslint-plugin-sdl/blob/master/docs/rules/no-document-write.md",
        },
        type: "suggestion" as const,
        messages: {
          default: "Do not write to DOM directly using document.write() or document.writeln() methods",
        },
      },
      create(context: Rule.RuleContext) {
        const typeChecker = getFullTypeChecker(context);

        return {

          CallExpression(node: { callee: { type: string; property?: { type: string; name: string }; object: unknown }; arguments: unknown[]; loc: Rule.RuleContext["sourceCode"]["ast"]["loc"] }) {
            if (
              node.callee.type === "MemberExpression"

              && node.callee.property?.type === "Identifier"

              && (node.callee.property.name === "write" || node.callee.property.name === "writeln")
              && node.arguments.length === 1
            ) {
              if (isDocumentObject(node.callee.object, context, typeChecker)) {
                context.report({
                  loc: node.loc,
                  messageId: "default",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  node: node as any,
                });
              }
            }
          },
        };
      },
    },

    // -------------------------------------------------------------------------
    // Rule: no-document-domain
    // Detects document.domain assignments
    // -------------------------------------------------------------------------
    "no-document-domain": {
      meta: {
        docs: {
          description: "Disallow assignments to document.domain property which can bypass same-origin checks",
          recommended: true,
          url: "https://github.com/microsoft/eslint-plugin-sdl/blob/master/docs/rules/no-document-domain.md",
        },
        type: "suggestion" as const,
        messages: {
          default: "Do not write to document.domain property",
        },
      },
      create(context: Rule.RuleContext) {
        const typeChecker = getFullTypeChecker(context);

        return {

          AssignmentExpression(node: { operator: string; left: { type: string; property?: { type: string; name: string }; object: unknown }; loc: Rule.RuleContext["sourceCode"]["ast"]["loc"] }) {
            if (
              node.operator === "="
              && node.left.type === "MemberExpression"

              && node.left.property?.type === "Identifier"

              && node.left.property.name === "domain"
            ) {
              if (isDocumentObject(node.left.object, context, typeChecker)) {
                context.report({
                  loc: node.loc,
                  messageId: "default",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  node: node as any,
                });
              }
            }
          },
        };
      },
    },

    // -------------------------------------------------------------------------
    // Rule: no-insecure-url
    // Detects insecure protocols (HTTP, FTP, WS, Telnet) in string literals
    // -------------------------------------------------------------------------
    "no-insecure-url": {
      meta: {
        docs: {
          description: "Disallow insecure protocols (HTTP, FTP, WS, Telnet) in URL strings - use HTTPS, WSS, FTPS instead",
          recommended: true,
          url: "https://github.com/microsoft/eslint-plugin-sdl/blob/master/docs/rules/no-insecure-url.md",
        },
        type: "suggestion" as const,
        fixable: "code" as const,
        messages: {
          doNotUseInsecureUrl: "Do not use insecure URLs. Use HTTPS, WSS, or FTPS instead.",
        },
      },
      create(context: Rule.RuleContext) {
        // Default blocklist: http://, ftp://, telnet://, ws://
        const blocklist: RegExp[] = [/^(ftp|http|telnet|ws):\/\//i];

        // Default exceptions: XML schemas, localhost
        const exceptions: RegExp[] = [
          /^http:(\/\/|\\u002f\\u002f)schemas\.microsoft\.com/i,
          /^http:(\/\/|\\u002f\\u002f)schemas\.openxmlformats\.org/i,
          /^http:(\/|\\u002f){2}localhost/i,
          /^http:(\/\/)www\.w3\.org\/1999\/xhtml/i,
          /^http:(\/\/)www\.w3\.org\/2000\/svg/i,
        ];

        function matches(patterns: RegExp[], value: string): boolean {
          return patterns.some((re) => re.test(value));
        }

        return {

          Literal(node: { value: string | number | boolean | null | undefined | RegExp; parent?: { type: string; name?: { name?: string } }; loc: Rule.RuleContext["sourceCode"]["ast"]["loc"] }) {
            if (typeof node.value === "string") {
              const value = node.value;

              // Skip xmlns attributes
              if (
                node.parent?.type === "JSXAttribute"

                && node.parent.name?.name === "xmlns"
              ) {
                return;
              }

              if (matches(blocklist, value) && !matches(exceptions, value)) {
                context.report({
                  loc: node.loc,
                  messageId: "doNotUseInsecureUrl",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  node: node as any,
                  fix(fixer) {
                    // Only auto-fix http:// to https://
                    if (/^http:\/\//i.test(value)) {
                      const fixed = value.replace(/^http:/i, "https:");

                      return fixer.replaceText(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        node as any,
                        JSON.stringify(fixed),
                      );
                    }

                    return null;
                  },
                });
              }
            }
          },

          TemplateElement(node: { value: { raw: string; cooked: string }; loc: Rule.RuleContext["sourceCode"]["ast"]["loc"] }) {
            const raw = node.value.raw;
            const cooked = node.value.cooked;

            if (typeof raw === "string" && matches(blocklist, raw) && !matches(exceptions, raw)) {
              context.report({
                loc: node.loc,
                messageId: "doNotUseInsecureUrl",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                node: node as any,
              });
            } else if (typeof cooked === "string" && matches(blocklist, cooked) && !matches(exceptions, cooked)) {
              context.report({
                loc: node.loc,
                messageId: "doNotUseInsecureUrl",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                node: node as any,
              });
            }
          },
        };
      },
    },

    // -------------------------------------------------------------------------
    // Rule: no-postmessage-star-origin
    // Detects postMessage(..., "*") calls with wildcard origin
    // -------------------------------------------------------------------------
    "no-postmessage-star-origin": {
      meta: {
        docs: {
          description: "Disallow using '*' as target origin in postMessage() calls - always specify the intended origin",
          recommended: true,
          url: "https://github.com/microsoft/eslint-plugin-sdl/blob/master/docs/rules/no-postmessage-star-origin.md",
        },
        type: "suggestion" as const,
        messages: {
          default: "Do not use '*' as target origin when sending data to other windows via postMessage()",
        },
      },
      create(context: Rule.RuleContext) {
        const typeChecker = getFullTypeChecker(context);

        return {

          CallExpression(node: { arguments: { length: number; [index: number]: { type: string; value?: string } }; callee: { type: string; property?: { type: string; name: string }; object: unknown }; loc: Rule.RuleContext["sourceCode"]["ast"]["loc"] }) {
            // postMessage(message, targetOrigin) or postMessage(message, targetOrigin, transfer)
            if (
              node.arguments.length >= 2
              && node.arguments.length <= 3
              && node.callee.type === "MemberExpression"

              && node.callee.property?.type === "Identifier"

              && node.callee.property.name === "postMessage"
            ) {
              // Check if second argument is "*"
              const targetOrigin = node.arguments[1];

              if (targetOrigin.type === "Literal" && targetOrigin.value === "*") {
                // Check if callee object is Window type

                const objType = getNodeTypeAsString(typeChecker, node.callee.object, context);

                if (objType === "any" || objType === "Window") {
                  context.report({
                    loc: node.loc,
                    messageId: "default",
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    node: node as any,
                  });
                }
              }
            }
          },
        };
      },
    },

    // -------------------------------------------------------------------------
    // Rule: no-unsafe-alloc
    // Detects Buffer.allocUnsafe() and Buffer.allocUnsafeSlow() calls
    // -------------------------------------------------------------------------
    "no-unsafe-alloc": {
      meta: {
        docs: {
          description: "Disallow Buffer.allocUnsafe() and Buffer.allocUnsafeSlow() which can expose sensitive data from uninitialized memory",
          recommended: true,
          url: "https://github.com/microsoft/eslint-plugin-sdl/blob/master/docs/rules/no-unsafe-alloc.md",
        },
        type: "suggestion" as const,
        messages: {
          default: "Do not allocate uninitialized buffers in Node.js. Use Buffer.alloc() instead.",
        },
      },
      create(context: Rule.RuleContext) {
        return {

          CallExpression(node: { callee: { type: string; object?: { type: string; name: string }; property?: { type: string; name: string } }; arguments: { length: number; [index: number]: { type: string; value?: number } }; loc: Rule.RuleContext["sourceCode"]["ast"]["loc"] }) {
            if (
              node.callee.type === "MemberExpression"

              && node.callee.object?.type === "Identifier"

              && node.callee.object.name === "Buffer"

              && node.callee.property?.type === "Identifier"
            ) {
              const methodName = node.callee.property.name;

              if (methodName === "allocUnsafe" || methodName === "allocUnsafeSlow") {
                // Skip known false positive: Buffer.allocUnsafe(0)
                if (
                  node.arguments.length === 1
                  && node.arguments[0].type === "Literal"
                  && node.arguments[0].value === 0
                ) {
                  return;
                }

                context.report({
                  loc: node.loc,
                  messageId: "default",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  node: node as any,
                });
              }
            }
          },
        };
      },
    },

    // -------------------------------------------------------------------------
    // Rule: no-html-method
    // Detects .html() method calls (jQuery pattern)
    // -------------------------------------------------------------------------
    "no-html-method": {
      meta: {
        docs: {
          description: "Disallow calling .html() method which can manipulate DOM without sanitization (e.g., in jQuery)",
          recommended: false, // Only relevant for jQuery projects
          url: "https://github.com/microsoft/eslint-plugin-sdl/blob/master/docs/rules/no-html-method.md",
        },
        type: "suggestion" as const,
        messages: {
          default: "Do not write to DOM directly using the .html() method (e.g., jQuery). Use safer alternatives.",
        },
      },
      create(context: Rule.RuleContext) {
        return {

          CallExpression(node: { callee: { type: string; property?: { type: string; name: string } }; arguments: { length: number; [index: number]: { type: string; value?: string | null } }; loc: Rule.RuleContext["sourceCode"]["ast"]["loc"] }) {
            // Detect .html(value) calls
            if (
              node.callee.type === "MemberExpression"

              && node.callee.property?.type === "Identifier"

              && node.callee.property.name === "html"
              && node.arguments.length === 1
            ) {
              // Skip known false positives: .html("") or .html(null)
              const arg = node.arguments[0];

              if (arg.type === "Literal" && (arg.value === "" || arg.value === null)) {
                return;
              }

              context.report({
                loc: node.loc,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                node: node.callee as any,
                messageId: "default",
              });
            }
          },
        };
      },
    },

    // -------------------------------------------------------------------------
    // Rule: no-insecure-random
    // Detects Math.random() and crypto.pseudoRandomBytes() for security purposes
    // -------------------------------------------------------------------------
    "no-insecure-random": {
      meta: {
        docs: {
          description: "Disallow Math.random() and crypto.pseudoRandomBytes() for security purposes - use crypto.randomBytes() or window.crypto.getRandomValues() instead",
          recommended: true,
          url: "https://github.com/microsoft/eslint-plugin-sdl/blob/master/docs/rules/no-insecure-random.md",
        },
        type: "suggestion" as const,
        messages: {
          default: "Do not use pseudo-random number generators for generating secret values such as tokens, passwords, or keys. Use crypto.randomBytes() or window.crypto.getRandomValues() instead.",
        },
      },
      create(context: Rule.RuleContext) {
        // Banned random libraries
        const bannedRandomLibraries = [
          "chance",
          "random-number",
          "random-int",
          "random-float",
          "random-seed",
          "unique-random",
        ];

        return {
          // Detect Math.random()

          CallExpression(node: { callee: { type: string; property?: { type: string; name: string }; object: { type: string; name: string } }; loc: Rule.RuleContext["sourceCode"]["ast"]["loc"] }) {
            if (
              node.callee.type === "MemberExpression"

              && node.callee.property?.type === "Identifier"
            ) {
              const propName = node.callee.property.name;

              // Math.random()
              if (propName === "random") {
                const obj = node.callee.object;

                if (obj.type === "Identifier" && obj.name === "Math") {
                  context.report({
                    loc: node.loc,
                    messageId: "default",
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    node: node as any,
                  });
                }
              }

              // crypto.pseudoRandomBytes()
              if (propName === "pseudoRandomBytes") {
                const obj = node.callee.object;

                if (obj.type === "Identifier" && obj.name === "crypto") {
                  context.report({
                    loc: node.loc,
                    messageId: "default",
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    node: node as any,
                  });
                }
              }
            }
          },

          // Detect import of banned random libraries

          ImportDeclaration(node: { source: { value: string }; loc: Rule.RuleContext["sourceCode"]["ast"]["loc"] }) {
            const source = node.source.value;

            if (typeof source === "string") {
              const libName = source.split("/").pop() ?? source;

              if (bannedRandomLibraries.includes(libName)) {
                context.report({
                  loc: node.loc,
                  messageId: "default",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  node: node as any,
                });
              }
            }
          },
        };
      },
    },
  },
};

export default sdlPlugin;
