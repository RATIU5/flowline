import { createAuthClient } from "better-auth/svelte";

export const { signIn, signUp, useSession } = createAuthClient({
  baseURL: "http://localhost:8080",
});
