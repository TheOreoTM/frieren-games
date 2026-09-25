# Phase 6 Prompt — Profiles, Stats, XP, Achievements

Read `AGENTS.md` and the project docs. Do not disturb stable Guessr/Daily behavior.

We are implementing **Phase 6 only**.

Before coding, propose the progression schema and explain how duplicate XP/achievement awards will be prevented.

## Goal

Add meaningful personal progression without turning the game into a grind or letting Unlimited generate infinite XP.

## Public profile

Implement `/user/[username]` with game-only public information such as:

- avatar,
- display name,
- username,
- level,
- total XP,
- current Daily streak,
- best Daily score,
- games played,
- exact episode guesses,
- average episode distance,
- recent Daily results,
- unlocked achievements.

Never expose raw Discord IDs, email-like auth data, session data, or admin-only account information.

## XP ledger

Use an XP transaction ledger rather than only mutating `user.xp`.

Each award should have enough identity/reason metadata to avoid accidental duplicate grants.

Potential sources:

- Daily completion,
- modest Daily performance bonus,
- achievements,
- small Unlimited completion reward.

## Unlimited XP cap

Unlimited games remain infinitely playable, but only a maximum amount of Unlimited-derived XP may be earned per UTC day.

Store/derive this reliably on the server. Do not trust a client counter.

The UI may show something like:

```text
Unlimited XP today: 80 / 100
```

Exact XP numbers and level thresholds should live in a centralized configuration/domain module so they can be tuned.

## Achievements

Build a small extensible system and ship roughly 5-8 achievements, for example:

- First Steps — complete first game
- Bullseye — exact episode guess
- Perfect Round — 5,000 points in one round
- Scholar of the Era — complete 10 Dailies
- Tenure — 10-day Daily streak
- 25K — perfect five-round Guessr game

Do not create dozens of filler achievements.

## Stats

Calculate/update useful Guessr stats consistently and document whether they are derived from attempts or cached counters.

Prefer a design that can be repaired/recalculated if a bug is discovered later.

## Tests

Cover:

- XP award deduplication,
- Unlimited daily XP cap,
- level calculation,
- achievement one-time grants,
- core stat calculations where they are not simple DB aggregations.

Explain how these tests protect progression integrity.

## Explicit non-goals

Do NOT add:

- friends,
- followers,
- comments,
- profile messaging,
- trading/currency,
- power-ups,
- paid progression.

## Definition of done

A logged-in player can build a public game profile through normal play, XP is auditable, achievements cannot double-award accidentally, and Unlimited cannot be farmed for unlimited XP in one UTC day.

Then STOP and hand the work back to me.
