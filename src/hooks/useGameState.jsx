import { createContext, useContext, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

/**
 * GameStateContext
 * ----------------
 * Single source of truth for all persistent player state. All game modes
 * (Swipe, Speed-ID, Trivia, Survival) read from and write to this context.
 *
 * State shape:
 *   xp:          number — total XP earned, drives "Field Level"
 *   streak:      { count, lastDay } — daily streak tracker
 *   collected:   { [speciesId]: { firstSeenAt, encounters, mastery } }
 *                mastery rises with correct quiz answers; powers the
 *                "fully documented" milestone shown in the Habitat view.
 *   survival:    number 0–100 — represents the global ecosystem health
 *                meter. Lost answers in Survival mode tick this down.
 *   stats:       { swipes, ids, quizCorrect, quizWrong, sessions }
 *   onboarded:   boolean — has the user seen the intro pulse?
 */

const initialState = {
  xp: 0,
  streak: { count: 0, lastDay: null },
  collected: {},
  survival: 100,
  stats: {
    swipes: 0,
    ids: 0,
    idsCorrect: 0,
    quizCorrect: 0,
    quizWrong: 0,
    sessions: 0,
  },
  onboarded: false,
};

const GameStateContext = createContext(null);

// --- Level curve ---------------------------------------------------------
// Levels scale gradually so the early-game feels rewarding and later levels
// feel earned. Mirrors the "Scout → Field Observer → Researcher → ..."
// taxonomy from the Field Journal but with shorter, punchier rank names
// suitable for a HUD.
const LEVEL_THRESHOLDS = [
  0, 50, 150, 350, 700, 1200, 2000, 3200, 5000, 8000,
];

const LEVEL_NAMES = [
  'Rookie',
  'Tracker',
  'Spotter',
  'Field Tech',
  'Naturalist',
  'Biologist',
  'Ecologist',
  'Specialist',
  'Lead Researcher',
  'Archivist',
];

export function levelFromXP(xp) {
  let level = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i;
  }
  const current = LEVEL_THRESHOLDS[level];
  const next = LEVEL_THRESHOLDS[level + 1] ?? null;
  const progress = next ? (xp - current) / (next - current) : 1;
  return {
    level: level + 1,
    name: LEVEL_NAMES[level],
    xpInLevel: xp - current,
    xpToNext: next ? next - xp : 0,
    progress,
    capped: !next,
  };
}

// --- Helpers -------------------------------------------------------------
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function tickStreak(streak) {
  const today = todayKey();
  if (streak.lastDay === today) return streak; // already counted today

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (streak.lastDay === yesterday) {
    return { count: streak.count + 1, lastDay: today };
  }
  // missed a day, or first session ever
  return { count: 1, lastDay: today };
}

// --- Provider ------------------------------------------------------------

export function GameStateProvider({ children }) {
  const [state, setState] = useLocalStorage('nemox-state-v1', initialState);

  const updateState = useCallback(
    (mutator) => {
      setState((prev) => {
        const next = mutator({ ...prev });
        return next;
      });
    },
    [setState],
  );

  const recordSwipe = useCallback(
    (speciesId, kept) => {
      updateState((s) => {
        s.stats = { ...s.stats, swipes: s.stats.swipes + 1 };
        if (kept) {
          const existing = s.collected[speciesId];
          s.collected = {
            ...s.collected,
            [speciesId]: existing
              ? { ...existing, encounters: existing.encounters + 1 }
              : { firstSeenAt: Date.now(), encounters: 1, mastery: 0 },
          };
          s.xp = s.xp + (existing ? 5 : 25); // first-time bonus
        }
        s.streak = tickStreak(s.streak);
        return s;
      });
    },
    [updateState],
  );

  const recordSpeedID = useCallback(
    (speciesId, correct) => {
      updateState((s) => {
        s.stats = {
          ...s.stats,
          ids: s.stats.ids + 1,
          idsCorrect: s.stats.idsCorrect + (correct ? 1 : 0),
        };
        if (correct) {
          s.xp = s.xp + 10;
          const existing = s.collected[speciesId];
          if (existing) {
            s.collected = {
              ...s.collected,
              [speciesId]: { ...existing, mastery: Math.min(100, existing.mastery + 8) },
            };
          }
        }
        s.streak = tickStreak(s.streak);
        return s;
      });
    },
    [updateState],
  );

  const recordQuiz = useCallback(
    (speciesId, correct) => {
      updateState((s) => {
        s.stats = {
          ...s.stats,
          quizCorrect: s.stats.quizCorrect + (correct ? 1 : 0),
          quizWrong: s.stats.quizWrong + (correct ? 0 : 1),
        };
        if (correct) {
          s.xp = s.xp + 15;
          const existing = s.collected[speciesId];
          if (existing) {
            s.collected = {
              ...s.collected,
              [speciesId]: { ...existing, mastery: Math.min(100, existing.mastery + 12) },
            };
          }
        }
        s.streak = tickStreak(s.streak);
        return s;
      });
    },
    [updateState],
  );

  const recordSurvivalLoss = useCallback(
    (amount) => {
      updateState((s) => {
        s.survival = Math.max(0, s.survival - amount);
        return s;
      });
    },
    [updateState],
  );

  const recordSurvivalGain = useCallback(
    (amount) => {
      updateState((s) => {
        s.survival = Math.min(100, s.survival + amount);
        return s;
      });
    },
    [updateState],
  );

  const markOnboarded = useCallback(() => {
    updateState((s) => {
      s.onboarded = true;
      s.stats = { ...s.stats, sessions: s.stats.sessions + 1 };
      return s;
    });
  }, [updateState]);

  const reset = useCallback(() => {
    setState(initialState);
  }, [setState]);

  const level = useMemo(() => levelFromXP(state.xp), [state.xp]);
  const collectedCount = useMemo(() => Object.keys(state.collected).length, [state.collected]);

  const value = {
    ...state,
    level,
    collectedCount,
    recordSwipe,
    recordSpeedID,
    recordQuiz,
    recordSurvivalLoss,
    recordSurvivalGain,
    markOnboarded,
    reset,
  };

  return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>;
}

export function useGameState() {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error('useGameState must be used within GameStateProvider');
  return ctx;
}
