import { createApp, createRouter } from "./effects/h3";
import { Effect } from "effect";

const buildRoutes = createRouter([
	{
		method: "get",
		path: "/",
		handler: () => Effect.succeed("Hello World!"),
	},
	{
		method: "get",
		path: "/*",
		handler: () => Effect.succeed("Not found"),
	},
]);

export const app = Effect.gen(function* () {
	const app = yield* createApp();
	const router = yield* buildRoutes;
	app.use(router);
	return app;
});
