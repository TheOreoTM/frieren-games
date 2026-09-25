# Public launch checklist

Use this checklist for the first production deploy and for later high-risk releases.

## Accounts and environment

- Create separate Neon development and production databases or branches. Never point `.env.local` at production.
- Set `DATABASE_URL`, `AUTH_SECRET`, `AUTH_DISCORD_ID`, `AUTH_DISCORD_SECRET`, `ADMIN_DISCORD_ID`, `GUESSR_SESSION_SECRET`, and `R2_PUBLIC_BASE_URL` in Vercel.
- Keep `AUTH_SECRET` and `GUESSR_SESSION_SECRET` independent and at least 32 random characters.
- Do not configure `CURATOR_MEDIA_ROOT`, R2 write credentials, episode paths, or FFmpeg paths in Vercel. The production app only needs the public R2 base URL.
- Run `npm run env:check` against the intended production environment before deployment.
- Register `https://frieren.oreotm.xyz/api/auth/callback/discord` in the Discord application.

## Database and migrations

- Take a Neon branch/snapshot before the first production migration and before migrations that rewrite existing data.
- Review every SQL file in `prisma/migrations/` before applying it.
- Apply production migrations with `npx prisma migrate deploy`; never use `prisma migrate dev`, reset, or seed against production.
- Confirm `npx prisma migrate status` reports the production schema as up to date.
- Test restoring a Neon branch or snapshot before relying on it as a backup plan.

## R2 and media

- Confirm the public R2 hostname uses HTTPS and only exposes approved opaque `frames/<id>.webp` objects.
- Keep R2 write keys local to the frame-push workflow; rotate them if they are ever copied to an unintended environment.
- Verify a production frame response has an immutable long-lived cache policy.
- Confirm the local curator still binds only to `127.0.0.1` and is not run as part of the Vercel build or start commands.

## Pre-deploy verification

```bash
npm ci
npm run prisma:generate
npm test
npm run lint
npm run build
npm audit --omit=dev
```

- Review unresolved dependency advisories instead of applying a breaking `npm audit fix --force` automatically.
- Verify light and dark OS themes, keyboard-only play, reduced motion, and a narrow mobile viewport.
- Complete one anonymous Unlimited game and one signed-in Unlimited game.
- Complete one ranked Daily, confirm a replay is Practice, and confirm a second ranked attempt is impossible.
- Check `/admin/frames` and `/admin/dailies` with an admin and with a non-admin account.

## Post-deploy checks

- Open `/`, `/guessr`, `/guessr/daily`, `/leaderboards/guessr`, one public profile, and `/legal` on the canonical domain.
- Confirm Discord login returns to the canonical domain and a new account reaches onboarding.
- Confirm frames and proxied avatars load without answer-bearing URLs or provider IDs in page markup.
- Confirm security headers, `robots.txt`, and `sitemap.xml` are present.
- Generate and approve at least several future Dailies; verify their frames do not appear in Unlimited.
- Record the current production migration and Neon backup/branch identifier in the release notes.

## Incident basics

- Use `VOID DAILY` for a catastrophically broken active Daily; never replace active rounds for only some players.
- Disable a bad frame for future Unlimited selection and review any future Dailies that contain it.
- For a suspected credential leak, rotate Auth, Discord, database, and R2 credentials according to the affected scope.
- Direct copyright, takedown, or privacy contacts to the project GitHub issue/contact channel without asking people to post sensitive personal data publicly.
