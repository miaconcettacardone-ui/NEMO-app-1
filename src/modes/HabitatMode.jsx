/**
 * HabitatMode.jsx — the collection / index view.
 *
 * Shows every species in the catalog as a small card. Discovered species
 * (anything the user has swiped right on) appear in full color with their
 * name, status, and mastery bar. Undiscovered species appear as fogged
 * silhouettes with a "?" overlay.
 *
 * Filters at the top let the user narrow the view to a single biome. Tapping
 * a discovered cell opens a detail modal with the long description and meta.
 *
 * This is the "sticky" mode — players come back to watch their habitat fill up.
 * It's the visible reward for everything the other modes do.
 */

import { useState } from 'react';
import { SPECIES, BIOMES, STATUS_LABELS } from '../data/species';
import { useGameState } from '../hooks/useGameState';
import { SpeciesGlyph } from '../components/SpeciesGlyph';
import './habitat.css';

export function HabitatMode() {
  // collected: dictionary of speciesId → record (with mastery, encounters, etc.)
  // level:     derived rank info for the header
  const { collected, level } = useGameState();

  // The current biome filter. 'all' shows everything; any biome id filters down.
  const [biomeFilter, setBiomeFilter] = useState('all');

  // The species currently shown in the detail modal, or null if no modal is open.
  const [selected, setSelected] = useState(null);

  // Apply the biome filter. If 'all', use the full species list; otherwise
  // filter down to species in the chosen biome.
  const filtered = biomeFilter === 'all'
    ? SPECIES
    : SPECIES.filter((s) => s.biome === biomeFilter);

  // Stats for the header. Filter-aware so they reflect what the user is currently viewing.
  const collectedCount = filtered.filter((s) => collected[s.id]).length;
  const totalCount = filtered.length;
  const pct = totalCount > 0 ? Math.round((collectedCount / totalCount) * 100) : 0;

  return (
    <div className="habitat-mode page-enter">
      {/* Header — the editorial top of the page. */}
      <div className="habitat-header">
        <div className="eyebrow">Your habitat</div>
        <h1 className="habitat-title">Documented<br/>{collectedCount}<span className="habitat-of">/{totalCount}</span></h1>
        <div className="habitat-pctbar">
          <div className="habitat-pctbar-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="habitat-rank">Rank · {level.name}</p>
      </div>

      {/* Biome filter chips. The "All" chip plus one per biome. */}
      <div className="habitat-filters">
        <button
          className={`habitat-chip ${biomeFilter === 'all' ? 'is-active' : ''}`}
          onClick={() => setBiomeFilter('all')}
        >
          All
        </button>
        {BIOMES.map((b) => (
          <button
            key={b.id}
            className={`habitat-chip ${biomeFilter === b.id ? 'is-active' : ''}`}
            onClick={() => setBiomeFilter(b.id)}
            // The active chip uses the biome's accent color for its border
            // and text — gives each biome a distinct visual identity. We
            // pass an empty object when inactive so the default CSS applies.
            style={biomeFilter === b.id ? { borderColor: b.accent, color: b.accent } : {}}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* The grid of species cells. */}
      <div className="habitat-grid">
        {filtered.map((s) => {
          // Look up this species' record in the collection (undefined if undiscovered).
          const record = collected[s.id];
          const status = STATUS_LABELS[s.status];
          return (
            <button
              key={s.id}
              className={`habitat-cell ${record ? 'is-found' : 'is-locked'}`}
              // Only open the detail modal if discovered. The `&&` short-circuits.
              onClick={() => record && setSelected(s)}
              // disabled gives proper button semantics (e.g., screen readers
              // announce it as disabled, no focus styles).
              disabled={!record}
            >
              <div className="habitat-cell-glyph">
                <SpeciesGlyph species={s} size="md" />
                {/* Fog overlay for undiscovered species. */}
                {!record && <div className="habitat-cell-fog">?</div>}
              </div>

              <div className="habitat-cell-name">{record ? s.name : '— Undiscovered —'}</div>

              {/*
                Only render status and mastery for discovered species.
                The fragment <>...</> groups multiple elements without adding
                a wrapper to the DOM.
              */}
              {record && (
                <>
                  <div
                    className="habitat-cell-status"
                    style={{ color: status.color }}
                  >
                    {status.label}
                  </div>
                  <div className="habitat-cell-mastery">
                    <div
                      className="habitat-cell-mastery-fill"
                      style={{ width: `${record.mastery}%` }}
                    />
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* --- Detail modal ---
          Conditionally rendered when `selected` is set. The classic modal pattern:
          - The outer .habitat-detail backdrop captures click-outside-to-close.
          - The inner .habitat-detail-card calls e.stopPropagation() so clicks
            inside the card don't bubble up to the backdrop and close the modal.
      */}
      {selected && (
        <div className="habitat-detail" onClick={() => setSelected(null)}>
          <div className="habitat-detail-card" onClick={(e) => e.stopPropagation()}>
            <button className="habitat-detail-close" onClick={() => setSelected(null)}>✕</button>
            <SpeciesGlyph species={selected} size="lg" />
            <h2 className="habitat-detail-name">{selected.name}</h2>
            <p className="habitat-detail-sci">{selected.scientific}</p>
            <p className="habitat-detail-hook">{selected.hook}</p>
            <p className="habitat-detail-long">{selected.long}</p>
            <div className="habitat-detail-meta">
              <span>Biome · {selected.biome}</span>
              <span>Status · {STATUS_LABELS[selected.status].label}</span>
              {/* `?.` is optional chaining — safely access .encounters even if the
                  record is missing. `??` provides the fallback (0) if it is. */}
              <span>Encounters · {collected[selected.id]?.encounters ?? 0}</span>
              <span>Mastery · {collected[selected.id]?.mastery ?? 0}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
