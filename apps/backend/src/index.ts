import { Elysia } from "elysia";
import { authRoutes } from "./lib/routes/auth";

const app = new Elysia()
  .get("/", () => "Hello Elysia 2")
  .use(authRoutes)
  .listen(8080);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
