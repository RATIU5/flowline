# Documentation Process

This document explains the daily workflow for documenting decisions and tracking progress while building this project.

---

## Philosophy

**Document to learn, not to impress.**

Every decision I spend >30 minutes researching deserves documentation. Future me (and others) will thank me.

---

## Daily Development Workflow

### 1. Before Coding

Create a feature branch:

```bash
git checkout -b feat/phase1-websocket-setup
```

### 2. During Coding

**Make focused commits with context.**

#### Commit Message Format

**For routine commits:**

```
<type>: <what you did>

Why: <one sentence explaining rationale>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructure (no behavior change)
- `docs`: Documentation only
- `test`: Adding tests
- `chore`: Maintenance (dependencies, config)

**Example:**

```bash
git commit -m "feat: add WebSocket connection handler

Why: Need bidirectional communication for real-time messages"
```

**For decision-heavy commits:**

```
<type>: <what you did>

Options considered: A, B, C
Chose: B
Because: <reasoning>
Trade-off: <what you gave up>
```

**Example:**

```bash
git commit -m "feat: implement message storage with PostgreSQL

Options considered: MongoDB, PostgreSQL, in-memory
Chose: PostgreSQL
Because: Relational model fits channels/users/messages structure
Trade-off: Will need to revisit if scaling beyond 100k users"
```

### 3. After Feature Complete

**Ask myself:** Did I make a significant decision?

**Create a decision doc if:**

- ✅ I spent >30 minutes researching options
- ✅ Choice impacts multiple phases or future architecture
- ✅ I compared 2+ alternatives
- ✅ Future me will ask "why did I do this?"

**Skip decision doc if:**

- ❌ It's a routine implementation detail
- ❌ There was only one obvious option
- ❌ It's easily reversible

**Then:**

1. Create decision doc (if needed) - use [DECISION_TEMPLATE.md](DECISION_TEMPLATE.md)
2. Update [PROGRESS.md](PROGRESS.md)
3. Merge PR

---

## When to Create Each Document Type

### Decision Documents

**When:** I researched multiple options and chose one

**Where:** `/docs/decisions/YYYYMMDD-short-title.md`

**Template:** [DECISION_TEMPLATE.md](DECISION_TEMPLATE.md)

**Examples:**

- `20260114-effect-streams-for-websockets.md`
- `20260115-postgres-over-mongodb.md`
- `20260120-ws-library-choice.md`

### Progress Updates

**When:** After each PR merge

**Where:** `/docs/PROGRESS.md`

**What to update:**

- Move items from "In Progress" to "Completed"
- Add link to merged PR
- Link new decision docs (if any)
- Note any learnings
- Update "Next Steps"

### Phase Retrospectives

**When:** After completing each phase (Phases 1-n)

**Where:** `/docs/phases/phase-N-retrospective.md`

**Template:** [RESTROSPECTIVE_TEMPLATE.md](RESTROSPECTIVE_TEMPLATE.md)

**Write this when:** Phase goals all checked off in PROGRESS.md

---

## Enforcement Checklist

**Print this. Tape to monitor.**

### Before Merging Each PR

- [ ] Commit messages have "Why" context (not just "what")
- [ ] If I researched >30min, created decision doc
- [ ] Updated `/docs/PROGRESS.md` with PR status
- [ ] Can explain this choice in 30 seconds

### After Completing Each Phase

- [ ] Write phase retrospective using [RESTROSPECTIVE_TEMPLATE.md](RESTROSPECTIVE_TEMPLATE.md)
- [ ] Update README.md stats (phases complete, learnings)
- [ ] Plan next phase in PROGRESS.md

### Weekly Review

- [ ] Review what I learned this week
- [ ] Update any "Revisit" dates in decision docs
- [ ] Check if any decisions need status updates
- [ ] Update README if major progress made

---

## Quick Reference Card

**Keep this visible while coding:**

```
┌─────────────────────────────────────────┐
│  BEFORE CODING                          │
│  ☐ Create feature branch                │
│                                         │
│  DURING CODING                          │
│  ☐ Commit with "Why" context            │
│  ☐ Format: type: what + Why: ...        │
│                                         │
│  AFTER FEATURE                          │
│  ☐ Big decision? → Decision doc         │
│  ☐ Update PROGRESS.md                   │
│  ☐ Merge PR                             │
│                                         │
│  AFTER PHASE                            │
│  ☐ Write retrospective                  │
│                                         │
│  WEEKLY                                 │
│  ☐ Review learnings                     │
│  ☐ Update README                        │
└─────────────────────────────────────────┘
```

---

## Tips for Sustainability

**Keep it manageable:**

- Decision docs: ~15 minutes to write
- Daily updates to PROGRESS.md: ~5 minutes
- Phase retrospectives: ~30 minutes
- If it feels like busywork, I'm overthinking it

**Remember:**

- Document for **understanding**, not **completeness**
- Short and specific > long and vague

**When in doubt:**

- Ask: "Would I want to read this in 3 months?"
- Ask: "Could I explain this decision this doc?"
- If yes to both → good doc

---

## Getting Help

**Stuck on what to document?**

Ask myself:

1. Did I choose between multiple options? → Decision doc
2. Did I learn something non-obvious? → Add to phase retrospective (at end of phase)
3. Did I complete a feature? → Update PROGRESS.md

**Stuck on how to explain a decision?**

Use this formula: "I chose X over Y because Z, but I gave up W."

---

## File Structure Reference

```
flowline/
├── README.md                           # Project overview
├── docs/
│   ├── PROCESS.md                      # This file - workflow guide
│   ├── PROGRESS.md                     # Current status tracker
|   ├── RESTROSPECTIVE_TEMPLATE.md      # Template for phase retrospectives
│   ├── DECISION_TEMPLATE.md            # Template for decision docs
│   ├── decisions/                      # All decision documents
│   │   ├── 20260114-effect-streams.md
│   │   └── 20260115-postgres-choice.md
│   └── phases/                         # Phase retrospectives
│       ├── phase-1-retrospective.md
│       └── phase-2-retrospective.md
```

---

**Last Updated:** January 14, 2026
