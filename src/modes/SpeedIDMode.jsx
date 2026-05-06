/**
 * SpeedIDMode.jsx — the timed flashcard identification mode.
 *
 * Shows a species silhouette + biome + status. The user picks the correct
 * name from four options before the timer runs out. Right answers add time
 * and score; wrong answers subtract time. Run ends when timer hits zero.
 *
 * Phase machine:
 *   intro     → user lands here, sees their best score, taps "Start run"
 *   running   → the clock counts down, rounds replace each round on answer
 *   ended     → time hit zero, show the final score and a "Run again" button
 *
 * The phase is derived from `running` and `time` rather than stored as a
 * separate state — see the conditional returns near the bottom.
 *
 * The "best run" score is persisted in localStorage directly here, separately
 * from the main game state. This is a simplification that should eventually
 * move into useGameState for consistency, but for now it's fine.
 */

import { useEffect, useRef, useState } from 'react';
import { SPECIES } from '../data/species';
import { useGameState } from '../hooks/useGameState';
import { SpeciesGlyph } from '../components/SpeciesGlyph';
import './speedid.css';

// --- Tunable constants for the run rules. Adjust these to balance difficulty. ---
const RUN_SECONDS = 30;       // total time per run
const PENALTY_SECONDS = 2;    // time lost on a wrong answer
const REWARD_SECONDS = 1;     // time gained on a right answer

/**
 * Pick `n` random elements from `arr` without replacement.
 * Walks the array, picking and removing one element at a time.
 */
function pickRandom(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length);
    // .splice(i, 1) removes one element at index i and returns it as an
    // array; [0] grabs the removed element.
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

/**
 * Build a single round: pick a target species, pick three decoy names from
 * its hand-curated decoy list, and shuffle the four choices.
 *
 * `prevId` is the previous round's species id — we exclude it so the same
 * species never appears twice in a row (would feel like a glitch).
 */
function buildRound(prevId) {
  const pool = SPECIES.filter((s) => s.id !== prevId);
  const target = pool[Math.floor(Math.random() * pool.length)];
  const decoys = pickRandom(target.decoy_names, 3);
  // Shuffle by passing all 4 to pickRandom with n=4 — it's not the cleanest
  // shuffle, but it's clear and works.
  const choices = pickRandom([target.name, ...decoys], 4);
  return { target, choices };
}

