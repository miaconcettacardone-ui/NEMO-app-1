/**
 * QuizMode.jsx — trivia mode with biosphere stakes.
 *
 * Each question has 4 choices; pick the right one, get XP and a tiny biosphere
 * boost. Pick wrong, the global biosphere meter drops 4%. Streak counter
 * tracks consecutive right answers.
 *
 * The question pool is built once at mount from each species' `quizzes` array
 * in src/data/species.js, so adding new questions is just editing that data file.
 *
 * Phase machine (per question):
 *   awaiting → user hasn't picked yet, choices are tappable
 *   answered → user has picked, the explainer shows, "Next" button advances
 */

import { useEffect, useMemo, useState } from 'react';
import { SPECIES, getById } from '../data/species';
import { useGameState } from '../hooks/useGameState';
import { SpeciesGlyph } from '../components/SpeciesGlyph';
import './quiz.css';

/**
 * Walk every species, collect their quiz questions, and tag each with the
 * speciesId so we can look up the species when displaying the question.
 *
 * Returns a flat array of question objects.
 */
function buildQuestionPool() {
  const pool = [];
  for (const species of SPECIES) {
    if (!species.quizzes) continue;
    for (const q of species.quizzes) {
      // Spread the existing question fields (q, choices, a, why) and add speciesId.
      pool.push({ ...q, speciesId: species.id });
    }
  }
  return pool;
}

// Same Fisher-Yates shuffle as in SwipeMode.
function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Tunable: how much the biosphere meter moves per answer.
// Loss is bigger than gain because we want wrong answers to hurt more than
// right answers help — keeps the meter feeling fragile, which fits the theme.
const BIOSPHERE_LOSS_PER_WRONG = 4;
const BIOSPHERE_GAIN_PER_RIGHT = 1;

export function QuizMode() {
  // Pull both the action functions and the current biosphere value (so we
  // can show the "biosphere collapsed" banner when it hits 0).
  const { recordQuiz, recordSurvivalLoss, recordSurvivalGain, survival } = useGameState();

  // Build the question pool once on mount and memoize. The empty deps array
  // [] means "compute this on first render and never again" — perfect for
  // expensive computations that don't depend on changing inputs.
  const allQuestions = useMemo(buildQuestionPool, []);

  // The shuffled queue of questions to ask, and our position in it.
  const [queue, setQueue] = useState(() => shuffle(allQuestions));
  const [pos, setPos] = useState(0);

  // The user's pick (an index into q.choices) or null if they haven't picked yet.
  // null is the "awaiting answer" state; a number is the "answered" state.
  const [picked, setPicked] = useState(null);

  // Consecutive right answers. Resets to 0 on any wrong answer.
  const [streak, setStreak] = useState(0);

  // When we run off the end of the queue, reshuffle and restart at 0.
  useEffect(() => {
    if (pos >= queue.length) {
      setQueue(shuffle(allQuestions));
      setPos(0);
    }
  }, [pos, queue.length, allQuestions]);

  // The current question. q can be undefined briefly during the reshuffle
  // effect above, so we guard against that.
  const q = queue[pos];
  const species = q ? getById(q.speciesId) : null;

  // Defensive early return.
  if (!q || !species) return null;

  /**
   * Handle a choice tap.
   * Records the answer, updates streak, and adjusts the biosphere meter.
   */
  const onPick = (idx) => {
    if (picked !== null) return; // already answered, ignore further taps
    setPicked(idx);

    const correct = idx === q.a;
    recordQuiz(q.speciesId, correct);

    if (correct) {
      setStreak((s) => s + 1);
      recordSurvivalGain(BIOSPHERE_GAIN_PER_RIGHT);
    } else {
      setStreak(0);
      recordSurvivalLoss(BIOSPHERE_LOSS_PER_WRONG);
    }
  };

  /**
   * Move to the next question.
   * picked goes back to null (awaiting answer), pos advances.
   */
  const next = () => {
    setPicked(null);
    setPos((p) => p + 1);
  };

  return (
    <div className="quiz-mode page-enter">
      {/* Header row: section label and current streak. */}
      <div className="quiz-eyebrow">
        <span className="eyebrow">Field quiz</span>
        <span className="eyebrow quiz-streak">
          Streak · <span style={{ color: streak > 0 ? 'var(--forest)' : 'var(--ink-faint)' }}>{streak}</span>
        </span>
      </div>

      {/* The species being asked about. Visual context — the user knows what they're answering about. */}
      <div className="quiz-glyph">
        <SpeciesGlyph species={species} size="lg" />
        <div className="quiz-glyph-name">{species.name}</div>
      </div>

      {/* The question itself, in display type. */}
      <h2 className="quiz-question">{q.q}</h2>

      {/* The four choices. Each gets:
          - 'is-correct' if we've answered and this is the right one
          - 'is-wrong'   if the user picked this and it was wrong
          - 'is-dim'     if we've answered and this is just a wrong-but-not-picked option */}
      <div className="quiz-choices">
        {q.choices.map((choice, idx) => {
          const isPicked = picked === idx;
          const isAnswer = picked !== null && idx === q.a;
          const isWrong = isPicked && idx !== q.a;
          return (
            <button
              key={idx}
              className={`quiz-choice ${isAnswer ? 'is-correct' : ''} ${isWrong ? 'is-wrong' : ''} ${
                picked !== null && !isAnswer && !isWrong ? 'is-dim' : ''
              }`}
              onClick={() => onPick(idx)}
              // Disable all buttons after answering until "Next" is tapped.
              disabled={picked !== null}
            >
              {/* The A/B/C/D marker — using array indexing instead of String.fromCharCode for clarity. */}
              <span className="quiz-choice-marker">{['A', 'B', 'C', 'D'][idx]}</span>
              <span className="quiz-choice-text">{choice}</span>
            </button>
          );
        })}
      </div>

      {/* Explainer card — only shown after the user picks. The actual learning
          happens here: WHY the answer is what it is. This is the educational
          payload of the entire mode. */}
      {picked !== null && (
        <div className="quiz-explainer">
          <div
            className="quiz-explainer-verdict"
            style={{ color: picked === q.a ? 'var(--forest)' : 'var(--magenta)' }}
          >
            {picked === q.a ? '✓ Correct' : '✕ Not quite'}
          </div>
          <p className="quiz-explainer-text">{q.why}</p>

          {/* Stakes line — clay if they got it wrong, forest if they got it right. */}
          {picked !== q.a && (
            <p className="quiz-explainer-stakes">
              Biosphere -{BIOSPHERE_LOSS_PER_WRONG}%
            </p>
          )}
          {picked === q.a && (
            <p className="quiz-explainer-stakes" style={{ color: 'var(--forest)' }}>
              Biosphere +{BIOSPHERE_GAIN_PER_RIGHT}%
            </p>
          )}
          <button className="quiz-next" onClick={next}>
            Next
          </button>
        </div>
      )}

      {/* Doom banner: shown when the biosphere has been reduced to zero AND
          the user is about to answer the next question. A reminder that
          right answers rebuild it. */}
      {survival === 0 && picked === null && (
        <div className="quiz-collapse-banner">
          Biosphere collapsed — every right answer rebuilds it.
        </div>
      )}
    </div>
  );
}
