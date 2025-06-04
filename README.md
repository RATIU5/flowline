# Flowline

A task management and team chat platform where conversations and tasks live together. (Think Slack + Linear)

## Features

These are the current ideas that Flowline could have, which are subject to change as the project evolves.

- **Multi-user**: Support for multiple users with different roles and permissions.
- **Conversational Tasks**: Tasks that grow from chat messages naturally - no separate "create task" workflow needed.
- **Context-Aware Chat**: Smart threading that automatically links related messages, tasks, and decisions without manual tagging.
- **Intelligent Task Creation**: Task extracts, due dates, and assignees from natural conversation ("Can you review the design by Friday?" becomes a task).
- **Unified Timeline**: See tasks, messages, and decisions in one chronological view - never lose track of how decisions were made.
- **Real-time**: WebSocket connections for live updates across tasks and conversations.
- **Offline-first**: Local-first data sync with conflict resolution.

## Tech Stack

This is the current tech stack to be used in Flowline, which is subject to change as the project evolves.

### Development

- **Format/Lint**: [Biome](https://biomejs.dev/)
- **Package Manager**: [Bun](https://bun.sh/)
- **Code Editor**: [Visual Studio Code](https://code.visualstudio.com/)
- **Version Control**: [Git](https://git-scm.com/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Observability**: [OpenTelemetry](https://opentelemetry.io/)
- **Monorepo**: Single repository with frontend and backend

### Web App

- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Svelte](https://svelte.dev/)
- **Meta Framework**: [SvelteKit](https://kit.svelte.dev/)
- **CSS**: [Tailwind CSS](https://tailwindcss.com/)
- **Sync & Offline**: [ElectricSQL](https://electric-sql.com/)
- **Architecture Library**: [Effect](https://effect.dev/)
- **Rendering**: Transitional (SSR + SPA)*

### Server

- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Runtime**: [Bun](https://bun.sh/)
- **Server**: [Elysia](https://elysiajs.com/)
- **Authentication**: [Better Auth](https://www.better-auth.com/)
- **Architecture Library**: [Effect](https://effect.dev/)

### Storage

- **Database**: [PostgreSQL](https://www.postgresql.org/)

### Infrastructure

- **Frontend**: [Fly.io](https://fly.io/)
- **Backend**: [Fly.io](https://fly.io/)
- **Database**: [Neon](https://neon.tech/)
- **Files**: [Bunny CDN](https://bunny.net/cdn/)

<sub>_*Initial SSR page with client hydration into a full SPA experience._</sub>

## Development

### Prerequisites

- [Bun](https://bun.sh/) (v1.2.0 or later)
- [Docker](https://www.docker.com/)

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

3. Start the database (PostgreSQL):
   ```bash
   docker compose up
   ```

4. Run the migrations:
   ```bash
   bun migrate up
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