export function SpeedIDMode() {
  const { recordSpeedID } = useGameState();

  // The current round (target species + 4 choice strings).
  const [round, setRound] = useState(() => buildRound(null));

  // Score this run (incremented on each correct answer).
  const [score, setScore] = useState(0);

  // Time remaining, in seconds. Counts down by 0.1s every 100ms while running.
  const [time, setTime] = useState(RUN_SECONDS);

  // Whether the run is in progress. `false` covers both "haven't started yet"
  // and "just ended."
  const [running, setRunning] = useState(false);

  // Brief feedback after answering: { kind: 'right' | 'wrong', name }.
  // Cleared after 600ms to make room for the next round.
  const [feedback, setFeedback] = useState(null);

  // Best score ever, persisted in localStorage. Lazy initializer reads from
  // storage on mount.
  // TODO: move this into useGameState for consistency with the rest of the app.
  const [best, setBest] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nemox-id-best') || '0');
    } catch {
      return 0;
    }
  });

  // Ref for the interval id so we can clear it from the cleanup function.
  // We use a ref (not state) because the interval id doesn't affect rendering.
  const intervalRef = useRef(null);

  // --- Timer effect ---
  // Starts the countdown when `running` flips to true; stops it when running
  // flips to false (or component unmounts).
  useEffect(() => {
    if (!running) return;

    // setInterval fires our callback every 100ms. Each tick subtracts 0.1
    // from the remaining time, clamped at 0.
    intervalRef.current = setInterval(() => {
      setTime((t) => Math.max(0, t - 0.1));
    }, 100);

    // The cleanup function clears the interval. Critical: without this, the
    // interval would keep firing forever even after the component unmounts.
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // --- End-of-run effect ---
  // Watches for the moment time hits zero while running, then ends the run
  // and saves the new best score if applicable.
  useEffect(() => {
    if (time <= 0 && running) {
      setRunning(false);
      if (score > best) {
        setBest(score);
        try {
          localStorage.setItem('nemox-id-best', JSON.stringify(score));
        } catch {}
      }
    }
  }, [time, running, score, best]);

  /**
   * Start (or restart) a run.
   */
  const start = () => {
    setScore(0);
    setTime(RUN_SECONDS);
    setRunning(true);
    setRound(buildRound(null));
    setFeedback(null);
  };

  /**
   * Handle a choice tap. Adjusts time and score, shows feedback, then
   * after 600ms moves to the next round.
   */
  const choose = (name) => {
    if (!running || feedback) return; // ignore taps after answering or before start
    const correct = name === round.target.name;
    recordSpeedID(round.target.id, correct);
    setFeedback({ kind: correct ? 'right' : 'wrong', name: round.target.name });

    if (correct) {
      setScore((s) => s + 1);
      // Math.min ensures time doesn't exceed the starting amount even after rewards.
      setTime((t) => Math.min(RUN_SECONDS, t + REWARD_SECONDS));
    } else {
      setTime((t) => Math.max(0, t - PENALTY_SECONDS));
    }

    // Brief delay so the player sees the answer reveal before the next round.
    setTimeout(() => {
      setFeedback(null);
      setRound(buildRound(round.target.id));
    }, 600);
  };

  // --- Derived values for rendering ---
  const timePct = (time / RUN_SECONDS) * 100;
  // Color shifts amber as time gets low, clay when critical.
  const timeColor = time > 10 ? 'var(--acid)' : time > 5 ? 'var(--amber)' : 'var(--magenta)';

  // --- Phase: pre-run intro ---
  // Detected by: not running AND time is at the starting value.
  if (!running && time === RUN_SECONDS) {
    return (
      <div className="speedid-mode page-enter">
        <div className="speedid-intro">
          <div className="eyebrow">Speed identification</div>
          <h1 className="speedid-title">Name it.<br/>Before the clock runs out.</h1>
          <p className="speedid-blurb">
            30 seconds. Wrong answer costs you 2. Right answer buys you 1.
            How many can you ID?
          </p>
          <div className="speedid-best">
            Best run · <span style={{ color: 'var(--forest)' }}>{best}</span>
          </div>
          <button className="speedid-start" onClick={start}>
            Start run
          </button>
        </div>
      </div>
    );
  }

  // --- Phase: post-run summary ---
  // Detected by: not running AND time has hit zero.
  if (!running && time <= 0) {
    return (
      <div className="speedid-mode page-enter">
        <div className="speedid-intro">
          <div className="eyebrow" style={{ color: 'var(--magenta)' }}>Run ended</div>
          <h1 className="speedid-title">{score === best && score > 0 ? 'New best.' : 'Time.'}</h1>
          <div className="speedid-final">
            <div className="speedid-final-num">{score}</div>
            <div className="speedid-final-label">Species identified</div>
          </div>
          <div className="speedid-best">
            All-time best · <span style={{ color: 'var(--forest)' }}>{best}</span>
          </div>
          <button className="speedid-start" onClick={start}>
            Run again
          </button>
        </div>
      </div>
    );
  }

  // --- Phase: live run ---
  return (
    <div className="speedid-mode page-enter">
      {/* Score and timer at the top */}
      <div className="speedid-hud">
        <div className="speedid-score">Score · {score}</div>
        <div className="speedid-time" style={{ color: timeColor }}>
          {/* toFixed(1) keeps one decimal place so the timer counts down smoothly. */}
          {time.toFixed(1)}s
        </div>
      </div>

      {/* Visual timebar — width tracks time, color matches the digital readout. */}
      <div className="speedid-timebar">
        <div
          className="speedid-timebar-fill"
          style={{ width: `${timePct}%`, background: timeColor }}
        />
      </div>

      {/* The species plate. The user has to name what they're looking at. */}
      <div className="speedid-card">
        <SpeciesGlyph species={round.target} size="xl" />
        <div className="speedid-meta">
          <span>{round.target.biome}</span>
          <span>·</span>
          <span>{round.target.status}</span>
        </div>
      </div>

      {/* Four choice buttons. After answering, the correct one highlights and the rest dim. */}
      <div className="speedid-choices">
        {round.choices.map((choice) => {
          const isAnswered = !!feedback;
          const isCorrect = isAnswered && choice === round.target.name;
          const isDimmed = isAnswered && choice !== round.target.name;
          return (
            <button
              key={choice}
              className={`speedid-choice ${isCorrect ? 'is-correct' : ''} ${isDimmed ? 'is-dim' : ''}`}
              onClick={() => choose(choice)}
              disabled={isAnswered}
            >
              {choice}
            </button>
          );
        })}
      </div>

      {/* Feedback strip below the choices. Shown briefly after each answer. */}
      {feedback && (
        <div className={`speedid-feedback speedid-feedback--${feedback.kind}`}>
          {feedback.kind === 'right' ? '+1s' : `-${PENALTY_SECONDS}s · It was the ${feedback.name}`}
        </div>
      )}
    </div>
  );
}
