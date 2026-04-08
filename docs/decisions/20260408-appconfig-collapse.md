# Collapsing Config Services to AppConfig

**Date:** 2026-04-08 | **Phase:** 2

## What & Why

Collapsed the FlowlineConfig and DatabaseConfig services to AppConfig service only. This keeps the config in one place instead of smaller config services requiring the main config service. This caused too much overhead.

## Alternatives

- **[Split Config Services]** — skipped because it was unnessesary overhead

## Tradeoffs

Instead of full composability (I'd argue the original approach was an anti-pattern), using a single config service that reads the ENV is still composable enough for this project.

## Impact

This required all services that require one of the several config services to require the one main AppConfig service. This was relatively quick to patch.
