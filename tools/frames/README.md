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
