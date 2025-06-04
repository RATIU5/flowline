import { HttpClient, HttpClientError } from "@effect/platform";
import { Duration, Effect, Schedule } from "effect";

export const makeProxyFetch = Effect.gen(function* () {
  const client = (yield* HttpClient.HttpClient).pipe(
    HttpClient.tapRequest((request) =>
      Effect.logDebug("Attempting proxy request", {
        url: request.url.toString(),
        method: request.method,
      }),
    ),
    HttpClient.retryTransient({
      times: 3,
      schedule: Schedule.exponential(Duration.seconds(1)).pipe(
        Schedule.jittered,
        Schedule.tapOutput((delay) =>
          Effect.logWarning(
            `Http request transient failure; retrying in ${Duration.toMillis(delay)}ms`,
          ),
        ),
      ),
    }),
  );

  const finalClient = HttpClient.make((request) =>
    client.execute(request).pipe(
      Effect.timeoutFail({
        duration: Duration.seconds(15),
        onTimeout: () =>
          new HttpClientError.RequestError({
            request,
            reason: "Transport",
            description:
              "Request timed out after all retries or during first attempt",
          }),
      }),
      Effect.filterOrFail(
        (response) => response.status >= 200 && response.status <= 300,
        (response) =>
          new HttpClientError.ResponseError({
            request,
            response,
            reason: "StatusCode",
            description: `Request failed with status ${response.status}`,
          }),
      ),
      Effect.tapErrorCause((cause) =>
        Effect.logError("Http request failed", {
          cause,
          url: request.url.toString(),
        }),
      ),
    ),
  );

  return finalClient;
});
