import { useState } from 'react';
import { SPECIES, BIOMES, STATUS_LABELS } from '../data/species';
import { useGameState } from '../hooks/useGameState';
import { SpeciesGlyph } from '../components/SpeciesGlyph';
import './habitat.css';

/**
 * Habitat Mode
 * ------------
 * The collection / idle layer. Shows every species as a card — locked
 * (silhouette only, "?") if undiscovered, unlocked once swiped or
 * encountered. Mastery percentage is per-species, fed by Speed-ID and
 * Quiz performance.
 *
 * This mode is the sticky one — users come back to watch their habitat
 * fill up. Acts as the "collection book" the dopamine loop is feeding.
 */

export function HabitatMode() {
  const { collected, level } = useGameState();
  const [biomeFilter, setBiomeFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const filtered = biomeFilter === 'all'
    ? SPECIES
    : SPECIES.filter((s) => s.biome === biomeFilter);

  const collectedCount = filtered.filter((s) => collected[s.id]).length;
  const totalCount = filtered.length;
  const pct = totalCount > 0 ? Math.round((collectedCount / totalCount) * 100) : 0;

  return (
    <div className="habitat-mode page-enter">
      <div className="habitat-header">
        <div className="eyebrow">Your habitat</div>
        <h1 className="habitat-title">Documented<br/>{collectedCount}<span className="habitat-of">/{totalCount}</span></h1>
        <div className="habitat-pctbar">
          <div className="habitat-pctbar-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="habitat-rank">Rank · {level.name}</p>
      </div>

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
            style={biomeFilter === b.id ? { borderColor: b.accent, color: b.accent } : {}}
          >
            {b.name}
          </button>
        ))}
      </div>

      <div className="habitat-grid">
        {filtered.map((s) => {
          const record = collected[s.id];
          const status = STATUS_LABELS[s.status];
          return (
            <button
              key={s.id}
              className={`habitat-cell ${record ? 'is-found' : 'is-locked'}`}
              onClick={() => record && setSelected(s)}
              disabled={!record}
            >
              <div className="habitat-cell-glyph">
                <SpeciesGlyph species={s} size="md" />
                {!record && <div className="habitat-cell-fog">?</div>}
              </div>
              <div className="habitat-cell-name">{record ? s.name : '— Undiscovered —'}</div>
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
              <span>Encounters · {collected[selected.id]?.encounters ?? 0}</span>
              <span>Mastery · {collected[selected.id]?.mastery ?? 0}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
