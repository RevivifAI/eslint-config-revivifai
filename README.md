# @revivifai/eslint-config

[![npm version](https://img.shields.io/npm/v/@revivifai/eslint-config.svg)](https://www.npmjs.com/package/@revivifai/eslint-config)
[![npm downloads](https://img.shields.io/npm/dm/@revivifai/eslint-config.svg)](https://www.npmjs.com/package/@revivifai/eslint-config)
[![License](https://img.shields.io/npm/l/@revivifai/eslint-config.svg)](https://github.com/RevivifAI/eslint-config-revivifai/blob/main/LICENSE)

A comprehensive, modern ESLint flat config for TypeScript projects with strict type checking, JSDoc enforcement, import sorting, and Prettier compatibility.

## Features

- **ESLint 10+ Flat Config** — Modern configuration format using `defineConfig` from `eslint/config`
- **TypeScript Strict** — `strictTypeChecked` and `stylisticTypeChecked` from `typescript-eslint`
- **JSDoc Enforcement** — Comprehensive JSDoc linting with 40+ rules
- **Import Sorting** — Automatic import/member sorting via `eslint-plugin-perfectionist`
- **Unicorn Rules** — Additional best-practice rules from `eslint-plugin-unicorn`
- **Security Rules** — Comprehensive security linting via `eslint-plugin-security` and custom SDL rules
- **Stylistic Formatting** — Comprehensive code formatting via `@stylistic/eslint-plugin` and `@seahax/eslint-plugin-wrap`
- **YAML Linting** — Full YAML file support via `eslint-plugin-yml`
- **Markdown Linting** — Markdown file support via `@eslint/markdown`
- **Keep A Changelog** — Custom rules enforcing [Keep A Changelog v1.1.0](https://keepachangelog.com/en/1.1.0/) format

## Installation

```bash
pnpm add -D @revivifai/eslint-config
```

### Peer Dependencies

This package requires the following peer dependencies:

```bash
pnpm add -D eslint@^10 typescript@^5 typescript-eslint@^8
```

### Requirements

- **Node.js**: >= 20.0.0
- **ESLint**: 10.x
- **TypeScript**: ^5.0.0
- **typescript-eslint**: ^8.0.0

## Usage

Create an `eslint.config.js` file in your project root:

```javascript
// @ts-check
import { createConfig } from "@revivifai/eslint-config";

export default createConfig({
  tsconfigRootDir: import.meta.dirname,
});
```

### Configuration Options

```typescript
interface RevivifaiEslintOptions {
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
   * Whether to enable JSDoc enforcement rules.
   * @default true
   */
  jsdoc?: boolean;

  /**
   * Whether to enable Unicorn rules.
   * @default true
   */
  unicorn?: boolean;

  /**
   * Whether to enable Perfectionist import/member sorting.
   * @default true
   */
  perfectionist?: boolean;

  /**
   * Whether to enable security rules (includes eslint-plugin-security and SDL rules).
   * @default true
   */
  security?: boolean;

  /**
   * Whether to enable Stylistic formatting rules.
   * @default true
   */
  stylistic?: boolean;

  /**
   * Additional ignore patterns.
   */
  ignores?: string[];
}
```

### Example: Disable JSDoc Rules

If you don't want JSDoc enforcement:

```javascript
// @ts-check
import { createConfig } from "@revivifai/eslint-config";

export default createConfig({
  tsconfigRootDir: import.meta.dirname,
  jsdoc: false,
});
```

### Example: Add Custom Ignores

```javascript
// @ts-check
import { createConfig } from "@revivifai/eslint-config";

export default createConfig({
  tsconfigRootDir: import.meta.dirname,
  ignores: ["generated/**/*", "scripts/**/*.js"],
});
```

### Example: Disable Specific Security Rules

If you find certain security rules too noisy (like `security/detect-object-injection`), you can disable them using standard ESLint overrides:

```javascript
// @ts-check
import { createConfig } from "@revivifai/eslint-config";

export default [
  ...createConfig({
    tsconfigRootDir: import.meta.dirname,
  }),
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Disabling object-injection as it has a high false-positive rate in 
      // projects that frequently use dynamic keys. 
      // NOTE: Each reported case should still be audited for potential 
      // prototype pollution or other injection vulnerabilities.
      "security/detect-object-injection": "off",
    },
  },
];
```

## Included Rules

### TypeScript Strict Type-Checked

- `@typescript-eslint/no-deprecated` — Error on deprecated API usage
- `@typescript-eslint/no-unused-vars` — Unused variable detection with `_` prefix ignore
- `@typescript-eslint/restrict-template-expressions` — Type-safe template strings
- `@typescript-eslint/no-confusing-void-expression` — Void expression clarity
- `@typescript-eslint/switch-exhaustiveness-check` — Exhaustive switch statements
- `@typescript-eslint/no-floating-promises` — Catch unhandled promises
- `@typescript-eslint/no-misused-promises` — Promise misuse detection
- `@typescript-eslint/return-await` — Proper await in try-catch
- And more from `strictTypeChecked` and `stylisticTypeChecked`

### JSDoc (40+ Rules)

Comprehensive JSDoc enforcement including:

- `jsdoc/require-jsdoc` — Public functions/classes require JSDoc
- `jsdoc/require-description` — JSDoc must have descriptions
- `jsdoc/require-param` — Document all parameters
- `jsdoc/require-returns` — Document return values
- `jsdoc/check-access` — Access tags must be valid
- And many more

### Unicorn

- `unicorn/prefer-switch` — Prefer switch for 3+ equality comparisons
- `unicorn/prefer-string-starts-ends-with` — Prefer `startsWith`/`endsWith`

### Perfectionist

- `recommended-natural` — Natural sorting for imports and members

### Security (eslint-plugin-security + SDL)

Comprehensive security enforcement including:

- `security/detect-child-process` — Detects `child_process` and non-literal `exec()` calls
- `security/detect-object-injection` — Detects variable[key] assignment (warn)
- `security/detect-unsafe-regex` — Detects potentially unsafe regex (ReDoS)
- `@revivifai/sdl/no-inner-html` — Prevents DOM XSS via `innerHTML`
- `@revivifai/sdl/no-insecure-url` — Detects insecure `http://` protocols
- `@revivifai/sdl/no-insecure-random` — Disallows cryptographically weak PRNGs
- And 20+ more security rules

### General Best Practices

- `no-console` — Warn on console usage
- `curly` — Require braces for all control flow
- `eqeqeq` — Strict equality
- `prefer-const` — Prefer const declarations
- `prefer-arrow-callback` — Arrow functions for callbacks
- `padding-line-between-statements` — Consistent whitespace around declarations
- `no-eval` — Disallow `eval`
- `no-var` — Disallow `var` declarations
- `object-shorthand` — Require shorthand object properties
- `prefer-template` — Prefer template literals over string concatenation

### YAML (`eslint-plugin-yml`)

Full YAML file linting with rules including:

- `yml/block-mapping` — Enforce block mapping style
- `yml/block-sequence` — Enforce block sequence style
- `yml/indent` — Consistent 2-space indentation
- `yml/quotes` — Double quotes preference
- `yml/sort-keys` — Sorted YAML keys
- And more

### Markdown (`@eslint/markdown`)

Native ESLint 10+ Markdown support using `@eslint/markdown`. Provides recommended linting for `.md` files with automatic TypeScript type-checked rule disablement for non-TS files.

### Keep A Changelog

Custom plugin enforcing [Keep A Changelog v1.1.0](https://keepachangelog.com/en/1.1.0/) format for `CHANGELOG.md`, `HISTORY.md`, `NEWS.md`, and `RELEASES.md` files:

- `no-empty-sections` — Disallow empty change categories
- `require-change-categories` — Ensure standard categories (Added, Changed, Deprecated, Removed, Fixed, Security)
- `require-change-item-format` — Require imperative mood for change items
- `require-date-format` — ISO date format (YYYY-MM-DD) for version headers
- `require-semantic-versioning-order` — Versions in reverse chronological order
- `require-unreleased-section` — Suggest `[Unreleased]` section

## Test File Relaxations

The following rules are automatically relaxed in test files (`test/**/*.ts`, `tests/**/*.ts`, `**/*.test.ts`, `**/*.spec.ts`):

- `@typescript-eslint/no-empty-function` — Off
- `@typescript-eslint/no-non-null-assertion` — Off
- `@typescript-eslint/no-unsafe-*` — Off
- `@typescript-eslint/unbound-method` — Off
- `no-console` — Off

## Stylistic Formatting

This config includes `@stylistic/eslint-plugin` and `@seahax/eslint-plugin-wrap` to handle all code formatting concerns directly within ESLint. This replaces the need for Prettier.

The default formatting style is:
- **Indent**: 2 spaces
- **Quotes**: Double
- **Semi-colons**: Required
- **Trailing Commas**: All (multiline)
- **Line Length**: 100 characters (with auto-wrapping)
- **Line Endings**: LF

## Comparison with Airbnb Configs

| Feature           | @revivifai/eslint-config   | eslint-config-airbnb-extended |
| ----------------- | -------------------------- | ----------------------------- |
| Config Format     | ✅ Flat config (ESLint 9+) | ✅ Flat config (ESLint 9+)    |
| TypeScript        | ✅ strictTypeChecked       | ✅ TypeScript support         |
| JSDoc             | ✅ 40+ rules               | ❌ Not included               |
| Import Sorting    | ✅ Perfectionist           | ✅ import-x                   |
| Unicorn           | ✅ Built-in                | ❌ Not included               |
| YAML Linting      | ✅ eslint-plugin-yml       | ❌ Not included               |
| Markdown Linting  | ✅ @eslint/markdown        | ❌ Not included               |
| Keep A Changelog  | ✅ Built-in                | ❌ Not included               |
| Security          | ✅ Security + SDL          | ❌ Not included               |
| React/JSX         | ❌ Not configured          | ✅ React, hooks, a11y         |
| Node.js           | ❌ Not configured          | ✅ eslint-plugin-n            |
| Formatting        | ✅ ESLint Stylistic        | ✅ ESLint Stylistic           |

## License

Apache-2.0 © RevivifAI
