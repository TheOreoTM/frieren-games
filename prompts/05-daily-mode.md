# Phase 5 Prompt — Daily Guessr, Scheduling, Streaks, Leaderboard

Read `AGENTS.md` and all project docs. Inspect existing Guessr/auth/frame code first.

This is **Phase 5 only** and is the largest single product phase. Break your implementation into reviewable substeps internally, and do not add unrelated progression/social features.

Before coding, present the proposed Daily schema and the database constraints you intend to rely on. Explain how one-ranked-attempt enforcement and immutable active Dailies will work.

## Goal

Ship one globally shared five-round Daily challenge per UTC date with scheduling/admin tools, one ranked attempt per account, streaks, and a per-Daily leaderboard.

## Daily rules

- reset boundary: 00:00 UTC,
- exactly 5 rounds,
- same frame set/order for everyone,
- one ranked attempt per account per Daily,
- after ranked completion, replay is allowed only as Practice/Unranked,
- ties share rank,
- speed is not a tiebreaker,
- streak = consecutive completed Daily challenge IDs regardless of score.

## Generator constraints

When inventory allows:

- 5 distinct frames,
- 5 distinct episodes,
- exact frame may never be reused in another ranked Daily,
- approximate composition: 1 Easy / 3 Medium / 1 Hard,
- avoid recently used episodes/scenes where practical,
- avoid visually redundant selections in one Daily.

Keep selection logic as testable domain code rather than burying it in a route handler.

## Future-frame reservation

As soon as a frame is assigned to an upcoming non-void Daily, exclude that exact frame from Unlimited until the Daily has finished.

Do not let tomorrow's exact image appear in Unlimited today.

## Admin `/admin/dailies`

Build a practical calendar/date-range workflow:

- month/date view,
- states such as generated/draft, approved, locked/active, completed, void,
- choose an arbitrary future date range,
- generate challenges for the range,
- preview each five-frame challenge,
- replace one frame,
- regenerate an entire day,
- approve future challenges,
- clearly show which dates are ready.

I may prepare many days or months in advance; do not limit generation to one week.

## Fallback generation

If a UTC date becomes active without an approved challenge:

- generate a valid challenge once,
- save it immediately,
- use that persisted challenge from then on,
- do not regenerate a different answer set on restart.

## Locking

Once a challenge's UTC date begins, normal composition edits are disabled.

If something catastrophically breaks, provide an admin action:

```text
VOID DAILY
```

A voided Daily should be clearly unranked/invalid. Do not replace an active round midway through the day.

## Ranked attempts

Persist ranked state server-side.

Do not let users:

- restart their ranked attempt,
- create two ranked attempts for the same Daily,
- submit client-computed scores.

Use DB uniqueness/transactions where appropriate, not only UI checks.

## Streaks

A streak is based on completed consecutive Daily challenge IDs/dates, not the user's local timezone.

Completing the Daily preserves the streak even with a bad score.

## Leaderboard

Launch with:

- current Daily leaderboard,
- previous Daily/history navigation.

Equal scores share the same rank. Do not break ties by speed or completion time.

## Tests

This phase needs strong tests. Explain each group to me.

Cover at minimum:

- generator returns five valid distinct rounds,
- exact Daily frame cannot be reused,
- future Daily frames are excluded from Unlimited,
- challenge fallback persists rather than changing,
- active challenge cannot be normally edited,
- one ranked attempt per account,
- practice replay behavior,
- streak calculation,
- shared-rank leaderboard behavior.

Add a small Playwright flow for a ranked Daily if the test environment supports it.

## Explicit non-goals

Do NOT implement:

- XP,
- levels,
- achievements,
- weekly/monthly rankings,
- social features,
- complex anti-cheat.

## Definition of done

Two different logged-in users on the same UTC date receive the same five-round Daily. Each can submit one ranked run. The leaderboard works, streaks update correctly, future Daily frames do not leak through Unlimited, and I can prepare future dates through the admin UI.

Then STOP and hand the work back to me.
