<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project

This repository powers `frieren.oreotm.xyz`, a Frieren-themed minigame hub. The first and current priority is **FrierenGuessr**: show a still frame from the TV anime and ask the player to identify the season and episode.

The developer is actively learning and participating in the project. AI should act as a strong pair programmer, not as an autonomous contractor trying to finish the entire roadmap in one pass.

## Working style

- Work in small, reviewable increments.
- When changing the repository, create small, coherent git commits as each verified checkpoint is completed. Do not leave all changes for one large commit at the end.
- Keep each commit focused on one concern and leave the repository in a working state where practical. A very small task may use a single commit.
- Before committing, inspect `git status` and the relevant diff. Stage only files or hunks that belong to the current task; never include unrelated or pre-existing developer changes.
- Follow the Conventional Commits format for commit messages, using a concise imperative description (for example, `feat: add episode picker`, `fix: preserve daily progress`, or `docs: clarify setup`). Prefer the most specific appropriate type, such as `feat`, `fix`, `test`, `docs`, `refactor`, or `chore`.
- Do not amend, rebase, rewrite history, or push commits unless the developer explicitly asks.
- Do not implement multiple major roadmap phases in one pass.
- Before a meaningful architectural change, explain the choice and relevant tradeoffs.
- Do not ask permission for trivial implementation details or routine refactors.
- After each bounded task, stop and report:
  1. what changed,
  2. why it changed,
  3. files changed,
  4. how to run/test it,
  5. tests added or updated,
  6. any important concepts the developer should understand,
  7. unresolved decisions,
  8. the suggested next task.
- Do not begin the next major phase until the developer asks.
- Prefer understandable code over clever abstractions.
- Do not hide important domain logic behind unnecessary generic frameworks.
- Do not rewrite working architecture merely because another approach is fashionable.
- If the developer edits code, preserve and build on those changes unless they are demonstrably broken.
- When fixing a bug, identify the cause before applying a broad rewrite.

## AI asset rule

**Never generate AI artwork or AI-generated replacement imagery for this project.**

For visual identity, use:

- CSS,
- typography,
- gradients/textures,
- Lucide icons,
- small original SVG ornaments created in code,
- user-supplied assets,
- actual approved anime frames where game content requires them.

Do not add generated anime art, generated backgrounds, generated character illustrations, or placeholder AI imagery.

## Product priorities

1. Make FrierenGuessr fun and polished before expanding into many games.
2. Build a reusable hub shell for future games without creating a universal-game-engine abstraction.
3. Keep mobile as a first-class experience.
4. Favor reliable game-state and content tooling over premature social features.
5. The local frame-curation workflow is a core product tool, not a throwaway script.

## Stack

Use the current stable versions compatible with the repository unless the developer explicitly requests otherwise.

- Next.js App Router
- React + TypeScript
- Tailwind CSS v4
- shadcn/ui
- Lucide icons
- Prisma
- PostgreSQL, using Neon-hosted databases for development and production
- Auth.js / NextAuth with Discord OAuth
- Cloudflare R2 for approved frame images
- FFmpeg / ffprobe for local media processing
- Zod for runtime validation where useful
- Vercel for the web application
- Vitest for domain/unit tests
- Playwright for a small set of critical end-to-end tests

Do not introduce Redis until there is a concrete requirement that PostgreSQL cannot reasonably handle.

## Next.js conventions

- Prefer Server Components by default.
- Use Client Components only where browser interactivity requires them, such as game controls, episode selection, local curator UI, and interactive timelines.
- Keep database access server-only.
- Keep secrets and privileged R2/database operations server-only.
- Prefer a clear server-side data-access/domain layer over Prisma calls scattered through UI components.
- Use Server Actions for authenticated internal mutations when they are a good fit.
- Use Route Handlers for public HTTP endpoints, media/range streaming, OAuth/webhooks, or APIs that genuinely need HTTP semantics.
- Validate untrusted inputs at server boundaries.

## Database rules

- Prisma schema changes that materially affect architecture must be explained before implementation.
- Use migrations rather than ad-hoc destructive schema changes.
- Preserve existing data where reasonable.
- **Never reset, drop, truncate, or reseed the developer's database without explicit authorization.**
- Development and production must use separate Neon databases/branches/credentials.
- Application code should depend on `DATABASE_URL`, not on Neon-specific APIs unless a Neon-only feature is intentionally adopted later.
- Prefer explicit game-specific tables over a generic polymorphic "GameData" blob.

