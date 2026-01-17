# Use HttpRouterLayer over HttpRouter

**Date:** 2026-01-15
**Status:** Decided

## Problem

I am trying to create a server that serves both a REST API and a RPC API (for WebSocket connection). The WebSocket RPC connection will supply all real-time updates to the clients. The REST API will be used to serve resources to other systems.

## Options Considered

### Option A: `HttpRouter` (Imparitive)

- Pro: Simpler to write, less abstraction
- Con: Manual service wiring

### Option B: `HttpLayerRouter` (Declaritive)

- Pro: Service deps via layer composition
- Pro: Routes from modules merge cleanly
- Con: More concepts & boilerplate used
- Con: Requires understanding of Layers in Effect

## Decision

Chose Option B

## Reasoning

WebSocket transport is required for bidirectional real-time data flow (messages, typing indicators, presence). Both `layerProtocolWebsocketRouter` and `layerProtocolWebsocket` support websockets, but using the first approach will help deepen my understanding of Effect's Layers and composition.

## Trade-offs

I am giving up a more simple approach to creating the server in exchange for learning and using more of Effect's features. This may slow down initial development.
