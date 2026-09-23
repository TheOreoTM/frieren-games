# Phase 8 Prompt — Plan the Second Minigame Without Overgeneralizing

Do not implement a second game immediately.

Read `AGENTS.md`, the project docs, and inspect the now-existing Guessr/platform code.

I want to add either **Frierendle** or **Connections** next. First help me plan it collaboratively.

## Your task

1. Show me which existing pieces are truly reusable:
   - auth,
   - profiles,
   - XP/achievements,
   - hub navigation,
   - design tokens,
   - any leaderboard primitives that actually fit.
2. Show me which Guessr-specific pieces must remain Guessr-specific.
3. Propose the new game's domain/data model without forcing it through a generic `GameAttempt.payload` abstraction.
4. Identify any abstraction that is now justified because **two real games** need it.
5. Identify any abstraction that still would be premature.
6. Ask me the product/gameplay decisions needed for that specific game before writing it.

Do not generate a full implementation until we have agreed on that game's rules and scope.
