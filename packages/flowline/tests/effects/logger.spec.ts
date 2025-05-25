import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { Effect, LogLevel, Logger } from "effect";
import { BunLogger, LogOptions } from "../../src/effects/logger";

// Mock Bun.stdout.write
const writeMock = vi.fn();

// TODO: Use different mock for BunLogger, or use node for testing on CI
describe.runIf(globalThis.Bun?.stdout)("BunLogger", () => {
  beforeAll(() => {
    Object.defineProperty(globalThis.Bun.stdout, "write", {
      value: writeMock,
      writable: true,
      configurable: true,
    });
  });

  beforeEach(() => {
    writeMock.mockClear();
  });

  it("logs in 'raw' style by default", async () => {
    await Effect.runPromise(
      Effect.flatMap(BunLogger, (logger) =>
        Effect.logInfo("Test message").pipe(
          Effect.provide(Logger.replace(Logger.defaultLogger, logger)),
        ),
      ),
    );
    expect(writeMock).toHaveBeenCalledWith("Test message\n");
  });

  it("logs in 'basic' style", async () => {
    await Effect.runPromise(
      Effect.flatMap(BunLogger, (logger) =>
        Effect.logInfo("Test message").pipe(
          Effect.provideService(LogOptions, { style: "basic" }),
          Effect.provide(Logger.replace(Logger.defaultLogger, logger)),
        ),
      ),
    );
    expect(writeMock).toHaveBeenCalledWith(
      "\u001B[2m[\u001B[22m\u001B[34mINFO\u001B[39m\u001B[2m]\u001B[22m Test message\n",
    );
  });

  it("logs in 'debug' style with annotations and with debug mode", async () => {
    await Effect.runPromise(
      Effect.flatMap(BunLogger, (logger) =>
        Effect.logDebug("Test message").pipe(
          Effect.annotateLogs({
            foo: "bar",
            _internal: "shouldBeFiltered",
          }),
          Effect.provideService(LogOptions, { style: "debug" }),
          Effect.provide(Logger.replace(Logger.defaultLogger, logger)),
        ),
      ).pipe(Logger.withMinimumLogLevel(LogLevel.Debug)),
    );
    const output = writeMock.mock.calls[0][0];
    expect(output).toMatch(/DEBUG/);
    expect(output).toMatch(/Test message/);
    expect(output).toMatch(/foo=bar/);
    expect(output).not.toMatch(/_internal/);
    expect(output).not.toMatch(/style=shouldBeFiltered/);
    expect(output.endsWith("\n")).toBe(true);
  });

  it("logs in 'basic' style with annotations", async () => {
    await Effect.runPromise(
      Effect.flatMap(BunLogger, (logger) =>
        Effect.logInfo("Test message").pipe(
          Effect.annotateLogs({
            foo: "bar",
            _internal: "shouldBeFiltered",
          }),
          Effect.provideService(LogOptions, { style: "basic" }),
          Effect.provide(Logger.replace(Logger.defaultLogger, logger)),
        ),
      ),
    );
    expect(writeMock).toHaveBeenCalledWith(
      "\u001B[2m[\u001B[22m\u001B[34mINFO\u001B[39m\u001B[2m]\u001B[22m Test message foo=bar\n",
    );
  });

  it("filters out annotation keys starting with _", async () => {
    await Effect.runPromise(
      Effect.flatMap(BunLogger, (logger) =>
        Effect.logInfo("Test message").pipe(
          Effect.annotateLogs({
            foo: "bar",
            _shouldNotShow: "hidden",
            visible: 123,
          }),
          Effect.provideService(LogOptions, { style: "basic" }),
          Effect.provide(Logger.replace(Logger.defaultLogger, logger)),
        ),
      ),
    );
    const output = writeMock.mock.calls[0][0];
    expect(output).toMatch(/foo=bar/);
    expect(output).toMatch(/visible=123/);
    expect(output).not.toMatch(/_shouldNotShow/);
  });

  it("handles no annotations gracefully", async () => {
    await Effect.runPromise(
      Effect.flatMap(BunLogger, (logger) =>
        Effect.logInfo("Test message").pipe(
          Effect.provideService(LogOptions, { style: "basic" }),
          Effect.provide(Logger.replace(Logger.defaultLogger, logger)),
        ),
      ),
    );
    const output = writeMock.mock.calls[0][0];
    expect(output).toMatch(/Test message/);
    expect(output.trim().endsWith("Test message")).toBe(true);
  });

  it("logs non-string messages (numbers, objects)", async () => {
    await Effect.runPromise(
      Effect.flatMap(BunLogger, (logger) =>
        Effect.logInfo({ foo: "bar" }).pipe(
          Effect.provideService(LogOptions, { style: "basic" }),
          Effect.provide(Logger.replace(Logger.defaultLogger, logger)),
        ),
      ),
    );
    const output = writeMock.mock.calls[0][0];
    expect(output).toMatch(/\{"foo":"bar"\}/);
  });
});
