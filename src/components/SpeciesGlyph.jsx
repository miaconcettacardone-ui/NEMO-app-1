/**
 * SpeciesGlyph — renders the species silhouette path on a warm,
 * field-guide-style background plate.
 *
 * Each biome gets a slight tonal shift so cards feel different at a
 * glance — but always within the brand palette. Cream/sand bases with
 * the biome accent color washed in subtly, like a botanical print
 * gone slightly green for rainforest or warm for desert.
 *
 * The silhouette itself is drawn in a near-black warm ink with a soft
 * accent halo — like an engraved plate from a 19th-century field guide.
 */
import { BIOMES } from '../data/species';

/**
 * Per-biome plate colors. Each plate is a two-stop radial gradient that
 * tints cream toward the biome's mood without ever leaving the brand.
 */
const BIOME_BG = {
  rainforest: { from: '#eef0e5', to: '#dfe5d6' }, // cream → soft moss
  desert:     { from: '#f7ecd9', to: '#ead7b6' }, // cream → warm sand
  ocean:      { from: '#e8edec', to: '#cfd8d8' }, // cream → cool stone
  tundra:     { from: '#f0eee8', to: '#dcd9d0' }, // cream → pale ash
  archive:    { from: '#f0e7e3', to: '#d9c9c0' }, // cream → warm clay
};

export function SpeciesGlyph({ species, size = 'md' }) {
  const bg = BIOME_BG[species.biome] ?? BIOME_BG.rainforest;
  const accent = BIOMES.find((b) => b.id === species.biome)?.accent ?? 'var(--forest)';

  const pixelSize = { sm: 64, md: 140, lg: 220, xl: 300 }[size] ?? 140;

  // Unique IDs so multiple cards on screen don't collide.
  const gradId = `g-${species.id}`;
  const haloId = `h-${species.id}`;

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: pixelSize, height: pixelSize, display: 'block' }}
      aria-label={species.name}
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor={bg.from} />
          <stop offset="100%" stopColor={bg.to} />
        </radialGradient>
        {/* Soft accent halo behind the silhouette — gives the species a
            hint of its biome's color without the silhouette itself
            having to be colored. */}
        <radialGradient id={haloId} cx="50%" cy="55%" r="40%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Plate background */}
      <rect width="100" height="100" fill={`url(#${gradId})`} />

      {/* Accent halo — sits behind the silhouette */}
      <rect width="100" height="100" fill={`url(#${haloId})`} />

      {/* A pair of soft concentric rings — naturalist's plate-frame.
          No crosshair, no scope marks; just a quiet circular composition. */}
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

      {/* The species silhouette — drawn in warm forest ink, the way a
          field-guide engraving would be inked. The drop-shadow gives it
          a touch of weight against the plate without going neon. */}
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
