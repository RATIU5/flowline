import { HttpApi } from "effect/unstable/httpapi";

import { Space } from "./space/space.endpoints";

export const Api = HttpApi.make("flowline-v1").add(Space).prefix("/api/v1");
