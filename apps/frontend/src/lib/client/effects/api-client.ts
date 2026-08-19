import { PUBLIC_BASE_URL } from "$env/static/public";
import { apiV1 } from "@flowline/api/api";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
} from "effect/unstable/http";
import { HttpApiClient } from "effect/unstable/httpapi";
import { RequestEvent } from "svelte-effect-runtime/server";

/**
 * Typed client for the v1 API. Built once by the server runtime; each call
 * forwards the current request's cookies so the API sees the caller's session.
 */
export class ApiClient extends Context.Service<
  ApiClient,
  HttpApiClient.ForApi<typeof apiV1.Api, never, RequestEvent>
>()("frontend/lib/client/effects/api-client/ApiClient") {
  static readonly layer = Layer.effect(
    ApiClient,
    Effect.gen(function* () {
      const httpClient = (yield* HttpClient.HttpClient).pipe(
        HttpClient.mapRequestEffect((request) =>
          Effect.gen(function* () {
            const event = yield* RequestEvent;
            return HttpClientRequest.setHeader(
              request,
              "cookie",
              event.request.headers.get("cookie") ?? "",
            );
          }),
        ),
      );

      return yield* HttpApiClient.makeWith(apiV1.Api, {
        httpClient,
        baseUrl: PUBLIC_BASE_URL,
      });
    }),
  ).pipe(Layer.provide(FetchHttpClient.layer));
}
