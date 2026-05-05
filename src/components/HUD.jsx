import { useGameState } from '../hooks/useGameState';
import './hud.css';

/**
 * HUD — sits at the top of every screen.
 * Mirrors a mission-control readout: level, XP-to-next, streak, survival.
 */
export function HUD() {
  const { level, collectedCount, streak, survival } = useGameState();

  return (
    <header className="hud">
      <div className="hud-row hud-row--top">
        <div className="hud-brand">
          <span className="hud-logo">▶</span>
          <span className="hud-title">NEMO<span className="hud-x">X</span></span>
        </div>
        <div className="hud-streak" title="Daily streak">
          <span className="hud-streak-flame">●</span>
          <span className="hud-streak-num">{streak.count}</span>
        </div>
      </div>

      <div className="hud-row hud-row--meters">
        <div className="hud-meter" title="Field Rank">
          <div className="hud-meter-label">
            <span className="eyebrow">Field rank</span>
            <span className="hud-rank">{level.name}</span>
          </div>
          <div className="hud-meter-bar">
            <div
              className="hud-meter-fill hud-meter-fill--xp"
              style={{ width: `${level.progress * 100}%` }}
            />
          </div>
          <div className="hud-meter-foot mono">
            <span>Lv {level.level}</span>
            <span>{level.capped ? 'Top rank' : `${level.xpToNext} XP to next`}</span>
          </div>
        </div>

        <div className="hud-meter" title="Ecosystem health">
          <div className="hud-meter-label">
            <span className="eyebrow">Biosphere</span>
            <span
              className="hud-rank"
              style={{
                color:
                  survival > 60 ? 'var(--status-secure)' :
                  survival > 30 ? 'var(--status-watch)' :
                  'var(--status-critical)',
              }}
            >
              {survival}%
            </span>
          </div>
          <div className="hud-meter-bar">
            <div
              className="hud-meter-fill hud-meter-fill--bio"
              style={{
                width: `${survival}%`,
                background:
                  survival > 60 ? 'var(--status-secure)' :
                  survival > 30 ? 'var(--status-watch)' :
                  'var(--status-critical)',
              }}
            />
          </div>
          <div className="hud-meter-foot mono">
            <span>{collectedCount} documented</span>
            <span>{survival === 100 ? 'Stable' : survival === 0 ? 'Collapsed' : survival > 60 ? 'Healthy' : survival > 30 ? 'Stressed' : 'Critical'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
