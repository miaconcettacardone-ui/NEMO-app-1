/**
 * SpeciesGlyph.jsx — renders a species silhouette as an SVG plate.
 *
 * Used everywhere a species is shown: in cards, modals, the habitat grid,
 * the toast notifications. It draws an SVG with three layers:
 *   1. A radial-gradient background (the "plate"), tinted to the biome
 *   2. A soft accent halo behind the silhouette
 *   3. The silhouette itself, drawn as a thin forest-ink line
 *
 * Each plate evokes a 19th-century botanical/zoological field guide — cream
 * paper with a subtle biome-colored wash, a pair of decorative concentric
 * rings framing the subject, and a single ink-line drawing.
 *
 * SVG primer: SVG (Scalable Vector Graphics) is just XML that draws shapes.
 * Inside JSX we use it directly — every <circle>, <rect>, <path> element is
 * an SVG primitive. The numbers are in a 0–100 coordinate space (set by
 * viewBox), so they always scale proportionally regardless of pixel size.
 */

// The list of biomes (with their accent colors) lives in the species data
// file. We import it to look up the right accent for each species.
import { BIOMES } from '../data/species';

/**
 * Per-biome plate background colors. Each entry is a two-color radial
 * gradient (light center → slightly darker edge) that tints cream toward
 * that biome's mood.
 *
 * Defined as a plain object outside the component so it's not recreated
 * on every render.
 */
const BIOME_BG = {
  rainforest: { from: '#eef0e5', to: '#dfe5d6' }, // cream → soft moss
  desert:     { from: '#f7ecd9', to: '#ead7b6' }, // cream → warm sand
  ocean:      { from: '#e8edec', to: '#cfd8d8' }, // cream → cool stone
  tundra:     { from: '#f0eee8', to: '#dcd9d0' }, // cream → pale ash
  archive:    { from: '#f0e7e3', to: '#d9c9c0' }, // cream → warm clay
};

/**
 * Props:
 *   species — a species object from src/data/species.js (must have id,
 *             name, biome, silhouette path)
 *   size    — 'sm' | 'md' | 'lg' | 'xl'. Defaults to 'md'.
 *
 * The `= 'md'` syntax sets a default value if the prop isn't passed.
 */
export function SpeciesGlyph({ species, size = 'md' }) {
  // Look up the right plate colors for this species' biome. The `??` operator
  // falls back to rainforest if the biome isn't recognized.
  const bg = BIOME_BG[species.biome] ?? BIOME_BG.rainforest;

  // Look up the biome's accent color. .find returns the first match or
  // undefined; the optional chaining (?.) safely accesses .accent only if
  // we got a hit, then ?? falls back to forest.
  const accent = BIOMES.find((b) => b.id === species.biome)?.accent ?? 'var(--forest)';

  // Convert the size keyword to actual pixels. The bracket-then-fallback
  // pattern: look up size in the object, fall back to 140 if unknown.
  const pixelSize = { sm: 64, md: 140, lg: 220, xl: 300 }[size] ?? 140;

  // SVG <defs> use ids that must be unique on the page. If two SpeciesGlyphs
  // for the same species are rendered side by side, they'd both try to
  // define `g-tiger` and the browser would pick one — ugly. We don't actually
  // hit that today (each species is shown once at a time), but using the
  // species id keeps the gradients distinct per species and is forward-safe.
  const gradId = `g-${species.id}`;
  const haloId = `h-${species.id}`;

  return (
    <svg
      // viewBox sets the SVG's internal coordinate space. Everything we draw
      // uses these 0–100 coordinates. The browser scales the result to fit
      // the actual pixel size we set via inline style.
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: pixelSize, height: pixelSize, display: 'block' }}

      // aria-label gives screen readers a way to identify the image.
      aria-label={species.name}
    >
      {/*
        <defs> holds reusable definitions (gradients, patterns, filters)
        that the rest of the SVG references by id. Nothing in <defs>
        renders directly — it has to be referenced by url(#id).
      */}
      <defs>
        {/* Plate background gradient: lighter center, slightly darker edges. */}
        <radialGradient id={gradId} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor={bg.from} />
          <stop offset="100%" stopColor={bg.to} />
        </radialGradient>

        {/* Soft accent halo — the species's biome color, very faded.
            Sits behind the silhouette and gives the plate a hint of color. */}
        <radialGradient id={haloId} cx="50%" cy="55%" r="40%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Plate background — fills the whole 100×100 canvas with the gradient. */}
      <rect width="100" height="100" fill={`url(#${gradId})`} />

      {/* Accent halo over the plate. */}
      <rect width="100" height="100" fill={`url(#${haloId})`} />

      {/*
        Two faint concentric rings — the "naturalist's plate frame." They
        echo the printed border around an old engraved illustration without
        being heavy-handed. The dashed inner ring is a tiny callback to a
        compass rose or scope reticle, but kept very subtle.
      */}
      <circle
        cx="50" cy="50" r="44"
        fill="none"
        stroke="var(--ink)"
        strokeOpacity="0.06"
        strokeWidth="0.5"
      />
      <circle
        cx="50" cy="50" r="36"
        fill="none"
        stroke="var(--ink)"
        strokeOpacity="0.08"
        strokeWidth="0.4"
        strokeDasharray="1.5 2"
      />

      {/*
        The species silhouette. species.silhouette is an SVG path "d"
        attribute — a string of move/line/curve commands like "M10,20 L30,40
        ...". The path data lives in species.js so this component stays
        purely about presentation.

        Drawn in forest-deep ink with a tiny drop-shadow filter for depth.
      */}
      <path
        d={species.silhouette}
        fill="none"
        stroke="var(--forest-deep)"
        strokeWidth="1.3"
        strokeOpacity="0.88"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(15, 37, 24, 0.18))' }}
      />
    </svg>
  );
}
