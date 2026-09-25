# Phase 7 Prompt — Polish and Public-Launch Hardening

Read `AGENTS.md` and the project docs. This phase is about quality, not new game modes.

Before making changes, audit the existing application and give me a prioritized list of real launch issues. Do not perform a giant visual rewrite just because you can.

## Goal

Make the existing hub + Guessr experience robust enough to share publicly.

## Review areas

### UX

- mobile episode selector,
- frame sizing/aspect behavior,
- loading states,
- disabled/submitting states,
- error recovery,
- empty states,
- result readability,
- Daily locked/void/practice messaging,
- keyboard accessibility where applicable.

### Accessibility

- semantic controls,
- keyboard navigation,
- visible focus,
- useful alt behavior for game imagery without leaking the answer,
- contrast in both themes,
- reduced-motion support.

### Visual consistency

- Modern × Frieren identity,
- intentional light + dark themes,
- restrained ornamentation,
- consistent spacing/type hierarchy,
- no generic dashboard drift,
- no AI-generated artwork.

### Performance

- image sizing/loading,
- unnecessary client components,
- avoid fetching answers/data prematurely,
- server query review,
- obvious N+1 patterns,
- bundle/dependency sanity.

### Security/config

- admin authorization,
- production env secrets,
- development vs production Neon URLs,
- R2 credential exposure,
- answer leakage review,
- local curator cannot be accidentally exposed as a production filesystem browser.

### Public-project basics

- metadata/title/description,
- favicon/site identity using non-AI assets,
- clear unofficial fan-project notice,
- simple copyright/takedown/contact information,
- sensible error pages.

### Tests

- run/fix existing tests,
- remove brittle tests rather than piling on workarounds,
- add only missing high-value coverage discovered during audit.

## Explicit non-goals

Do not use this phase to add:

- a second minigame,
- social features,
- new progression systems,
- complex analytics,
- an architectural rewrite.

## Definition of done

The existing feature set feels coherent on phone and desktop, critical flows are tested, production configuration is understandable, and no major launch blocker remains unexplained.

Then STOP and give me a launch checklist plus any issues you intentionally left for later.
