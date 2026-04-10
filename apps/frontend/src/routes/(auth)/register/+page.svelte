<script lang="ts">
import * as Effect from "effect/Effect";
import { goto } from "$app/navigation";
import { PUBLIC_BASE_URL } from "$env/static/public";
import { AuthClient } from "$lib/client/effects/auth";

let name = $state("");
let email = $state("");
let password = $state("");
let confirmPassword = $state("");
let error = $state("");
let loading = $state(false);

const HandleSubmitEffect = Effect.fn("@flowline/backend/HandleSubmitEffect")(
  function* (e: Event) {
    const auth = yield* AuthClient(new URL(PUBLIC_BASE_URL));

    e.preventDefault();
    error = "";

    if (password !== confirmPassword) {
      error = "Passwords do not match.";
      return yield* Effect.void;
    }

    loading = true;

    const { error: authError } = yield* Effect.tryPromise(() =>
      auth.signUp.email(
        { name, email, password },
        {
          onSuccess: () => {
            goto("/login");
          },
        },
      ),
    ).pipe(
      Effect.catchTag("UnknownError", () =>
        Effect.succeed({
          error: {
            status: 500,
            statusText: "An internal error occurred",
            message: "An internal error occurred",
          },
        }),
      ),
    );

    if (authError) {
      error = authError.message ?? "Something went wrong.";
    }

    loading = false;

    return yield* Effect.void;
  },
);

const handleSubmit = (e: Event) =>
  HandleSubmitEffect(e).pipe(Effect.runPromise);
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
  <div
    class="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
  >
    <div class="mb-8">
      <h1 class="text-2xl font-semibold text-gray-900">Create an account</h1>
      <p class="mt-1 text-sm text-gray-500">Sign up to get started.</p>
    </div>

    <form onsubmit={handleSubmit} class="space-y-5">
      <!-- Name -->
      <div class="space-y-1.5">
        <label for="name" class="block text-sm font-medium text-gray-700"
          >Name</label
        >
        <input
          id="name"
          type="text"
          bind:value={name}
          required
          autocomplete="name"
          placeholder="Jane Doe"
          class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400
                 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
      </div>

      <!-- Email -->
      <div class="space-y-1.5">
        <label for="email" class="block text-sm font-medium text-gray-700"
          >Email</label
        >
        <input
          id="email"
          type="email"
          bind:value={email}
          required
          autocomplete="email"
          placeholder="jane@example.com"
          class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400
                 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
      </div>

      <!-- Password -->
      <div class="space-y-1.5">
        <label for="password" class="block text-sm font-medium text-gray-700"
          >Password</label
        >
        <input
          id="password"
          type="password"
          bind:value={password}
          required
          minlength="8"
          autocomplete="new-password"
          placeholder="Min. 8 characters"
          class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400
                 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
      </div>

      <!-- Confirm Password -->
      <div class="space-y-1.5">
        <label
          for="confirm-password"
          class="block text-sm font-medium text-gray-700"
        >
          Confirm password
        </label>
        <input
          id="confirm-password"
          type="password"
          bind:value={confirmPassword}
          required
          autocomplete="new-password"
          placeholder="Repeat your password"
          class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400
                 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
      </div>

      <!-- Error -->
      {#if error}
        <p
          class="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600"
        >
          {error}
        </p>
      {/if}

      <!-- Submit -->
      <button
        type="submit"
        disabled={loading}
        class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white
               transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
               disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating account…' : 'Create account'}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-gray-500">
      Already have an account?
      <a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500"
        >Sign in</a
      >
    </p>
  </div>
</div>
