import type * as Redacted from "effect/Redacted";

import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as ServiceMap from "effect/ServiceMap";

export class FlowlineConfig extends ServiceMap.Service<
  FlowlineConfig,
  {
    readonly dbHost: string;
    readonly dbName: string;
    readonly dbUser: string;
    readonly dbPassword: Redacted.Redacted;
    readonly dbPort: number;
    readonly betterAuthSecret: Redacted.Redacted;
    readonly betterAuthUrl: URL;
  }
>()("@flowline/config/modules/core/core.service/FlowlineConfig") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const dbHost = yield* Config.string("DB_HOST");
      const dbPort = yield* Config.number("DB_PORT");
      const dbUser = yield* Config.string("DB_USER");
      const dbPswd = yield* Config.redacted("DB_PASSWORD");
      const dbName = yield* Config.string("DB_NAME");
      const betterAuthSecret = yield* Config.redacted("BETTER_AUTH_SECRET");
      const betterAuthUrl = yield* Config.url("BETTER_AUTH_URL");

      return {
        betterAuthSecret,
        betterAuthUrl,
        dbHost,
        dbName,
        dbPort,
        dbPassword: dbPswd,
        dbUser,
      };
    }),
  );
}
