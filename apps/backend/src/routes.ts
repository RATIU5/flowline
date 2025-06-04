import Elysia from "elysia";
import { ELECTRICSQL_URL } from "./utils/constants";
import { Effect } from "effect";
import { FetchHttpClient } from "@effect/platform";
import { makeProxyFetch } from "./effects/proxy-fetch";

export const routes = new Elysia().get("/shape", async (c) => {
  Effect.runPromise(
    Effect.gen(function* () {
      const request = c.request;
      const originUrl = new URL(`${ELECTRICSQL_URL}/v1/shape`);
      const url = new URL(request.url);
      for (const [value, key] of url.searchParams) {
        originUrl.searchParams.set(key, value);
      }
      const client = yield* makeProxyFetch;
      const response = yield* client.get(originUrl.toString(), {
        ...request,
        headers: {
          ...request.headers,
        },
      });
      return response;
    }).pipe(
      Effect.provide(FetchHttpClient.layer),
      Effect.catchTag("RequestError", (error) =>
        Effect.succeed({
          error: `Request failed: ${error.message}`,
        }),
      ),
      Effect.catchTag("ResponseError", (error) =>
        Effect.succeed({
          error: `Response failed: ${error.message}`,
        }),
      ),
    ),
  );
});
