import js from "@eslint/js";
import parser from "@typescript-eslint/parser";
import plugin from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: {
        console: "readonly",
        process: "readonly",
        module: "readonly",
        require: "readonly",
        __dirname: "readonly",
        exports: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": plugin
    },
    rules: {
      ...plugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off",
      "no-console": "off"
    }
  },
  prettier
];
