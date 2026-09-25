# Connections — Product and Engineering Plan

Status: **rules approved; Increments 1–2 complete; gameplay not started**

This document defines the first release of Connections for Magic in Passing. It is intentionally
game-specific. Guessr remains independent, and this plan does not introduce a generic game engine.

## 1. Product goal

Connections is a shared daily word-grouping puzzle built from Frieren anime material. It should be
quick to understand, satisfying to solve, safe to play anonymously, and carefully authored rather
than procedurally generated.

Initial routes:

```text
/connections
/admin/connections
```

An archive route can be added after enough approved puzzles exist.

## 2. Approved v1 rules

- One globally shared puzzle per UTC date.
- The board contains exactly 16 unique text tiles split into four groups of four.
- Tiles are shuffled before play.
- A player selects exactly four tiles and submits them.
- A correct submission locks the group and reveals its category.
- An incorrect submission consumes one of four allowed mistakes.
- A submission receives `ONE_AWAY` feedback when exactly three selected tiles belong to one
  unsolved group.
- The player can reshuffle remaining tiles without changing game state.
- The attempt is solved when all four groups are found.
- The attempt fails after the fourth incorrect submission.
- Anonymous players can play an unranked attempt.
- A signed-in player receives one persistent ranked attempt per puzzle and cannot restart it.
- Replays after a solved or failed ranked attempt are practice-only.
- Speed is not scored and is never a tiebreaker.
- There is no global leaderboard in v1.
- Content is text-only and limited to aired TV-anime material.
- Each puzzle may show a spoiler note before the attempt begins.
- Puzzles are manually authored and reviewed in the production admin.
- Personal statistics ship with the game; Connections XP and achievements follow after the core
  loop is proven.

## 3. Puzzle content policy

Puzzle groups may use characters, places, spells, objects, episode events, organizations, or other
TV-anime concepts. A puzzle may mix those concepts when the group labels remain fair.

Authoring requirements:

- tile text and group labels are non-empty after trimming,
- tile text is unique within the puzzle using case-insensitive comparison,
- group labels are unique within the puzzle,
- each group has exactly four tiles,
- the puzzle has exactly four groups,
- difficulty uses `EASY`, `MEDIUM`, `HARD`, and `TRICKY`, one level per group,
- alternate valid groups and accidental ambiguity require human review,
- title wording and answer-bearing metadata are never sent before the relevant group is solved,
- spoiler scope is stated before play when needed.

Automated validation can protect structure, but it cannot certify that a puzzle is fair.

## 4. Attempt lifecycle

```text
READY
  └─ submit four tiles
       ├─ correct ──► lock group ──► SOLVED after fourth group
       └─ incorrect ─► consume mistake ─► FAILED after fourth mistake
```

Only currently unsolved tiles may be submitted. Repeating the same incorrect combination does not
consume another mistake, but the server still rejects it as a duplicate submission. A correct
group cannot be submitted again.

`ONE_AWAY` is feedback attached to an incorrect submission, not a separate attempt state.

For ranked attempts:

- progress is persisted after every submission,
- leaving or refreshing does not restart the attempt,
- a database constraint enforces one ranked attempt per user and puzzle,
- active puzzle answers remain authoritative for the entire UTC day,
- a voided puzzle does not count toward statistics or streaks.

For anonymous attempts, a signed HttpOnly cookie stores only answer-safe progress. It may contain
the puzzle ID, opaque solved-group IDs, mistake count, and previous submission signatures. It must
not contain tile-to-group mappings or unrevealed category labels.

## 5. Server/client boundary

The server owns:

- puzzle selection for the current UTC date,
- tile-to-group relationships,
- unrevealed category labels and explanations,
- submission validation,
- `CORRECT`, `INCORRECT`, and `ONE_AWAY` evaluation,
- ranked-attempt persistence and completion state,
- admin authorization, approval, locking, and voiding,
- personal-stat and streak calculations.

The client may receive:

- opaque tile IDs and visible tile text,
- current selection and presentation order,
- mistakes remaining,
- already revealed groups,
- safe feedback returned after a submission,
- final answers only after the attempt ends.

Tile order is presentation state. The initial order can be deterministically derived from the
attempt ID; manual reshuffles do not need database persistence.

## 6. Data-model direction

The Prisma migration should use explicit Connections tables rather than a polymorphic attempt or
JSON game payload.

```text
ConnectionsPuzzle
  id
  dateUtc                 unique date
  status                  DRAFT | APPROVED | VOID
  spoilerNote?
  approvedAt?
  voidedAt?
  createdAt
  updatedAt

ConnectionsGroup
  id
  puzzleId
  position                unique within puzzle
  difficulty              EASY | MEDIUM | HARD | TRICKY
  label
  explanation?

ConnectionsTile
  id
  groupId
  puzzleId
  text
  normalizedText

ConnectionsAttempt
  id
  puzzleId
  userId
  ranked
  startedAt
  completedAt?
  failedAt?

ConnectionsSubmission
  id
  attemptId
  sequence                unique within attempt
  result                  CORRECT | INCORRECT
  matchedGroupId?
  oneAway
  createdAt

ConnectionsSubmissionTile
  submissionId
  tileId
```

