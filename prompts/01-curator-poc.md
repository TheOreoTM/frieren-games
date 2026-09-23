# Phase 1 Prompt — Curator Proof of Concept

Read `AGENTS.md`, `docs/PROJECT_SPEC.md`, `docs/ARCHITECTURE.md`, and `docs/ROADMAP.md` before making changes.

We are starting **Phase 1 only**. Do not implement later phases.

I want to work on this with you, not hand the whole project off. Begin by inspecting the repository and briefly tell me:
- the current structure and relevant tooling,
- anything in the repo that conflicts with the planning docs,
- the exact small implementation plan you propose for this phase,
- any dependency you think must be added and why.

Do not make a large architectural change before explaining it.

## Goal

Prove this complete local workflow:

```text
local Frieren episode
-> discover season/episode
-> open/scrub it in a local curator UI
-> read current timestamp
-> choose Easy/Medium/Hard
-> click Approve Frame
-> FFmpeg extracts a final WebP from the ORIGINAL source
-> persistent local manifest entry is created
```

The local episode itself must never be uploaded anywhere.

## Scope

Implement only what is required for the proof of concept:

1. Confirm or establish the minimum project/theme structure needed to work cleanly.
2. Connect Prisma to a Neon **development** database through `DATABASE_URL`.
3. Add only the initial `Episode` and `Frame` data model needed by this phase. Do not add Daily, XP, achievements, attempts, or full profile models yet.
4. Add a minimal episode metadata seed mechanism suitable for Frieren TV seasons. Keep the seed data separate and easy to extend. Do not turn this into a full anime metadata database.
5. Add a developer-only local curator under `tools/curator` or an equally clear local-only location.
6. Add a simple command such as `pnpm curator`.
7. Read a configured local media root from environment/config rather than hardcoding my machine path.
8. Discover episode files and parse common `S01E01`-style tokens even when filenames have prefixes/suffixes.
9. Use ffprobe to obtain useful source metadata such as duration.
10. Build the smallest usable curator UI with:
    - episode selection,
    - local video preview,
    - current timestamp,
    - play/pause,
    - scrubbing/seeking,
    - difficulty selector,
    - `Approve Frame`.
11. Browser playback of MKV is not guaranteed. Design the POC so a browser-incompatible source can generate/cache a disposable local browser-friendly preview proxy, while the final screenshot is always extracted from the original source.
12. On approval, use FFmpeg to extract the exact source frame and output approximately 1280x720 WebP while preserving aspect ratio and avoiding unnecessary metadata.
13. Give each approved frame a random/opaque local ID.
14. Persist an approval queue/manifest locally so work survives restarting the tool.
15. Add useful keyboard controls if they fit cleanly:
    - Space play/pause
    - Left/Right ~5s
    - Shift+Left/Right ~1s
    - 1/2/3 difficulty
    - A approve
    - N/P next/previous episode
16. Add focused tests for filename parsing and any other important pure logic introduced.

## Safety / local-tool requirements

- Bind local media serving to loopback by default.
- Do not allow arbitrary filesystem path traversal from browser requests.
- Only expose files discovered inside the configured media root.
- Do not create production routes that can browse my local filesystem.
- Do not upload episodes or proxy videos.

## Important implementation note

The most important thing to validate is timestamp correctness. If a preview proxy is used, make sure approving at a preview timestamp extracts the expected frame from the original source. Explain any timestamp/seek caveats you encounter.

## Explicit non-goals

Do NOT implement in this phase:
- Cloudflare R2 upload,
- `frames:push`,
- full production admin,
- playable Guessr,
- Discord auth,
- Daily mode,
- leaderboards,
- profiles,
- XP,
- achievements,
- Frierendle/Connections,
- AI-generated visual assets.

## Definition of done

I can point the curator at at least one local Frieren episode, scrub to a moment, choose difficulty, approve it, and see:
- a real WebP extracted from the original source,
- correct season/episode/timestamp metadata,
- a durable local manifest record.

When that works, **STOP**. Do not begin R2 or the Guessr UI.

At the end, give me:
1. what you changed,
2. why,
3. files changed,
4. commands I should run,
5. how I can manually verify the entire flow,
6. tests added and what they protect,
7. anything I should understand about the curator/media implementation,
8. known limitations,
9. the suggested Phase 2 task.
