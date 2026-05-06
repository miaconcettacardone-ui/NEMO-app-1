/**
 * useGameState.jsx — the central nervous system of the app.
 *
 * This file owns all the game state that needs to survive across modes and
 * page reloads: how much XP the player has, which species they've collected,
 * their daily streak, the global biosphere meter, and various stats.
 *
 * It uses a React pattern called "Context" to share that state with every
 * component in the app without having to pass it as props through every layer.
 *
 * HOW IT WORKS:
 *   1. <GameStateProvider> wraps the whole app (see App.jsx).
 *   2. Inside the provider, we keep state in a useLocalStorage hook so it
 *      persists across reloads.
 *   3. The provider exposes both the state values AND a set of functions
 *      ("actions") that mutate the state — recordSwipe, recordQuiz, etc.
 *   4. Any descendant component calls useGameState() to grab whatever it needs.
 *
 * Think of this file as a tiny in-app database. Components don't write to
 * state directly; they call action functions, and those functions know how
 * to update the state correctly.
 */

// React context lets us share data across the component tree without prop drilling.
//   - createContext: makes a new context "channel"
//   - useContext: subscribes a component to that channel
//   - useMemo: caches a computed value so it only recomputes when its inputs change
//   - useCallback: caches a function reference so child components don't re-render
//                  every time the parent re-renders (referential stability)
//   - useEffect: runs a function after render (for side effects — here, evaluating
//                certificate predicates whenever state changes)
import { createContext, useContext, useMemo, useCallback, useEffect } from 'react';

// Our own custom hook for state that persists to localStorage.
import { useLocalStorage } from '../hooks/useLocalStorage';

// The species catalog — predicates that reason about biome coverage need this.
import { SPECIES } from '../data/species';

// Certificate definitions and the pure evaluator. The provider re-runs the
// evaluator after state changes and grants any newly-true certs.
import { evaluateCertificates } from '../data/certificates';

/**
 * The shape of game state. Documented here so it's easy to see what fields
 * exist without having to read every action function.
 *
 * State shape:
 *   xp:                  number — total XP earned, drives "Field Level"
 *   sandDollars:         number — soft currency, earned alongside XP across
 *                        all modes. Spent in the (future) shop on
 *                        conservation actions. Mirrors XP roughly 1:1 by
 *                        design — players don't have to think about two
 *                        separate progress curves.
 *   streak:              { count, lastDay } — daily streak tracker
 *   collected:           { [speciesId]: { firstSeenAt, encounters, mastery } }
 *                        mastery rises with correct quiz answers; powers the
 *                        "fully documented" milestone shown in the Habitat view.
 *   survival:            number 0–100 — represents the global biosphere meter.
 *                        Wrong answers in Quiz tick this down; right answers
 *                        tick it up. The Survive mode also reads/writes it.
 *   stats:               running totals across all play sessions, useful for
 *                        certificate predicates and the eventual stats screen.
 *   earnedCertificates:  { [certId]: timestamp } — paper artifacts the player
 *                        has earned. Granted by a useEffect that re-runs every
 *                        certificate predicate after each state change. Once
 *                        granted, never revoked.
 *   onboarded:           boolean — has the user finished the intro flow?
 */
const initialState = {
  xp: 0,
  sandDollars: 0,
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
    surviveRunsWon: 0,
    surviveRunsLost: 0,
  },
  earnedCertificates: {},
  onboarded: false,
};

// Create the context. The argument (`null` here) is the default value used
// only when a component calls useGameState() OUTSIDE of a <GameStateProvider>.
// We never want that to happen, so the value here doesn't really matter — our
// useGameState() hook below throws an error in that case.
const GameStateContext = createContext(null);

// --- Level curve ---------------------------------------------------------
//
// XP thresholds for each level. Index 0 = level 1 (Rookie, 0 XP), index 1 =
// level 2 (Tracker, 50 XP), and so on. The curve is gradual at the start so
// new players feel constant progress, and steeper later so high levels feel
// earned. Tuning these numbers is one of the levers we'll pull when balancing
// the points economy.
const LEVEL_THRESHOLDS = [
  0, 50, 150, 350, 700, 1200, 2000, 3200, 5000, 8000,
];

// Names for each level. Keeps the field-guide voice — these are real-ish
// scientific roles, not generic gamer ranks like "Bronze" or "Platinum."
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

