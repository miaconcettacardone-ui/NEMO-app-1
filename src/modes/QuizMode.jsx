import { useEffect, useMemo, useState } from 'react';
import { SPECIES, getById } from '../data/species';
import { useGameState } from '../hooks/useGameState';
import { SpeciesGlyph } from '../components/SpeciesGlyph';
import './quiz.css';

/**
 * Quiz Mode
 * ---------
 * Trivia with stakes. Correct = XP + biosphere stays. Wrong = biosphere
 * meter takes a hit (mirroring the "global ecosystem health" pressure
 * that's the spine of NEMO X's mission framing). At biosphere = 0 we
 * surface a recovery prompt — the player can rebuild it by getting a
 * streak of correct answers.
 *
 * Question pool is built from each species' `quizzes` array, so adding
 * questions later is just editing the data file.
 */

function buildQuestionPool() {
  const pool = [];
  for (const species of SPECIES) {
    if (!species.quizzes) continue;
    for (const q of species.quizzes) {
      pool.push({ ...q, speciesId: species.id });
    }
  }
  return pool;
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const BIOSPHERE_LOSS_PER_WRONG = 4;
const BIOSPHERE_GAIN_PER_RIGHT = 1;

export function QuizMode() {
  const { recordQuiz, recordSurvivalLoss, recordSurvivalGain, survival } = useGameState();
  const allQuestions = useMemo(buildQuestionPool, []);
  const [queue, setQueue] = useState(() => shuffle(allQuestions));
  const [pos, setPos] = useState(0);
  const [picked, setPicked] = useState(null);
  const [streak, setStreak] = useState(0);

  // Reshuffle when we run out
  useEffect(() => {
    if (pos >= queue.length) {
      setQueue(shuffle(allQuestions));
      setPos(0);
    }
  }, [pos, queue.length, allQuestions]);

  const q = queue[pos];
  const species = q ? getById(q.speciesId) : null;

  if (!q || !species) return null;

  const onPick = (idx) => {
    if (picked !== null) return;
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

  const next = () => {
    setPicked(null);
    setPos((p) => p + 1);
  };

  return (
    <div className="quiz-mode page-enter">
      <div className="quiz-eyebrow">
        <span className="eyebrow">Field quiz</span>
        <span className="eyebrow quiz-streak">
          Streak · <span style={{ color: streak > 0 ? 'var(--forest)' : 'var(--ink-faint)' }}>{streak}</span>
        </span>
      </div>

      <div className="quiz-glyph">
        <SpeciesGlyph species={species} size="lg" />
        <div className="quiz-glyph-name">{species.name}</div>
      </div>

      <h2 className="quiz-question">{q.q}</h2>

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
              disabled={picked !== null}
            >
              <span className="quiz-choice-marker">{['A', 'B', 'C', 'D'][idx]}</span>
              <span className="quiz-choice-text">{choice}</span>
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="quiz-explainer">
          <div
            className="quiz-explainer-verdict"
            style={{ color: picked === q.a ? 'var(--forest)' : 'var(--magenta)' }}
          >
            {picked === q.a ? '✓ Correct' : '✕ Not quite'}
          </div>
          <p className="quiz-explainer-text">{q.why}</p>
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

      {survival === 0 && picked === null && (
        <div className="quiz-collapse-banner">
          Biosphere collapsed — every right answer rebuilds it.
        </div>
      )}
    </div>
  );
}
