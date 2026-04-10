# Split Double Rpc Clients to Layer

**Date:** 2026-04-10 | **Phase:** 2

## What & Why

We encountered a bug where calling RpcClient.make() in two separate effects that shared the same runtime caused the second client to silently hang. The protocol layer only allows one active client at a time (enforced by an internal semaphore), so when the subscribe effect grabed the connection on mount, the submit effect could send requests but never receive responses. The fix was to create the RPC client once and share the layer and access it from both effects throught the service map.

## Alternatives

N/A

## Tradeoffs

This does require an entire ServiceMap.Service class, though this may be simplified later.

## Impact

This creates a little extra code to maintain, but solves a bug that could be difficult to track down in the future.