/**
 * Given a player's XP, figure out:
 *   - what level they're at
 *   - what the level is called
 *   - how much progress they've made toward the next level (0–1)
 *   - how much XP until next level
 *   - whether they've hit the cap (no more levels above)
 *
 * Exported because the Onboarding component (and others) want to display
 * level info without going through the full context.
 */
export function levelFromXP(xp) {
  // Walk through the thresholds and find the highest one we've passed.
  let level = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i;
  }

  // Where the current level starts in XP terms.
  const current = LEVEL_THRESHOLDS[level];

  // Where the next level starts. The `??` operator returns `null` if the
  // left side is undefined — which happens when we're at the top level and
  // there's no entry past us in the array.
  const next = LEVEL_THRESHOLDS[level + 1] ?? null;

  // Progress as a fraction (0–1). If we're at the cap, progress is "full."
  const progress = next ? (xp - current) / (next - current) : 1;

  return {
    level: level + 1, // human-friendly: levels start at 1, not 0
    name: LEVEL_NAMES[level],
    xpInLevel: xp - current,
    xpToNext: next ? next - xp : 0,
    progress,
    capped: !next,
  };
}

// --- Helpers -------------------------------------------------------------

/**
 * Get today's date as 'YYYY-MM-DD' in the user's local timezone-ish
 * representation (actually UTC date, but it's stable enough for streak
 * tracking and avoids timezone landmines).
 */
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Update the daily streak based on today's date and when the user last played.
 *
 * Three cases:
 *   1. They already played today → no change
 *   2. They played yesterday → streak count goes up by 1
 *   3. They missed a day (or this is their first session) → streak resets to 1
 */
function tickStreak(streak) {
  const today = todayKey();

  // Case 1: already counted today. Bail without changes.
  if (streak.lastDay === today) return streak;

  // Compute "yesterday" by subtracting 24 hours' worth of milliseconds from now.
  // 86400000 = 24 * 60 * 60 * 1000.
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Case 2: they played yesterday — extend the streak.
  if (streak.lastDay === yesterday) {
    return { count: streak.count + 1, lastDay: today };
  }

  // Case 3: gap of at least one day, or first session ever. Streak starts at 1.
  return { count: 1, lastDay: today };
}

// --- Provider ------------------------------------------------------------

/**
 * GameStateProvider — wraps the app and provides game state to descendants.
 *
 * The `{ children }` prop is React's way of letting a component receive
 * whatever JSX is nested inside it. So when App.jsx writes:
 *   <GameStateProvider>
 *     <AppShell />
 *   </GameStateProvider>
 * ...AppShell becomes `children` here.
 */
