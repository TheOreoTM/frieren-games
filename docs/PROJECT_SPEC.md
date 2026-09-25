# Magic in Passing — Project Spec

## 1. Product vision

**Magic in Passing**, hosted at `frieren.oreotm.xyz`, is a focused, unofficial Frieren fan-game collection. The first flagship game is **FrierenGuessr**, where players see a still frame from the TV anime and guess the season and episode.

The long-term hub may later include games such as:
- Frierendle
- Connections
- Who Said It?
- Silhouette
- Spellbook
- Higher/Lower
- Timeline

The hub architecture should make additional games easy to add, but the codebase should **not** begin with a generic universal minigame engine. Shared platform concerns should be shared; game logic should remain game-specific.

## 2. Initial release sequence

### v0.1 — First playable Guessr

Must include:
- hub shell/homepage,
- modern Frieren-inspired light/dark visual system,
- Discord authentication and first-login onboarding,
- anonymous Unlimited Guessr,
- five-round games,
- season + episode selector,
- episode-distance scoring,
- round reveal and game results,
- local episode curator,
- local approval queue/manifest,
- R2 frame upload path,
- `Episode` and `Frame` persistence,
- basic `/admin/frames`,
- responsive mobile-first UI.

### v0.2 — Daily competition

Add:
- one five-round Daily challenge per UTC date,
- one ranked Daily attempt per account,
- unranked replay after completion,
- Daily streaks,
- date-range Daily generation,
- admin approval calendar,
- fallback auto-generation,
- Daily leaderboard,
- Daily history,
- `VOID DAILY` emergency control.

### v0.3 — Profiles and progression

Add:
- public profiles,
- game stats/history,
- XP ledger,
- Unlimited XP daily cap,
- levels,
- initial achievements.

### Later

Add Frierendle, Connections, and other games after Guessr is polished and stable.

## 3. FrierenGuessr rules

### Standard game

A standard game contains 5 rounds.

Each round:
1. Display one approved frame.
2. Player selects a season.
3. Player selects an episode from that season.
4. Player locks the guess.
5. Server validates and scores it.
6. Reveal the answer and score.
7. Continue to the next round.

Maximum score:
- 5,000 points per round
- 25,000 points per standard game

### Episode distance

All TV episodes belong to one continuous ordered sequence.

Example:

```text
S1E27 -> globalOrder 27
S1E28 -> globalOrder 28
S2E01 -> globalOrder 29
S2E02 -> globalOrder 30
```

Distance is:

```ts
Math.abs(actual.globalOrder - guessed.globalOrder)
```

There is no separate season bonus or season penalty.

### Score curve

Canonical v1 formula:

```ts
export function scoreEpisodeDistance(distance: number): number {
  if (distance === 0) return 5000;

  return Math.round(
    5000 * Math.exp(-0.12 * Math.pow(distance, 1.25)),
  );
}
```

Reference values:

| Distance | Score |
|---:|---:|
| 0 | 5000 |
| 1 | 4435 |
| 2 | 3759 |
| 3 | 3113 |
| 4 | 2536 |
| 5 | 2039 |
| 8 | 995 |
| 10 | 592 |
| 15 | 145 |
| 20 | 31 |

The curve must be defined in one domain module and covered by unit tests so it can be tuned later without inconsistent behavior.

## 4. Guessing UI

### Input

Use:
- season tabs,
- episode-number grid,
- clear selected state,
- prominent `Lock In` action.

Avoid dropdowns as the primary interaction.

### Reveal

After submission, show:
- points earned,
- guessed season + episode,
- correct season + episode,
- episode title,
- exact frame timestamp,
- episode-distance,
- a chronological timeline visualization showing guess versus answer.

For cross-season guesses, the timeline should visually preserve the continuous episode sequence.

## 5. Modes

### Unlimited

Purpose: casual play and practice.

Rules:
- playable anonymously,
- five rounds per game,
- random eligible approved frames,
- unlimited replay,
- no serious global leaderboard in the initial release,
- logged-in users may later earn capped daily Unlimited XP,
- logged-in users may retain personal Unlimited stats.

