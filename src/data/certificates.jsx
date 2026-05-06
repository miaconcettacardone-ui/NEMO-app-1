/**
 * certificates.js — the achievement layer.
 *
 * Per AGENTS.md, certificates are the meta-loop's rewards: field-guide-style
 * paper artifacts earned at milestones, never bought. Each one renders as
 * an inline-SVG paper artifact in the Credentials view.
 *
 * SHAPE OF A CERTIFICATE
 *   id          — stable string key. Used both as the React `key` prop and
 *                 as the lookup key inside `state.earnedCertificates`. NEVER
 *                 rename an id once it's been issued — players have it saved.
 *   name        — display name, written in title case.
 *   tier        — 'field-notes' | 'documented' | 'verified'. Three rough
 *                 tiers from "you started" through "you're committed" to
 *                 "you went deep." Used by the UI for sorting and styling.
 *   description — one-line plain-English summary of what earned this.
 *   predicate   — function(state, allSpecies) => boolean. Pure. Returns true
 *                 when the player qualifies. The provider re-runs every
 *                 predicate after each state change; once a predicate
 *                 returns true the certificate is granted and stays granted
 *                 (no de-grants — losing progress doesn't take a cert away).
 *   render      — function() => JSX returning the inline-SVG art for the
 *                 cert face. Called by <Credentials>. Self-contained — the
 *                 SVG includes its own viewBox and uses brand tokens via
 *                 CSS variables (`var(--forest)`, etc.) rather than literal
 *                 hex codes, so the certs respect any future theme work.
 *
 * TIER NOTES
 *   field-notes — early/easy. First swipe, first run, first quiz right.
 *   documented  — committed. Multiple runs, mastered species, biosphere care.
 *   verified    — substantial. Long streaks, deep collection, Survive
 *                 specialist work. These are the "you're really doing this"
 *                 awards.
 *
 * EXTENDING THIS FILE
 *   Append new entries; never reorder existing ones (the order in the file
 *   doubles as a soft display priority for ties). When tuning predicates,
 *   keep the floor honest: a cert that can't be lost should never be
 *   trivially given. The current set is balanced so no certificate fires
 *   in the first session except the four obvious "you started" ones.
 *
 * NOTE on the file extension: this is `.jsx` rather than `.js` because the
 * render functions return real JSX. Vite's React plugin auto-transforms JSX
 * in `.jsx` files; keeping the extension honest also signals to humans that
 * this file isn't pure data.
 */

// ---------------------------------------------------------------------------
// SVG TEMPLATE HELPERS
// ---------------------------------------------------------------------------
// Every certificate is roughly the same shape: a cream paper rectangle with
// a forest border, a small ornament, a name, and a body line. Rather than
// copy-paste that scaffold thirteen times, we factor it into a single
// PaperArt component that each `render` calls with its own ornament + lines.
//
// This isn't a React component file (it lives in /data/), but JSX works
// anywhere the build can transform it. The render functions are pure:
// they take no arguments and return the same JSX every call.

