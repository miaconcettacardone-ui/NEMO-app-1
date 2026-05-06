/**
 * HUD.jsx — the top-of-screen status bar.
 *
 * Shows the player's current rank, XP progress, daily streak, and the global
 * biosphere meter. Visible in every mode (the parent App.jsx renders it
 * outside the mode swap, so it persists).
 *
 * The Field Rank meter is also the entry point to the Credentials overlay:
 * tap it and a fullscreen modal slides in showing every certificate (earned
 * and unearned). That keeps the meta-loop visible without claiming a sixth
 * slot on the bottom nav (Explore takes that slot).
 *
 * This component reads from game state but never writes to it — all changes
 * come from the gameplay modes calling action functions on useGameState.
 */

import { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { Credentials } from './Credentials';
import './hud.css';

export function HUD() {
  // Pull the pieces of state we display. We don't need any of the action
  // functions (recordSwipe etc.) here, so we don't destructure them.
  const { level, collectedCount, streak, survival, sandDollars } = useGameState();

  // Local state for the Credentials overlay. Lives here (not in App or in
  // useGameState) because no other component needs to know about it — only
  // the HUD opens it, and only the overlay closes itself.
  const [credsOpen, setCredsOpen] = useState(false);

  return (
    // Fragment (`<>...</>`) groups the header and the overlay without
    // adding a DOM wrapper. The HUD itself stays a sticky header; the
    // overlay is rendered as a sibling so its `position: fixed` covers
    // the whole viewport regardless of where the HUD sits.
    <>
    {/* <header> is the semantic HTML element for header content (top of page,
        top of section, etc.). Better for accessibility than <div>. */}
    <header className="hud">
      {/* --- Top row: brand + chips ------------------------------------- */}
      <div className="hud-row hud-row--top">
        <div className="hud-brand">
          <span className="hud-logo">▶</span>
          <span className="hud-title">NEMO<span className="hud-x">X</span></span>
        </div>

        {/*
          The two chips on the right share a row. Sand Dollars sits to the
          left of the streak chip — left-to-right reading order goes
          "currency, then streak," which mirrors how players actually think
          about their progress. The `title` attributes show tooltips on
          hover (desktop only); mobile users get the visual which is
          self-explanatory.
        */}
        <div className="hud-chip-group">
          <div className="hud-chip" title="Sand Dollars">
            <span className="hud-chip-mark hud-chip-mark--sd">◐</span>
            <span className="hud-chip-num">{sandDollars}</span>
          </div>

          <div className="hud-chip" title="Daily streak">
            <span className="hud-chip-mark hud-chip-mark--streak">●</span>
            <span className="hud-chip-num">{streak.count}</span>
          </div>
        </div>
      </div>

      {/* --- Meters row: rank progress + biosphere health ---------------- */}
      <div className="hud-row hud-row--meters">

        {/* Rank meter — XP progress to the next field rank. Also the
            entry point to the Credentials overlay. We use a <button> here
            (not a <div>) so it's keyboard-reachable and announces itself
            to screen readers. The styling in hud.css strips the default
            button chrome to keep the visual identical to a non-clickable
            meter. */}
        <button
          type="button"
          className="hud-meter hud-meter--button"
          title="Field Rank — view credentials"
          onClick={() => setCredsOpen(true)}
          aria-label={`Field rank ${level.name}. Open credentials.`}
        >
          <div className="hud-meter-label">
            <span className="eyebrow">Field rank</span>
            <span className="hud-rank">{level.name}</span>
          </div>

          {/*
            Inline `style` prop sets CSS directly on the element. We use it
            here because the width is dynamic (depends on player progress) and
            CSS can't compute that without a custom property handoff. For a
            static value, a class would be better.

            level.progress is 0–1, so we multiply by 100 to get a percentage.
            Template literal builds the string, e.g. "47.5%".
          */}
          <div className="hud-meter-bar">
            <div
              className="hud-meter-fill hud-meter-fill--xp"
              style={{ width: `${level.progress * 100}%` }}
            />
          </div>

          <div className="hud-meter-foot mono">
            <span>Lv {level.level}</span>
            {/*
              Conditional rendering with the ternary operator: if `capped` is
              true, show "Top rank"; otherwise, show how much XP to next level.
            */}
            <span>{level.capped ? 'Top rank' : `${level.xpToNext} XP to next`}</span>
          </div>
        </button>

        {/* Biosphere meter — the global ecosystem health 0–100. */}
        <div className="hud-meter" title="Ecosystem health">
          <div className="hud-meter-label">
            <span className="eyebrow">Biosphere</span>

            {/*
              Color-coded by health: green/forest above 60, amber 30–60,
              clay/critical below 30. Inline style because the color depends
              on the value — a class would require five different classes
              and a JS function to pick one.
            */}
            <span
              className="hud-rank"
              style={{
                color:
                  survival > 60 ? 'var(--status-secure)' :
                  survival > 30 ? 'var(--status-watch)' :
                  'var(--status-critical)',
              }}
            >
              {survival}%
            </span>
          </div>

          <div className="hud-meter-bar">
            <div
              className="hud-meter-fill hud-meter-fill--bio"
              style={{
                width: `${survival}%`,
                background:
                  survival > 60 ? 'var(--status-secure)' :
                  survival > 30 ? 'var(--status-watch)' :
                  'var(--status-critical)',
              }}
            />
          </div>

          <div className="hud-meter-foot mono">
            <span>{collectedCount} documented</span>
            {/*
              Nested ternary picks one of five status labels. Reads weird at
              first but is just chained if/else: 100→Stable, 0→Collapsed,
              >60→Healthy, >30→Stressed, else Critical.
            */}
            <span>{survival === 100 ? 'Stable' : survival === 0 ? 'Collapsed' : survival > 60 ? 'Healthy' : survival > 30 ? 'Stressed' : 'Critical'}</span>
          </div>
        </div>
      </div>
    </header>

    {/* The Credentials overlay. Rendered as a sibling so its fixed
        positioning covers the whole viewport. The component itself returns
        null when `open` is false, so this is cheap when closed. */}
    <Credentials open={credsOpen} onClose={() => setCredsOpen(false)} />
    </>
  );
}