## Current domain model direction

Shared platform concepts may include:

- User / auth account/session
- UserProfile
- UserRole (`USER`, `ADMIN`)
- XPTransaction
- Achievement
- UserAchievement

Guessr concepts may include:

- Episode
- Frame
- DailyChallenge
- DailyChallengeRound
- GuessrAttempt
- GuessrRoundGuess
- GuessrStats / user game stats

Do **not** implement all of these just because they are listed. Follow the current phase. The first milestone intentionally models only `Episode` and `Frame`.

## FrierenGuessr gameplay rules

- Standard game: 5 rounds.
- Maximum per round: 5,000 points.
- Maximum standard game: 25,000 points.
- A player guesses season + episode.
- Episode selection UI: season tabs + episode grid.
- Scoring is based on distance in continuous chronological TV-episode order, not a separate season penalty.
- If S1E28 is immediately before S2E01, those episodes are distance 1.
- Current scoring curve:

```ts
score(distance) =
  distance === 0 ? 5000 : round(5000 * exp(-0.12 * distance ** 1.25));
```

Reference values:

- 0 away -> 5000
- 1 away -> 4435
- 2 away -> 3759
- 3 away -> 3113
- 4 away -> 2536
- 5 away -> 2039
- 8 away -> 995
- 10 away -> 592
- 15 away -> 145
- 20 away -> 31

Keep the curve in one well-named domain module with tests. Do not duplicate constants throughout the app.

## Guessr modes

### Unlimited

- Available anonymously.
- Five-round games.
- Uses approved eligible frames.
- May be replayed indefinitely.
- Logged-in players may earn limited XP later, but Unlimited XP has a daily cap.
- Unlimited statistics may be recorded for logged-in users.
- No serious global Unlimited leaderboard is required initially.

### Daily

- One globally shared five-round challenge per UTC date.
- One ranked attempt per account.
- Replays after completion are practice/unranked.
- Daily reset boundary is 00:00 UTC.
- Streak means completing consecutive Daily challenge IDs, regardless of score.
- Equal scores share rank; completion speed is not a tiebreaker.
- Daily frames are fixed once the day starts.
- A catastrophic bad Daily can be marked `VOID`; do not silently replace an active Daily for some users and not others.

## Daily generation rules

Generated Dailies should use constrained randomness:

- exactly 5 frames,
- no duplicate episode within the same Daily,
- never reuse the exact same frame in another ranked Daily,
- approximately 1 Easy / 3 Medium / 1 Hard when inventory allows,
- avoid recently used episodes/scenes where practical,
- avoid visually redundant selections in the same Daily,
- upcoming Daily frames must be excluded from Unlimited until that Daily has passed.

Admins can generate arbitrary future date ranges, review them, replace frames, regenerate a day, and approve them in advance.

If no approved Daily exists when a date arrives, generate a valid fallback once, persist it, and treat that saved challenge as authoritative.

## Frame rules

- TV episodes only for Guessr v1.
- Season 1 and Season 2 initially; schema must support arbitrary future seasons.
- Manga content is out of scope for v1.
- Approved gameplay images are 16:9, no cropping in v1.
- Target output is approximately 1280x720 WebP.
- Playable object names/URLs must be opaque and must not encode season, episode, timestamp, or answer information.
- Strip unnecessary embedded image metadata before upload.
- Season/episode/timestamp remain authoritative in the database.
- OP/ED/title cards/previews/credits/obvious answer text should not be eligible gameplay frames.
- Difficulty (`EASY`, `MEDIUM`, `HARD`) is curation metadata and does not multiply score.

## Local curator

The original episode files remain on the developer's computer. They are never uploaded to production.

The local curator lives in this repository under tooling such as `tools/curator` and should be started with a simple script such as:

```bash
pnpm curator
```

Expected workflow:

1. Scan a configured local episode directory.
2. Parse season/episode from filenames where possible.
3. Let the developer watch/scrub an episode locally.
4. Read the exact current timestamp.
5. Assign difficulty.
6. Press `Approve Frame`.
7. Use FFmpeg against the original source to extract the exact still.
8. Optimize to WebP.
9. Add the frame to a local approval queue + manifest.
10. A separate explicit command such as `pnpm frames:push` uploads approved batches to R2 and inserts records into the database.

Important: MKV/browser playback is not guaranteed. If the original file cannot be played reliably in a browser, create and cache a local browser-friendly preview/proxy (for example H.264 MP4) for curation while still extracting final stills from the original source.

