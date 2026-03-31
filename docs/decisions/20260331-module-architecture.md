# Use a feature-based architecture

**Date:** 2026-03-31 | **Phase:** 2

## Context

I need a robust architecture for organizing my code and files. My goal is to have a format that scales with this project and makes it easy to make changes.

## Options

| Option        | Why Consider                                     | Why Not                                                                          |
| ------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| Feature based | Isolation, high cohesion, ownership              | inconsistency risk, hard to enforce globally, blur boundaries on shared services |
| Layer based   | Consistent patterns, more familiar, shared infra | Touches many folders, low cohesion, no isolation, not good for microservices     |

## Chose: Feature Based (Modules)

**Why:** Better pros for larger scale project, pros outweigh the cons. Can isolate features better, works with Effect's methodology better, and modules can be extracted for microservices if needed.

**Tradeoff accepted:** Risking inconsistency and ease to enforce patterns. Required to document well.
