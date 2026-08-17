import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { minwind } from "minwind";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [minwind(), tailwindcss(), sveltekit()],
});
