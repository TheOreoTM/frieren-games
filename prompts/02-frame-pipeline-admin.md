# Phase 2 Prompt — Frame Push Pipeline + Frame Admin

Read the repository `AGENTS.md` and project docs first. Inspect the Phase 1 implementation before changing it.

We are implementing **Phase 2 only**. Do not build playable Guessr yet.

Before coding, summarize how the current curator manifest works and propose the smallest clean design for pushing approved frames to Cloudflare R2 + Neon. Explain any new dependencies before adding them.

## Goal

Turn locally approved frames into safe, manageable production content.

Target workflow:

```text
curator approval queue
-> pnpm frames:push
-> validate batch
-> upload WebPs with opaque R2 keys
-> insert Frame records
-> mark local entries pushed
-> production /admin/frames can manage them
```

## Requirements

### Push command

Implement a command such as:

```bash
pnpm frames:push
```

It should:
- read the local approval manifest,
- validate records with a clear schema,
- verify image files exist and are expected WebP images,
- refuse malformed records with actionable errors,
- generate/use opaque external IDs and R2 object keys that reveal no season/episode/timestamp,
- upload only approved frame images,
- insert the corresponding database row linked to the correct Episode,
- be idempotent/retry-safe,
- clearly summarize pushed/skipped/failed records,
- never upload source videos or local preview proxies.

Strip or verify removal of unnecessary image metadata. Do not include source filenames/paths in public asset metadata.

### R2 abstraction

Create a small focused storage module instead of scattering S3-compatible calls through the app/tooling.

Keep credentials server/tooling-only.

### Database

Evolve the existing `Frame` model only as needed for reliable upload/admin management. Explain material schema changes before applying them. Use migrations. Never reset the DB.

### Admin authorization

If full auth is not implemented yet, do not fake a production-ready auth system just for this phase. It is acceptable for `/admin/frames` to be clearly development-gated/temporary until the auth phase, as long as you document that fact and do not expose it as secure production admin.

### `/admin/frames`

Build a useful frame-management page for uploaded frames with:
- image preview,
- season,
- episode number,
- episode title,
- timestamp,
- difficulty,
- enabled/disabled state,
- filters for season/episode/difficulty/status,
- ability to change difficulty,
- ability to enable/disable.

Deletion can be conservative. If safe deletion semantics are not obvious yet, implement disable first and document deletion for later rather than risking broken references.

## URL/data leakage requirement

A player-facing or admin image URL/object key must not contain strings like:

```text
s01e14
season-1
episode-14
08m42s
```

The answer belongs in the database, not the object path.

## Testing

Add focused tests for:
- manifest validation,
- idempotency-related pure logic,
- opaque object-key generation shape if deterministic properties can be tested,
- any important mapping from manifest -> DB input.

Do not overbuild an R2 integration test suite unless there is already infrastructure for it.

## Explicit non-goals

Do NOT implement:
- Guessr gameplay,
- Daily mode,
- Discord OAuth,
- XP/achievements,
- future minigames.

## Definition of done

I can approve multiple frames locally, run one explicit push command, see them in R2/Neon, rerun the command without creating duplicates, and manage their difficulty/enabled state from `/admin/frames`.

Then STOP and hand the work back to me with the standard summary/test instructions from `AGENTS.md`.
