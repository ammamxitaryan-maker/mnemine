import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { 
    ignores: [
      "dist", 
      "node_modules", 
      "client/dist", 
      "server/dist",
      "**/*.test.ts",
      "**/*.test.js",
      "**/__tests__/**",
      "**/node_modules/**",
      "**/build/**",
      "**/coverage/**",
      "**/.next/**",
      "**/out/**",
      "**/public/**",
      "**/static/**",
      "**/vendor/**"
    ] 
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        ...globals.browser,
      },
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        project: ["./client/tsconfig.json", "./server/tsconfig.json", "./cursor-autopilot/tsconfig.json"],
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { "allow": ["warn", "error", "log"] }],
      "no-empty": ["error", { "allowEmptyCatch": true }],
      "prefer-const": "warn",
      "no-var": "warn",
      "prefer-rest-params": "warn",
      "prefer-spread": "warn",
      "no-prototype-builtins": "warn",
      "@typescript-eslint/no-this-alias": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "no-cond-assign": "warn",
      "no-self-assign": "warn",
      "no-useless-escape": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "no-constant-condition": "warn",
    },
  },
);
