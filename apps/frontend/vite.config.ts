import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { minwind } from "minwind";
import { effect } from "svelte-effect-runtime";
import { compose } from "svelte-plugin-composer";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: compose([
    effect(),
    minwind(),
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        experimental: {
          async: true,
        },
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
      },
      experimental: {
        remoteFunctions: true,
      },
    }),
  ]),
});
