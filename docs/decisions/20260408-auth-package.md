# Split Auth to a Dedicated Package

**Date:** 2026-04-08 | **Phase:** 2

## What & Why

Split the auth functionality out of the server into it's own package `@flowline/auth`. The goal is to create a sparation of responsibility and to keep things more modular. Previously it was hard to communicate the right database schema from the auth if it was tied to the backend server only. This way, it also exposes both client and server functions to be used in both contexts.

## Alternatives

- **Keep Auth in Server** — avoided for better composability and to avoid requiring the better-auth package in two places

## Tradeoffs

This expects the auth package to be used in different places, and that the project stays composable. This may be premature optimization to some, but I find the benefits outweight the cons at this time.

## Impact

This allows for increased flexibility and composability/de-coupling to allow for easy extendability of services in the future.
