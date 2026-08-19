import { Auth } from "@flowline/auth/shared";
import * as Layer from "effect/Layer";

import { DBAndConfigLayer, FlowlineConfigLayer } from "./layers";

/** One better-auth instance (and one database pool) for the whole server. */
export const AuthLive = Auth.layer.pipe(
  Layer.provide([DBAndConfigLayer, FlowlineConfigLayer]),
);
