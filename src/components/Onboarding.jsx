/**
 * Onboarding.jsx — the first-time-user splash screen.
 *
 * Shown only when `onboarded` is false in game state. After the user taps
 * "Begin," `markOnboarded()` flips the flag and the user is dropped into the
 * default mode (Swipe). Onboarded is persisted via localStorage, so this
 * screen is shown exactly once per device per install.
 *
 * Voice notes (per ProjectNEMO style guide):
 *   - Earnest, curious, honest, specific. Not preachy, not hyped.
 *   - No "FIELD UNIT" mission-control LARP, no all-caps screaming.
 *   - The emphasis word (`attention`) carries the personality;
 *     everything else gets out of the way.
 */

import { useGameState } from '../hooks/useGameState';
import './onboarding.css';

export function Onboarding() {
  // We only need the action that flips the onboarded flag. None of the
  // state values are read here — this screen has no dynamic content.
  const { markOnboarded } = useGameState();

  return (
    <div className="onboarding">
      <div className="onboarding-content">
        {/* Brand tag at the top — small, quiet, sets context. */}
        <div className="onboarding-tag">ProjectNEMO · Field Edition</div>

        {/*
          The headline is the editorial moment. Playfair Display, big, with
          a colored emphasis word. The <br /> tags force line breaks for
          rhythm — we want each phrase on its own line for cadence, not
          flowing text.
        */}
        <h1 className="onboarding-headline">
          Wildlife,<br />
          at the speed of<br />
          <span className="onboarding-emph">attention.</span>
        </h1>

        <div className="onboarding-blurb">
          A living field guide built for short attention and long curiosity.
          Swipe through species you've never met. Test what's stuck. Document
          what's out there before you realize you've learned it.
        </div>

        {/*
          A row of mode names — preview of what's inside. No icons, no
          decoration. Just the words, like a TOC.
        */}
        <div className="onboarding-modes">
          <div>Swipe</div>
          <div>Speed-ID</div>
          <div>Quiz</div>
          <div>Habitat</div>
          <div>Survive</div>
        </div>

        {/*
          The single CTA. Calling markOnboarded sets onboarded=true in game
          state, which causes App.jsx to re-render and show the main UI
          instead of this screen.

          Note: `onClick={markOnboarded}` — no arrow function needed because
          we're just passing the function reference directly. We'd need an
          arrow function only if we wanted to pass arguments.
        */}
        <button className="onboarding-go" onClick={markOnboarded}>
          Begin
        </button>

        <div className="onboarding-fine">
          Every species is real. Every fact is sourced.
        </div>
      </div>
    </div>
  );
}
