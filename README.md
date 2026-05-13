# @revivifai/eslint-config

A comprehensive, modern ESLint flat config for TypeScript projects with strict type checking, JSDoc enforcement, import sorting, and Prettier compatibility.

## Features

- **ESLint 9+ Flat Config** — Modern configuration format using `defineConfig` from `eslint/config`
- **TypeScript Strict** — `strictTypeChecked` and `stylisticTypeChecked` from `typescript-eslint`
- **JSDoc Enforcement** — Comprehensive JSDoc linting with 40+ rules
- **Import Sorting** — Automatic import/member sorting via `eslint-plugin-perfectionist`
- **Unicorn Rules** — Additional best-practice rules from `eslint-plugin-unicorn`
- **Prettier Compatible** — Disables conflicting formatting rules

## Installation

```bash
pnpm add -D @revivifai/eslint-config
```

### Peer Dependencies

This package requires the following peer dependencies:

```bash
pnpm add -D eslint@^10 prettier typescript typescript-eslint
```

**ESLint Compatibility:** Supports ESLint 9.x and 10.x (ESLint 10 is the latest stable release).

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
   * Path to tsconfig.json relative to tsconfigRootDir.
   * @default "./tsconfig.json"
   */
  tsconfig?: string;

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

### General Best Practices

- `no-console` — Warn on console usage
- `curly` — Require braces for all control flow
- `eqeqeq` — Strict equality
- `prefer-const` — Prefer const declarations
- `prefer-arrow-callback` — Arrow functions for callbacks
- `padding-line-between-statements` — Consistent whitespace around declarations

## Test File Relaxations

The following rules are automatically relaxed in test files (`test/**/*.ts`, `tests/**/*.ts`, `**/*.test.ts`, `**/*.spec.ts`):

- `@typescript-eslint/no-empty-function` — Off
- `@typescript-eslint/no-non-null-assertion` — Off
- `@typescript-eslint/no-unsafe-*` — Off
- `@typescript-eslint/unbound-method` — Off
- `no-console` — Off

## Prettier Setup

This config includes `eslint-config-prettier` to disable all ESLint rules that might conflict with Prettier. Make sure you also have a Prettier config:

```json
// .prettierrc.json
{
  "quoteStyle": "double",
  "trailingComma": "all",
  "tabWidth": 2,
  "semi": true
}
```

## Comparison with Airbnb Configs

| Feature | @revivifai/eslint-config | eslint-config-airbnb-extended |
|---------|--------------------------|------------------------------|
| Config Format | ✅ Flat config (ESLint 9+) | ✅ Flat config (ESLint 9+) |
| TypeScript | ✅ strictTypeChecked | ✅ TypeScript support |
| JSDoc | ✅ 40+ rules | ❌ Not included |
| Import Sorting | ✅ Perfectionist | ✅ import-x |
| Unicorn | ✅ Built-in | ❌ Not included |
| React/JSX | ❌ Not configured | ✅ React, hooks, a11y |
| Node.js | ❌ Not configured | ✅ eslint-plugin-n |
| Prettier | ✅ Integrated | ❌ Uses stylistic plugin |

## License

Apache-2.0 © RevivifAI