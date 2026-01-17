# Phase 1: WebSocket Connection - Retrospective

**Completed:** 2026-01-16
**Duration:** 2 days

---

## What You Built

A real-time chat using Effect RPC over WebSocket with PubSub-backed message broadcasting. Clients publish messages via request-reponse RPC; subscribers recieve a continuous stream from a shared PubSub service.

[PR #12](https://github.com/RATIU5/flowline/pull/12)

---

## Key Decisions

[Use Effect](../decisions/20260114-use-effect.md)
[Use Effect](../decisions/20260115-httprouterlayer.md)

---

## What Worked Well

The implementation went smoothly overall. Effect helps make complex processes much more managable.

---

## What Was Challenging

I lacked some fundamental knowledge of RPC over WebSockets. I had to try/fail building the flow in a lot of different ways (in a way, blind coding) before I found the correct processes.

---

## What I Learned

### Technical:

Bidirectional data transfer -> WebSocket protocol
RPC -> Execute named operations on a server
You need two RPC procedues: one to publish messages, the other to subscribe to them. A client will also need the two.

### Non-technical:

---

## What I'd Do Differently

I wouldn't focus so heavily on the frontend design, as it could change drastically as I build the backend. Since this is a backend-oriented project, the backend takes proirity.

---

## Metrics

- Lines of code: ~320
- Commits: 12
- Time spent: 2 days
- Decision docs created: 2

---

## Next Phase Preview

User Authentication will happen next since users will have their own accounts so it's clear who is sending what message. This will include setting up a database first, and then Better-auth.

---

## Open Questions

I am unsure if all RPC requests should flow through the /rpc route, or if I should create a new one for different methods. I'll need to research the pros and cons of each approach.

---

**Phase Status: Complete**
