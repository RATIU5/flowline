import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Effect, Layer, Schema } from "effect";
import { HttpRouter } from "effect/unstable/http";
import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
} from "effect/unstable/httpapi";

class ThingNotFound extends Schema.TaggedErrorClass<ThingNotFound>()(
  "ThingNotFound",
  {
    message: Schema.String,
  },
  { httpApiStatus: 404 },
) {}

const ThingEndpoint = HttpApiGroup.make("thing").add(
  HttpApiEndpoint.get("getThing", "/thing", {
    success: Schema.Struct({
      thing: Schema.Boolean,
    }),
    error: Schema.Union([ThingNotFound /* ... */]),
  }),
);

const Api = HttpApi.make("flowline-v1").add(ThingEndpoint).prefix("/api/v1");

const ThingHandlers = HttpApiBuilder.group(Api, "thing", (handlers) =>
  handlers.handle("getThing", () =>
    Effect.gen(function* () {
      if (false) {
        return {
          thing: true,
        };
      }
      return new ThingNotFound({ message: "failed to get thing" });
    }),
  ),
);

const ThingApiLive = HttpApiBuilder.layer(Api).pipe(
  Layer.provide(ThingHandlers),
);

export const Routes = Layer.mergeAll(
  // ...
  ThingApiLive,
);

const ServerLive = NodeRuntime.layer({ port: 3000 });
HttpRouter.serve(Routes).pipe(
  Layer.provide(ServerLive),
  Layer.launch,
  NodeRuntime.runMain,
);

const program = Effect.gen(function* () {
  yield* Effect.log("Welcome to the Effect Playground!");
}).pipe(
  Effect.withSpan("program", {
    attributes: { source: "Playground" },
  }),
);

program.pipe(NodeRuntime.runMain);