function PaperArt({ ornament, eyebrow, title, body, accent = 'forest' }) {
  // accent = 'forest' | 'amber' | 'sage' | 'magenta'
  // We translate the prop into a CSS variable string. Defaulting to forest
  // because most cert faces use the primary brand green.
  const accentVar = `var(--${accent})`;

  return (
    <svg
      viewBox="0 0 320 200"
      xmlns="http://www.w3.org/2000/svg"
      className="cert-art"
      role="img"
      aria-label={`${title} certificate`}
    >
      {/* Paper face */}
      <rect x="4" y="4" width="312" height="192" rx="3" fill="var(--bg-raised)" stroke={accentVar} strokeWidth="1.2" />
      {/* Inner hairline — gives the field-journal "bordered card" feel */}
      <rect x="12" y="12" width="296" height="176" rx="1" fill="none" stroke={accentVar} strokeWidth="0.5" opacity="0.35" />

      {/* Ornament — the small symbol top-center. Per-cert flavor. */}
      <g transform="translate(160 44)" fill={accentVar}>
        {ornament}
      </g>

      {/* Eyebrow — small uppercase label above the title */}
      <text x="160" y="92" textAnchor="middle" fontFamily="var(--font-body)" fontSize="8" fontWeight="600" letterSpacing="2.4" fill="var(--ink-faint)">
        {eyebrow}
      </text>

      {/* Title — Playfair, the editorial moment */}
      <text x="160" y="118" textAnchor="middle" fontFamily="var(--font-display)" fontSize="18" fontWeight="700" fill="var(--ink)">
        {title}
      </text>

      {/* Body — the why, in body sans */}
      <text x="160" y="148" textAnchor="middle" fontFamily="var(--font-body)" fontSize="9.5" fill="var(--ink-soft)">
        {body}
      </text>

      {/* Bottom rule — tiny editorial flourish */}
      <line x1="120" y1="170" x2="200" y2="170" stroke={accentVar} strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

// A few reusable ornament paths. SVG paths drawn around (0,0) so PaperArt's
// translate(160 44) puts them top-center. Kept simple — these are tiny.
const ornamentLeaf = (
  <path d="M 0 -16 Q -10 -6 -8 6 Q 0 10 8 6 Q 10 -6 0 -16 Z M 0 -10 L 0 6" stroke="currentColor" strokeWidth="0.6" fill="currentColor" fillOpacity="0.18" />
);
const ornamentDiamond = <path d="M 0 -14 L 12 0 L 0 14 L -12 0 Z" fillOpacity="0.18" stroke="currentColor" strokeWidth="0.8" />;
const ornamentCircle = <circle cx="0" cy="0" r="12" fillOpacity="0.18" stroke="currentColor" strokeWidth="0.8" />;
const ornamentBurst = (
  <g stroke="currentColor" strokeWidth="0.8" fill="none">
    <circle cx="0" cy="0" r="6" fillOpacity="0.18" fill="currentColor" />
    <line x1="0" y1="-13" x2="0" y2="-9" />
    <line x1="0" y1="9" x2="0" y2="13" />
    <line x1="-13" y1="0" x2="-9" y2="0" />
    <line x1="9" y1="0" x2="13" y2="0" />
    <line x1="-9" y1="-9" x2="-6" y2="-6" />
    <line x1="6" y1="6" x2="9" y2="9" />
    <line x1="-9" y1="9" x2="-6" y2="6" />
    <line x1="6" y1="-6" x2="9" y2="-9" />
  </g>
);
const ornamentWave = (
  <path d="M -14 0 Q -7 -6 0 0 Q 7 6 14 0" stroke="currentColor" strokeWidth="1.2" fill="none" />
);
const ornamentMountain = (
  <path d="M -14 8 L -4 -8 L 2 -2 L 14 -10 L 14 8 Z" fillOpacity="0.18" stroke="currentColor" strokeWidth="0.8" />
);

// ---------------------------------------------------------------------------
// THE CERTIFICATE CATALOG
// ---------------------------------------------------------------------------
// Order matters for display priority but not for correctness. Each predicate
// receives `(state, allSpecies)` where `state` is the full game state and
// `allSpecies` is the full SPECIES array (so predicates can reason about
// "you've collected one species per biome" etc. without hardcoding).
//
// All predicates use `?? 0`/`?? {}` defaults defensively because state
// schemas evolve and an old save might be missing fields.

export const CERTIFICATES = [
  // ----- TIER: field-notes ----------------------------------------------
  {
    id: 'first-swipe',
    name: 'First Card Pulled',
    tier: 'field-notes',
    description: 'Your first species swipe.',
    predicate: (s) => (s.stats?.swipes ?? 0) >= 1,
    render: () => (
      <PaperArt
        ornament={ornamentLeaf}
        eyebrow="FIELD NOTES · 001"
        title="First Card Pulled"
        body="The first species you ever swiped through."
        accent="forest"
      />
    ),
  },
  {
    id: 'first-id',
    name: 'First Identification',
    tier: 'field-notes',
    description: 'Your first correct Speed-ID.',
    predicate: (s) => (s.stats?.idsCorrect ?? 0) >= 1,
    render: () => (
      <PaperArt
        ornament={ornamentBurst}
        eyebrow="FIELD NOTES · 002"
        title="First Identification"
        body="A species correctly named under time pressure."
        accent="amber"
      />
    ),
  },
  {
    id: 'first-quiz',
    name: 'First Right Answer',
    tier: 'field-notes',
    description: 'Your first correct quiz answer.',
    predicate: (s) => (s.stats?.quizCorrect ?? 0) >= 1,
    render: () => (
      <PaperArt
        ornament={ornamentDiamond}
        eyebrow="FIELD NOTES · 003"
        title="First Right Answer"
        body="A quiz question, answered correctly."
        accent="sage"
      />
    ),
  },
  {
    id: 'first-run',
    name: 'First Run Survived',
    tier: 'field-notes',
    description: 'Completed a Survive run, win or loss.',
    predicate: (s) =>
      (s.stats?.surviveRunsWon ?? 0) + (s.stats?.surviveRunsLost ?? 0) >= 1,
    render: () => (
      <PaperArt
        ornament={ornamentCircle}
        eyebrow="FIELD NOTES · 004"
        title="First Run Survived"
        body="Six seasons, one species. Win or fall."
        accent="magenta"
      />
    ),
  },

  // ----- TIER: documented -----------------------------------------------
  {
    id: 'ten-species',
    name: 'Ten Species Documented',
    tier: 'documented',
    description: 'Ten distinct species in your collection.',
    predicate: (s) => Object.keys(s.collected ?? {}).length >= 10,
    render: () => (
      <PaperArt
        ornament={ornamentLeaf}
        eyebrow="DOCUMENTED · 005"
        title="Ten Species Documented"
        body="Ten entries, each one a real animal in real trouble."
        accent="forest"
      />
    ),
  },
  {
    id: 'biome-spread',
    name: 'Across Four Biomes',
    tier: 'documented',
    description: 'Documented at least one species in each of the four biomes.',
    predicate: (s, allSpecies) => {
      const collectedIds = Object.keys(s.collected ?? {});
      // Build a set of biomes for the species the player has collected.
      const biomes = new Set();
      for (const id of collectedIds) {
        const sp = allSpecies.find((x) => x.id === id);
        if (sp && sp.biome !== 'archive') biomes.add(sp.biome);
      }
      // Four real biomes: rainforest, desert, ocean, tundra.
      // 'archive' is the extinct species bucket and doesn't count.
      return ['rainforest', 'desert', 'ocean', 'tundra'].every((b) => biomes.has(b));
    },
    render: () => (
      <PaperArt
        ornament={ornamentMountain}
        eyebrow="DOCUMENTED · 006"
        title="Across Four Biomes"
        body="Forest, desert, ocean, tundra — at least one of each."
        accent="sage"
      />
    ),
  },
  {
    id: 'speed-ten',
    name: 'Ten Identifications Clean',
    tier: 'documented',
    description: 'Ten correct Speed-ID rounds.',
    predicate: (s) => (s.stats?.idsCorrect ?? 0) >= 10,
    render: () => (
      <PaperArt
        ornament={ornamentBurst}
        eyebrow="DOCUMENTED · 007"
        title="Ten Identifications Clean"
        body="Ten species named correctly under the clock."
        accent="amber"
      />
    ),
  },
  {
    id: 'quiz-twenty',
    name: 'Twenty Right',
    tier: 'documented',
    description: 'Twenty correct quiz answers.',
    predicate: (s) => (s.stats?.quizCorrect ?? 0) >= 20,
    render: () => (
      <PaperArt
        ornament={ornamentDiamond}
        eyebrow="DOCUMENTED · 008"
        title="Twenty Right"
        body="Twenty quiz questions answered correctly."
        accent="sage"
      />
    ),
  },
  {
    id: 'first-survival-win',
    name: 'A Species Stabilized',
    tier: 'documented',
    description: 'Won your first Survive run.',
    predicate: (s) => (s.stats?.surviveRunsWon ?? 0) >= 1,
    render: () => (
      <PaperArt
        ornament={ornamentCircle}
        eyebrow="DOCUMENTED · 009"
        title="A Species Stabilized"
        body="Six seasons cleared with a population still standing."
        accent="forest"
      />
    ),
  },

  // ----- TIER: verified --------------------------------------------------
  {
    id: 'mastered-species',
    name: 'A Species Fully Documented',
    tier: 'verified',
    description: 'Brought a single species to 100% mastery.',
    predicate: (s) => {
      const collected = s.collected ?? {};
      // Object.values returns an array of the records; .some checks if any
      // record satisfies the predicate. mastery climbs in Speed-ID and Quiz.
      return Object.values(collected).some((r) => (r?.mastery ?? 0) >= 100);
    },
    render: () => (
      <PaperArt
        ornament={ornamentBurst}
        eyebrow="VERIFIED · 010"
        title="A Species Fully Documented"
        body="One species — every quiz, every detail, mastered."
        accent="amber"
      />
    ),
  },
  {
    id: 'streak-seven',
    name: 'Seven-Day Streak',
    tier: 'verified',
    description: 'Played seven days in a row.',
    predicate: (s) => (s.streak?.count ?? 0) >= 7,
    render: () => (
      <PaperArt
        ornament={ornamentWave}
        eyebrow="VERIFIED · 011"
        title="Seven-Day Streak"
        body="Seven consecutive days in the field."
        accent="amber"
      />
    ),
  },
  {
    id: 'survive-three',
    name: 'Three Stabilizations',
    tier: 'verified',
    description: 'Won three Survive runs.',
    predicate: (s) => (s.stats?.surviveRunsWon ?? 0) >= 3,
    render: () => (
      <PaperArt
        ornament={ornamentCircle}
        eyebrow="VERIFIED · 012"
        title="Three Stabilizations"
        body="Three species stewarded all the way through."
        accent="forest"
      />
    ),
  },
];

// ---------------------------------------------------------------------------
// PUBLIC HELPER — used by both the provider (to grant) and Credentials (to sort)
// ---------------------------------------------------------------------------

/**
 * Given current state and the species catalog, return an object mapping
 * { [certId]: timestamp } for every cert whose predicate is true. Pure.
 *
 * The provider compares this to the previous earnedCertificates and grants
 * any newly-true certs without revoking any that had been granted earlier
 * (we never take a cert away once won — even if a predicate flickers false
 * after a state migration). The merge happens in useGameState.
 */
export function evaluateCertificates(state, allSpecies) {
  const earned = {};
  for (const cert of CERTIFICATES) {
    try {
      if (cert.predicate(state, allSpecies)) {
        earned[cert.id] = Date.now();
      }
    } catch {
      // A predicate threw — most likely because state shape changed and the
      // cert hasn't been updated. Swallow rather than crash the whole app.
      // The cert simply won't be granted this evaluation. In dev we'd want
      // a console.warn; in production silence is the right call.
    }
  }
  return earned;
}

/**
 * Tier ordering for display. Earlier tiers sort first when grouping is on.
 */
export const TIER_ORDER = ['field-notes', 'documented', 'verified'];

export const TIER_LABELS = {
  'field-notes': 'Field Notes',
  documented: 'Documented',
  verified: 'Verified',
};
