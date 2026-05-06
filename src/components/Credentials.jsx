/**
 * Credentials.jsx — fullscreen overlay listing every certificate.
 *
 * Reachable from the HUD: tapping the Field Rank meter opens this overlay.
 * Per the project plan, certificates are NOT a sixth bottom-nav tab — the
 * bottom nav stays at six (with Explore taking the new slot). Putting this
 * behind the rank meter ties achievements to the player's identity ("who
 * am I as a naturalist?") rather than treating them as a feature flag in a
 * tab list.
 *
 * STRUCTURE
 *   The overlay is a fixed full-screen container with its own scrolling.
 *   The header has a back button and the player's current rank summary.
 *   The body is a list of certificate cards, sorted earned-first.
 *   Each card renders the cert's SVG art via the cert's own `render()` plus
 *   a small line of metadata.
 *
 * STATE OWNERSHIP
 *   - `open` lives in HUD (the parent), passed in as the `open` prop and
 *     closed via `onClose`.
 *   - The list of earned certs comes straight from useGameState; this
 *     component never writes state.
 */

import { CERTIFICATES, TIER_LABELS } from '../data/certificates';
import { useGameState } from '../hooks/useGameState';
import './credentials.css';

export function Credentials({ open, onClose }) {
  // Pull the data we need. `level` is the derived level info we show in the
  // header; `earnedCertificates` is the grant ledger.
  const { level, earnedCertificates } = useGameState();

  // Early return BEFORE doing other work when the overlay is closed. This
  // matters for performance (we don't want to render twelve SVGs every
  // render of the HUD) and for animation (mounting fresh on open lets the
  // CSS entry animation replay).
  if (!open) return null;

  // Sort earned-first. We DON'T mutate CERTIFICATES — that's the single
  // source of truth, exported from /data/certificates.jsx. We sort a copy.
  //
  // The compare function returns:
  //   negative → a comes before b
  //   zero    → leave order alone
  //   positive → b comes before a
  // Earned status is the primary sort; the original file order is the
  // tiebreaker (stable sorts in modern JS preserve relative order for ties).
  const sorted = [...CERTIFICATES].sort((a, b) => {
    const aEarned = a.id in earnedCertificates;
    const bEarned = b.id in earnedCertificates;
    if (aEarned === bEarned) return 0;
    return aEarned ? -1 : 1;
  });

  // Quick counts for the header summary.
  const earnedCount = Object.keys(earnedCertificates).length;
  const totalCount = CERTIFICATES.length;

  return (
    // role="dialog" + aria-modal="true" announces this as a modal overlay
    // to screen readers. onClick on the backdrop closes; clicks inside
    // .credentials-sheet stop propagation so they don't close.
    <div className="credentials-overlay" role="dialog" aria-modal="true" aria-label="Credentials">
      <div className="credentials-sheet" onClick={(e) => e.stopPropagation()}>
        {/* --- Header ---------------------------------------------------- */}
        <header className="credentials-header">
          <button
            className="credentials-close"
            onClick={onClose}
            aria-label="Close credentials"
          >
            ←
          </button>

          <div className="credentials-header-title">
            <div className="eyebrow">Credentials</div>
            <h1 className="credentials-rank">{level.name}</h1>
          </div>

          <div className="credentials-count">
            <div className="credentials-count-num">{earnedCount}<span className="credentials-count-of">/{totalCount}</span></div>
            <div className="eyebrow">Earned</div>
          </div>
        </header>

        {/* --- Cert grid -------------------------------------------------- */}
        {/*
          Single column on phones, two columns on wider viewports. Layout is
          handled in credentials.css with a CSS grid.
        */}
        <div className="credentials-grid">
          {sorted.map((cert) => {
            // Whether the player has earned this cert. We compare by `in`
            // (a key check) rather than truthy because an earned timestamp
            // of 0 — though rare — should still count as earned.
            const isEarned = cert.id in earnedCertificates;
            return (
              <article
                key={cert.id}
                // Toggle is-locked / is-earned modifiers so CSS can style
                // each state without inline conditionals.
                className={`credentials-card ${isEarned ? 'is-earned' : 'is-locked'}`}
              >
                {/* The cert's SVG art — calls the per-cert render(). */}
                <div className="credentials-card-art">
                  {cert.render()}
                </div>

                {/* Metadata strip below the art */}
                <div className="credentials-card-meta">
                  <div className="credentials-card-tier eyebrow">
                    {TIER_LABELS[cert.tier]}
                  </div>
                  <div className="credentials-card-name">{cert.name}</div>
                  <div className="credentials-card-desc">{cert.description}</div>
                </div>

                {/*
                  When locked, render a subtle veil so the art reads as
                  "preview." We intentionally don't hide it entirely — players
                  should see what's possible to earn.
                */}
                {!isEarned && <div className="credentials-card-veil" aria-hidden />}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
