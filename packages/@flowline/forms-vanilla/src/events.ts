import { Effect, Stream } from "effect";

export type EventMap = DocumentEventMap | WindowEventMap | HTMLElementEventMap;
export type EventName = keyof EventMap;

export const fromEvent = <E extends EventName>(
  target: EventTarget,
  eventName: E,
) =>
  Stream.asyncScoped<EventMap[E]>((emit) =>
    Effect.gen(function* () {
      const handler = (e: Event) => {
        void emit.single(e as EventMap[E]);
      };
      yield* Effect.acquireRelease(
        Effect.sync(() => target.addEventListener(eventName, handler)),
        () => Effect.sync(() => target.removeEventListener(eventName, handler)),
      );
    }),
  );
