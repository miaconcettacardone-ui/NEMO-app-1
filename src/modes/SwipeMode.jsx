/**
 * SwipeMode.jsx — the Tinder-for-species mode.
 *
 * Show one species card. The user either:
 *   - swipes right (or taps the green ✓) → "Document" → adds to their habitat
 *   - swipes left (or taps the red ✕)   → "Skip"     → moves on
 *
 * Either action records the swipe in game state and advances to the next card.
 * The deck is a shuffled copy of the full species list; when exhausted, it
 * reshuffles automatically so the user never hits a dead end.
 *
 * THE INTERESTING PART: implementing drag-to-swipe by hand. We use Pointer
 * Events (a unified API that works for mouse, touch, and stylus) and track
 * the drag offset in state. The card's CSS `transform` is computed from
 * that offset. When the user releases past a threshold, we commit the swipe
 * with an animation. Otherwise the card snaps back to center.
 */

import { useEffect, useRef, useState } from 'react';
import { SPECIES, STATUS_LABELS } from '../data/species';
import { useGameState } from '../hooks/useGameState';
import { SpeciesGlyph } from '../components/SpeciesGlyph';
import './swipe.css';

// How many pixels the user has to drag horizontally before we treat it as a
// committed swipe. Below this, the card snaps back. Above, it flies off.
// Tuned by hand — too low and accidental drags commit; too high and
// deliberate drags feel resistant.
const DRAG_COMMIT_PX = 110;

/**
 * Fisher-Yates shuffle. Returns a new array with the input's elements in
 * random order. The classic algorithm: walk from the end, and at each
 * position swap with a random earlier (or same) position. O(n) time, and
 * actually uniformly random (unlike the common but-broken sort-with-random
 * approach).
 *
 * The funky `[copy[i], copy[j]] = [copy[j], copy[i]]` is a destructuring
 * assignment for swapping two values without a temp variable.
 */
