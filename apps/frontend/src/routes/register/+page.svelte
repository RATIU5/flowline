<script lang="ts">
import * as Form from "@flowline/forms";

const registerForm = Form.struct({
  displayName: Form.TextInput.Optional,
});

const form = Form.make(registerForm);

console.log(form.displayName.errors);
console.log(form.displayName.placeholder);
</script>

<div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-sm">
    <h2
      class="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900"
    >
      Register a new account
    </h2>
  </div>

  <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
    <form class="space-y-4" method="POST">
      <div>
        <label
          for={form.id}
          class="block text-sm/6 font-medium text-gray-900">
            {form.attributes.label}
          </label>
        <div class="mt-2">
          <input
            {...form.attributes}
            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
        <p class="text-xs text-red-700 mt-2 h-4">
          {#if form.error}
            {form.error}
          {/if}
        </p>
      </div>

      <div>
        <label for="email" class="block text-sm/6 font-medium text-gray-900"
          >Email address</label
        >
        <div class="mt-2">
          <input
            type="email"
            name="email"
            id="email"
            autocomplete="email"
            required
            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
        <p class="text-xs text-red-700 mt-2 h-4"></p>
      </div>

      <div>
        <div class="flex items-center justify-between">
          <label
            for="password"
            class="block text-sm/6 font-medium text-gray-900">Password</label
          >
        </div>
        <div class="mt-2">
          <input
            type="password"
            name="password"
            id="password"
            autocomplete="new-password"
            required
            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
        <p class="text-xs text-red-700 mt-2 h-4"></p>
      </div>

      <div>
        <div class="flex items-center justify-between">
          <label
            for="confirmPassword"
            class="block text-sm/6 font-medium text-gray-900"
            >Confirm Password</label
          >
        </div>
        <div class="mt-2">
          <input
            type="password"
            name="confirmPassword"
            id="confirmPassword"
            autocomplete="new-password"
            required
            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
        <p class="text-xs text-red-700 mt-2 h-4"></p>
      </div>

      <div>
        <button
          type="submit"
          class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs cursor-pointer hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >Sign up</button
        >
      </div>
    </form>

    <p class="mt-10 text-center text-sm/6 text-gray-500">
      Already a member?
      <a
        href="/login"
        class="font-semibold text-indigo-600 hover:text-indigo-500"
        >Login here</a
      >
    </p>
  </div>
</div>
