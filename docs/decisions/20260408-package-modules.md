# Package Modules

**Date:** 2026-04-08 | **Phase:** 2

## What & Why

All packages inside `@flowline/*` only export their individual "modules". Modules are public features of each package. This makes the code more clear and maintainable when reading, writing or using the packages modules.

## Alternatives

- **[Genral index.ts]** — was starting to feel too cluttered and hard to navigate around the code

## Tradeoffs

The only main tradeoff we see is a more opinionated approach to organizing the packages. This is fine for internal packages.

## Impact

This helps each package to be tree-shakable, and to make it clear what module is being used/imported from a specific package.
