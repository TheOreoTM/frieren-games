# Local frame curator

This developer-only server discovers local episode files, prepares browser-friendly preview proxies when needed, and extracts approved WebP stills from the original sources. It binds to `127.0.0.1` and is not part of the Next.js application.

## Prerequisites

- Node.js 22+
- `ffmpeg` and `ffprobe` on `PATH` (or set `FFMPEG_PATH` / `FFPROBE_PATH`)
- an absolute `CURATOR_MEDIA_ROOT` pointing to your local episode directory

Copy `.env.example` to `.env.local`, fill in `CURATOR_MEDIA_ROOT`, then run:

```bash
npm run curator
```

Open the printed loopback URL. MKV and other unsupported sources are transcoded once to `tools/curator/cache`; the cache is disposable. Approved images are written to `tools/curator/output`, and durable metadata is written atomically to `tools/curator/manifest.json`. All three paths are ignored by Git.

New approvals begin in `LOCAL_APPROVED`. The separate `npm run frames:push` command may later mark them `PUSHED` or `FAILED`; the curator preserves those records and continues appending new approvals.

## Timestamp model

Both the native browser source and generated proxy expose a zero-based media timeline. Proxy video timestamps are explicitly rebased with `setpts=PTS-STARTPTS`. Approval captures `HTMLMediaElement.currentTime` in integer milliseconds, then passes that relative time to FFmpeg's accurate input seek against the original source. The proxy is never screenshotted.

Some unusual sources can have broken timestamps or variable-frame-rate boundaries. For the POC exit test, compare the approved WebP with the paused preview at a visually distinctive cut. A one-frame difference near a cut is possible because a millisecond timestamp may fall between frames; the extracted image is the first decoded source frame at that seek point.

## Local safety

- The server binds only to `127.0.0.1` by default.
- Browser-visible episode IDs are opaque and map only to startup-discovered files.
- Symlinks are ignored, path containment is checked during discovery, and no request accepts a filesystem path.
- POST requests require the curator's exact loopback origin.
- No upload implementation exists in this phase.
