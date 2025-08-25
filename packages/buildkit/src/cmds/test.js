import path from "node:path";
import { $ } from "bun";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import chalk from "chalk";

// DateTime format for logging
/**
 * @type {Intl.DateTimeFormat}
 */
const dt = new Intl.DateTimeFormat("en-us", {
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Run tests using Bun's test runner.
 * @param {string[]} args - The command line arguments for the test command.
 */
export default async function test(args) {
  const parsedArgs = parseArgs({
    args,
    allowPositionals: true,
    options: {
      // Bun test options
      match: { type: "string", alias: "m" },
      only: { type: "boolean", alias: "o" },
      parallel: { type: "boolean", alias: "p" },
      watch: { type: "boolean", alias: "w" },
      timeout: { type: "string", alias: "t" },
      setup: { type: "string", alias: "s" },
      teardown: { type: "string" },
    },
  });

  // Find the package.json file in the current directory
  // and read it to get the project name
  const packageJSONPath = path.resolve("./package.json");
  let packageJSON;
  try {
    packageJSON = await Bun.file(packageJSONPath).json();
  } catch (error) {
    throw new Error(`Failed to read package.json: ${error.message}`);
  }

  console.log(
    `${chalk.dim(`[${dt.format(new Date())}]`)} Running tests for ${chalk.bold(packageJSON.name)}...\n`,
  );

  const start = Date.now();

  const pattern = parsedArgs.positionals[0];
  if (!pattern) throw new Error("Missing test glob pattern");

  // Build bun test command
  const bunTestArgs = ["test"];

  if (pattern) bunTestArgs.push(pattern);
  if (parsedArgs.values.match)
    bunTestArgs.push("--test-name-pattern", parsedArgs.values.match);
  if (parsedArgs.values.only) bunTestArgs.push("--only");
  if (parsedArgs.values.watch) bunTestArgs.push("--watch");
  if (parsedArgs.values.timeout)
    bunTestArgs.push("--timeout", parsedArgs.values.timeout);
  if (!parsedArgs.values.parallel) bunTestArgs.push("--concurrent", "1");

  const teardownModule = parsedArgs.values.teardown
    ? await import(
        pathToFileURL(path.resolve(parsedArgs.values.teardown)).toString()
      )
    : undefined;

  try {
    const result = await $`bun ${bunTestArgs}`.quiet();

    const testPassed = result.exitCode === 0;
    teardownModule?.default(testPassed);

    const end = Date.now();
    console.log(
      `\n${chalk.dim(`[${dt.format(new Date())}]`)} Tests for ${chalk.bold(packageJSON.name)} completed in ${((end - start) / 1000).toFixed(2)} seconds. ${
        testPassed
          ? chalk.green("All tests passed!")
          : chalk.red("Some tests failed!")
      }`,
    );

    if (!testPassed) {
      process.exitCode = 1;
    }
  } catch (error) {
    const end = Date.now();
    console.error(`Test execution failed: ${error.message}`);
    console.log(
      `\n${chalk.dim(`[${dt.format(new Date())}]`)} Tests for ${chalk.bold(packageJSON.name)} failed in ${((end - start) / 1000).toFixed(2)} seconds. ${chalk.red("Test runner error!")}`,
    );
    process.exitCode = 1;
  }
}
