import { useEffect, useRef, useState } from 'react';
import { SPECIES } from '../data/species';
import { useGameState } from '../hooks/useGameState';
import { SpeciesGlyph } from '../components/SpeciesGlyph';
import './speedid.css';

/**
 * Speed-ID Mode
 * -------------
 * Show a silhouette + biome + status. Player picks the correct name
 * from 4 options before the timer runs out. Wrong = -2s on the clock.
 * Run is over when timer hits zero. Score and best run are tracked
 * locally so users have something to beat.
 *
 * Decoy answers come from the species' own decoy_names list — these
 * are hand-chosen plausibly-confusable names, which makes the
 * difficulty feel earned rather than random.
 */
const RUN_SECONDS = 30;
const PENALTY_SECONDS = 2;
const REWARD_SECONDS = 1;

function pickRandom(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

function buildRound(prevId) {
  const pool = SPECIES.filter((s) => s.id !== prevId);
  const target = pool[Math.floor(Math.random() * pool.length)];
  const decoys = pickRandom(target.decoy_names, 3);
  const choices = pickRandom([target.name, ...decoys], 4);
  return { target, choices };
}

export function SpeedIDMode() {
  const { recordSpeedID } = useGameState();
  const [round, setRound] = useState(() => buildRound(null));
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(RUN_SECONDS);
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState(null); // { kind: 'right'|'wrong', name }
  const [best, setBest] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nemox-id-best') || '0');
    } catch {
      return 0;
    }
  });
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setTime((t) => Math.max(0, t - 0.1));
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [running]);

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

  const start = () => {
    setScore(0);
    setTime(RUN_SECONDS);
    setRunning(true);
    setRound(buildRound(null));
    setFeedback(null);
  };

  const choose = (name) => {
    if (!running || feedback) return;
    const correct = name === round.target.name;
    recordSpeedID(round.target.id, correct);
    setFeedback({ kind: correct ? 'right' : 'wrong', name: round.target.name });
    if (correct) {
      setScore((s) => s + 1);
      setTime((t) => Math.min(RUN_SECONDS, t + REWARD_SECONDS));
    } else {
      setTime((t) => Math.max(0, t - PENALTY_SECONDS));
    }
    setTimeout(() => {
      setFeedback(null);
      setRound(buildRound(round.target.id));
    }, 600);
  };

  const timePct = (time / RUN_SECONDS) * 100;
  const timeColor = time > 10 ? 'var(--acid)' : time > 5 ? 'var(--amber)' : 'var(--magenta)';

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

  return (
    <div className="speedid-mode page-enter">
      <div className="speedid-hud">
        <div className="speedid-score">Score · {score}</div>
        <div className="speedid-time" style={{ color: timeColor }}>
          {time.toFixed(1)}s
        </div>
      </div>
      <div className="speedid-timebar">
        <div
          className="speedid-timebar-fill"
          style={{ width: `${timePct}%`, background: timeColor }}
        />
      </div>

      <div className="speedid-card">
        <SpeciesGlyph species={round.target} size="xl" />
        <div className="speedid-meta">
          <span>{round.target.biome}</span>
          <span>·</span>
          <span>{round.target.status}</span>
        </div>
      </div>

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

      {feedback && (
        <div className={`speedid-feedback speedid-feedback--${feedback.kind}`}>
          {feedback.kind === 'right' ? '+1s' : `-${PENALTY_SECONDS}s · It was the ${feedback.name}`}
        </div>
      )}
    </div>
  );
}
