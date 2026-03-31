# Progress Tracker

_This document is updated after each PR_

## Phase 1: WebSocket Connection

**Status:** Completed
**Started:** Jan 16, 2026

### Goals:

- [x] Use Effect throughout WebSocket and server
- [x] Create a web server with Effect
- [x] Setup server to accept websocket connection
- [x] Client connection handling
- [x] Client can send messages to global chat

### Decisions Made:

- [20260114-use-effect.md](decisions/20260114-use-effect.md)
- [20260115-httprouterlayer.md](decisions/20260115-httprouterlayer.md)
- [20260319-effect-4-oxc.md](decisions/20260319-effect-4-oxc.md)

## Phase 2: User Authentication

**Status:** In Progress
**Started:** Mar 23, 2026

### Goals:

- [x] Pick a database (PostgreSQL)
- [x] Setup Effect services for database access
- [x] Setup Kysely for type-safe query-building
- [x] Setup routes for authentication and handlers
- [ ] Setup basic UI for logging in/out and messaging with profiles
- [ ] Separate messages to dedicated user accounts

### Decisions Made:

- [20260326-kysely-pg.md](decisions/20260326-kysely-pg.md)
- [20260331-module-architecture.md](decisions/20260331-module-architecture.md)
