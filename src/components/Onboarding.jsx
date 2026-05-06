/**
 * Onboarding.jsx — the first-time-user flow.
 *
 * Replaces the single-screen "Begin" splash with a multi-step flow that
 * sets the player's reading tier:
 *   welcome     → quick splash with one CTA
 *   age         → kid / teen / adult picker
 *   schooling   → less than HS / basic adult / science person picker
 *   placement?  → "Want a quick quiz to fine-tune?" yes / skip
 *   quiz        → 5 questions (only if user said yes above)
 *   confirm     → "Based on your answers we picked [tier]. OK / Pick another"
 *   done        → setReadingTier + markOnboarded → main app
 *
 * Voice notes:
 *   - The welcome screen itself has to be readable to the youngest user
 *     (we can't ask a kid what tier they want before they tell us).
 *   - Buttons are large (min 56px tall) for thumb tap and accessibility.
 *   - No back button per step — the flow is short enough that "Restart"
 *     from the confirm screen is the right escape hatch.
 *   - We never say "your tier is too low for this" — adjustments are
 *     framed as "we'll show you simpler / deeper text," never as judgment.
 */

import { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import {
  READING_TIERS,
  TIER_LABELS,
  TIER_DESCRIPTIONS,
  inferTierFromOnboarding,
} from '../lib/tier';
import { PLACEMENT_QUESTIONS } from '../lib/placement';
import './onboarding.css';

export function Onboarding() {
  const { markOnboarded, setReadingTier } = useGameState();

  // -------- State --------
  // Phase machine — see header comment for the legal transitions.
  const [phase, setPhase] = useState('welcome');

  // Picker answers. Stay null until the user makes a choice.
  const [age, setAge] = useState(null);
  const [schooling, setSchooling] = useState(null);

  // Quiz state.
  //   quizIndex   = which question is currently on screen (0-based)
  //   quizAnswers = array of choice indices the user picked, one per
  //                 answered question (so its length is also "how many
  //                 questions have been answered")
  //   quizScore   = number of correct answers, or null if quiz was skipped
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizScore, setQuizScore] = useState(null);

  // The tier we'll commit when the user finishes. Recomputed from the
  // signals on each step transition that produces a new signal.
  const [tier, setTier] = useState('standard');

  // -------- Step handlers --------

  const pickAge = (value) => {
    setAge(value);
    setPhase('schooling');
  };

  const pickSchooling = (value) => {
    setSchooling(value);
    setPhase('placement-prompt');
  };

  const acceptQuiz = () => {
    setQuizIndex(0);
    setQuizAnswers([]);
    setPhase('quiz');
  };

  const skipQuiz = () => {
    // Compute tier from picker only. Quiz score stays null.
    const inferred = inferTierFromOnboarding({ age, schooling, quizScore: null });
    setTier(inferred);
    setQuizScore(null);
    setPhase('confirm');
  };

  const answerQuiz = (choiceIndex) => {
    const nextAnswers = [...quizAnswers, choiceIndex];
    setQuizAnswers(nextAnswers);

    // Was this the last question? If so, score and advance to confirm.
    if (nextAnswers.length >= PLACEMENT_QUESTIONS.length) {
      // Score: count correct answers. PLACEMENT_QUESTIONS[i].a is the
      // index of the correct choice.
      let correct = 0;
      nextAnswers.forEach((ans, i) => {
        if (ans === PLACEMENT_QUESTIONS[i].a) correct += 1;
      });
      setQuizScore(correct);
      const inferred = inferTierFromOnboarding({ age, schooling, quizScore: correct });
      setTier(inferred);
      setPhase('confirm');
    } else {
      setQuizIndex(nextAnswers.length);
    }
  };

  const finalize = (chosenTier) => {
    setReadingTier(chosenTier);
    markOnboarded();
    // No setPhase('done') needed — once onboarded flips, App.jsx unmounts
    // this component entirely.
  };

  // ============= RENDER BRANCHES =============

  // ----- welcome -----
  if (phase === 'welcome') {
    return (
      <div className="onboarding">
        <div className="onboarding-content">
          <div className="onboarding-tag">ProjectNEMO · Field Edition</div>
          <h1 className="onboarding-headline">
            Wildlife,<br />
            at the speed of<br />
            <span className="onboarding-emph">attention.</span>
          </h1>
          <p className="onboarding-blurb">
            Real animals. Real conservation. A short setup so we can show you
            text that fits how you read.
          </p>
          <button className="onboarding-go" onClick={() => setPhase('age')}>
            Get started
          </button>
          <p className="onboarding-fine">Takes about a minute.</p>
        </div>
      </div>
    );
  }

  // ----- age picker -----
  if (phase === 'age') {
    return (
      <OnboardingStep
        eyebrow="Step 1 of 3"
        title="How old are you?"
        subtitle="This helps us pick the right reading level."
      >
        <ChoiceButton onClick={() => pickAge('kid')} label="Kid" sub="12 or under" />
        <ChoiceButton onClick={() => pickAge('teen')} label="Teen" sub="13 to 17" />
        <ChoiceButton onClick={() => pickAge('adult')} label="Adult" sub="18 and over" />
      </OnboardingStep>
    );
  }

  // ----- schooling picker -----
  if (phase === 'schooling') {
    return (
      <OnboardingStep
        eyebrow="Step 2 of 3"
        title="How much have you studied science?"
        subtitle="There's no wrong answer. Be honest — the app gets better when we know."
      >
        <ChoiceButton
          onClick={() => pickSchooling('pre-hs')}
          label="Just starting out"
          sub="Less than high school, or new to science"
        />
        <ChoiceButton
          onClick={() => pickSchooling('basic')}
          label="The usual"
          sub="High-school biology level"
        />
        <ChoiceButton
          onClick={() => pickSchooling('science')}
          label="Pretty deep"
          sub="College-level science or a science job"
        />
      </OnboardingStep>
    );
  }

  // ----- placement prompt -----
  if (phase === 'placement-prompt') {
    return (
      <OnboardingStep
        eyebrow="Step 3 of 3 (optional)"
        title="Want to take a quick quiz?"
        subtitle="Five questions, about a minute. We'll fine-tune the reading level for you. Or skip — your earlier answers are enough."
      >
        <ChoiceButton onClick={acceptQuiz} label="Yes, take the quiz" sub="5 quick questions" />
        <ChoiceButton onClick={skipQuiz} label="Skip" sub="Use my answers from before" />
      </OnboardingStep>
    );
  }

  // ----- quiz -----
  if (phase === 'quiz') {
    const q = PLACEMENT_QUESTIONS[quizIndex];
    return (
      <OnboardingStep
        eyebrow={`Question ${quizIndex + 1} of ${PLACEMENT_QUESTIONS.length}`}
        title={q.q}
        subtitle="Pick the answer that sounds most right."
      >
        {q.choices.map((choice, i) => (
          <ChoiceButton key={i} onClick={() => answerQuiz(i)} label={choice} />
        ))}
      </OnboardingStep>
    );
  }

  // ----- confirm -----
  if (phase === 'confirm') {
    // Show what we picked, why, and let them override.
    const summary = quizScore != null
      ? `You picked ${age} and got ${quizScore} of ${PLACEMENT_QUESTIONS.length} right on the quiz.`
      : `Based on your answers.`;

    return (
      <div className="onboarding">
        <div className="onboarding-content">
          <div className="onboarding-tag">All set</div>
          <h1 className="onboarding-headline">
            We'll show you<br />
            <span className="onboarding-emph">{TIER_LABELS[tier]}</span><br />
            text.
          </h1>
          <p className="onboarding-blurb">{summary} {TIER_DESCRIPTIONS[tier]}</p>

          <div className="onboarding-tier-note">
            You can change this any time from your Credentials screen.
          </div>

          <button className="onboarding-go" onClick={() => finalize(tier)}>
            Sounds good — let's go
          </button>

          {/* Override row — small, secondary. The default is "go with the
              suggestion"; only people who actively disagree drop down here. */}
          <div className="onboarding-override">
            <div className="onboarding-override-label">Or pick a different level:</div>
            <div className="onboarding-override-row">
              {READING_TIERS.filter((t) => t !== tier).map((t) => (
                <button
                  key={t}
                  className="onboarding-override-btn"
                  onClick={() => finalize(t)}
                >
                  {TIER_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Defensive fallback.
  return null;
}

// ---------------------------------------------------------------------------
// Small subcomponents kept inline because they're only used here.
// ---------------------------------------------------------------------------

/**
 * OnboardingStep — shared chrome for the picker / quiz screens.
 * Eyebrow + title + subtitle stack, then children render the buttons.
 */
function OnboardingStep({ eyebrow, title, subtitle, children }) {
  return (
    <div className="onboarding">
      <div className="onboarding-content">
        <div className="onboarding-tag">{eyebrow}</div>
        <h1 className="onboarding-step-title">{title}</h1>
        {subtitle && <p className="onboarding-blurb">{subtitle}</p>}
        <div className="onboarding-choices">{children}</div>
      </div>
    </div>
  );
}

/**
 * ChoiceButton — a tall, full-width button used throughout the flow.
 * Label is the main word; `sub` is an optional secondary line.
 *
 * AGENTS.md is explicit: 6px radius (var(--radius)) on action buttons,
 * never pill. Touch target is ≥ 56px tall per accessibility guidelines.
 */
function ChoiceButton({ onClick, label, sub }) {
  return (
    <button className="onboarding-choice" onClick={onClick}>
      <div className="onboarding-choice-label">{label}</div>
      {sub && <div className="onboarding-choice-sub">{sub}</div>}
    </button>
  );
}
