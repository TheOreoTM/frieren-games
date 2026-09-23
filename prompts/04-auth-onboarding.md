# Phase 4 Prompt — Discord Auth + Onboarding

Read `AGENTS.md` and the project docs. Preserve the anonymous Unlimited flow from Phase 3.

We are implementing **Phase 4 only**.

Before coding, inspect the repository for any existing Auth.js/NextAuth setup and explain the smallest integration plan.

## Goal

Add Discord identity and site profiles without making login mandatory for Unlimited.

## Requirements

### Authentication

- Auth.js / NextAuth with Discord OAuth.
- Persist accounts/users using the project's Prisma integration.
- Keep secrets server-side.
- Do not expose raw Discord IDs publicly.

### Public identity

A new user needs:
- unique site `username`,
- `displayName`,
- avatar/image where available,
- onboarding-complete state or equivalent.

On first Discord login:
1. prefill site username from Discord username,
2. prefill display name from Discord display/global name when available,
3. redirect to `/onboarding`,
4. let the user keep or edit both,
5. validate username as unique and URL-safe,
6. continue into the site.

Do not silently accept an ugly/generated username without showing onboarding once.

### Roles

Use only:

```text
USER
ADMIN
```

Create a simple documented way to bootstrap my account as ADMIN, preferably based on a trusted env-configured Discord account identifier or a deliberate manual DB action. Keep the role check server-side.

### Existing admin

Replace any temporary Phase 2 admin protection with real server-side admin authorization.

### Anonymous behavior

Anonymous users must still be able to:
- open `/guessr`,
- play Unlimited,
- finish a game.

Do not accidentally couple Guessr attempt state to a required User ID.

## Public route groundwork

It is fine to create a minimal `/user/[username]` shell if required by the identity model, but do not implement the full stats/XP profile yet.

## Tests

Add focused tests for username normalization/validation if nontrivial.

Add a lightweight onboarding/auth flow test only if feasible without brittle external Discord interaction; mock/test application behavior rather than attempting to automate real Discord login.

## Explicit non-goals

Do NOT implement:
- Daily,
- XP,
- achievements,
- rich user stats,
- friends/followers,
- multiple OAuth providers.

## Definition of done

- anonymous Unlimited still works,
- Discord login works in configured environments,
- new users see onboarding once,
- username defaults from Discord but can be changed,
- admin routes are actually authorized server-side.

Then STOP and hand the work back to me.
