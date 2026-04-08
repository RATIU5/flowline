# Use sveltekit-effect-runtime Package in Frontend

**Date:** 2026-04-08 | **Phase:** 2

## What & Why

We opted to use a separate package for writing effects in SvelteKit special functions. This makes it easier to manage dependencies and to ensure all errors are properly handled.

## Alternatives

- **[Manual Effect Management]** — Piece together an effect-supported way to write effect code in SvelteKit
- **[No Effect in SvelteKit]** — Don't use Effect in SvelteKit at all

## Tradeoffs

We are adding an extra dependency and some complexity to allow for Effect code to be written in SvelteKit special server functions.

## Impact

This should result in more maintainable code in the future, and makes the whole project feel more Effect-ful.