Potential later difficulty modes:
- Casual
- Normal
- Hard

Launch only Normal + Daily unless implementation is already trivial.

### Daily

Purpose: shared competitive challenge.

Rules:
- exactly one challenge per UTC date,
- exactly five rounds,
- everyone receives the same frame set and order,
- one ranked attempt per account,
- Daily reset at 00:00 UTC,
- replay is allowed after ranked completion but is marked Practice/Unranked,
- equal scores share rank,
- speed is not a tiebreaker,
- streak requires completion, not a minimum score,
- streak is defined by consecutive Daily challenge IDs rather than a user's local calendar.

## 6. Daily generation

A generated Daily should obey these constraints where inventory permits:
- exactly 5 frames,
- five distinct episodes,
- no exact frame that has appeared in a previous ranked Daily,
- approximately 1 Easy / 3 Medium / 1 Hard,
- avoid episodes used too recently,
- avoid multiple visually redundant scenes/locations in the same challenge,
- exclude frames reserved for future approved Dailies from Unlimited until that Daily is over.

### Scheduling

Admin can:
- select an arbitrary date range,
- generate candidates for all those dates,
- review each day,
- replace an individual round,
- regenerate an entire day,
- approve future days in bulk or individually.

### Missing Daily fallback

If no approved challenge exists when a UTC date becomes active:
1. generate a valid challenge,
2. persist it immediately,
3. mark it as the authoritative challenge for that date,
4. never regenerate a different challenge because of a server restart.

### Locking

Once a challenge's date begins:
- round composition is immutable,
- normal admin editing is disabled.

### Emergency failure

If an active Daily is seriously broken, admin may mark the entire Daily `VOID`.

Do not replace an active frame mid-day for only some players.

## 7. Frame content model

### Initial scope

- TV Season 1
- TV Season 2
- no manga-only content
- no specials/OVAs/movies in v1

The data model must support later seasons without schema redesign.

### Frame properties

An approved Frame should conceptually know:
- opaque ID,
- episode ID,
- timestamp in milliseconds,
- difficulty (`EASY`, `MEDIUM`, `HARD`),
- R2 object key,
- width/height,
- enabled/disabled status,
- content flags/tags if needed,
- created/imported timestamps,
- Daily usage metadata or relations.

### Eligibility exclusions

Do not use frames that are primarily:
- opening sequence,
- ending sequence,
- credits,
- title card,
- next-episode preview,
- obvious episode-number text,
- black/fade frames,
- broken/corrupt stills.

Iconic/easy scenes are allowed; they should be marked `EASY`, not universally excluded.

Difficulty affects selection, not score.

## 8. Local curator

### Goal

The curator should make manual selection fast enough that the developer can watch/scrub episodes and approve good frames directly rather than reviewing thousands of automatically extracted stills.

### Start command

Target UX:

```bash
pnpm curator
```

### Episode discovery

The curator scans a configured directory and recognizes filenames such as:

```text
S01E01.mkv
s01e01.mkv
Frieren - S01E01.mkv
```

The parser should be configurable/fallback-friendly rather than coupled to one exact naming pattern.

The curator should derive:
- season,
- episode,
- source path,
- duration via ffprobe.

### Browser playback caveat

Direct MKV playback in browsers is unreliable. The curator should therefore:
- play the source directly only when browser-compatible,
- otherwise generate/cache a local preview proxy suitable for browser playback,
- use the original source file for final still extraction.

A practical preview proxy is a local H.264 MP4. It should be treated as disposable cache and should never be uploaded to production.

### UI

Primary screen:
- large video player,
- season/episode/title indicator,
- current timestamp,
- scrubber,
- seek controls,
- difficulty selection,
- `Approve Frame`,
- approved count for episode/total,
- next/previous episode controls,
- optional scene-detection jump markers.

Keyboard shortcuts:
- `Space`: play/pause
- `Left` / `Right`: roughly -5s / +5s
- `Shift+Left` / `Shift+Right`: roughly -1s / +1s
- `1`: Easy
- `2`: Medium
- `3`: Hard
- `A`: Approve
- `N`: next episode
- `P`: previous episode

