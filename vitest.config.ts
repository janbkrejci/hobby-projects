import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "src/components/mode-toggle.tsx",
        "src/components/theme-provider.tsx",
        "src/app/layout.tsx",
        "src/app/page.tsx",
        "src/lib/utils.ts",
        "src/lib/sudoku/**/*.{ts,tsx}",
      ],
      exclude: [
        "src/lib/genetic-core/**",
        "src/lib/genetic-sudoku/**",
        "src/lib/morphic-widgets/**",
        "src/components/ui/**",
        "src/app/genetic-sudoku/**",
        "src/app/morphic-widgets/**",
      ],
      thresholds: {
        lines: 100,
        statements: 100,
        functions: 100,
        branches: 100,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
