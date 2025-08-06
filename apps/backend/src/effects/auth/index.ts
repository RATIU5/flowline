import { Effect } from "effect";
import { auth } from "../../lib/auth";

interface SignUpUserData {
  name: string;
  email: string;
  password: string;
}

const signUpUser = async (data: SignUpUserData) =>
  Effect.tryPromise({
    try: () =>
      auth.api.signUpEmail({
        body: {
          name: data.name,
          email: data.email,
          password: data.password,
        },
      }),
    catch: (error) => {
      console.error("Sign up error:", error);
      return Effect.fail(new Error("Failed to sign up user"));
    },
  });
