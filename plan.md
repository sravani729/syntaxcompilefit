# SyntaxCompileFit implementation plan

## Product approach

Build a single-page React prototype that makes the core learning loop tangible: discover a problem, open a guided coding workspace, run/submit a sample Java solution, then inspect analysis, brute-force vs optimal comparison, interview preparation, analytics and history. Use realistic local state and sample data so the prototype feels complete without requiring external credentials or a database round-trip.

## Scope and behavior

- Public landing state: brand story, workflow ribbon, feature cards, and CTAs into the app.
- App shell: responsive sidebar navigation for Dashboard, Problems, Practice, Analytics and History; profile chip and streak indicator.
- Dashboard: welcome block, stats, skill progress, weekly activity bars and recent submissions.
- Problems: searchable/filterable problem catalog with difficulty/topic/status chips and a Start practice action.
- Practice: Two Sum workspace with problem statement, constraints/examples, Java editor, language selector, Reset, Run, Submit, and console tabs. Run shows a passing sample output; Submit shows accepted state and opens analysis.
- Analysis: submitted solution, plain-language explanation, complexity, strengths/improvements, brute-force and optimal approaches, comparison table, interview questions with model answers.
- Analytics and History: compact progress chart, topic breakdown, streak panel and submission log.
- Authentication is represented as a lightweight welcome/profile flow rather than a protected backend route; the prototype starts in the signed-in dashboard state after the landing CTA.

## Design system

- **Design movement:** editorial developer-tool UI with a warm paper-like canvas, crisp dark ink, and electric mint accents.
- **Core principles:** legible at a glance, evidence over decoration, friendly coaching, and purposeful density.
- **Color philosophy:** deep ink/navy grounds the experience; mint signals progress and “accepted”; amber marks attention; cream keeps the student project approachable rather than corporate.
- **Layout paradigm:** persistent left rail plus offset content panels; avoid centered marketing grids in the app, use asymmetric “workbench” composition for code and analysis.
- **Signature elements:** lime code-bracket mark, thin ruled dividers, and rounded status pills with tiny monospace labels.
- **Interaction philosophy:** navigation changes the visible work surface; CTAs move the user forward; tabs and filters update local state immediately; Run and Submit provide clear feedback.
- **Animation:** subtle 160–220ms fades/slides on panels and status updates; no looping hero motion; respect reduced motion.
- **Typography:** Inter for UI/body, Space Grotesk for display headings, and JetBrains Mono for code/metadata.
- **Brand essence:** a student-first coding workbench that teaches you to solve and explain; curious, direct, encouraging.
- **Brand voice:** specific and motivating, never inflated. Examples: “Make the next submission teach you something.” and “Don’t just pass the tests. Know why it works.”
- **Wordmark/logo:** a compact `{_}` lime bracket mark paired with the SyntaxCompileFit wordmark.
- **Signature brand color:** electric mint `#C8F56A`, used for accepted states and primary CTAs.

## Project structure

- `client/src/App.tsx`: all prototype state, screens, sample data and reusable presentational sections.
- `client/src/index.css`: design tokens, layout primitives, responsive behavior, editor/analytics styling.
- `public/manus-routes.json`: route manifest for `/` and the in-app SPA routes.
- `plan.md` and `TODO.md`: implementation contract and outcome tracking.

## Dependencies and serving

Reuse the initialized React/Vite/Express starter and existing icon dependency (`lucide-react`). Run with `pnpm dev` on the configured port 3000. Keep the current Server + Database configuration intact for future persistence, while this first prototype uses local client state and static sample content. Before delivery, run TypeScript checks, verify the route manifest over HTTP, inspect the running preview, then commit the intended files to the canonical repository.
