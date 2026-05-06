# NEMO X Project Rules

This is a React + Vite single-page app — the kinetic, gameplay-driven counterpart to ProjectNEMO Field Journal. Players identify, learn, and protect real species through five (soon six) gameplay modes, with progress feeding a points/certificates meta-loop.

The app is the `nemo-x` package in this repo. Future backend work for accounts, leaderboards, save sync, and shop economy will live in a separate `server/` directory and is described in the **Backend Rules** section even though the code does not yet exist.

## Technical Baseline

- Runtime: React 18 + Vite 5 + plain CSS (no preprocessor, no Tailwind, no CSS-in-JS)
- Language: modern JavaScript (ES2022+), no TypeScript yet
- Persistence today: `localStorage` via the `useLocalStorage` hook
- Persistence tomorrow: REST API + Postgres (see **Backend Rules**)
- Project grade: production-quality from the start. First slices may be narrow, but they must use real foundations for state management, accessibility, persistence, error handling, and tests. No throwaway prototypes once a feature ships.
- Browser target: evergreen Chrome, Safari, Firefox, Edge. Mobile Safari and mobile Chrome are first-class.
- Build: `npm install && npm run build`. Dev: `npm run dev`. Preview: `npm run preview`.

## Brand System Rules

The brand identity is **ProjectNEMO field-guide** — cream paper, forest ink, editorial typography, no neon, no kinetic glow chrome. The full token set lives in `src/styles/global.css`. Drift here is the most expensive bug in the codebase because it touches every screen.

- **Always use CSS custom properties from `global.css` for color, radius, spacing, shadow, and easing.** Never hardcode hex values, rgb tints, or pixel radii in component CSS.
- The token set: `--cream`, `--ink`, `--ink-soft`, `--ink-faint`, `--forest`, `--forest-deep`, `--sage`, `--amber`, `--magenta` (clay), `--bg-base`, `--bg-raised`, `--border`, `--line`, `--line-strong`, `--radius` (6px), `--radius-lg`, `--radius-xl`.
- **Action buttons** use `border-radius: var(--radius)` (6px). Never `100px` (pill) on a button.
- **Thin progress bars** (≤8px tall) may use 2–4px radius as a capsule end-cap. That is the only exception to the no-pill rule.
- **No neon glow shadows.** Box-shadows are warm and subtle: `rgba(26, 60, 42, 0.05–0.10)` for forest tints, `rgba(184, 85, 58, 0.08–0.12)` for clay.
- **No `text-shadow` glows on text.** Typography carries weight through font choice and color, not luminescence.
- **No `pulse-glow` or other persistent attention-seeking animations** on resting UI. Reserved for ephemeral moments only (correct-answer flash, etc.).
- **Typography:** Playfair Display for titles, numbers, and editorial moments; Source Sans 3 for body, labels, and UI chrome. Never invert this.
- **All-caps labels come from CSS (`text-transform: uppercase`), not from JS source strings.** Never write `LABEL TEXT` or call `.toUpperCase()` in JSX. Write source as title or sentence case; let the `.eyebrow` class or per-component CSS handle the visual transform.
- The legacy "kinetic" tokens (`--bg-void`, `--acid`, `--magenta-neon`, `pulse-glow` keyframe) remain declared in `global.css` for backward compatibility but **must not be used in new code**.

## Frontend Architecture Rules

- Every component lives in one of three directories:
  - `src/components/` — shared, reusable UI (HUD, BottomNav, Onboarding, ToastLayer, SpeciesGlyph)
  - `src/modes/` — full-screen gameplay modes (SwipeMode, SpeedIDMode, QuizMode, HabitatMode, SurviveMode, plus the upcoming WorldSimMode)
  - `src/hooks/` — reusable stateful logic (`useGameState`, `useLocalStorage`)
- Each component pairs `Component.jsx` with `component.css` (lowercase). The CSS file imports from `global.css` tokens; it never redefines them.
- **State that survives mode switches** lives in `useGameState` (the central reducer-style hook). Mode-local state lives in the mode component.
- **Persistent state** goes through `useLocalStorage`, never `localStorage.setItem` directly. The hook handles JSON serialization, error recovery, and (eventually) server sync.
- New gameplay modes follow the established pattern: a single default-exported component, an `intro` / `playing` / `result` phase machine where appropriate, and a CSS file that uses tokens.
- Routing today is mode-based via `useGameState`. If/when route-based navigation is added, use React Router and keep deep links working.
- Side effects (timers, event listeners, network) live in `useEffect` with proper cleanup. Never start a timer without clearing it.

## Points & Meta-Loop Rules

This system is being built. Rules go here as decisions land.

- The single in-game currency is called **field notes** (or whichever brand-appropriate name we land on). One unified currency across all modes.
- Points are **earned**, never **purchased**. No real-money currency, no premium currency, no gem-style dual economy.
- The **shop** sells in-world conservation actions (corridors, anti-poaching funding, habitat purchases) that affect the world simulation. **No cosmetic items.** No skins, hats, badges-as-vanity. Vanity rewards conflict with the brand pitch ("real species, real stakes") and are not allowed.
- **Certificates** are the achievement layer. They render as field-guide-style paper artifacts and are earned at milestones, never bought.
- Certificate templates live in `src/data/certificates.js`. Each entry has an `id`, `name`, `description`, milestone predicate, and SVG/JSX render function.

## World Simulation Rules

Coming in a near-future commit. Design intent recorded here so future sessions can extend it consistently.

