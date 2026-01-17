# Use Effect Throughout Project

**Date:** 2026-01-14
**Status:** Decided

## Problem

I want to write maintainable, high-quality code in TypeScript. I also want to learn how to write production-ready Effect code.

## Options Considered

### Option A: Effect (Effect-ts)

- Pro: Effects (tracking success, error, and dependency values at a type level)
- Pro: Easier to write composable code in TypeScript
- Con: More verbose code
- Con: High learning curve

### Option B: Vanilla TypeScript

- Pro: Mostly type-safe
- Con: Hard to maintain errors and dependencies, with too many ways to solve problems

## Decision

Chose Option A: Effect

## Reasoning

Part of the goals of this project is to learn Effect by builidng a real-world project with it and then to scale it. I am hoping to learn where Effect succeeds and fails. It also is a joy to write, though more verbose, I feel much more confident with the code I ship with it.

## Trade-offs

I am giving vanilla TypeScript, for Effect which is more verbose, harder to learn, and may take a while to train new users on. I won't revisit this since this is one of the goals of this project.
