# Flowline - A Distributed Systems Learning Project

> Building a real-time chat application from scratch to deeply understand distributed systems architecture, using Effect-ts

> Phases may be re-arranged or new ones introduced as the project evolves.

## Project Goals

Learn distributed systems by building a Discord-like chat app that scales from 1 to 10,000+ concurrent users using Effect.

**Learning focus:**

- Distributed systems patterns (consensus, sharding, pub/sub)
- Effect in a complex real-world domain
- Documenting architectural decisions

**Not focused on:**

- Production readiness or feature completeness
- Perfect code from day one (learning by making mistakes)

## Architecture Approach

**Start Simple. Add Complexity When Needed.**

- **Phases 1-11:** Single server, core features
- **Phase 14:** Load testing to find bottlenecks
- **Phases 15+:** Add distributed patterns as needed

Avoid premature optimization to learn _why_ distributed patterns exist, not just _how_ to use them.

## Tech Stack

**Current:**

- Bun + Effect-ts
- PostgreSQL

[See tech decision docs →](docs/decisions/)

## Quick Start

```bash
git clone https://github.com/RATIU5/flowline
cd flowline
pnpm install
pnpm dev
```

**Prerequisites:** Bun v1.3.5+, PostgreSQL 17+

## Roadmap

### MVP (Phases 1-13)

1. [x] WebSocket connection
2. [x] User authentication (with DB)
3. [ ] Database persistence _(in progress)_
4. [ ] Direct messages for 1:1 communication
5. [ ] Channels & spaces for 1:N communication
6. [ ] User presence (active, offline, away, custom)
7. [ ] Custom UI/UX library
8. [ ] Typing indicators
9. [ ] Message types (text, markdown, forward, reply, quote)
10. [ ] Reactions to messages
11. [ ] Threads (group similar messages in a sub-container)
12. [ ] File uploads
13. [ ] Public API to work for different client and load testing

### Scale (Phases 14+)

14. [ ] Load testing (10k users)
15. [ ] Redis pub/sub
16. [ ] Message queue

[View detailed roadmap →](docs/PROGRESS.md)

## Documentation

**For contributors:**

- [Documentation Process](docs/PROCESS.md) - How to document decisions
- [Decision Log](docs/decisions/) - Architecture choices & trade-offs
- [Phase Retrospectives](docs/phases/) - Lessons learned

## Connect

**GitHub:** [@RATIU5](https://github.com/RATIU5)  
**X:** [@RATIU51](https://x.com/RATIU51)

---

**Why build this publicly?**

Learning distributed systems for career growth. Documenting decisions shows growth over time and provides interview material.

---

_"The best way to learn distributed systems is to build one, break it, and fix it."_

**Last Updated:** April 10, 2026
