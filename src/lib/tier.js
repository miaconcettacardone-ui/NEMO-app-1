/**
 * tier.js — reading-tier helpers.
 *
 * NEMO X content can be authored in three reading tiers:
 *   simple   — short sentences, no jargon. Roughly age 5–11.
 *   standard — high-school-ish reading. The default.
 *   expert   — technical terms welcome. Adults who want depth.
 *
 * THE MIGRATION TRICK
 * Existing data fields are plain strings. New ones can be objects shaped
 * { simple, standard, expert }. The pickTier() helper accepts BOTH:
 *   - a plain string → returned as-is (existing content keeps working)
 *   - a tier object → the right tier's string is picked, with sensible
 *     fallbacks if a tier is missing
 * This lets us migrate species/scenarios/certs one file at a time without
 * having to rewrite every consumer in the same commit. Components that read
 * `species.hook` just wrap the read in pickTier(species.hook, tier) and they
 * work for both old and new shapes.
 *
 * INFERRING TIER FROM ONBOARDING ANSWERS
 * We collect three signals: age band, schooling level, and an optional 5-Q
 * placement quiz score. inferTierFromOnboarding combines them into the most
 * likely tier. The user can always override afterwards from the settings
 * surface in Credentials — this is a starting point, not a sentence.
 */

// Stable list of tiers in difficulty order. Used by the picker UI and as
// the canonical set when validating saved values.
export const READING_TIERS = ['simple', 'standard', 'expert'];

// Display labels for each tier. Capitalized for UI; ids stay lowercase.
export const TIER_LABELS = {
  simple: 'Simple',
  standard: 'Standard',
  expert: 'Expert',
};

// One-line descriptions shown on the picker. Written for adults setting
// the level for themselves OR for a child — voice is neutral, not patronizing.
export const TIER_DESCRIPTIONS = {
  simple: 'Short sentences. Plain words. Good for younger readers.',
  standard: 'Everyday English. The default for most readers.',
  expert: 'Real ecological terms. For curious adults and science folks.',
};

/**
 * pickTier — return the tier-appropriate version of a content field.
 *
 * @param content — either a plain string OR an object shaped
 *                  { simple?, standard?, expert? }. Missing tiers fall back
 *                  to standard, then to whatever exists, then to the empty
 *                  string. We never throw — content systems break loudly
 *                  enough; this one fails quietly.
 * @param tier    — 'simple' | 'standard' | 'expert'. Anything else is
 *                  treated as 'standard'.
 *
 * Returns the string to display. Always a string, never undefined.
 */
export function pickTier(content, tier) {
  // Null / undefined → empty string. Defensive: a missing field shouldn't
  // crash the renderer.
  if (content == null) return '';

  // Plain strings pass through unchanged. This is what makes the migration
  // gradual — every existing field continues to render correctly.
  if (typeof content === 'string') return content;

  // From here on we know it's an object-ish thing. Validate the tier
  // argument and fall back to standard if it's wrong or missing.
  const safeTier = READING_TIERS.includes(tier) ? tier : 'standard';

  // First-pass: the requested tier.
  if (typeof content[safeTier] === 'string' && content[safeTier].length > 0) {
    return content[safeTier];
  }

  // Fall back to standard — the canonical default.
  if (typeof content.standard === 'string' && content.standard.length > 0) {
    return content.standard;
  }

  // Fall back to whichever tier is defined. We pick simple before expert
  // because if standard is missing, more readers can handle simple than
  // can handle expert.
  if (typeof content.simple === 'string' && content.simple.length > 0) {
    return content.simple;
  }
  if (typeof content.expert === 'string' && content.expert.length > 0) {
    return content.expert;
  }

  // Nothing usable. Empty string is safer than undefined (rendered as
  // "undefined" in JSX) or null (warning in some React contexts).
  return '';
}

/**
 * inferTierFromOnboarding — combine the three onboarding signals into a
 * starting tier.
 *
 * @param age        — 'kid' | 'teen' | 'adult' (the age picker's answer)
 * @param schooling  — 'pre-hs' | 'basic' | 'science' (the schooling picker)
 * @param quizScore  — number 0–5, or null if the user skipped the quiz.
 *
 * Decision logic, in plain English:
 *   1. If the user took the quiz, we start with the quiz tier:
 *        0–1 right → simple, 2–3 → standard, 4–5 → expert
 *   2. We compute a tier from the picker answers (age + schooling) the
 *      same way: the lower of the two signals dominates. A 7-year-old
 *      with a science background still gets simple; an adult who picked
 *      "less than high school" gets simple regardless of age.
 *   3. We return the GENTLER of {quiz tier, picker tier} so we don't
 *      surprise a kid with technical text. They can always level up later.
 *
 * A note on philosophy: it's much worse to overestimate someone's tier
 * than to underestimate it. Bored is recoverable; lost is not.
 */
export function inferTierFromOnboarding({ age, schooling, quizScore }) {
  // Picker signal — start by mapping each axis to a tier.
  const ageTier =
    age === 'kid' ? 'simple' :
    age === 'teen' ? 'standard' :
    'standard'; // adult default

  const schoolingTier =
    schooling === 'pre-hs' ? 'simple' :
    schooling === 'basic' ? 'standard' :
    schooling === 'science' ? 'expert' :
    'standard';

  // The lower of the two — see the function comment for why.
  const pickerTier = lowerTier(ageTier, schoolingTier);

  // No quiz? Use the picker.
  if (quizScore == null) return pickerTier;

  // Quiz signal.
  const quizTier =
    quizScore <= 1 ? 'simple' :
    quizScore <= 3 ? 'standard' :
    'expert';

  // Lower of {quiz, picker} — gentler is better.
  return lowerTier(pickerTier, quizTier);
}

/**
 * lowerTier — return the lower of two tiers (simple < standard < expert).
 * Local helper so we don't repeat the index lookup logic.
 */
function lowerTier(a, b) {
  const ia = READING_TIERS.indexOf(a);
  const ib = READING_TIERS.indexOf(b);
  // Math.min on the indexes; READING_TIERS[index] for the result. Defensive
  // fallback to standard if either input is unrecognized.
  if (ia < 0 || ib < 0) return 'standard';
  return READING_TIERS[Math.min(ia, ib)];
}

/**
 * isValidTier — guard for runtime checks. Used by the setReadingTier action
 * to reject bad values.
 */
export function isValidTier(tier) {
  return READING_TIERS.includes(tier);
}
