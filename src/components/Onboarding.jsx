import { useGameState } from '../hooks/useGameState';
import './onboarding.css';

/**
 * Onboarding — single splash screen. No quiz, no questions.
 * Sets tone, then steps out of the way.
 *
 * Voice notes (per ProjectNEMO style guide):
 *   - Earnest, curious, honest, specific. Not preachy, not hyped.
 *   - No "FIELD UNIT" mission-control LARP, no all-caps screaming.
 *   - The emphasis word (`attention`) carries the personality;
 *     everything else gets out of the way.
 */
export function Onboarding() {
  const { markOnboarded } = useGameState();

  return (
    <div className="onboarding">
      <div className="onboarding-content">
        <div className="onboarding-tag">ProjectNEMO · Field Edition</div>

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

        <div className="onboarding-modes">
          <div>Swipe</div>
          <div>Speed-ID</div>
          <div>Quiz</div>
          <div>Habitat</div>
          <div>Survive</div>
        </div>

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
