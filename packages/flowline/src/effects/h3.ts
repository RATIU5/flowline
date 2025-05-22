import { Effect } from "effect";
import {
	createApp as h3_createApp,
	createRouter as h3_createRouter,
	defineEventHandler as h3_defineEventHandler,
	type H3Event,
	type EventHandler,
	type EventHandlerRequest,
	type EventHandlerResponse,
} from "h3";

export interface Routes {
	method: "get" | "post" | "put" | "delete" | "patch";
	path: string;
	handler: (
		request: H3Event<EventHandlerRequest>,
	) => Effect.Effect<EventHandlerResponse>;
}

export const defineEffectHandler = (
	handler: (
		event: H3Event<EventHandlerRequest>,
	) => Effect.Effect<EventHandlerResponse, never>,
): EventHandler =>
	h3_defineEventHandler((event) => handler(event).pipe(Effect.runPromise));

export const createApp = () => Effect.sync(() => h3_createApp());

export const createRouter = (routes: Routes[]) =>
	Effect.gen(function* () {
		const router = yield* Effect.sync(() => h3_createRouter());
		for (const { method, path, handler } of routes) {
			router[method](path, defineEffectHandler(handler));
		}
		return router;
	});
