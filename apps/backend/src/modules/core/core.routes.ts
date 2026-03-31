import { HttpServerResponse } from "effect/unstable/http";
import * as HttpRouter from "effect/unstable/http/HttpRouter";

export const RootRoute = HttpRouter.add(
  "*",
  "/",
  HttpServerResponse.text("Hello, world!"),
);
