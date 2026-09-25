# Start Here

Copy this planning package into the root of the Frieren project repository:

```text
AGENTS.md
docs/PROJECT_SPEC.md
docs/ARCHITECTURE.md
docs/ROADMAP.md
prompts/*.md
```

Then work through the prompts one at a time with your coding agent.

## Important workflow

Do **not** paste every phase at once.

For each phase:

1. give the agent the relevant prompt,
2. let it inspect the repo,
3. discuss any meaningful architectural choice it raises,
4. let it implement only that phase,
5. run the project yourself,
6. inspect the changes,
7. ask questions/change things you dislike,
8. only then move to the next phase.

`AGENTS.md` is intentionally written so the agent should stop after bounded work instead of racing through the roadmap.

## First prompt

Start with:

```text
prompts/01-curator-poc.md
```

This deliberately validates the local-video -> timestamp -> FFmpeg -> WebP pipeline before investing in the rest of the application.

## Local environment you will eventually need

- Node.js/pnpm appropriate for the project
- FFmpeg and ffprobe available on PATH
- a Neon development database URL
- a local folder containing your Frieren TV episode files

R2 and Discord OAuth are not required for the first curator proof of concept.

## Secrets

Do not commit:

- `DATABASE_URL`
- Discord OAuth credentials
- R2 credentials
- local episode paths that reveal unnecessary machine/user information

Use `.env.local` or the repository's existing secret-management convention.
