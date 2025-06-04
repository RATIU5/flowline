import adapter from "svelte-adapter-bun";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      out: "build",
      assets: true,
      envPrefix: "FLOWLINE_",
      development: process.env.NODE_ENV === "development",
    }),
  },
};

export default config;
