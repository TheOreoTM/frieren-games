# Frame push pipeline

`npm run frames:push` promotes locally approved WebPs from the curator queue to Cloudflare R2 and the development Neon database.

## Required environment

Configure these values in the root `.env.local`:

```env
DATABASE_URL="postgresql://...development database..."
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET="..."
R2_PUBLIC_BASE_URL="https://your-public-r2-domain.example"
```

The R2 token needs permission to write objects to this bucket. `R2_PUBLIC_BASE_URL` is the public/custom domain used to render uploaded images; it is not used for authenticated uploads.

Run the migration and episode seed before the first push:

```bash
npm run db:migrate
npm run db:seed
```

Then push:

```bash
npm run frames:push
```

## Safety and retries

- The complete JSON manifest is schema-validated before processing.
- Each WebP must remain inside `tools/curator/output`, match its recorded SHA-256 and dimensions, contain a valid still WebP structure, and contain no animation, EXIF, XMP, or ICC chunks.
- `Frame.id` is the curator's opaque `localId`; its object key is always `frames/<localId>.webp`.
- Upload metadata never includes the source filename, season, episode, or timestamp.
- A retry overwrites the same object and upserts the same database row. Already `PUSHED` entries are skipped.
- Per-frame failures are saved as `FAILED` with a local error and are retried by the next run.
- Source episodes and preview proxies are never considered for upload.

## Frame admin

The frame admin requires Discord authentication and a database `ADMIN` role. Configure the Auth.js variables described in the root README, including your trusted account ID:

```env
ADMIN_DISCORD_ID="your personal Discord user ID"
```

Run `npm run dev`, sign in with that Discord account, and open `http://localhost:3000/admin/frames`. The route and every mutation perform their own server-side role check. Deletion is intentionally omitted; disable a frame instead.

## Production promotion

The curator manifest has one local workflow status, so do not edit `PUSHED` records or point
`.env.local` at production. Production promotion deliberately ignores the development push status
and synchronizes every locally approved manifest record to an explicitly named target.

First apply the reviewed Prisma migrations to the production database using
`prisma migrate deploy`. Then create the ignored production promotion environment file:

```bash
cp .env.frames-production.example .env.frames-production.local
```

Fill it with the production Neon and R2 values. This custom filename is intentional: Next.js does
not automatically load the R2 write credentials during normal production builds. Run the default
dry-run first:

```bash
npm run frames:promote
```

The dry-run validates every local WebP, reads the production Frame inventory, detects immutable
metadata conflicts, and prints the proposed create/update counts. It does not write to PostgreSQL
or R2.

Apply only after checking the displayed database hostname, bucket, public origin, and plan:

```bash
npm run frames:promote -- --apply --confirm=frieren-production
```

Use the exact `PRODUCTION_TARGET_LABEL` configured in `.env.frames-production.local`. An apply run:

- verifies and uploads every approved WebP under its existing opaque object key,
- synchronizes the canonical Episode catalogue,
- creates missing Frame rows and updates difficulty only on matching rows,
- aborts rather than changing conflicting episode, timestamp, object-key, or dimension metadata,
- leaves `tools/curator/manifest.json` untouched and is safe to retry.

The production R2 bucket may be the same bucket used during development or a separate bucket. In
either case, uploads are idempotent because object keys derive from stable opaque frame IDs.
