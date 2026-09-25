# Development Roadmap

This roadmap is intentionally phased so the developer remains involved and the AI does not sprint through the whole application.

## Phase 0 — Repo review

Goal: understand what already exists before changing architecture.

Tasks:

- inspect package manager, Next.js structure, Tailwind/shadcn setup, linting, TypeScript, Prisma if present,
- read `AGENTS.md` and docs,
- identify conflicts between repo reality and proposed structure,
- propose the smallest adjustments.

Stop before broad implementation if the repo significantly differs from the plan.

## Phase 1 — Curator proof of concept

Goal: validate the riskiest technical workflow first.

Deliverables:

- basic design tokens/theme scaffold if missing,
- Neon development DB connection,
- initial `Episode` + `Frame` schema only,
- minimal episode seed source,
- local curator skeleton,
- local media-root configuration,
- episode filename discovery/parser,
- ffprobe integration,
- browser playback or cached proxy fallback,
- current timestamp display,
- Easy/Medium/Hard selection,
- `Approve Frame`,
- FFmpeg final WebP extraction from the original source,
- persistent local manifest entry,
- tests for filename parsing and any important pure logic.

Explicit non-goals:

- R2 upload,
- full game UI,
- auth,
- Daily,
- XP,
- achievements.

Exit test:
`local episode -> scrub -> approve -> real WebP + manifest` works reliably.

## Phase 2 — Frame pipeline + content admin

Goal: turn curated local frames into usable application content.

Deliverables:

- `frames:push`,
- manifest validation,
- opaque IDs/object keys,
- WebP metadata stripping/verification,
- R2 abstraction,
- DB insert/upsert/idempotency,
- basic `/admin/frames`,
- enable/disable,
- difficulty editing,
- episode/timestamp context,
- safe deletion rules,
- optional scene-suggestion groundwork only if it does not distract.

Exit test:
a batch of local-approved frames can be pushed, viewed in admin, and loaded by the app without answer-bearing URLs.

## Phase 3 — Unlimited Guessr

Goal: ship the core playable loop.

Deliverables:

- `/guessr` landing/mode entry,
- `/guessr/play`,
- five-round Unlimited game,
- server-selected approved frames,
- season tabs + episode grid,
- server-side scoring,
- reveal UI,
- chronological guess-vs-answer visualization,
- final 25K-style results screen,
- anonymous support,
- responsive mobile UX,
- Vitest score/order tests,
- one Playwright Unlimited happy path.

Exit test:
an anonymous user can complete multiple five-round games without any answer being sent before submission.

## Phase 4 — Discord auth + onboarding

Goal: add identity without entangling the game with login requirements.

Deliverables:

- Discord Auth.js/NextAuth setup,
- profile/user persistence,
- `USER | ADMIN`,
- first-login `/onboarding`,
- Discord username/display name prefill,
- unique site username,
- admin bootstrap path,
- signed-in navigation states.

Exit test:
Unlimited still works anonymously; a new Discord user can log in, choose/keep a username, and reach the game.

## Phase 5 — Daily Guessr

Goal: add the main competitive loop.

Deliverables:

- Daily schema,
- challenge/round generation,
- constrained selection,
- future frame reservation from Unlimited,
- `/admin/dailies` calendar,
- arbitrary date-range generation,
- preview/replace/regenerate/approve,
- lock on active date,
- fallback generation,
- one ranked attempt per account,
- practice replay,
- streak logic,
- Daily leaderboard/history,
- shared ties,
- `VOID DAILY`,
- relevant unit/integration/E2E tests.

Exit test:
two accounts receive the same Daily; each gets one ranked attempt; tomorrow's reserved frames do not leak through Unlimited.

## Phase 6 — Profiles, stats, XP, achievements

Goal: add retention/progression after gameplay is stable.

Deliverables:

- `/user/[username]`,
- Guessr stats,
- recent Dailies,
- streak display,
- XP transaction ledger,
- level calculation,
- capped Unlimited XP per UTC day,
- achievement definitions/grants,
- roughly 5-8 initial achievements,
- deduplication tests.

Exit test:
progression is auditable and cannot be farmed infinitely through Unlimited in one day.

## Phase 7 — Polish + public-launch hardening

Goal: make the site feel deliberate and safe to share.

Deliverables:

- accessibility pass,
- mobile/device pass,
- loading/error/empty states,
- reduced-motion behavior,
- performance/image-loading review,
- SEO/basic metadata,
- unofficial fan-project notice,
- takedown/contact route or information,
- production env audit,
- migration/backup expectations,
- admin safety review,
- test cleanup.

## Phase 8 — Second game

Recommended next game: Frierendle or Connections.

Before building it:

- identify which platform pieces are genuinely reusable,
- only then extract abstractions supported by two real games,
- keep the new game's domain tables/logic independent.
