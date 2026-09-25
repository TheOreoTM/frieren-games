# Architecture Notes

## 1. High-level topology

```text
Developer PC
├── Original Frieren episode files
├── FFmpeg + ffprobe
├── Local curator
├── Local preview/proxy cache
├── Local approved-frame queue
└── frames:push command
        │
        ├──────────────► Cloudflare R2
        │                └── approved WebP frames only
        │
        └──────────────► Neon PostgreSQL
                         └── frame metadata

Users
  │
  ▼
Vercel / Next.js
├── Hub
├── Guessr
├── Auth
├── Profiles
├── Admin
└── Server-side game logic
       │
       ├──────────────► Neon PostgreSQL
       └──────────────► R2/CDN frame assets
```

The original anime episodes never need to reach Vercel, R2, or Neon.

## 2. Suggested repository layout

Adapt this to the existing repo rather than forcing it blindly.

```text
src/
  app/
    (site)/
      page.tsx
      guessr/
        page.tsx
        play/
        daily/
        results/[attemptId]/
      leaderboards/guessr/
      user/[username]/
      onboarding/
    admin/
      frames/
      dailies/
    api/
  components/
    ui/
    shell/
    guessr/
  features/
    guessr/
      domain/
      server/
      components/
    progression/
    profiles/
  data/
  lib/
    auth/
    db/
    r2/
    validation/
  styles/

prisma/
  schema.prisma
  seed.ts

tools/
  curator/
    src/
    cache/
    output/
  frames/
    push.ts
    manifest-schema.ts

docs/
AGENTS.md
```

The exact folders can change if the repository already has a strong convention. Avoid needless nesting.

## 3. Server/client boundary

### Server-only

Keep these server-side:

- Prisma/database access,
- correct episode answers before submission,
- Daily composition and ranked-attempt state,
- R2 write credentials,
- admin authorization,
- XP awards,
- achievement grants.

### Client-side

Client Components are appropriate for:

- episode-grid interaction,
- active round state that is safe to expose,
- reveal animation/timeline,
- countdown display,
- curator video controls,
- theme switcher.

Do not send the correct episode to the browser before a guess is locked.

## 4. Data access

Prefer a thin server-only data layer rather than importing Prisma directly everywhere.

Conceptual examples:

```text
src/data/episodes.ts
src/data/frames.ts
src/features/guessr/server/attempts.ts
src/features/guessr/server/daily.ts
```

Domain functions that do not require I/O should stay pure and testable:

```text
src/features/guessr/domain/score.ts
src/features/guessr/domain/episode-distance.ts
src/features/guessr/domain/daily-selection.ts
```

## 5. Initial Prisma scope

The first milestone intentionally starts small.

A possible initial shape:

```prisma
enum FrameDifficulty {
  EASY
  MEDIUM
  HARD
}

model Episode {
  id            Int      @id @default(autoincrement())
  season        Int
  episodeNumber Int
  globalOrder   Int      @unique
  title         String
  durationMs    Int?
  frames        Frame[]

  @@unique([season, episodeNumber])
}

model Frame {
  id           String          @id
  episodeId    Int
  episode      Episode         @relation(fields: [episodeId], references: [id], onDelete: Restrict)
  timestampMs  Int
  difficulty   FrameDifficulty
  objectKey    String          @unique
  width        Int
  height       Int
  enabled      Boolean         @default(true)
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  @@index([episodeId, enabled])
  @@index([difficulty, enabled])
}
```

This is a direction, not a command to copy blindly. The agent should adapt naming/types to the current Prisma version and existing schema.

Later phases add auth/profile, attempts, Dailies, XP, and achievements.

## 6. Episode ordering

`globalOrder` is canonical for Guessr distance.

Do not calculate distance from `(season * 100 + episode)` or similar shortcuts.

The seed should explicitly assign continuous order so future seasons are simple additions.

Example:

```text
S1E28 globalOrder 28
S2E01 globalOrder 29
```

## 7. Game-state architecture

### Unlimited

The server creates a game/attempt definition containing safe round identifiers and current-round access.

A useful rule: do not send all five correct answers to the browser upfront. The browser only needs enough information to render the current frame and submit a guess.

After submission:

1. server loads frame + episode,
2. server loads guessed episode,
3. calculates distance and score,
4. persists result when applicable,
5. returns reveal-safe information.

Anonymous v0.1 attempts may use a signed/encrypted server token or server persistence depending on which is simpler in the existing architecture. Do not prematurely require user accounts for Unlimited.

### Daily

Daily ranked progress should be persisted server-side because one-ranked-attempt enforcement matters.

A later schema may resemble:

```text
DailyChallenge
  id
  dateUtc
  status
  lockedAt
  voidedAt

DailyChallengeRound
  challengeId
  roundNumber
  frameId

GuessrAttempt
  id
  userId?
  mode
  dailyChallengeId?
  ranked
  startedAt
  completedAt
  totalScore

GuessrRoundGuess
  attemptId
  roundNumber
  frameId
  guessedEpisodeId
  distance
  score
```

Enforce important uniqueness at the database level where practical, not only in application code.

## 8. Daily status model

A future enum may use states similar to:

```text
DRAFT
APPROVED
ACTIVE/LOCKED
COMPLETED
VOID
```

Do not overfit the exact names. The important semantics are:

- future generated challenge can be edited,
- approved future challenge is ready,
- active challenge is immutable,
- voided challenge is clearly unranked/invalid.

## 9. Curator technical design

### Why a local web UI

