# Phase 2: Auth and Database

**Completed:** 2026-04-10

## What was Built

Implemented an authentication layer so only authorized users may message in the app. This required several components working together. First, a database was setup using Kysely for query building and migrations. Second, Better Auth was setup as the authentication layer with simple email/password login method. New APIs were introduced and handled by Better Auth, and everything was wrapped to the best of our ability to ensure improved composability and error-handling practices. The UI was also updated and introduces pages for the authentication. The project files were also refactored to be more maintainable.

- [PR #19](https://github.com/RATIU5/flowline/pull/19)

## The Struggle

**What I expected**: Creating a new RpcClient.make() in each effect program would just work since they shared the same runtime and protocol layer.

**What actually happened**: The protocol only allows one active client at a time via an internal semaphore. The second client could send requests but its response-processing fiber silently blocked, so responses never arrived and the program hung with no errors.

**What I learned**: In Effect's RPC system, the client should be created once in a shared layer and accessed through the service map, not instantiated per-program. This also shifted how we think about scoping: the layer owns the client lifecycle, not individual programs.

## Key Decisions

Link decision docs + one-line summary of each:

- [Use Kysely and Postgres](../decisions/20260326-kysely-pg.md) - Chose PostgreSQL and Kysely because I know PostgreSQL best and Kysely is a robust and powerful query language for multiple SQL dialects
- [Module-based Architecture](../decisions/20260331-module-architecture.md) - Restructured project to a module-based approach to improve maintainability and clarity as the codebase grows
- [FlowlineConfig & other confis -> AppConfig](../decisions/20260408-appconfig-collapse.md) - Collapsed multiple config services to one AppConfig service
- [Better Auth for Authentication](../decisions/20260408-auth-package.md) - Chose Better Auth for powerful and flexible authentication layer
- [Auth Session Strategy](../decisions/20260408-auth-session-strategy.md) - Chose to call server APIs from client to handle auth over introducing Better Auth directly to the client
- [Module-based Architecture Part 2](../decisions/20260408-package-modules.md) - Updates packages to only export named module index files
- [SvelteKit Effect Runtime](.//decisions/20260408-sveltekit-effect-runtime.md) - Chose package to make writing Effect code in SvelteKit easier
- [New Client RPC Layer](../decisions/20260410-client-rpc-layer.md) - Created separate service layer for RPC client to fix bug

## Distributed Systems Learnings

N/A

## Open Questions

I don't know if creating a whole class-based service layer just for the RPC client was the best option. I'll need to research to see if there's better approaches.

## Interview Talking Points

- Split out service clients (db, rcp, http, etc...) from different effects into layers under one managed runtime
- The module project structure makes it easy to reason what code goes where
- Don't split the config to many config services at this stage
- Effect v4 migration and dev tools upgrade required some time to learn the new APIs and features
