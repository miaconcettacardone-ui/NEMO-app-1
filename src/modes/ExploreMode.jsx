/**
 * ExploreMode.jsx — the decision-card simulation, sixth tab.
 *
 * WHY THIS MODE EXISTS
 * Swipe and Habitat let players collect species. Speed-ID and Quiz let them
 * test knowledge. Survive puts them inside a single species' fight to
 * persist. Explore is the missing layer above all of those: the systems
 * view. You sit at the desk where the trade-offs land — protected area
 * vs. logging concession, marine reserve vs. fishing fleet — and feel
 * what those choices cost in four directions at once.
 *
 * It is INTENTIONALLY NOT an open-world / Minecraft-style sim. AGENTS.md is
 * explicit on this and the previous session over-promised in that direction
 * once. The mechanic is Reigns: you flip a card, you pick from 2–3 honest
 * choices, four meters move. Five turns per session.
 *
 * Phase machine:
 *   intro        → no session in progress; hero copy + start button
 *   map          → biome map; player picks which biome to spend a turn in
 *   playing      → current scenario card on screen, awaiting choice
 *   result       → choice locked in; meters animated; "Continue" button
 *   session-end  → all turns played (or a meter hit zero); win/loss screen
 *
 * Legal transitions:
 *   intro       → map         (player taps "Begin session")
 *   map         → playing     (player taps a biome)
 *   playing     → result      (player picks a choice — meters update first)
 *   result      → map         (player taps "Continue", more turns left)
 *   result      → session-end (player taps "Continue", no turns left, OR
 *                              a meter hit zero — that ends immediately)
 *   session-end → intro       (player taps "Begin again")
 *
 * STATE OWNERSHIP
 *   - World meters live in useGameState.world (persistent across mode
 *     switches; reset on session start via resetWorld()).
 *   - Per-session locals — turn counter, current biome, current scenario,
 *     last choice picked, used scenario ids — live here.
 */

import { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import {
  BIOMES,
  TURNS_PER_SESSION,
  WIN_THRESHOLD,
  pickScenario,
} from '../data/explore';
import './explore.css';

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export function ExploreMode() {
  // Game-state hooks: the world meters and the actions that touch them.
  const {
    world,
    applyWorldEffects,
    resetWorld,
    recordExploreSessionComplete,
  } = useGameState();

  // -------- Per-session state --------
  // phase machine — see the header comment.
  const [phase, setPhase] = useState('intro');

  // Which biome the player picked for the current turn. Reset after each
  // turn so every turn returns to the map.
  const [biome, setBiome] = useState(null);

  // The scenario currently on screen (during `playing` and `result`).
  const [scenario, setScenario] = useState(null);

  // The choice the player just picked. Used to render the result screen.
  const [lastChoice, setLastChoice] = useState(null);

  // Turn counter — increments after each completed turn. Session ends when
  // this hits TURNS_PER_SESSION.
  const [turn, setTurn] = useState(0);

  // Track which scenarios have already been shown this session, so we
  // don't repeat. Stored as an array of scenario ids.
  const [usedIds, setUsedIds] = useState([]);

  // Final outcome — set when we transition to session-end. 'won' | 'lost'.
  const [outcome, setOutcome] = useState(null);

  // Reason text shown on the session-end screen — explains what ended it.
  const [endReason, setEndReason] = useState('');

  // -------- Helpers --------

  /**
   * Check whether any meter has hit zero. Returns the name of the first
   * meter at zero, or null if all four are still positive.
   */
  const findCollapsedMeter = (w) => {
    if (w.biodiversity <= 0) return 'biodiversity';
    if (w.climate <= 0) return 'climate';
    if (w.prosperity <= 0) return 'prosperity';
    if (w.biosphere <= 0) return 'biosphere';
    return null;
  };

  // -------- Event handlers --------

  /**
   * Begin a new Explore session. Resets world meters to baseline, clears
   * per-session locals, transitions to the biome map.
   */
  const begin = () => {
    resetWorld();
    setBiome(null);
    setScenario(null);
    setLastChoice(null);
    setTurn(0);
    setUsedIds([]);
    setOutcome(null);
    setEndReason('');
    setPhase('map');
  };

  /**
   * Player tapped a biome on the map. Pick a scenario for that biome and
   * advance to the playing phase.
   */
  const visitBiome = (biomeId) => {
    const next = pickScenario(biomeId, usedIds);
    if (!next) return; // shouldn't happen; defensive
    setBiome(BIOMES.find((b) => b.id === biomeId));
    setScenario(next);
    setLastChoice(null);
    setPhase('playing');
  };

  /**
   * Player picked one of the choices. Apply effects, mark scenario used,
   * detect end-of-session conditions.
   *
   * The order of operations matters:
   *   1. Apply effects to world (so meters update visually before we read).
   *   2. Compute next world ourselves (since setState is async we can't
   *      read the updated world this render).
   *   3. Decide the next phase based on the *computed* next world.
   */
  const choose = (choice) => {
    applyWorldEffects(choice.effects);
    setLastChoice(choice);
    setUsedIds((prev) => [...prev, scenario.id]);

    // Compute the world state we'd see *after* this choice. We don't trust
    // setState to settle in time for the conditional logic below.
    const nextWorld = {
      biodiversity: clamp(world.biodiversity + (choice.effects.biodiversity ?? 0)),
      climate: clamp(world.climate + (choice.effects.climate ?? 0)),
      prosperity: clamp(world.prosperity + (choice.effects.prosperity ?? 0)),
      biosphere: clamp(world.biosphere + (choice.effects.biosphere ?? 0)),
    };

    const collapsed = findCollapsedMeter(nextWorld);
    const nextTurn = turn + 1;

    if (collapsed) {
      // A meter hit zero — instant loss, regardless of turn count.
      setOutcome('lost');
      setEndReason(`The ${collapsed} meter collapsed. The system can't bounce back from zero in any honest model.`);
      recordExploreSessionComplete(false);
      // Brief delay would be nice for animation; keeping synchronous for
      // simplicity — phase transitions via state.
      setPhase('result'); // result screen first, then session-end on Continue
    } else if (nextTurn >= TURNS_PER_SESSION) {
      // All turns done. Win/loss decided by whether all four meters are
      // above WIN_THRESHOLD.
      const allAbove = (
        nextWorld.biodiversity >= WIN_THRESHOLD &&
        nextWorld.climate >= WIN_THRESHOLD &&
        nextWorld.prosperity >= WIN_THRESHOLD &&
        nextWorld.biosphere >= WIN_THRESHOLD
      );
      setOutcome(allAbove ? 'won' : 'lost');
      setEndReason(allAbove
        ? `All four systems still above ${WIN_THRESHOLD}. That's what good stewardship looks like.`
        : `Some meters dropped below ${WIN_THRESHOLD}. The system held together — barely.`,
      );
      recordExploreSessionComplete(allAbove);
      setPhase('result');
    } else {
      // Normal mid-session result screen.
      setPhase('result');
    }

    setTurn(nextTurn);
  };

  /**
   * From the result screen, advance to either the next map turn or the
   * session-end screen depending on whether the session finished.
   */
  const continueFromResult = () => {
    if (outcome) {
      // Session resolved during the last choose() call.
      setPhase('session-end');
    } else {
      // More turns remaining — back to the map.
      setBiome(null);
      setScenario(null);
      setLastChoice(null);
      setPhase('map');
    }
  };

  // -------- Render branches --------

  // ===== intro =====
  if (phase === 'intro') {
    return (
      <div className="explore-mode page-enter">
        <div className="explore-intro">
          <div className="eyebrow">Decision sim</div>
          <h1 className="explore-title">
            Four meters.<br />Five turns.<br />No clean answers.
          </h1>
          <p className="explore-blurb">
            Visit a biome. Read a card. Pick a choice. Watch four world meters move
            — biodiversity, climate, human prosperity, biosphere. Keep all four
            above {WIN_THRESHOLD} to stabilize the region; let any drop to zero and
            the run ends.
          </p>
          <p className="explore-disclaimer">
            Every scenario is rooted in a real conservation tradeoff.
          </p>
          <button className="explore-start" onClick={begin}>Begin session</button>
        </div>
      </div>
    );
  }

  // ===== map =====
  // Each biome shows as a tappable card with its current "felt" state
  // derived from the world meters. We don't show per-biome meters (the
  // four meters are global to the session) — the cards are pure entry points.
  if (phase === 'map') {
    const turnsLeft = TURNS_PER_SESSION - turn;
    return (
      <div className="explore-mode page-enter">
        <div className="explore-header">
          <div className="eyebrow">Region map · turn {turn + 1} / {TURNS_PER_SESSION}</div>
          <h2 className="explore-section-title">Where will you spend this turn?</h2>
        </div>

        <WorldMeters world={world} />

        <div className="explore-biome-grid">
          {BIOMES.map((b) => (
            <button
              key={b.id}
              className="explore-biome-card"
              onClick={() => visitBiome(b.id)}
            >
              <div className="explore-biome-name">{b.name}</div>
              <div className="explore-biome-blurb">{b.blurb}</div>
              <div className="explore-biome-arrow">→ Visit</div>
            </button>
          ))}
        </div>

        <div className="explore-foot">{turnsLeft} turn{turnsLeft === 1 ? '' : 's'} remaining</div>
      </div>
    );
  }

  // ===== playing — scenario card with choices =====
  if (phase === 'playing') {
    return (
      <div className="explore-mode page-enter">
        <div className="explore-header">
          <div className="eyebrow">{biome.name} · turn {turn + 1} / {TURNS_PER_SESSION}</div>
          <h2 className="explore-section-title">{scenario.flavor}</h2>
        </div>

        <WorldMeters world={world} compact />

        <div className="explore-scenario">
          <p className="explore-prompt">{scenario.prompt}</p>

          <div className="explore-choices">
            {scenario.choices.map((c, i) => (
              <button
                key={i}
                className="explore-choice"
                onClick={() => choose(c)}
              >
                <span className="explore-choice-marker">→</span>
                <span className="explore-choice-label">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== result — choice outcome shown =====
  if (phase === 'result') {
    return (
      <div className="explore-mode page-enter">
        <div className="explore-header">
          <div className="eyebrow">{biome?.name ?? 'Outcome'}</div>
          <h2 className="explore-section-title">You chose:</h2>
          <p className="explore-chosen-label">{lastChoice.label}</p>
        </div>

        <WorldMeters world={world} showDeltas={lastChoice.effects} />

        <div className="explore-result-note">
          <div className="eyebrow">Note from the field</div>
          <p>{lastChoice.note}</p>
        </div>

        <button className="explore-continue" onClick={continueFromResult}>
          {outcome ? 'See session result →' : 'Continue →'}
        </button>
      </div>
    );
  }

  // ===== session-end — win or loss =====
  if (phase === 'session-end') {
    const won = outcome === 'won';
    return (
      <div className="explore-mode page-enter">
        <div className="explore-intro">
          <div className="eyebrow" style={{ color: won ? 'var(--forest)' : 'var(--magenta)' }}>
            {won ? 'Session stabilized' : 'Session destabilized'}
          </div>
          <h1 className="explore-title" style={{ color: won ? 'var(--forest)' : 'var(--magenta)' }}>
            {won ? 'The region held.' : 'Something gave.'}
          </h1>
          <p className="explore-blurb">{endReason}</p>

          <WorldMeters world={world} />

          <button className="explore-start" onClick={begin}>Begin again</button>
        </div>
      </div>
    );
  }

  // Defensive fallback — should never hit this.
  return null;
}

// ---------------------------------------------------------------------------
// WorldMeters — small subcomponent rendering the four meters.
// ---------------------------------------------------------------------------
//
// Kept inside the same file because (a) it's only used here, and (b) the
// AGENTS.md rule "One component per file unless two are tightly coupled
// and never used apart" applies. It's a pure render helper: pass a `world`
// object and optionally `compact` (smaller layout) or `showDeltas` (an
// effects object — renders ±N indicators on each meter).

function WorldMeters({ world, compact = false, showDeltas = null }) {
  // The four meters in display order. Order matters for muscle memory —
  // players will scan top-to-bottom, and we want the most "values-laden"
  // meter (biodiversity) first.
  const meters = [
    { key: 'biodiversity', label: 'Biodiversity', value: world.biodiversity },
    { key: 'climate', label: 'Climate', value: world.climate },
    { key: 'prosperity', label: 'Prosperity', value: world.prosperity },
    { key: 'biosphere', label: 'Biosphere', value: world.biosphere },
  ];

  return (
    <div className={`explore-meters ${compact ? 'is-compact' : ''}`}>
      {meters.map((m) => {
        const delta = showDeltas ? (showDeltas[m.key] ?? 0) : null;
        // Color follows the same threshold logic as the HUD biosphere meter:
        // forest above 60, amber 30–60, clay below 30. Reuses brand tokens.
        const color =
          m.value > 60 ? 'var(--status-secure)' :
          m.value > 30 ? 'var(--status-watch)' :
          'var(--status-critical)';
        return (
          <div key={m.key} className="explore-meter">
            <div className="explore-meter-label">
              <span className="eyebrow">{m.label}</span>
              <span className="explore-meter-value" style={{ color }}>
                {m.value}
                {delta !== null && delta !== 0 && (
                  <span className="explore-meter-delta" style={{ color: delta > 0 ? 'var(--forest)' : 'var(--magenta)' }}>
                    {' '}{delta > 0 ? `+${delta}` : delta}
                  </span>
                )}
              </span>
            </div>
            <div className="explore-meter-bar">
              <div
                className="explore-meter-fill"
                style={{ width: `${m.value}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// utility — clamp a number into [0, 100]. Top-level so it doesn't get
// recreated on every render.
// ---------------------------------------------------------------------------
function clamp(n) {
  return Math.max(0, Math.min(100, n));
}
