// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user: any; // Replace with your user type
      session: any; // Replace with your session type
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
