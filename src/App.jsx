/**
 * App.jsx — the top-level component.
 *
 * Two responsibilities:
 *   1. Wrap the entire app in <GameStateProvider> so any component anywhere in
 *      the tree can read or write shared game state (points, biosphere, the
 *      species you've collected, whether onboarding is complete).
 *   2. Decide which mode to show right now (Swipe, Speed-ID, Quiz, Habitat,
 *      Survive) based on which tab the user has tapped in the bottom nav.
 *
 * Everything else (the HUD at the top, the bottom nav, the toast layer for
 * pop-up messages) stays mounted at all times — only the middle <main>
 * region swaps when the user changes mode.
 */

// `useState` is the React hook for "remember a value between renders." When
// the value changes, React re-runs this component to reflect the new value
// in the UI. Every interactive piece of UI in React boils down to useState
// (or its bigger sibling, useReducer).
import { useState } from 'react';

// GameStateProvider is a "context provider" — a React pattern that lets us
// share state across many components without having to pass props through
// every layer of the tree. We wrap our whole app in it once, and then
// any descendant can call useGameState() to read/update the shared state.
import { GameStateProvider, useGameState } from './hooks/useGameState';

// The persistent UI chrome — these stay on screen no matter what mode is active.
import { HUD } from './components/HUD';
import { BottomNav } from './components/BottomNav';
import { Onboarding } from './components/Onboarding';
import { ToastLayer } from './components/ToastLayer';

// The five gameplay modes. Each is a self-contained screen. A sixth — Explore —
// is the new systems-view mode added in this commit: a Reigns-style decision
// sim that puts the player at the policy desk where conservation tradeoffs
// land. AGENTS.md plans for it explicitly under "World Simulation Rules."
import { SwipeMode } from './modes/SwipeMode';
import { SpeedIDMode } from './modes/SpeedIDMode';
import { QuizMode } from './modes/QuizMode';
import { HabitatMode } from './modes/HabitatMode';
import { SurviveMode } from './modes/SurviveMode';
import { ExploreMode } from './modes/ExploreMode';

// Importing CSS files in JS is a Vite/webpack feature: Vite sees these imports
// and bundles the CSS into the final stylesheet. The order matters —
// global.css defines the design tokens that app.css and all component CSS
// files use, so it has to come first.
import './styles/global.css';
import './styles/app.css';

/**
 * AppShell — the inner component that decides what to render.
 *
 * It's split out from <App> below because it needs to call useGameState(), and
 * useGameState() only works inside a <GameStateProvider>. So <App> sets up the
 * provider, and <AppShell> lives inside it.
 */
function AppShell() {
  // Pull `onboarded` out of the shared game state. The first time the user
  // opens the app, this is false and we show the onboarding flow. After they
  // finish onboarding it flips to true and persists in localStorage forever.
  const { onboarded } = useGameState();

  // Local state for which mode is currently active. We start everyone on the
  // Swipe mode — it's the easiest entry point and what onboarding hands off
  // to. `setMode` is the function we call to change it; calling it triggers
  // a re-render with the new value.
  const [mode, setMode] = useState('swipe');

  // If the user hasn't completed onboarding yet, that's the only thing they see.
  // No HUD, no bottom nav, no modes — just the onboarding flow taking the full
  // screen until they finish.
  if (!onboarded) {
    return (
      <div className="app-shell">
        <Onboarding />
      </div>
    );
  }

  // Pick which mode component to render based on the current `mode` value.
  //
  // The `key` prop here is a React technique: when the key changes between
  // renders, React unmounts the old component completely and mounts a fresh
  // one, instead of trying to reuse the existing instance. We use it here so
  // that switching tabs gives every mode a clean slate — timers reset,
  // animations replay, internal state resets to its initial values.
  let content = null;
  switch (mode) {
    case 'swipe':   content = <SwipeMode key="swipe" />; break;
    case 'id':      content = <SpeedIDMode key="id" />; break;
    case 'quiz':    content = <QuizMode key="quiz" />; break;
    case 'habitat': content = <HabitatMode key="habitat" />; break;
    case 'survive': content = <SurviveMode key="survive" />; break;
    case 'explore': content = <ExploreMode key="explore" />; break;
    // Fallback in case `mode` somehow becomes an unknown value. Defensive
    // coding — should never hit this, but if it does we don't want a blank screen.
    default:        content = <SwipeMode key="swipe" />;
  }

  // The actual render: HUD on top, the chosen mode in the middle, bottom nav
  // at the bottom, and the toast layer floating over everything for popups.
  return (
    <div className="app-shell">
      <HUD />
      <main className="app-main">{content}</main>
      <BottomNav active={mode} onChange={setMode} />
      <ToastLayer />
    </div>
  );
}

/**
 * App — the exported root component.
 *
 * `export default` means "this is the main thing this file exports." When
 * main.jsx writes `import App from './App.jsx'`, it gets this function.
 *
 * We wrap AppShell in GameStateProvider so the shared state context is
 * available everywhere inside the tree.
 */
export default function App() {
  return (
    <GameStateProvider>
      <AppShell />
    </GameStateProvider>
  );
}
