/**
 * ToastLayer.jsx — the floating notification system.
 *
 * Watches game state for two events and shows a brief popup ("toast") when
 * either happens:
 *   1. Level-ups — when the player's level goes up
 *   2. New species — when the collected count goes up
 *
 * Each toast auto-dismisses after 2.4 seconds. Multiple toasts can stack.
 *
 * The "watch state for changes" pattern uses two tools:
 *   - useEffect: runs code after a render commits
 *   - useRef:    stores a value across renders WITHOUT causing re-renders
 *
 * useRef is the key trick here. We need to know "was the level different last
 * render?" — but we don't want our update of that comparison value to itself
 * trigger another render. useState would. useRef won't. That's exactly what
 * refs are for: data that the component needs but doesn't display.
 */

import { useEffect, useRef, useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import './toasts.css';

export function ToastLayer() {
  // Pull the values we want to watch.
  const { collected, collectedCount, level } = useGameState();

  // The visible list of toasts. Each is { id, kind, title, subtitle }.
  const [toasts, setToasts] = useState([]);

  // Refs for "what was this last time we rendered?" Initialized to the
  // current value so the first render doesn't trigger a false-positive toast.
  const lastLevelRef = useRef(level.level);
  const lastCountRef = useRef(collectedCount);
  const lastSpeciesRef = useRef(null);

  // --- Level-up watcher --------------------------------------------------
  // Runs after every render where level.level or level.name changed. If the
  // current level is higher than the last one we saw, push a toast.
  useEffect(() => {
    if (level.level > lastLevelRef.current) {
      // setToasts((t) => [...t, newOne]) — the function form. We use it
      // because if multiple toasts fire in the same tick (rare but possible),
      // each one needs to see the most recent toasts list, not the snapshot
      // captured when this effect started.
      setToasts((t) => [
        ...t,
        {
          // Date.now() + Math.random() makes a unique key so React can
          // distinguish toasts. A pure timestamp could collide if two fire
          // in the same millisecond.
          id: Date.now() + Math.random(),
          kind: 'level',
          title: `Level ${level.level}`,
          subtitle: `Promoted to ${level.name}`,
        },
      ]);
    }
    // Always update the ref to the current value, whether or not we fired.
    // Refs assign with `.current = value` (no setter function).
    lastLevelRef.current = level.level;
  }, [level.level, level.name]);

  // --- New-species watcher ----------------------------------------------
  // When the collection grows, find the most recently added species and
  // toast about it.
  useEffect(() => {
    if (collectedCount > lastCountRef.current) {
      // Walk the collected dictionary to find the entry with the latest
      // firstSeenAt timestamp. Object.entries gives us [id, record] pairs
      // we can iterate over.
      let newest = null;
      let newestTime = 0;
      for (const [id, rec] of Object.entries(collected)) {
        if (rec.firstSeenAt > newestTime) {
          newest = id;
          newestTime = rec.firstSeenAt;
        }
      }

      // Guard against firing the same toast twice for the same species
      // (could happen if state updates batch weirdly).
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

  // --- Auto-dismiss ------------------------------------------------------
  // Whenever the toasts array changes, schedule removal of the oldest one
  // 2.4 seconds from now. Each toast effectively gets its own timer because
  // when one is removed, the array changes, this effect re-runs, and the
  // new "oldest" gets a fresh timer.
  useEffect(() => {
    if (toasts.length === 0) return;
    const oldest = toasts[0];

    // setTimeout returns an id we can use to cancel.
    const t = setTimeout(() => {
      // .filter creates a new array containing only items where the predicate
      // returns true. Here, all toasts whose id is NOT the oldest one's id.
      setToasts((all) => all.filter((x) => x.id !== oldest.id));
    }, 2400);

    // The function returned from a useEffect is the "cleanup" function. React
    // runs it before the next time the effect runs (or when the component
    // unmounts). Here, if toasts changes again before our 2.4s is up, we
    // cancel the old timer so it doesn't fire stale.
    return () => clearTimeout(t);
  }, [toasts]);

  // If there's nothing to show, render nothing. Returning null is the React
  // idiom for "this component should not produce any DOM right now."
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