A browser-like interface makes scrubbing, shortcuts, frame preview, and future scene markers pleasant. But local MKV playback cannot be assumed.

### Recommended local flow

```text
Episode scan
  ↓
ffprobe metadata
  ↓
Can browser play source?
  ├── yes -> serve source locally with Range requests
  └── no  -> generate/cache browser-friendly MP4 preview
                    ↓
                local video UI
                    ↓
              current timestamp
                    ↓
               Approve Frame
                    ↓
          ffmpeg original source
                    ↓
             final WebP output
                    ↓
              local manifest
```

### Preview proxy

The proxy is for navigation only. It need not be archival quality.

Requirements:

- preserve duration accurately enough for timestamp seeking,
- browser-friendly container/codec,
- cached so reopening an episode does not transcode it every time,
- generated on demand or in advance,
- never uploaded.

### Timestamp correctness

The final still must be extracted from the original source using the captured timestamp. Do not take a browser screenshot of the preview player.

If seeking/transcoding creates timestamp drift, verify the final extracted still against the preview during the POC. This is one of the main reasons the curator is the first technical milestone.

### Local media server

If serving media through localhost:

- bind to loopback by default,
- support HTTP Range requests for seeking,
- reject arbitrary filesystem paths from browser input,
- only expose files discovered inside the configured media root,
- do not accidentally ship a production endpoint that reads local paths.

## 10. Filename parsing

Episode discovery should use a tested parser with patterns such as:

```text
S01E01
s1e1
S02E10
```

Allow prefixes/suffixes around the token.

If a filename cannot be parsed:

- show it as unmapped,
- allow an explicit local mapping or skip,
- do not guess silently.

Filename-derived metadata helps local discovery. The production database remains canonical after import.

## 11. Local queue and idempotent push

The local approval queue should have a persistent manifest so closing the curator does not lose work.

Suggested states:

```text
LOCAL_APPROVED
PUSHED
FAILED
```

`frames:push` should be safe to retry.

Possible idempotency strategies:

- stable random `localId` persisted in the manifest and reused as the DB/frame ID,
- unique DB constraint on frame ID/object key,
- transaction around DB insertion where appropriate.

A failed upload should not cause a second copy on retry.

## 12. R2 abstraction

Hide R2 details behind a small server/tooling module.

Responsibilities:

- generate opaque object key,
- upload WebP,
- delete object when explicitly needed,
- construct public/CDN URL or application asset reference,
- surface useful errors.

Do not spread S3-compatible client calls throughout the app.

## 13. Auth architecture

Use Auth.js/NextAuth with Discord.

On first authenticated session:

- determine whether onboarding is complete,
- redirect to `/onboarding` when necessary,
- prefill public identity from Discord,
- normalize/validate username,
- reserve unique username transactionally.

Admin access must be checked server-side. Hiding nav links is not authorization.

## 14. Neon environments

Use separate credentials/databases or branches for development and production.

Suggested env distinction:

```text
# local .env.local
DATABASE_URL=<development Neon URL>

# Vercel production secret
DATABASE_URL=<production Neon URL>
```

Never point routine local migrations/testing at production.

If preview deployments are later introduced, decide deliberately whether they receive disposable Neon branches.

## 15. Styling architecture

Use semantic design tokens rather than hardcoding dozens of one-off colors.

Examples of semantic concepts:

- background
- surface
- elevated surface
- text
- muted text
- border
- sage accent
- gold accent
- magical accent
- success/error

Both themes should map the same semantic tokens differently.

Keep game-specific components visually distinctive without forking the entire design system.

## 16. Testing architecture

### Domain tests first

Fast pure tests should cover the rules that determine fairness:

```text
scoreEpisodeDistance()
episodeDistance()
selectDailyFrames()
calculateStreak()
awardUnlimitedXpWithinCap()
```

### Integration tests where DB constraints matter

Use integration tests when behavior depends on:

- unique ranked Daily attempt,
- Daily frame reuse prevention,
- transactional XP deduplication.

### Playwright sparingly

The UI should not depend on a huge brittle E2E suite.

## 17. Observability

Initial observability should be lightweight:

- structured server logs for failed game submissions,
- explicit curator/push CLI summaries,
- admin-visible failed Daily generation states if needed.

Third-party product analytics is not part of the initial scope.

## 18. Security basics

- validate all server mutations,
- authorize admin routes server-side,
- keep secrets out of client bundles,
- sanitize/localize file access in curator,
- never trust client-supplied score/distance,
- calculate score on the server,
- avoid answer-bearing filenames/URLs,
- use safe image content types and expected dimensions during push,
- rate limit only where there is an actual abuse surface.

## 19. Copyright-conscious technical choices

The product uses individual anime stills as game prompts. Technical choices should minimize unnecessary redistribution:

- do not host full episodes,
- do not host surrounding video clips,
- do not host audio as part of Guessr,
- use resized/compressed stills rather than source-quality video frames,
- only upload curated stills actually needed for gameplay,
- provide a clear unofficial-fan-project/takedown contact path before public launch.

Legal treatment varies by jurisdiction; technical minimization does not itself establish permission or fair use.

## 20. Architecture principle for future games

Share:

- auth,
- profiles,
- XP/achievements,
- navigation/shell,
- design system,
- common leaderboard primitives only when truly common.

Do not share prematurely:

- Guessr attempt state with Frierendle state,
- Guessr rounds with Connections groups,
- one giant polymorphic `GameAttempt.payload` JSON model.

Let two games prove the need before extracting a generic abstraction.
