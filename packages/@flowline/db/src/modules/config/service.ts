import type * as Redacted from "effect/Redacted";

import { FlowlineConfig } from "@flowline/config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as ServiceMap from "effect/ServiceMap";

export class DatabaseConfig extends ServiceMap.Service<
  DatabaseConfig,
  {
    readonly host: string;
    readonly name: string;
    readonly user: string;
    readonly password: Redacted.Redacted;
    readonly port: number;
  }
>()("@flowline/db/config/DatabaseConfig") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const appConfig = yield* FlowlineConfig;
      return {
        host: appConfig.dbHost,
        name: appConfig.dbName,
        user: appConfig.dbUser,
        password: appConfig.dbPswd,
        port: appConfig.dbPort,
      };
    }),
  );
}
