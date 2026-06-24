import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  {
    ignores: [".next/**", "node_modules/**", "legacy-app/**", "legacy-components/**", "legacy-lib/**"],
  },
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["src/api/**/*.ts", "src/services/**/*.ts", "src/hooks/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error"
    }
  }
];

export default config;