- The mode is **dual-perspective**: alternating turns between human and animal in the same world.
- Four meters drive every scenario: **biodiversity, climate, human prosperity, biosphere** (or the closest brand-correct names we settle on). Drop any meter to zero and the run ends.
- Mechanics are **Reigns-style** (decision cards, two-to-four choices per card, each choice shifts meters), not open-world. We are not building Minecraft.
- Scenarios are **hand-authored**, not procedurally generated, so we can guarantee accuracy to real conservation data.
- World state is read-only to the rest of the app *unless* the player has spent shop currency on a conservation action, which then feeds back into the simulation.

## Backend Rules (Forward-Looking)

The app is currently client-only. When the backend lands, these are the rules.

- The backend is a separate Node + Fastify (or Express) service in a `server/` directory at the repo root.
- All persistent business data — accounts, runs, points totals, certificates earned, shop purchases, world-sim state — lives behind `/api/v1/*` routes. Never put business data behind the same Vite dev server.
- **Frontend never talks directly to the database.** The frontend calls `/api/v1/*`; the API talks to Postgres.
- All API responses follow a consistent envelope:
  - success: `{ "data": ..., "meta": ... }`
  - validation error: HTTP 422, body `{ "errors": { "fieldName": ["message"] } }`
  - auth error: HTTP 401 (unauthenticated) or 403 (unauthorized)
  - domain failure: most specific 4xx/5xx + a stable string error code
- Authentication: JWT in HTTP-only cookies. Never localStorage. Never URL params.
- Use database transactions for any multi-row write (a "run completed" event writes points + run record + maybe certificate grant — that's one transaction).
- Use Zod (or equivalent) for request validation at the API boundary. Never trust client input.
- Audit log every points grant, certificate grant, and shop purchase, with user ID and timestamp.
- Idempotency keys on any endpoint that grants points or certificates so a retried request cannot double-credit.

## Coding Standards

- Use **functional components + hooks** exclusively. No class components.
- **Prop names are camelCase, CSS classes are kebab-case, file names match component names** (`SpeciesGlyph.jsx` exports `SpeciesGlyph`).
- Destructure props in the function signature when there are five or fewer; use `props.xyz` when there are more (it stays readable).
- Prefer derived values computed during render over state mirrored from other state.
- **Effects are a last resort**, not a first reach. If you can compute it during render or handle it in an event handler, do that instead.
- Memoize (`useMemo`, `useCallback`) only when there's a measurable problem or a referential-equality requirement (deps arrays, `React.memo` children). Premature memoization makes code worse.
- Keep `useEffect` dependency arrays accurate. If the linter complains, the linter is right; fix the underlying logic, don't suppress.
- No default exports for utility files (only for components).
- One component per file unless two are tightly coupled and never used apart.

## Comment & Documentation Style

- **Every JSX file gets a header block** explaining what the component is, why it exists, and what it owns vs. what its parent owns.
- **Non-obvious logic gets inline comments** explaining the *why*, not the *what* (`// debounce so we don't fire on every keystroke`, not `// set timer`).
- **State machines and reducers get a comment listing the legal phase/action transitions.**
- During the current "teaching" phase of this codebase, comments may also explain *what* React or JS concepts are doing for learning purposes. As the project owner becomes comfortable with React, those comments should be removed in a "graduate to medium-density comments" pass.
- README is for humans onboarding. AGENTS.md (this file) is for AI agents and contributors. They are not the same and should not duplicate each other.

## Testing & Verification Rules

- **Vitest + React Testing Library** is the testing stack (to be installed when the first test lands; not present yet).
- Every reducer/hook gets unit tests for each legal transition.
- Every gameplay mode gets a smoke test: it mounts, the user can complete one round, the expected state change happens.
- Every points/certificate grant gets a regression test once the system exists.
- Run `npm run build` after asset, CSS, or import-graph changes to catch broken bundling.
- Run `npm run dev` to manually verify visual behavior. The brand system makes regressions easy to spot at a glance — use that.

## Workflow Rules

- **One concern per commit.** "Brand migration" is one commit. "Add points system" is another. "Add AGENTS.md and teaching comments" is another. Don't mix.
- Commit messages: imperative mood, summary line ≤72 chars, blank line, body explaining the *why* if non-trivial.
- Push to `origin/main` after each green commit. There is no PR review process today (solo project), but treat `main` as deployable anyway.
- Before adding a dependency, ask: can a hook or 30 lines of plain JS do this? If yes, prefer that. The current `package.json` has exactly two runtime dependencies (`react`, `react-dom`) and that is a feature.
- When adding a new mode, copy an existing mode's structure rather than inventing a new one. Consistency is more valuable than cleverness.

## Things That Are Out Of Scope

These have been considered and rejected. Reopening any of them requires an explicit conversation, not a quiet PR.

- **Cosmetic shop items / skins / hats.** Conflicts with the brand pitch.
- **Daily login streaks, push notifications, FOMO mechanics.** Conflicts with the brand pitch.
- **Open-world / Minecraft-style world simulation.** Out of scope for the team size; Reigns-style is the design.
- **Multiplayer / social feed.** Possibly someday, not now. Don't preemptively add hooks for it.
- **Real-money microtransactions.** Hard no.
- **TypeScript migration.** Possibly someday, not now. New files use JSDoc for type hints when types matter.
- **CSS-in-JS, styled-components, Tailwind.** The plain-CSS + tokens approach is intentional and works.