export function GameStateProvider({ children }) {
  // The single source of truth. Everything in the app eventually reads from
  // or writes to this. We use 'nemox-state-v1' as the storage key — the v1
  // suffix lets us bump the schema later without breaking existing players
  // (we'd just use a new key and migrate from the old one).
  const [state, setState] = useLocalStorage('nemox-state-v1', initialState);

  /**
   * updateState — internal helper used by every action below.
   *
   * Takes a "mutator" function: a function that gets a copy of current state,
   * makes its changes, and returns the new state. We always start from a
   * shallow copy (`{ ...prev }`) so we don't accidentally mutate the
   * previous state object — React relies on reference identity to detect
   * changes, and mutating in place breaks that.
   *
   * Wrapped in useCallback so the function reference stays stable across
   * renders — needed because the action functions below depend on it, and
   * if it changed every render, all of them would too, breaking
   * referential equality for any consumer that depends on them.
   */
  const updateState = useCallback(
    (mutator) => {
      // setState here accepts a function. React calls our function with the
      // most recent state and uses whatever we return as the new state. This
      // is safer than `setState(mutator(state))` because `state` could be
      // stale if multiple updates happen in rapid succession.
      setState((prev) => {
        const next = mutator({ ...prev });
        return next;
      });
    },
    [setState],
  );

  /**
   * Certificate evaluator effect.
   *
   * Runs after every render where `state` changed. Re-evaluates every
   * certificate predicate against the current state and merges any newly-
   * earned certs into `state.earnedCertificates`.
   *
   * IMPORTANT DESIGN POINTS
   *  - Grants only. We never remove a cert here, even if a predicate flickers
   *    false (e.g. a hypothetical "data migration" that resets a stat).
   *    Earning is permanent.
   *  - Idempotent. If no new certs qualify, we don't call setState — that's
   *    what prevents an infinite render loop. The check is a simple "do we
   *    have at least one new key?"
   *  - Pure evaluator. The certificates module exports `evaluateCertificates`
   *    as a pure function. This effect is the only place that mutates state
   *    based on its result; everything else can call the evaluator for
   *    read-only purposes.
   *
   * The dep array contains `state` directly. That means this effect re-runs
   * after every state change — even ones that can't possibly grant a cert
   * (like flipping `onboarded`). That's fine: the evaluator is cheap (under
   * twenty predicates against a small state object) and the no-new-grants
   * early return makes those calls free.
   */
  useEffect(() => {
    const candidate = evaluateCertificates(state, SPECIES);
    const current = state.earnedCertificates ?? {};

    // Find any cert ids in `candidate` that aren't already in `current`.
    // for...in would also work; for...of with Object.keys gives us a clearer
    // intent (we're iterating ids, not enumerating object props).
    const newlyEarned = {};
    let hasAny = false;
    for (const id of Object.keys(candidate)) {
      if (!(id in current)) {
        newlyEarned[id] = candidate[id];
        hasAny = true;
      }
    }

    // No new grants → bail. Crucial: without this check we'd loop forever,
    // because every setState would re-trigger this effect.
    if (!hasAny) return;

    setState((prev) => ({
      ...prev,
      earnedCertificates: { ...(prev.earnedCertificates ?? {}), ...newlyEarned },
    }));
  }, [state, setState]);

  /**
   * recordSwipe — called when the user swipes a species card in Swipe mode.
   *
   * @param speciesId — the id of the species they swiped
   * @param kept      — true if they swiped right (added to collection),
   *                    false if they swiped left (passed)
   *
   * Earnings (right-swipes only): +25 XP and +25 Sand Dollars for a first-time
   * discovery, +5 XP and +5 SD for a re-encounter. The 1:1 mirror is
   * intentional — a single mental model for "how much did that just give me."
   * If we ever want SD to diverge from XP (a 2x SD weekend, a "double XP from
   * quizzes" event), that lives here, not in the consuming modes.
   */
  const recordSwipe = useCallback(
    (speciesId, kept) => {
      updateState((s) => {
        // Increment the swipe counter regardless of direction.
        s.stats = { ...s.stats, swipes: s.stats.swipes + 1 };

        if (kept) {
          // They swiped right — add to collection (or update existing entry).
          const existing = s.collected[speciesId];
          s.collected = {
            ...s.collected,
            [speciesId]: existing
              ? { ...existing, encounters: existing.encounters + 1 }
              : { firstSeenAt: Date.now(), encounters: 1, mastery: 0 },
          };

          // First-time discovery is worth more XP than re-encountering. This
          // shapes player behavior: encourages exploring new species over
          // grinding the same one repeatedly.
          const reward = existing ? 5 : 25;
          s.xp = s.xp + reward;
          s.sandDollars = s.sandDollars + reward;
        }

        // Either way, the user did something today, so update the streak.
        s.streak = tickStreak(s.streak);
        return s;
      });
    },
    [updateState],
  );

  /**
   * recordSpeedID — called when the user answers a Speed-ID round.
   * Right answers grant XP, Sand Dollars (+10 each), and increase mastery
   * on the species; wrong answers just count toward the stats.
   */
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
          s.sandDollars = s.sandDollars + 10;

          // Bump mastery if we already have this species. Math.min ensures
          // mastery never exceeds 100 (the "fully documented" threshold).
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

  /**
   * recordQuiz — called when the user answers a Quiz question.
   * Quiz mastery gains are bigger than Speed-ID (12 vs 8) because quiz
   * questions test deeper knowledge and we want to reward that. Sand Dollar
   * earnings (+15) are also higher than Speed-ID for the same reason.
   */
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
          s.sandDollars = s.sandDollars + 15;
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

  /**
   * recordSurvivalLoss / recordSurvivalGain — adjust the biosphere meter.
   *
   * Math.max(0, ...) and Math.min(100, ...) clamp the value to the 0–100
   * range. The Quiz mode calls these when the player gets answers right or
   * wrong; the Survive mode will eventually call them for events.
   */
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

  /**
   * recordSurviveRunComplete — called once at the end of a Survive run.
   *
   * Until this action existed, finishing a Survive run granted nothing to
   * XP or Sand Dollars — the only thing that moved was the global biosphere
   * meter via recordSurvivalGain/Loss. That meant a six-event run rewarded
   * the player less than two correct quiz questions, which made Survive feel
   * unrewarding despite being the most emotionally heavy mode.
   *
   * @param won — true if the player completed all seasons with population > 0,
   *              false if the species died out.
   *
   * Both outcomes grant *something*. A loss isn't a punishment — Survive is
   * about real conservation pressures and most extinctions weren't avoidable
   * by the player. The win/loss split is +60 / +15 to make a win feel earned
   * without making a loss feel like wasted time. Stats counters (runsWon /
   * runsLost) are bumped so future certificate predicates can read them.
   */
  const recordSurviveRunComplete = useCallback(
    (won) => {
      updateState((s) => {
        const reward = won ? 60 : 15;
        s.xp = s.xp + reward;
        s.sandDollars = s.sandDollars + reward;
        s.stats = {
          ...s.stats,
          surviveRunsWon: s.stats.surviveRunsWon + (won ? 1 : 0),
          surviveRunsLost: s.stats.surviveRunsLost + (won ? 0 : 1),
        };
        s.streak = tickStreak(s.streak);
        return s;
      });
    },
    [updateState],
  );

  /**
   * markOnboarded — called when the user finishes the onboarding flow.
   * Flips the flag and bumps the session count.
   */
  const markOnboarded = useCallback(() => {
    updateState((s) => {
      s.onboarded = true;
      s.stats = { ...s.stats, sessions: s.stats.sessions + 1 };
      return s;
    });
  }, [updateState]);

  /**
   * reset — wipes all progress. Used by a "start over" button somewhere in
   * settings (currently no UI surface, but keeping the action ready). When
   * we add settings, this gets a confirmation dialog and a "are you sure"
   * before firing.
   */
  const reset = useCallback(() => {
    setState(initialState);
  }, [setState]);

  // --- Derived values ------------------------------------------------------
  //
  // These are computed from state rather than stored. They use useMemo so
  // they only recompute when their inputs actually change — saves work on
  // every render of every consumer.

  // Level info derived from XP.
  const level = useMemo(() => levelFromXP(state.xp), [state.xp]);

  // How many distinct species the player has collected. Object.keys gives us
  // an array of all the species IDs in `collected`, and .length counts them.
  const collectedCount = useMemo(() => Object.keys(state.collected).length, [state.collected]);

  // The full bundle that consumers will receive when they call useGameState().
  // We spread `state` in first to get all the raw values, then add derived
  // values and action functions on top.
  //
  // The `sandDollars` and `stats` defaults below are defensive: a player
  // whose localStorage was written before these fields existed will load a
  // state object that's missing them. Without these fallbacks the HUD chip
  // would render `undefined` and certificate predicates that read stats
  // counters would crash. The `?? 0` and `?? {}` operators only kick in when
  // the value is null or undefined, so they're harmless when the fields exist.
  const value = {
    ...state,
    sandDollars: state.sandDollars ?? 0,
    earnedCertificates: state.earnedCertificates ?? {},
    stats: {
      swipes: 0,
      ids: 0,
      idsCorrect: 0,
      quizCorrect: 0,
      quizWrong: 0,
      sessions: 0,
      surviveRunsWon: 0,
      surviveRunsLost: 0,
      ...(state.stats ?? {}),
    },
    level,
    collectedCount,
    recordSwipe,
    recordSpeedID,
    recordQuiz,
    recordSurvivalLoss,
    recordSurvivalGain,
    recordSurviveRunComplete,
    markOnboarded,
    reset,
  };

  // Render the context provider with our value, with `children` (the rest
  // of the app) inside it.
  return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>;
}

/**
 * useGameState — the hook every component uses to read game state.
 *
 * Why have this wrapper instead of telling people to call useContext directly?
 *   1. It hides the GameStateContext export so callers don't accidentally
 *      bypass the provider.
 *   2. It throws a clear error if called outside the provider — much better
 *      than getting a confusing "cannot read property of null" later.
 */
export function useGameState() {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error('useGameState must be used within GameStateProvider');
  return ctx;
}
