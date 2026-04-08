import { AppConfig } from "@flowline/config/app";
import { DatabasePool } from "@flowline/db/pool";
import { betterAuth } from "better-auth";
import * as Effect from "effect/Effect";

export const AuthEffect = Effect.gen(function* () {
  const pool = yield* DatabasePool;
  const config = yield* AppConfig;

  const trimmedUrlString = config.general.clientUrl.toString().endsWith("/")
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
