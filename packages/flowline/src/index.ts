import { toWebHandler } from "h3";
import { app } from "./app";
import { Effect, Logger } from "effect";
import { BunLogger, LogOptions } from "./effects/logger";

const program = Effect.gen(function* () {
  const mainApp = yield* app;
  const server = Bun.serve({
    port: 3000,
    fetch: (req) => toWebHandler(mainApp)(req),
  });
  yield* Effect.logInfo(
    `Server listening on http://localhost:${server.port}`,
  ).pipe(Effect.provideService(LogOptions, { style: "none" }));
});

const programWithLogger = Effect.gen(function* () {
  const logger = yield* BunLogger;
  return yield* program.pipe(
    Effect.provide(Logger.replace(Logger.defaultLogger, logger)),
  );
}).pipe(Effect.provideService(LogOptions, { style: "basic" }));

Effect.runPromise(programWithLogger);