Important constraints:

- one puzzle per UTC date,
- four group positions per puzzle,
- four tiles per group enforced at the application boundary,
- unique normalized tile text per puzzle enforced during validation and transactionally on save,
- tile `puzzleId` is intentionally stored so PostgreSQL can enforce that uniqueness across all four
  groups; its composite group foreign key also guarantees that the group belongs to that puzzle,
- one ranked attempt per user and puzzle, preferably with a partial unique index,
- one tile occurrence per submission,
- exactly four tiles per submission enforced server-side,
- active/current puzzles are immutable,
- tiles and groups referenced by attempts use restrictive deletion behavior.

`ACTIVE` and `COMPLETED` do not need stored puzzle statuses. They are derived from the approved
puzzle date. `VOID` remains explicit for emergency invalidation.

## 7. Admin workflow

The first `/admin/connections` should support:

1. create or open a puzzle for a future UTC date,
2. enter four groups, their difficulty, labels, optional explanations, and four tiles each,
3. add a spoiler note when appropriate,
4. validate structure and duplicate text,
5. preview multiple shuffled board arrangements,
6. manually review red herrings and unintended alternate solutions,
7. approve the puzzle,
8. explicitly return an approved future puzzle to draft before editing,
9. lock all normal edits once its UTC date begins,
10. void a catastrophically broken active puzzle rather than replacing it.

No automatic puzzle generation is planned for v1.

## 8. Statistics and streaks

Initial signed-in profile statistics:

- ranked puzzles played,
- ranked puzzles solved,
- solve percentage,
- perfect solves with zero mistakes,
- total mistakes,
- current solve streak,
- best solve streak.

A solve streak counts consecutive non-void Connections puzzle IDs that the user solved in ranked
play. Failing or skipping a puzzle breaks the streak. Practice attempts never affect it.

Statistics should initially be derived from attempts and submissions rather than maintained in a
mutable aggregate row. Add an aggregate only if measured query cost justifies it.

## 9. Deferred progression

Connections XP and achievements are deliberately outside the first playable increment. After the
rules and completion data are stable, the proposed starting balance is:

- 50 XP for solving the ranked Daily,
- 25 additional XP for a perfect zero-mistake solve,
- an achievement for the first solve,
- an achievement for the first perfect solve.

Adding these awards should reuse the XP ledger's idempotent source-key pattern while keeping
Connections achievement evaluation independent from Guessr evaluation.

## 10. Shared abstractions justified by the second game

Implement these only when the corresponding Connections code needs them:

- move UTC-date normalization and date keys from Guessr into a shared domain module,
- expose a small shared idempotent XP-award helper when Connections progression is added,
- split the profile into shared identity/progression framing plus explicit per-game sections,
- add a small game-navigation catalogue for the hub and header.

Do not introduce generic game attempts, rounds, answers, Daily tables, scoring engines, stats
payloads, or admin CRUD frameworks.

## 11. Test plan

High-value Vitest coverage:

- puzzle structural validation,
- case-insensitive tile uniqueness,
- exact-group submission evaluation,
- one-away evaluation, including overlapping three-of-four possibilities,
- duplicate and already-solved submissions,
- four-mistake failure boundary,
- fourth-group completion boundary,
- answer-safe client projection,
- one-ranked-attempt policy,
- current and best solve streaks with voided puzzles,
- active-puzzle edit lock,
- deterministic initial shuffle.

Critical browser coverage after the core flow exists:

- complete one anonymous puzzle,
- resume one ranked attempt after refresh,
- prevent a second ranked attempt,
- author, preview, and approve a future puzzle.

## 12. Reviewable implementation sequence

### Increment 1 — Pure domain contract (complete)

- shared UTC-date extraction required by both games,
- Connections puzzle and attempt types,
- structural validation,
- submission evaluation and state transitions,
- deterministic shuffle,
- unit tests only; no database or UI.

Stop for review.

### Increment 2 — Persistence and admin authoring (complete)

- explicit Prisma models and migration,
- server-only data layer,
- `/admin/connections` authoring, preview, approval, locking, and voiding,
- seed or manually author enough reviewed puzzles for testing.

Stop for review.

### Increment 3 — Anonymous Daily gameplay

- `/connections`,
- answer-safe puzzle projection,
- signed anonymous progress,
- selection, submission, feedback, solved/failed reveal,
- responsive and keyboard-accessible board,
- one browser happy path.

Stop for review.

### Increment 4 — Ranked attempts and profile statistics

- one persistent ranked attempt per account,
- resume behavior,
- practice replay,
- profile Connections section,
- solve and streak statistics,
- ranked-attempt and streak tests.

Stop for review.

### Increment 5 — Sharing and progression

- answer-safe share grid,
- Connections XP awards,
- initial Connections achievements,
- final mobile/accessibility/polish pass.

Stop before adding an archive or another game.
