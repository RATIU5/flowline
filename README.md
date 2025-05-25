# Flowline

A multi-user task/project system augmented with customizable workflows. (Think Linear + Zapier)

## Features

These are the current ideas that Flowline could have, which are subject to change as the project evolves.

- **Multi-user**: Support for multiple users with different roles and permissions.
- **Customizable Workflows**: Create and manage workflows that can be tailored to specific project needs.
- **Task Management**: Create, assign, and track tasks within projects.
- **Integrations**: Connect with external services to automate workflows (e.g., Zapier-like functionality).

## Tech Stack

This is the current tech stack to be used in Flowline, which is subject to change as the project evolves.

### Web App

- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Svelte](https://svelte.dev/)
- **Meta Framework**: [SvelteKit](https://kit.svelte.dev/)
- **Local Database**: [libSQL](https://turso.tech/blog/turso-offline-sync-public-beta)
- **Rendering**: Transitional (SSR + SPA)

### Server

- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Runtime**: [Bun](https://bun.sh/)
- **Server**: [Elysia](https://elysiajs.com/)
- **Authentication**: [Better Auth](https://www.better-auth.com/)
- **Architecture Library**: [Effect](https://effect.dev/)

### Storage

- **Database**: [libSQL](https://turso.tech/libsql)

### Infrastructure

- **Frontend**: [Fly.io](https://fly.io/)
- **Backend**: [Fly.io](https://fly.io/)
- **Database**: [Turso](https://turso.tech/)

## Development

### Prerequisites

- [Bun](https://bun.sh/) (v1.2.0 or later)
- [libSQL](https://turso.tech/libsql) (for local development)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/RATIU5/flowline.git
   cd flowline
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

### Development

To start the development servers (frontend & backend), run:
```bash
bun dev
```

## Why

This is a personal project to learn more about the [Effect](https://effect.dev) ecosystem by building a complete real-world application, from the frontend to the hosting infrastructure.

## License

[MIT](LICENSE)
