import { HttpApi } from "effect/unstable/httpapi";

import { Space } from "./space";

export * from "./space";

export const Api = HttpApi.make("flowline-v1").add(Space).prefix("/api/v1");
