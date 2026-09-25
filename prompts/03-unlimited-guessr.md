# Phase 3 Prompt — Unlimited FrierenGuessr

Read `AGENTS.md` and the project docs. Inspect the current frame/content implementation before coding.

We are implementing **Phase 3 only**: the first actually playable FrierenGuessr loop.

Before coding, explain the proposed server/client game-state boundary, especially how you will avoid sending the correct answer to the browser before submission.

## Goal

An anonymous visitor can play a five-round Unlimited game from approved frames and receive a score out of 25,000.

## Core rules

- 5 rounds.
- 5,000 max points per round.
- Guess season + episode.
- Episode distance uses `Episode.globalOrder`.
- No separate season bonus/penalty.
- Canonical score:

```ts
if (distance === 0) return 5000;
return Math.round(5000 * Math.exp(-0.12 * Math.pow(distance, 1.25)));
```

Keep scoring in one pure tested module.

## Required UX

### `/guessr`

A polished landing/mode entry that fits the hub design.

### `/guessr/play`

For each round:

- large frame,
- round indicator (e.g. 2/5),
- season tabs,
- episode-number grid,
- selected episode state,
- `Lock In`,
- no answer visible in HTML/data/asset naming before submission.

### Reveal

After a guess:

- score,
- user's guess,
- correct season/episode,
- episode title,
- exact frame timestamp,
- number of episodes away,
- visual chronological line/timeline connecting guess and answer,
- next-round action.

### Final results

After five rounds:

- total / 25,000,
- per-round score summary,
- exact guesses visually distinguished,
- play again.

Do not add arbitrary grades/ranks like S/A/B unless I ask later.

## Frame selection

Use only enabled approved frames.

For a single five-round Unlimited game:

- avoid duplicate exact frame,
- avoid duplicate episode where inventory makes that practical,
- keep the selector function isolated so Daily constraints can be added later.

Do not reserve Daily frames yet unless the Daily schema already exists from an intentional earlier change.

## Anonymous architecture

Anonymous play must be first-class. Do not require a user record.

Choose a server-authoritative approach that fits Next.js cleanly. Explain why you chose server persistence vs a signed/encrypted attempt token if that decision is not already made by the repo.

The client must never be trusted to submit:

- distance,
- score,
- correct episode.

The client submits its selected episode; the server calculates the rest.

## Design

Follow the Modern × Frieren direction in `AGENTS.md`.

This should not look like a generic shadcn admin dashboard.

Prioritize:

- strong frame presentation,
- calm spacing,
- excellent mobile episode-grid tapping,
- intentional light and dark themes,
- subtle motion only where it improves feedback.

Do not generate AI artwork.

## Tests

Use Vitest to cover at minimum:

- score reference values,
- exact score = 5000,
- episode distance across season boundary,
- basic eligible-frame selection invariants.

Add one small Playwright happy-path test that completes an Unlimited game if the repo/test environment can support it without massive setup.

Explain the tests to me when done; I am learning how they work.

## Explicit non-goals

Do NOT implement:

- Daily mode,
- leaderboard,
- XP,
- achievements,
- social features,
- Blitz/timer mode,
- Frierendle/Connections.

Authentication is Phase 4 unless the current repo already has working auth.

## Definition of done

An anonymous user can complete a five-round game repeatedly on desktop and mobile-sized viewports, with server-side scoring and no trivially leaked answers.

Then STOP and give me the standard handoff summary.
