import { BunFileSystem } from "@effect/platform-bun";
import { DatabaseConfig, FlowlineConfig } from "@flowline/config";
import { DatabasePool } from "@flowline/db/pool";
import * as Layer from "effect/Layer";

const FlowlineConfigLayer = FlowlineConfig.layer.pipe(
  Layer.provide(BunFileSystem.layer),
);
const DatabaseConfigLayer = DatabaseConfig.layer.pipe(
  Layer.provide(FlowlineConfigLayer),
);
export const DatabasePoolLayer = Layer.provide(
  DatabasePool.layer,
  DatabaseConfigLayer,
);
