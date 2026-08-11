import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      "@template/basic": `${import.meta.dirname}/src`,
      "@template/basic/test": `${import.meta.dirname}/test`,
    },
  },
  test: {
    globals: true,
    include: ["./test/**/*.test.ts"],
    setupFiles: [`${import.meta.dirname}/setup-tests.ts`],
  },
});
