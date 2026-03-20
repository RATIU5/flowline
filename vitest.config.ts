import * as path from "node:path";
import { defineConfig } from "vitest/config";

const alias = (name: string) => {
  const target = process.env.TEST_DIST !== undefined ? "dist/dist/esm" : "src";
  return {
    [`${name}/test`]: path.join(__dirname, "packages", name, "test"),
    [name]: path.join(__dirname, "packages", name, target),
  };
};

export default defineConfig({
  esbuild: {
    target: "es2020",
  },
  optimizeDeps: {
    exclude: ["bun:sqlite"],
  },
  test: {
    alias: {
      ...alias("cli"),
      ...alias("domain"),
      ...alias("server"),
    },
    fakeTimers: {
      toFake: undefined,
    },
    projects: [
      "./packages/*",
      {
        test: {
          name: "unit",
        },
      },
    ],
    sequence: {
      concurrent: true,
    },
    setupFiles: [path.join(__dirname, "setup-tests.ts")],
  },
});
