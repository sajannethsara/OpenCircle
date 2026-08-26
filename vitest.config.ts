/**
 * vitest.config.ts
 *
 * Vitest configuration for the OpenCircle ranking system unit tests.
 *
 * Uses the 'node' environment (no DOM/IndexedDB needed for ranking-engine tests).
 * Path aliases are mapped to match tsconfig.json.
 */

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    // Provide a readable reporter for CI and terminal output
    reporter: ["verbose"],
    coverage: {
      provider: "v8",
      include: ["src/lib/ranking/**/*.ts"],
      exclude: ["src/lib/ranking/__tests__/**"],
    },
  },
  resolve: {
    alias: {
      // Mirror tsconfig.json paths so @/ imports resolve correctly
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
