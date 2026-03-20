import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      "@template/basic": path.join(__dirname, "src"),
      "@template/basic/test": path.join(__dirname, "test"),
    },
  },
  test: {
    globals: true,
    include: ["./test/**/*.test.ts"],
    setupFiles: [path.join(__dirname, "setup-tests.ts")],
  },
});
