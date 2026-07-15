import { BunFileSystem } from "@effect/platform-bun";
import { AppConfig } from "@flowline/config/app";
import { DatabasePool } from "@flowline/db/pool";
import * as Layer from "effect/Layer";

export const FlowlineConfigLayer = AppConfig.layer.pipe(
  Layer.provide(BunFileSystem.layer),
);

export const DBAndConfigLayer = Layer.provide(
  DatabasePool.layer,
  FlowlineConfigLayer,
);
