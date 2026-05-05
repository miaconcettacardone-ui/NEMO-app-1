import { useState } from 'react';
import { GameStateProvider, useGameState } from './hooks/useGameState';
import { HUD } from './components/HUD';
import { BottomNav } from './components/BottomNav';
import { Onboarding } from './components/Onboarding';
import { ToastLayer } from './components/ToastLayer';
import { SwipeMode } from './modes/SwipeMode';
import { SpeedIDMode } from './modes/SpeedIDMode';
import { QuizMode } from './modes/QuizMode';
import { HabitatMode } from './modes/HabitatMode';
import { SurviveMode } from './modes/SurviveMode';
import './styles/global.css';
import './styles/app.css';

function AppShell() {
  const { onboarded } = useGameState();
  const [mode, setMode] = useState('swipe');

  if (!onboarded) {
    return (
      <div className="app-shell">
        <Onboarding />
      </div>
    );
  }

  let content = null;
  // Each mode is keyed by `mode` so React unmounts/remounts on switch — gives
  // every tab a clean slate (timers reset, animations replay, deck reshuffles
  // when user taps a tab a second time intentionally is fine since users
  // expect tab taps to feel responsive). Memoization isn't worth the
  // complexity here.
  switch (mode) {
    case 'swipe':   content = <SwipeMode key="swipe" />; break;
    case 'id':      content = <SpeedIDMode key="id" />; break;
    case 'quiz':    content = <QuizMode key="quiz" />; break;
    case 'habitat': content = <HabitatMode key="habitat" />; break;
    case 'survive': content = <SurviveMode key="survive" />; break;
    default:        content = <SwipeMode key="swipe" />;
  }

  return (
    <div className="app-shell">
      <HUD />
      <main className="app-main">{content}</main>
      <BottomNav active={mode} onChange={setMode} />
      <ToastLayer />
    </div>
  );
}

export default function App() {
  return (
    <GameStateProvider>
      <AppShell />
    </GameStateProvider>
  );
}
