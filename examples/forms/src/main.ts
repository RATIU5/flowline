import { $ } from "bun";

console.log("Building client script...");

// Use Bun's bundler to create a single JS file for the browser
await $`bun build ./src/client.ts --outdir ./dist --target browser`;

console.log("Build complete. Starting server at http://localhost:3000");

// Use Bun's server to serve the root directory
Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    let filePath = url.pathname;

    if (filePath === "/") {
      filePath = "/index.html";
    }

    const file = Bun.file(`.${filePath}`);
    if (await file.exists()) {
      return new Response(file);
    }

    return new Response("Not Found", { status: 404 });
  },
});