No crop editor in v1.

### Approve action

Approving a frame should:
1. record the exact current playhead timestamp,
2. call FFmpeg against the original source,
3. extract the exact frame,
4. resize/encode to approximately 1280x720 WebP while preserving aspect ratio,
5. strip unnecessary metadata,
6. assign a random/opaque local frame ID,
7. store the image in the local approved queue,
8. append/update a manifest record.

No network request should be required for each approval.

### Manifest

A local manifest record may contain:

```ts
{
  localId: string;
  season: number;
  episode: number;
  timestampMs: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  sourceFile: string;
  outputFile: string;
  width: number;
  height: number;
  sha256?: string;
  perceptualHash?: string;
}
```

Source paths are local tooling metadata and should not be copied into public production responses.

### Push command

Target UX:

```bash
pnpm frames:push
```

The push operation should:
- validate manifest records,
- skip already-pushed frames safely,
- upload only approved WebPs,
- use opaque R2 keys,
- insert/update corresponding DB rows transactionally where reasonable,
- report success/failure clearly,
- avoid duplicating records on retry.

## 9. R2 storage

Approved playable files should use opaque object keys, for example:

```text
frames/7f3cad51f0964fa3a808c84e.webp
```

Never use:

```text
frames/s01e14-08m42s.webp
```

Answer security must not depend solely on object-name secrecy, but object names must not trivially reveal the answer.

Keep original video files and curator proxy videos off R2.

## 10. Authentication and onboarding

### Discord OAuth

Discord is the first identity provider.

### Anonymous play

Anonymous users may:
- play Unlimited,
- see results.

Anonymous users do not:
- maintain streaks,
- submit ranked Daily leaderboard scores,
- persist progression.

### First login

After successful Discord OAuth for a new account:
1. prefill `username` from Discord username,
2. prefill `displayName` from Discord display/global name where available,
3. show onboarding once,
4. let the user keep or change the values,
5. validate that username is unique and URL-safe.

Public route:

```text
/user/[username]
```

Never expose raw Discord IDs publicly.

## 11. Profiles

A mature profile may show:
- avatar,
- display name,
- username,
- level,
- total XP,
- current Daily streak,
- best Daily score,
- exact episode count,
- average episode distance,
- games played,
- recent Daily results,
- achievements.

No friends/followers/comments/feed are required in the initial roadmap.

## 12. XP and achievements

### XP

Use an append-only-ish XP transaction ledger so awards are auditable and deduplicatable.

Potential sources:
- Daily completion,
- Daily performance,
- achievements,
- small Unlimited rewards.

Unlimited has a maximum XP amount that can be earned per UTC day. Players can continue playing after reaching the cap.

Exact numbers should be tuned later.

### Initial achievements

Start with roughly 5-8 simple achievements. Example concepts:
- First Steps — finish first game
- Bullseye — exact episode guess
- Perfect Round — 5,000-point round
- Scholar of the Era — complete 10 Dailies
- Tenure — 10-day streak
- 25K — perfect standard Guessr game

## 13. Admin

### Roles

Only:

```text
USER
ADMIN
```

Bootstrap the developer as ADMIN through an explicit configuration path such as a trusted Discord user ID environment variable or manual DB promotion.

### `/admin/frames`

Provide:
- table/grid view,
- filters for season/episode/difficulty/status,
- image preview,
- timestamp/title context,
- enable/disable,
- edit difficulty,
- Daily usage history,
- safe deletion where allowed.

This page manages uploaded frames. It does not access local video files.

### `/admin/dailies`

Provide:
- calendar/date-range view,
- generated/approved/locked/void state,
- challenge preview,
- replace round,
- regenerate day,
- approve day,
- generate arbitrary future date range,
- emergency `VOID DAILY`.

## 14. Leaderboards

Launch with:
- today's Daily leaderboard,
- previous Daily leaderboard/history browser.

Do not build weekly/monthly/all-time competitive ladders until there is enough usage to justify them.

Ties share rank.

## 15. Visual direction

### Theme

Modern clean product UI influenced by Frieren's atmosphere.