function shuffle(arr) {
  const copy = [...arr]; // spread into a new array so we don't mutate the input
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function SwipeMode() {
  // Game-state actions and reads. We need recordSwipe (to log the swipe)
  // and collected (to know whether the current card is already documented,
  // so we can show a "Documented" badge).
  const { recordSwipe, collected } = useGameState();

  // The deck. Initialized lazily (the function form of useState) so we don't
  // re-shuffle on every render.
  const [deck, setDeck] = useState(() => shuffle(SPECIES));

  // Which card we're currently on. Indexes into `deck`.
  const [index, setIndex] = useState(0);

  // The drag state: how far we've moved from origin, and whether a drag is
  // in progress. Combined into one object so we update them together.
  const [drag, setDrag] = useState({ x: 0, y: 0, dragging: false });

  // Brief feedback state. Set to 'kept' or 'skipped' when a swipe commits;
  // used to drive the fly-off animation. Reset to null when the next card mounts.
  const [feedback, setFeedback] = useState(null);

  // Whether the long description is expanded ("Tell me more →" tapped).
  const [showLong, setShowLong] = useState(false);

  // useRef stores the pointer's starting position so we can compute deltas
  // during drag. We don't use useState because we don't want changes to
  // trigger re-renders — refs are perfect for "data we need but don't display."
  const startRef = useRef({ x: 0, y: 0 });

  // Convenience aliases for the current card.
  const card = deck[index];
  const isCollected = card && collected[card.id];

  // When index changes (new card), collapse the long description back.
  useEffect(() => {
    setShowLong(false);
  }, [index]);

  // When we run off the end of the deck, reshuffle and reset to 0. Players
  // never see a "no more cards" screen — the loop is infinite.
  useEffect(() => {
    if (index >= deck.length) {
      setDeck(shuffle(SPECIES));
      setIndex(0);
    }
  }, [index, deck.length]);

  /**
   * commit — finalize a swipe in either direction.
   * Sets feedback (which kicks off the fly-off animation), records the
   * swipe in game state, then after a delay advances to the next card.
   */
  const commit = (kept) => {
    setFeedback(kept ? 'kept' : 'skipped');
    recordSwipe(card.id, kept);

    // setTimeout delays the index advance so the fly-off animation has time
    // to play. 320ms matches the CSS transition duration. If we advanced
    // immediately, the new card would pop in mid-animation.
    setTimeout(() => {
      setFeedback(null);
      setDrag({ x: 0, y: 0, dragging: false });
      setIndex((i) => i + 1);
    }, 320);
  };

  // --- Pointer event handlers --------------------------------------------
  //
  // Pointer events unify mouse, touch, and stylus input. We use them instead
  // of separate mouse/touch handlers because they Just Work across devices.

  /**
   * Pointer pressed down on the card. Begin dragging.
   *
   * setPointerCapture is a browser API that locks all subsequent pointer
   * events to this element until release — even if the pointer leaves the
   * element. Without it, fast drags can "lose" the pointer and the card
   * gets stuck mid-drag. With it, pointermove/up always fire on the card.
   */
  const onPointerDown = (e) => {
    if (feedback) return; // ignore drags while a fly-off is animating
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, dragging: true });
  };

  /**
   * Pointer moved. Update the drag offset (current pos minus start pos).
   */
  const onPointerMove = (e) => {
    if (!drag.dragging || feedback) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    setDrag({ x: dx, y: dy, dragging: true });
  };

  /**
   * Pointer released. If we dragged past the threshold in either direction,
   * commit the swipe. Otherwise, snap back to center.
   */
  const onPointerUp = () => {
    if (!drag.dragging || feedback) return;
    if (drag.x > DRAG_COMMIT_PX) {
      commit(true);
    } else if (drag.x < -DRAG_COMMIT_PX) {
      commit(false);
    } else {
      setDrag({ x: 0, y: 0, dragging: false });
    }
  };

  // Defensive: if for some reason there's no card right now (e.g. mid-reshuffle),
  // render nothing rather than crashing.
  if (!card) return null;

  // Compute the CSS transform for the top card.
  // Three phases:
  //   1. After commit, fly off in the chosen direction with a tilt.
  //   2. During drag, follow the pointer with a small rotation proportional to dx.
  //   3. At rest, identity transform (the snap-back transition does the work).
  const transform = feedback === 'kept'
    ? `translate(420px, ${drag.y}px) rotate(20deg)`
    : feedback === 'skipped'
    ? `translate(-420px, ${drag.y}px) rotate(-20deg)`
    : drag.dragging
    ? `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 22}deg)`
    : 'translate(0, 0)';

  // Tilt amount used for the "Document" / "Skip" stamp opacity. Positive when
  // dragging right (Document fades in), negative when dragging left (Skip fades in).
  const tilt = drag.x / 200;
  const status = STATUS_LABELS[card.status];

  return (
    <div className="swipe-mode page-enter">
      <div className="swipe-eyebrow">
        <span className="eyebrow">Card {index + 1}</span>
        <span className="eyebrow swipe-eyebrow-right">Drag or tap</span>
      </div>

      <div className="swipe-stack">
        {/*
          Peek of the next card sitting behind the current one. Just for
          visual depth — gives the deck a sense of "more to come."
          aria-hidden because screen readers shouldn't announce both cards.
        */}
        {deck[index + 1] && (
          <div className="swipe-card swipe-card--peek" aria-hidden>
            <SpeciesGlyph species={deck[index + 1]} size="lg" />
          </div>
        )}

        <div
          className={`swipe-card swipe-card--top ${feedback ? `swipe-card--${feedback}` : ''}`}
          style={{
            transform,
            // While dragging, no transition — we want instant follow.
            // At rest (snap-back or fly-off), use the transition for smooth motion.
            transition: drag.dragging ? 'none' : 'transform 0.3s var(--ease-out)',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          // pointercancel fires when the browser steals the pointer (e.g.
          // user starts a system gesture). Treat it like pointerup so we
          // don't get stuck mid-drag.
          onPointerCancel={onPointerUp}
        >
          {/*
            "Document" / "Skip" stamps that fade in based on drag direction.
            Math.max(0, tilt) clamps to 0 so the keep-stamp never fades while
            swiping left and vice versa.
          */}
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
              {/* Show a "Documented" badge if this species is already in the user's collection. */}
              {isCollected && <span className="swipe-seen mono">Documented</span>}
            </div>
            <h2 className="swipe-name">{card.name}</h2>
            <p className="swipe-sci mono">{card.scientific}</p>
            <p className="swipe-hook">{card.hook}</p>

            {/*
              Toggle for the long description. Hidden by default to keep the
              card scan-able; users tap to read more.
            */}
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

      {/*
        The two big tap targets at the bottom — for users who don't want to
        drag, or who are reading on desktop. Same `commit` function as drag.
      */}
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
