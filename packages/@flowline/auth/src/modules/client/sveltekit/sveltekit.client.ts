import { createAuthClient as ba_createAuthClient } from "better-auth/svelte";
import * as Effect from "effect/Effect";

type AuthClientInstance = ReturnType<
  typeof ba_createAuthClient<{ baseURL: string }>
>;

const createAuthClient = (url: string): AuthClientInstance =>
  ba_createAuthClient({
    baseURL: url,
  });

export const AuthClient: (
  url: URL,
) => Effect.Effect<ReturnType<typeof createAuthClient>> = (url) =>
  Effect.sync(() => createAuthClient(url.toString()));