Preferred qualities:
- calm,
- refined,
- spacious,
- fantasy-adjacent without becoming a fantasy RPG UI,
- subtle magical motion,
- botanical/flower motifs,
- restrained use of gold,
- muted sage greens,
- warm off-white light theme,
- deep charcoal dark theme,
- cool magical accents.

### Avoid

- generic black shadcn dashboard,
- excessive glass cards,
- cyberpunk/gamer aesthetic,
- ornate borders everywhere,
- AI-generated character art,
- unlicensed decorative art added just to fill space.

### Responsive behavior

Mobile is first-class because users may enter from Discord links.

The episode grid must remain easy to tap on a phone. Desktop should use the additional width intentionally for a larger frame/reveal visualization rather than simply stretching mobile UI.

## 16. Proposed routes

```text
/
/guessr
/guessr/play
/guessr/daily
/guessr/results/[attemptId]
/leaderboards/guessr
/user/[username]
/onboarding
/admin/frames
/admin/dailies
```

Future:

```text
/frierendle
/connections
```

## 17. Conceptual data model

Do not implement every table in the first milestone.

### Platform

```text
User
Account
Session
UserProfile
XPTransaction
Achievement
UserAchievement
```

### Content

```text
Episode
Frame
```

### Guessr

```text
GuessrAttempt
GuessrRoundGuess
DailyChallenge
DailyChallengeRound
GuessrUserStats
```

### Key principles

- Episode has `season`, `episodeNumber`, `globalOrder`, `title`, optionally `durationMs` and `airDate`.
- Frame belongs to exactly one Episode.
- External gameplay entities use opaque IDs.
- Daily challenge composition is represented relationally, not as an opaque JSON blob.
- Game-specific data stays game-specific.

## 18. Anti-cheat boundary

Protect against trivial cheating:
- answers stay server-side until submission,
- frame URL/object key reveals no answer,
- ranked round submission is server-validated,
- Daily attempt state persists server-side,
- one ranked Daily attempt per account,
- no restart of ranked run,
- basic request/rate controls where warranted.

Do not spend substantial project time fighting determined reverse engineering.

## 19. Testing strategy

### Vitest

Protect deterministic domain logic:
- score curve,
- global episode ordering,
- valid episode-distance calculation,
- frame eligibility,
- Daily generation constraints,
- exact-frame Daily reuse prevention,
- one-ranked-attempt enforcement,
- streak calculation,
- XP cap/award logic later.

### Playwright

Keep a small set of high-value flows:
- anonymous Unlimited happy path,
- authenticated Daily happy path,
- second ranked Daily attempt rejected/converted to practice,
- onboarding flow,
- critical admin workflow later.

Tests should be explained to the developer as safeguards, not treated as ceremony.

## 20. Non-goals for the initial project

Do not prioritize:
- manga gameplay,
- specials/OVAs/movies,
- audio clips,
- social network features,
- messaging/chat,
- followers/friends,
- weekly/monthly competitive seasons,
- complex moderation,
- advanced third-party analytics,
- Redis,
- multiple auth providers,
- generic CMS for every future minigame,
- universal plugin architecture,
- aggressive anti-cheat.

## 21. Success criteria for the first milestone

Before building the full game, prove the riskiest local-media workflow:

1. App/repo structure is understood.
2. Design tokens/theme scaffolding exists.
3. Prisma connects to a Neon development DB.
4. Only `Episode` and `Frame` are modeled initially.
5. Minimal S1/S2 episode metadata can be seeded.
6. Local curator skeleton starts successfully.
7. It discovers at least one local episode.
8. It can play the episode directly or through a cached proxy.
9. It exposes the current playhead timestamp.
10. The developer can choose a difficulty and click `Approve Frame`.
11. FFmpeg extracts a real WebP still from the original source at that timestamp.
12. A local manifest record is created.
13. Tests cover any nontrivial parsing/domain logic introduced.
14. The AI stops and hands the project back for review.

No auth, Daily system, XP, achievements, or broad admin dashboard should be built as part of this proof-of-concept unless required by an already-existing repo constraint.
