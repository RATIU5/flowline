// See https://svelte.dev/docs/kit/types#app.d.ts
// For information about these interfaces

declare global {
  namespace App {
    // Interface Error {}
    interface Locals {
      user:
        | {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
          }
        | undefined;
    }
    // Interface PageData {}
    // Interface PageState {}
    // Interface Platform {}
  }
}

declare module "*.svg" {
  const content: string;
  export default content;
}

// oxlint-disable-next-line unicorn/require-module-specifiers
export {};
