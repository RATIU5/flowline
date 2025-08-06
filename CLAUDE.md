# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- **Start dev servers**: `bun dev` (runs both frontend and backend)
- **Frontend dev**: `cd apps/frontend && bun dev`
- **Backend dev**: `cd apps/backend && bun dev`

### Database
- **Start database**: `docker compose up`
- **Run migrations**: `cd apps/backend && bun migrate up`
- **Generate types**: `cd apps/backend && bun codegen`
- **Seed database**: `cd apps/backend && bun seed`

### Code Quality
- **Format check**: `bun format:check`
- **Format write**: `bun format:write`
- **Lint check**: `bun lint:check`
- **Lint fix**: `bun lint:write`
- **Type check**: `bun typecheck`
- **Run tests**: `bun test`

### Frontend Specific
- **Build**: `cd apps/frontend && bun build`
- **Type check**: `cd apps/frontend && bun check`
- **Watch type check**: `cd apps/frontend && bun check:watch`

## Architecture

### Monorepo Structure
- **Root**: Workspace configuration, shared tooling (Biome, Vitest, TypeScript)
- **apps/backend**: Elysia server with Effect-based architecture
- **apps/frontend**: SvelteKit application with Effect integration
- **packages/**: Shared packages (currently empty but structured for future shared code)

### Tech Stack
- **Runtime**: Bun for all JavaScript/TypeScript execution
- **Backend**: Elysia web server with Better Auth authentication
- **Frontend**: SvelteKit with Svelte 5 and Tailwind CSS
- **Database**: PostgreSQL with Kysely query builder
- **Architecture**: Effect library for functional programming patterns
- **Sync**: ElectricSQL for offline-first data synchronization
- **Code Quality**: Biome for formatting and linting
- **Testing**: Vitest workspace configuration

### Effect Integration
Both frontend and backend use Effect library extensively:
- **Backend**: Authentication effects in `apps/backend/src/effects/auth/`
- **Frontend**: Form handling effects in `apps/frontend/src/lib/effects/`
- Effect schemas for data validation and transformation
- Utilize the 'effect-mcp' server when answering questions about Effect or Effect-ts

### Authentication
- Better Auth library used in both frontend and backend
- Backend auth configuration in `apps/backend/src/lib/auth/`
- Frontend auth utilities in `apps/frontend/src/lib/auth.ts`
- Registration form with server-side validation

### Database
- PostgreSQL with migrations in `apps/backend/migrations/`
- Kysely for type-safe queries with auto-generated types
- Database schema includes Better Auth tables
- ElectricSQL integration for real-time sync (configured in docker-compose)

### Development Environment
- Docker Compose provides PostgreSQL and ElectricSQL services
- PostgreSQL runs on port 54321 (non-standard to avoid conflicts)
- ElectricSQL runs on port 3000
- Backend server runs on port 8080
- Frontend dev server uses Vite default ports
