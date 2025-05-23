#!/usr/bin/env node

import fs from "node:fs/promises";
import esbuild from "esbuild";
import glob from "fast-glob";
import { dim, gray, green, red, yellow } from "kleur/colors";

/**
 * Represents the structure of a package.json file.
 * @typedef {Object} PackageJSON
 * @property {string} type - The name of the package
 * @property {string} version - The version of the package
 * @property {Object.<string, string>} [dependencies] - Package dependencies
 * @property {Object.<string, string>} [devDependencies] - Development dependencies
 */

const dtsGen = (buildTsConfig, outDir) => ({
  name: "TypeScriptDeclarationsPlugin",
  setup(build) {
    build.onEnd((res) => {
      if (res.errors.length > 0) return;
      const date = dt.format(new Date());
      console.log(`${dim(`[${date}]`)} Generating TypeScript declarations...`);
      try {
        const r = execSync(
          `tsc --emitDeclarationOnly -p ${buildTsConfig} --outDir ./${outDir}`,
        );
        console.log(res.toString());
        console.log(
          dim(`[${date}] `) + green("√ Generated TypeScript declarations"),
        );
      } catch (error) {
        console.error(
          dim(`[${date}] `) + red(`${error}\n\n${error.stdout.toString()}`),
        );
      }
    });
  },
});

/**
 * Imports a package.json file from a given path.
 * @param {string} path
 * @returns {Promise<PackageJSON>}
 */
async function readPackageJSON(path) {
  try {
    const content = await fs.readFile(path, { encoding: "utf8" });
    try {
      return JSON.parse(content);
    } catch (parseError) {
      throw new Error(`Invalid JSON in ${path}: ${parseError.message}`);
    }
  } catch (readError) {
    throw new Error(`Failed to read ${path}: ${readError.message}`);
  }
}

async function clean(outDir, date, skip = []) {
  const files = await glob([`${outDir}/**`, ...skip], { onlyFiles: true });
  console.log(
    dim(`[${date}] `) + dim(`Cleaning ${files.length} files from ${outDir}`),
  );
  await Promise.all(files.map((file) => fs.rm(file, { force: true })));
}

function showHelp() {
  console.log(`
${green("Buildkit")} - The build tool for building TypeScript projects

${yellow("Usage:")}
  buildkit <command> [...files] [...options]

${yellow("Commands:")}
  dev     Watch files and rebuild on changes
  build   Perform a one-time build
  help    Show this help message

${yellow("Options:")}
  --no-clean-dist   Skip cleaning the dist directory
  --bundle          Enable bundling mode
  --force-cjs       Force CommonJS output format
  --tsconfig=<path> Specify TypeScript config file (default: tsconfig.json)
  --outdir=<path>   Specify output directory (default: dist)

${yellow("Examples:")}
  buildkit build "src/**/*.ts"
  buildkit dev "src/**/*.ts" --no-clean-dist
  buildkit build "src/**/*.ts" --bundle --force-cjs
`);
}

const dt = new Intl.DateTimeFormat("en-us", {
  hour: "2-digit",
  minute: "2-digit",
});

/** @type {import('esbuild').BuildOptions} */
const defaultConfig = {
  minify: false,
  format: "esm",
  platform: "node",
  target: "esnext",
  sourcemap: false,
  sourcesContent: false,
  loader: {
    ".d.ts": "copy",
    ".json": "copy",
    ".gif": "copy",
    ".jpeg": "copy",
    ".jpg": "copy",
    ".png": "copy",
    ".tiff": "copy",
    ".webp": "copy",
    ".avif": "copy",
    ".svg": "copy",
  },
};

export default async function run() {
  const [cmd, ...args] = process.argv.slice(2);
  const esbuildConfig = Object.assign({}, defaultConfig);
  const patterns = args
    .filter((f) => !!f)
    .map((f) => f.replace(/^'/, "").replace(/'$/, ""));
  const entryPoints = [].concat(
    ...(await Promise.all(
      patterns.map((p) => glob(p, { onlyFiles: true, absolute: true })),
    )),
  );
  const date = dt.format(new Date());

  const noClean = args.includes("--no-clean-dist");
  const bundle = args.includes("--bundle");
  const forceCJS = args.includes("--force-cjs");
  const buildTsConfig =
    args.find((arg) => arg.startsWith("--tsconfig="))?.split("=")[1] ??
    "tsconfig.json";
  const outDir =
    args.find((arg) => arg.startsWith("--outdir="))?.split("=")[1] ?? "dist";

  const { type = "module", dependencies = {} } =
    await readPackageJSON("./package.json");
  const format = type === "module" && !forceCJS ? "esm" : "cjs";

  switch (cmd) {
    case "dev": {
      if (!noClean) {
        console.log(
          `${dim(`[${date}]`)} Cleaning ${outDir} directory... ${dim(`(${entryPoints.length} files found)`)}`,
        );
        await clean(outDir, date, [`!${outDir}/**/*.d.ts`]);
      }

      const rebuildPlugin = {
        name: "dev:rebuild",
        setup(build) {
          build.onEnd(async (res) => {
            if (res?.errors.length) {
              const errMsg = res.errors.join("\n");
              console.error(dim(`[${date}] `) + red(errMsg));
            } else {
              if (res.warnings.length) {
                console.info(
                  dim(`[${date}] `) +
                    yellow(
                      `! updated with warnings:\n${res.warnings.join("\n")}`,
                    ),
                );
              }
              console.info(dim(`[${date}] `) + green("√ updated"));
            }
          });
        },
      };

      const builder = await esbuild.context({
        ...esbuildConfig,
        entryPoints,
        outdir: outDir,
        format,
        sourcemap: "linked",
        plugins: [rebuildPlugin],
      });

      console.log(
        `${dim(`[${date}] `) + gray("Watching for changes...")} ${dim(`(${entryPoints.length} files found)`)}`,
      );
      await builder.watch();

      process.on("beforeExit", () => {
        builder.stop?.();
      });
      break;
    }
    case "build": {
      if (!noClean) {
        console.log(
          `${dim(`[${date}]`)} Cleaning ${outDir} directory... ${dim(`(${entryPoints.length} files found)`)}`,
        );
        await clean(outDir, date, [`!${outDir}/**/*.d.ts`]);
      }
      console.log(
        `${dim(`[${date}]`)} Building...${bundle ? "(Bundling)" : ""} ${dim(`(${entryPoints.length} files found)`)}`,
      );

      await esbuild.build({
        ...esbuildConfig,
        bundle,
        external: bundle ? Object.keys(dependencies) : undefined,
        entryPoints,
        outdir: outDir,
        outExtension: forceCJS ? { ".js": ".cjs" } : {},
        format,
        plugins: [dtsGen(buildTsConfig, outDir)],
      });
      console.log(dim(`[${date}] `) + green("√ Build Complete"));
      break;
    }
    case "help": {
      showHelp();
      break;
    }
    default: {
      showHelp();
    }
  }
}

run();
