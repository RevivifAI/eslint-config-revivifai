// Test configuration to verify keep-a-changelog plugin rules
import markdown from "@eslint/markdown";
import { defineConfig } from "eslint/config";
import { keepAChangelogPlugin } from "./dist/keep-a-changelog-plugin.js";

export default defineConfig([
  ...markdown.configs.recommended.map((c) => ({
    ...c,
    files: ["**/*.md"],
  })),
  {
    files: ["**/CHANGELOG.md"],
    plugins: {
      "keep-a-changelog": keepAChangelogPlugin,
    },
    rules: {
      "markdown/no-missing-label-refs": "off",
      "keep-a-changelog/no-duplicate-headings": "error",
    },
  },
]);