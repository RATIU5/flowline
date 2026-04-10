# Auth Session Strategy

**Date:** 2026-04-08 | **Phase:** 2

## What & Why

Instead of requiring the database service or the server auth handler, the frontend makes auth calls to the backend auth handler. The frontend has middleware that sets the user locals if a session exists.

## Alternatives

- **[Require better-auth in multiple packages]** — Setup better-auth in frontend/backend

## Tradeoffs

This approach requires network hopping per request. The advantage of this is the frontend doesn't require the backend part of the auth package nor the database.

## Impact

Ideally if we ever expand the auth or replace it with a new service, the changes won't be too major. We may need to re-evaluate a more extendable interface in Effect to communicate with the core auth layer in the future.
