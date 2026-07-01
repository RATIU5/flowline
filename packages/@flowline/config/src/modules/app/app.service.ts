import type * as Redacted from "effect/Redacted";

import * as Config from "effect/Config";
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";

export interface AppConfigShape {
  readonly general: {
    readonly clientUrl: URL;
  };
  readonly db: {
    readonly host: string;
    readonly name: string;
    readonly user: string;
    readonly password: Redacted.Redacted;
    readonly port: number;
    readonly seedEmail: string;
  };
  readonly auth: {
    readonly secret: Redacted.Redacted;
    readonly url: URL;
  };
}

export class AppConfig extends Context.Service<AppConfig, AppConfigShape>()(
  "@flowline/config/modules/app/app.service/AppConfig",
) {
  static readonly layer = Layer.effect(
    this,
    Config.all({
      clientUrl: Config.url("CLIENT_URL"),
      dbHost: Config.nonEmptyString("DB_HOST"),
      dbPort: Config.number("DB_PORT"),
      dbUser: Config.nonEmptyString("DB_USER"),
      dbPswd: Config.redacted("DB_PASSWORD"),
      dbName: Config.nonEmptyString("DB_NAME"),
      dbSeedUserEmail: Config.string("SEED_USER_EMAIL"),
      authSecret: Config.redacted("AUTH_SECRET"),
      authUrl: Config.url("AUTH_URL"),
    }).pipe(
      Config.map((config) => ({
        general: {
          clientUrl: config.clientUrl,
        },
        db: {
          host: config.dbHost,
          port: config.dbPort,
          user: config.dbUser,
          password: config.dbPswd,
          name: config.dbName,
          seedEmail: config.dbSeedUserEmail,
        },
        auth: {
          secret: config.authSecret,
          url: config.authUrl,
        },
      })),
    ),
  );
}
