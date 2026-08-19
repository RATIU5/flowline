import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { minwind } from "minwind";
import { effect } from "svelte-effect-runtime";
import { compose } from "svelte-plugin-composer";
import { defineConfig } from "vite";

export default defineConfig({
  // Two @sveltejs/kit installs exist (peer skew between the app and
  // svelte-effect-runtime). SER then throws a `Redirect` built by the *other*
  // copy, SvelteKit's `instanceof` check misses it, and every redirect becomes
  // a 500. Force one instance.
  resolve: { dedupe: ["@sveltejs/kit", "svelte"] },
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
