import { useEffect, useMemo, useRef, useState } from 'react';
import { SPECIES, STATUS_LABELS } from '../data/species';
import { useGameState } from '../hooks/useGameState';
import { SpeciesGlyph } from '../components/SpeciesGlyph';
import './swipe.css';

/**
 * Swipe Mode
 * ----------
 * One species card at a time. Drag right (or tap KEEP) to add to your
 * Habitat collection. Drag left (or tap SKIP) to pass. The hook line
 * is the headline; the long description is what the user *earns* by
 * keeping the card. This is the entry-level dopamine loop and the
 * primary driver of XP for new users.
 *
 * Design note: the deck reshuffles when exhausted, so users never hit
 * a dead end. Already-collected species reappear with reduced XP,
 * which is the right trade-off for a casual loop — repetition isn't
 * punished, just less rewarding.
 */
const DRAG_COMMIT_PX = 110;

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function SwipeMode() {
  const { recordSwipe, collected } = useGameState();
  const [deck, setDeck] = useState(() => shuffle(SPECIES));
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0, dragging: false });
  const [feedback, setFeedback] = useState(null); // 'kept' | 'skipped' | null
  const [showLong, setShowLong] = useState(false);
  const startRef = useRef({ x: 0, y: 0 });

  const card = deck[index];
  const isCollected = card && collected[card.id];

  useEffect(() => {
    setShowLong(false);
  }, [index]);

  // Reshuffle when the deck runs out.
  useEffect(() => {
    if (index >= deck.length) {
      setDeck(shuffle(SPECIES));
      setIndex(0);
    }
  }, [index, deck.length]);

  const commit = (kept) => {
    setFeedback(kept ? 'kept' : 'skipped');
    recordSwipe(card.id, kept);
    // Allow the swoosh-out animation to play, then advance.
    setTimeout(() => {
      setFeedback(null);
      setDrag({ x: 0, y: 0, dragging: false });
      setIndex((i) => i + 1);
    }, 320);
  };

  const onPointerDown = (e) => {
    if (feedback) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, dragging: true });
  };

  const onPointerMove = (e) => {
    if (!drag.dragging || feedback) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    setDrag({ x: dx, y: dy, dragging: true });
  };

  const onPointerUp = () => {
    if (!drag.dragging || feedback) return;
    if (drag.x > DRAG_COMMIT_PX) {
      commit(true);
    } else if (drag.x < -DRAG_COMMIT_PX) {
      commit(false);
    } else {
      // snap back
      setDrag({ x: 0, y: 0, dragging: false });
    }
  };

  if (!card) return null;

  const transform = feedback === 'kept'
    ? `translate(420px, ${drag.y}px) rotate(20deg)`
    : feedback === 'skipped'
    ? `translate(-420px, ${drag.y}px) rotate(-20deg)`
    : drag.dragging
    ? `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 22}deg)`
    : 'translate(0, 0)';

  const tilt = drag.x / 200;
  const status = STATUS_LABELS[card.status];

  return (
    <div className="swipe-mode page-enter">
      <div className="swipe-eyebrow">
        <span className="eyebrow">Card {index + 1}</span>
        <span className="eyebrow swipe-eyebrow-right">Drag or tap</span>
      </div>

      <div className="swipe-stack">
        {/* Peek of next card behind */}
        {deck[index + 1] && (
          <div className="swipe-card swipe-card--peek" aria-hidden>
            <SpeciesGlyph species={deck[index + 1]} size="lg" />
          </div>
        )}

        <div
          className={`swipe-card swipe-card--top ${feedback ? `swipe-card--${feedback}` : ''}`}
          style={{
            transform,
            transition: drag.dragging ? 'none' : 'transform 0.3s var(--ease-out)',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Drag indicators */}
          <div
            className="swipe-stamp swipe-stamp--keep"
            style={{ opacity: Math.max(0, tilt) }}
          >
            Document
          </div>
          <div
            className="swipe-stamp swipe-stamp--skip"
            style={{ opacity: Math.max(0, -tilt) }}
          >
            Skip
          </div>

          <div className="swipe-card-glyph">
            <SpeciesGlyph species={card} size="xl" />
          </div>

          <div className="swipe-card-body">
            <div className="swipe-status-row">
              <span className="swipe-status" style={{ color: status.color, borderColor: status.color }}>
                {status.label}
              </span>
              <span className="swipe-biome mono">{card.biome}</span>
              {isCollected && <span className="swipe-seen mono">Documented</span>}
            </div>
            <h2 className="swipe-name">{card.name}</h2>
            <p className="swipe-sci mono">{card.scientific}</p>
            <p className="swipe-hook">{card.hook}</p>

            {showLong ? (
              <p className="swipe-long">{card.long}</p>
            ) : (
              <button className="swipe-more" onClick={() => setShowLong(true)}>
                Tell me more →
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="swipe-actions">
        <button className="swipe-btn swipe-btn--skip" onClick={() => commit(false)} aria-label="Skip">
          ✕
        </button>
        <button className="swipe-btn swipe-btn--keep" onClick={() => commit(true)} aria-label="Keep">
          ✓
        </button>
      </div>
    </div>
  );
}