Useful curator keyboard controls should include:

- Space: play/pause
- Left/Right: seek roughly ±5 seconds
- Shift+Left/Right: seek roughly ±1 second
- A: approve current frame
- 1/2/3: choose Easy/Medium/Hard
- N/P: next/previous episode

Scene detection may provide suggested jump markers, but the human chooses the actual frame and difficulty.

## Production admin

Production admin is separate from the local curator.

Expected admin areas eventually:

- `/admin/frames`
- `/admin/dailies`
- `/admin/users` only if needed

`/admin/frames` manages already approved/uploaded frames:

- filter/search,
- enable/disable,
- change difficulty,
- inspect episode/timestamp metadata,
- see Daily usage,
- delete where safe.

`/admin/dailies` manages:

- calendar/date-range generation,
- preview,
- replace individual frame,
- regenerate whole challenge,
- approve/publish future challenges,
- see locked/active/completed state,
- emergency `VOID DAILY`.

Keep roles simple: `USER | ADMIN`.

## Authentication and profiles

- Discord OAuth is the initial identity provider.
- Anonymous users can play Unlimited.
- Logged-in accounts persist stats/progression and can submit ranked Daily attempts.
- On first login, prefill site username/display name from Discord, then require one onboarding screen where the user can keep or change them.
- Public usernames are unique and URL-safe.
- Public profile route: `/user/[username]`.
- Never expose Discord IDs or other private auth identifiers on public profiles.

## Progression

Progression comes later than the core game.

- Use an XP transaction ledger rather than only mutating one total integer.
- Daily and achievements should be the primary XP sources.
- Unlimited can award smaller XP with a maximum earnable amount per UTC day.
- XP never changes gameplay power or score.
- Start with a small achievement set (roughly 5-8), not a giant badge catalog.

## Design system

Target style: **modern product UI × Frieren**, not generic gaming neon and not overdecorated medieval fantasy.

Use:

- calm spacious layouts,
- warm off-white/parchment-like light surfaces,
- deep charcoal dark surfaces,
- muted sage/green,
- restrained gold accents,
- soft cool magical highlights,
- subtle botanical/magical motifs,
- refined typography,
- gentle motion,
- restrained borders and textures.

Avoid:

- generic `bg-zinc-950` dashboard appearance,
- excessive glassmorphism,
- giant ornamental fantasy frames around every component,
- loud gamer gradients,
- AI-generated anime art,
- UI that copies another game's branding too literally.

Both light and dark themes should be intentional. Light should be treated as a signature design, not a fallback.

## Routes direction

Prefer top-level game routes:

```text
/
/guessr
/guessr/daily
/guessr/play
/guessr/results/[attemptId]
/leaderboards/guessr
/user/[username]
/admin/frames
/admin/dailies
```

Future games may use routes such as `/frierendle` and `/connections`.

## Testing

The developer is not yet experienced with automated tests. Take the lead, but explain what each category protects.

Use Vitest for high-value deterministic domain logic, including:

- score curve,
- episode distance/global ordering,
- frame eligibility,
- Daily selection constraints,
- one-ranked-attempt rule,
- streak rollover,
- XP calculations when XP exists.

Use Playwright only for a small number of important browser flows, for example:

- complete one Unlimited game,
- complete one ranked Daily,
- prevent a second ranked Daily attempt,
- basic admin/curator happy path where practical.

Do not chase 100% coverage. Protect logic whose regression would change scores, fairness, progression, or core gameplay.

## Anti-cheat scope

Prevent trivial cheating, not determined reverse engineering.

- Keep correct answers server-side until a guess is submitted.
- Do not embed season/episode answers in client payloads or image object names.
- Validate round submissions server-side.
- Persist ranked Daily progress server-side.
- Do not allow restarting a ranked Daily attempt.
- Use basic rate/request validation where sensible.
- Do not add browser fingerprinting, invasive telemetry, IP-ban machinery, steganography, or an anti-cheat arms race without a demonstrated need.

## Scope discipline

Do not let these delay the first playable Guessr:

- friends/followers,
- comments/social feed,
- chat,
- complex moderation,
- weekly/monthly leaderboards,
- manga mode,
- audio/Heardle mode,
- generic minigame framework,
- advanced analytics,
- Redis,
- multiple OAuth providers,
- complex role hierarchies.

When uncertain, optimize for getting a polished FrierenGuessr loop playable, testable, and maintainable.
