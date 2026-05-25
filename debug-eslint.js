import { defineConfig } from "eslint/config";
import markdown from "@eslint/markdown";

const debugPlugin = {
  meta: { name: "debug", version: "1.0.0" },
  rules: {
    "test": {
      create(context) {
        console.log("Rule create called");
        console.log("Source code type:", context.sourceCode?.constructor?.name);
        console.log("Source code text:", context.sourceCode?.text?.substring(0, 100));
        return {
          Document(node) {
            console.log("Document visitor called");
            console.log("Document node:", node);
          },
          Heading(node) {
            console.log("Heading visitor called");
            console.log("Heading node:", node);
          },
          root(node) {
            console.log("root visitor called");
            console.log("root node:", node);
          },
          heading(node) {
            console.log("heading visitor called");
            console.log("heading node:", node);
          },
        };
      },
      meta: { type: "problem" },
    },
  },
};

export default defineConfig([
  ...markdown.configs.recommended.map((c) => ({
    ...c,
    files: ["**/*.md"],
  })),
  {
    files: ["**/*.md"],
    plugins: { debug: debugPlugin },
    rules: {
      "debug/test": "error",
    },
  },
]);