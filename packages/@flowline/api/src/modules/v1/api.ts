import { HttpApi } from "effect/unstable/httpapi";

import { SpaceGroup } from "./space";

export * from "./authorization";
export * from "./space";

export const Api = HttpApi.make("flowline-v1")
  .add(SpaceGroup)
  .prefix("/api/v1");
