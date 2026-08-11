import { PUBLIC_BASE_URL } from "$env/static/public";
import { apiV1 } from "@flowline/api/api";
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";
import { FetchHttpClient } from "effect/unstable/http";
import { HttpApiClient } from "effect/unstable/httpapi";

export class ApiClient extends Context.Service<
  ApiClient,
  HttpApiClient.ForApi<typeof apiV1.Api>
>()("frontend/lib/client/effects/api-client/ApiClient") {
  static readonly layer = Layer.effect(
    ApiClient,
    HttpApiClient.make(apiV1.Api, { baseUrl: PUBLIC_BASE_URL }),
  ).pipe(Layer.provide(FetchHttpClient.layer));
}
