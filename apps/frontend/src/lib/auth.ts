import { createAuthClient } from "better-auth/svelte";

export const { signIn, signOut, useSession } = createAuthClient({
  baseURL: "http://localhost:5173",
});
