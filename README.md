# Flowline - A Distributed Systems Learning Project

> Building a real-time chat application from scratch to deeply understand distributed systems architecture, using Effect-ts

## Project Goals

Learn distributed systems by building a Discord-like chat app that scales from 1 to 10,000+ concurrent users.

**Learning focus:**

- Distributed systems patterns (consensus, sharding, pub/sub)
- Effect-ts in a complex real-world domain
- Documenting architectural decisions

**Not focused on:**

- Production readiness or feature completeness
- Perfect code from day one (learning by making mistakes)

## Architecture Approach

**Start Simple. Add Complexity When Needed.**

- **Phases 1-11:** Single server, core features
- **Phase 12:** Load testing to find bottlenecks
- **Phases 13+:** Add distributed patterns as needed

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

### MVP (Phases 1-11)

1. [x] WebSocket connection
2. [ ] User authentication (with DB) _(in progress)_
3. [ ] Database persistence
4. [ ] Direct messages
5. [ ] Channels & spaces
6. [ ] User presence
7. [ ] Typing indicators
8. [ ] Message types
9. [ ] Reactions
10. [ ] Threads
11. [ ] File uploads

### Scale (Phases 12+)

12. [ ] Load testing (10k users)
13. [ ] Multiple app servers
14. [ ] Redis pub/sub
15. [ ] Message queue

[View detailed roadmap →](docs/PROGRESS.md)

## Documentation

**For contributors:**

- [Documentation Process](docs/PROCESS.md) - How to document decisions
- [Decision Log](docs/decisions/) - Architecture choices & trade-offs
- [Phase Retrospectives](docs/phases/) - Lessons learned

## Key Learnings

_Updated after each phase_

- Phase 1: _In progress_

[See all retrospectives →](docs/phases/)

## Open Questions

- When to introduce multiple app servers?
- How to handle message ordering across distributed servers?
- Right balance between consistency and availability?

## Connect

**GitHub:** [@RATIU5](https://github.com/RATIU5)  
**X:** [@RATIU51](https://x.com/RATIU51)

---

**Why build this publicly?**

Learning distributed systems for career growth. Documenting decisions shows growth over time and provides interview material.

---

_"The best way to learn distributed systems is to build one, break it, and fix it."_

**Last Updated:** January 17, 2026
