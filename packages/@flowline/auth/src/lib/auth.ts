import { AppConfig } from "@flowline/config/app";
import { DatabasePool } from "@flowline/db/pool";
import { betterAuth } from "better-auth";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

export const AuthEffect = Effect.gen(function* () {
  const pool = yield* DatabasePool,
    config = yield* AppConfig,
    trimmedUrlString = config.general.clientUrl.toString().endsWith("/")
      ? config.general.clientUrl.toString().slice(0, -1)
      : config.general.clientUrl.toString();

  return betterAuth({
    trustedOrigins: [trimmedUrlString],
    baseURL: {
      allowedHosts: [config.auth.url.toString()],
    },
    emailAndPassword: {
      enabled: true,
    },
    database: pool,
  });
});

export class Auth extends Context.Service<
  Auth,
  Effect.Success<typeof AuthEffect>
>()("@flowline/auth/lib/auth/Auth") {
  static readonly layer = Layer.effect(this, AuthEffect.pipe(Effect.orDie));
}
