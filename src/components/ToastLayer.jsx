import { useEffect, useRef, useState } from 'react';
import { useGameState, levelFromXP } from '../hooks/useGameState';
import './toasts.css';

/**
 * ToastLayer
 * ----------
 * Watches the game state for two things:
 *   1. Level-ups — flashes a center banner.
 *   2. New species first-discovery — slides up from the bottom.
 *
 * Pure derived state; no extra storage needed. We just remember the
 * last level we saw and the last collected count.
 */

export function ToastLayer() {
  const { xp, collected, collectedCount, level } = useGameState();
  const [toasts, setToasts] = useState([]);
  const lastLevelRef = useRef(level.level);
  const lastCountRef = useRef(collectedCount);
  const lastSpeciesRef = useRef(null);

  // Level-up watcher
  useEffect(() => {
    if (level.level > lastLevelRef.current) {
      setToasts((t) => [
        ...t,
        {
          id: Date.now() + Math.random(),
          kind: 'level',
          title: `Level ${level.level}`,
          subtitle: `Promoted to ${level.name}`,
        },
      ]);
    }
    lastLevelRef.current = level.level;
  }, [level.level, level.name]);

  // New-species watcher
  useEffect(() => {
    if (collectedCount > lastCountRef.current) {
      // find newest species by firstSeenAt
      let newest = null;
      let newestTime = 0;
      for (const [id, rec] of Object.entries(collected)) {
        if (rec.firstSeenAt > newestTime) {
          newest = id;
          newestTime = rec.firstSeenAt;
        }
      }
      if (newest && newest !== lastSpeciesRef.current) {
        lastSpeciesRef.current = newest;
        setToasts((t) => [
          ...t,
          {
            id: Date.now() + Math.random(),
            kind: 'discovery',
            title: 'New entry',
            subtitle: 'Added to your field guide',
          },
        ]);
      }
    }
    lastCountRef.current = collectedCount;
  }, [collectedCount, collected]);

  // Auto-dismiss after 2.4s
  useEffect(() => {
    if (toasts.length === 0) return;
    const oldest = toasts[0];
    const t = setTimeout(() => {
      setToasts((all) => all.filter((x) => x.id !== oldest.id));
    }, 2400);
    return () => clearTimeout(t);
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-layer">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind}`}>
          <div className="toast-title mono">{t.title}</div>
          <div className="toast-sub">{t.subtitle}</div>
        </div>
      ))}
    </div>
  );
}
