/**
 * SurviveMode.jsx — the survival sim. You play AS a species through 6
 * seasons of real conservation pressures and decide how to respond to
 * each one. Survive all 6 to "stabilize"; drop to 0 population and the
 * species is archived.
 *
 * WHY THIS MODE EXISTS: it's the emotional core of NEMO X. Every event
 * here is rooted in real-world conservation history — gillnet bycatch
 * (vaquita), Australian bounties (thylacine), arctic fox displacement,
 * climate-driven sea-ice loss (polar bears). The drama is the truth.
 * That's also why the brand rules (no neon, no kinetic chrome) matter
 * here: cheap visual flash would undercut the gravity of what's being
 * shown.
 *
 * Phase machine (the run can be in exactly one of these states at a time):
 *   intro          → start screen, no run in progress
 *   playing        → an event is on screen waiting for the player's choice
 *   event-result   → choice has been made, showing the outcome + Next button
 *   win            → completed all 6 seasons with population > 0
 *   loss           → population hit 0
 *
 * Legal transitions:
 *   intro          → playing                       (player taps "Begin run")
 *   playing        → event-result | win | loss     (player picks a choice)
 *   event-result   → playing                       (player taps "Next season")
 *   win | loss     → playing                       (player taps "New run" / "Try another species")
 *   any            → intro                         (only from loss screen via "back to intro")
 */

// React hooks we need:
//   useState — hold values that the component remembers between renders
//             and that, when changed, trigger a re-render.
//   useEffect / useMemo — imported in case we need them later; not used yet.
import { useEffect, useMemo, useState } from 'react';

// Species data + the human-readable status labels (e.g. "Critically Endangered").
import { SPECIES, getById, STATUS_LABELS } from '../data/species';

// Central game state hook — used here to record XP gains/losses for the
// run's outcome so they show up in the HUD and persist via localStorage.
import { useGameState } from '../hooks/useGameState';

// The little SVG silhouette of the species.
import { SpeciesGlyph } from '../components/SpeciesGlyph';

// Mode-specific styles — imported for side effect (Vite bundles the CSS).
import './survive.css';

// ---------------------------------------------------------------------------
// EVENT BANK
// ---------------------------------------------------------------------------
// Each event is one "card" the player faces during a season. Events are
// gated by `biomes`: a rainforest species won't see a sea-ice event, etc.
// Each choice has a `delta` (population change, ±) and a `note` that
// becomes the after-action explanation — that's the teaching moment.
//
// Adding a new event = appending an object here. Keep choices honest:
// the "right" answer should map to what conservation biologists actually
// recommend, even if it's not always the highest delta.
const EVENTS = [
  {
    id: 'logging',
    label: 'Logging crews arrive at the edge of your range.',
    biomes: ['rainforest'],
    choices: [
      { text: 'Move deeper into intact forest', delta: -8, note: 'You survive — but the patch you reach is smaller, and so is your gene pool.' },
      { text: 'Stay and adapt to fragmented forest', delta: -22, note: 'Roads cut through your territory. Most don\'t make it across.' },
      { text: 'Move toward the river corridor', delta: 4, note: 'Riverside strips are often the last connected habitat. Smart move.' },
    ],
  },
  {
    id: 'drought',
    label: 'A multi-year drought hits.',
    biomes: ['rainforest', 'desert', 'tundra'],
    choices: [
      { text: 'Conserve water; reduce activity', delta: -5, note: 'You make it through. Many young don\'t.' },
      { text: 'Migrate to wetter ground', delta: 8, note: 'You find a refuge. Others without legs to move don\'t.' },
      { text: 'Stay; compete harder for resources', delta: -18, note: 'Crowded waterholes spread disease and concentrate predation.' },
    ],
  },
  {
    id: 'gillnet',
    label: 'Illegal gillnets show up in your bay.',
    biomes: ['ocean'],
    choices: [
      { text: 'Avoid the netted area', delta: -6, note: 'You avoid the nets. The nets keep being set.' },
      { text: 'Risk it — food is in there', delta: -28, note: 'This is exactly how vaquitas drown. We have only ~10 left.' },
      { text: 'Survive long enough for enforcement', delta: 12, note: 'Patrols arrived. Recovery is slow but possible.' },
    ],
  },
  {
    id: 'redfox',
    label: 'Red foxes have moved north into your range.',
    biomes: ['tundra'],
    choices: [
      { text: 'Stand your ground', delta: -22, note: 'Bigger species win these fights. You lose territory.' },
      { text: 'Retreat further north', delta: -6, note: 'Less habitat available — but you\'re still here.' },
      { text: 'Den deeper, raise smaller litters', delta: 2, note: 'A real adaptation arctic foxes use. Sustainable, just.' },
    ],
  },
  {
    id: 'climate',
    label: 'Sea ice is forming weeks later than usual.',
    biomes: ['tundra', 'ocean'],
    choices: [
      { text: 'Hunt longer in open water', delta: -10, note: 'More energy spent for less return. You\'re thinner this year.' },
      { text: 'Move to colder grounds', delta: -4, note: 'You find ice further north. Each year it\'s further still.' },
      { text: 'Switch prey species', delta: 6, note: 'Flexibility is survival. A few populations are managing this.' },
    ],
  },
  {
    id: 'fire',
    label: 'A wildfire sweeps through your habitat.',
    biomes: ['rainforest', 'desert'],
    choices: [
      { text: 'Flee to the burn line\'s edge', delta: 4, note: 'You escape. Recovery in burned areas takes years.' },
      { text: 'Shelter underground', delta: -2, note: 'Smoke is the killer, not flame. You\'re lucky.' },
      { text: 'Try to outrun it', delta: -20, note: 'Fire moves faster than most animals. This rarely works.' },
    ],
  },
  {
    id: 'poaching',
    label: 'Poachers begin operating near your range.',
    biomes: ['rainforest', 'desert', 'tundra'],
    choices: [
      { text: 'Stay clear of human paths', delta: -4, note: 'Smart, but they\'re extending into deeper habitat each year.' },
      { text: 'Become more nocturnal', delta: 2, note: 'Behavioral shifts buy time. They don\'t solve the underlying threat.' },
      { text: 'Carry on as normal', delta: -24, note: 'This is how species disappear. The thylacine had a bounty on it for decades.' },
    ],
  },
  {
    id: 'invasive',
    label: 'An invasive species is eating your eggs/young.',
    biomes: ['rainforest', 'tundra', 'ocean'],
    choices: [
      { text: 'Lay/birth in less-accessible places', delta: 4, note: 'Adaptation works — slowly. Most island species lost this race.' },
      { text: 'Wait for human intervention', delta: -10, note: 'Sometimes it comes (kākāpō recovery is real). Often it doesn\'t arrive in time.' },
      { text: 'Continue as before', delta: -22, note: 'Most extinctions of the last 500 years involved invasives.' },
    ],
  },
  {
    id: 'protected',
    label: 'Your range is officially designated protected habitat.',
    biomes: ['rainforest', 'desert', 'ocean', 'tundra'],
    choices: [
      { text: 'Recovery begins', delta: 18, note: 'This is what works. Protected habitat is the most reliable conservation tool we have.' },
      { text: 'Cautious — protection on paper isn\'t protection', delta: 6, note: 'A real concern. Enforcement matters more than designation.' },
      { text: 'Continue range expansion', delta: 12, note: 'Possible. Many species need habitat AND time.' },
    ],
  },
];

// Tunable run constants. SEASONS_TO_WIN = 6 means six events per run;
// STARTING_POP = 70 gives players some buffer to make a mistake and recover.
const SEASONS_TO_WIN = 6;
const STARTING_POP = 70;

/**
 * Filter the species list down to ones that are still extant in the
 * real world. We never assign a player an already-extinct species at
 * the start of a run — that would be a frustrating cold open. (You CAN
 * end the run as the cause of their extinction. That's the point.)
 */
function pickPlayableSpecies() {
  // .filter returns a new array with only the elements that pass the test.
  return SPECIES.filter((s) => s.status !== 'extinct');
}

/**
 * Pick the next event for the run. Two rules:
 *   1. The event has to apply to this species' biome (no sea-ice events
 *      for a desert lizard).
 *   2. We try not to repeat events within a run. `usedIds` is the list
 *      of event ids already shown.
 *
 * If we run out of biome-appropriate fresh events, we fall back to any
 * unused event, and finally — if everything has been used — to a random
 * one. The fallback ladder means short event banks won't crash the run.
 */
function pickEventForSpecies(species, usedIds) {
  // Primary candidates: biome match + not yet used.
  const candidates = EVENTS.filter(
    (e) => e.biomes.includes(species.biome) && !usedIds.includes(e.id)
  );

  if (candidates.length === 0) {
    // No biome-fresh events available — widen to "any unused event."
    const fallback = EVENTS.filter((e) => !usedIds.includes(e.id));
    if (fallback.length === 0) {
      // Out of fresh events entirely. Pick any random one (rare; only
      // happens if SEASONS_TO_WIN exceeds EVENTS.length).
      return EVENTS[Math.floor(Math.random() * EVENTS.length)];
    }
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  // Math.random() returns [0, 1). Multiplying by length and flooring gives
  // a valid integer index into the candidates array.
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ---------------------------------------------------------------------------
// THE COMPONENT
// ---------------------------------------------------------------------------

export function SurviveMode() {
  // Pull the two XP-recording functions from the central game state.
  // Using object destructuring `{ a, b }` to grab specific keys.
  const { recordSurvivalGain, recordSurvivalLoss } = useGameState();

  // -------- State --------
  // Each useState call creates ONE piece of state. The pattern is
  // `const [value, setValue] = useState(initialValue)`. Calling setValue
  // tells React "the value changed, please re-render this component."

  // Which screen we're currently showing. See the phase machine in the
  // header comment for legal values and transitions.
  const [phase, setPhase] = useState('intro');

  // Which species the player is playing as this run. Null until a run starts.
  const [species, setSpecies] = useState(null);

  // Population percentage (0-100). Drops below 0 floor → loss.
  const [pop, setPop] = useState(STARTING_POP);

  // Which season number we're on (1 through SEASONS_TO_WIN).
  const [season, setSeason] = useState(1);

  // The current event being presented to the player.
  const [event, setEvent] = useState(null);

  // Track which events have already been shown this run, so we don't repeat.
  const [usedEvents, setUsedEvents] = useState([]);

  // The choice the player just made — used to render the result screen.
  const [lastChoice, setLastChoice] = useState(null);

  // Derived value: the styled status label ({label, color}) for the
  // species' real-world conservation status. Recalculated on every
  // render but it's cheap (just an object lookup), so no useMemo needed.
  const status = species ? STATUS_LABELS[species.status] : null;

  // -------- Event handlers --------

  /**
   * Begin a new run. Called from the intro screen and from the win/loss
   * screens' "play again" buttons.
   */
  const start = () => {
    const playable = pickPlayableSpecies();
    // Pick a random species from the playable list.
    const chosen = playable[Math.floor(Math.random() * playable.length)];
    // Pick the first event for this species (no events used yet → []).
    const firstEvent = pickEventForSpecies(chosen, []);

    // Reset every piece of state for a fresh run. Calling the setter
    // doesn't update state instantly; it queues an update and React
    // batches them so the next render sees all new values together.
    setSpecies(chosen);
    setPop(STARTING_POP);
    setSeason(1);
    setUsedEvents([firstEvent.id]);
    setEvent(firstEvent);
    setLastChoice(null);
    setPhase('playing');
  };

  /**
   * Apply the player's choice to the run.
   *
   * Math.max(0, ...) clamps the lower bound so population can't go negative.
   * Math.min(100, ...) clamps the upper bound so it can't exceed 100%.
   * Combined, they keep `pop` always in [0, 100].
   *
   * The order of the three checks matters:
   *   1. Did pop hit 0? → loss (overrides everything; can't survive at 0 pop)
   *   2. Was that the last season? → win
   *   3. Otherwise → show result, await Next
   */
  const choose = (choice) => {
    const newPop = Math.max(0, Math.min(100, pop + choice.delta));
    setPop(newPop);
    setLastChoice(choice);

    if (newPop <= 0) {
      // Record an XP loss with the central game state so the HUD reflects it.
      recordSurvivalLoss(8);
      setPhase('loss');
      return; // Early return — don't fall through to the win/result branches.
    }
    if (season >= SEASONS_TO_WIN) {
      // Made it through all seasons with pop > 0. That's a win.
      recordSurvivalGain(12);
      setPhase('win');
      return;
    }

    // Normal case: between-season result screen.
    setPhase('event-result');
  };

  /**
   * Move from the result screen to the next season's event.
   * The functional setUsedEvents form `(u) => [...u, ...]` is the safe
   * way to update state that depends on its previous value — it avoids
   * a stale-closure bug where you'd accidentally append to an old copy.
   */
  const advanceSeason = () => {
    const nextSeason = season + 1;
    const nextEvent = pickEventForSpecies(species, usedEvents);
    setUsedEvents((u) => [...u, nextEvent.id]);
    setEvent(nextEvent);
    setSeason(nextSeason);
    setLastChoice(null);
    setPhase('playing');
  };

  // -------- Render branches --------
  // Each phase renders a different UI. We bail out early for each
  // non-default phase, then fall through to the "playing" render at the
  // bottom. Keeping each phase in its own block makes them easier to
  // edit independently.

  // ----- intro screen (no run in progress) -----
  if (phase === 'intro') {
    return (
      <div className="survive-mode page-enter">
        <div className="survive-intro">
          <div className="eyebrow" style={{ color: 'var(--magenta)' }}>Survival sim</div>
          <h1 className="survive-title">You are the species.<br/>Survive what we've done.</h1>
          <p className="survive-blurb">
            6 seasons. Real pressures: habitat loss, climate shift, gillnets, bounties.
            Your choices change your population. Drop to zero and your species is archived.
          </p>
          <p className="survive-disclaimer">
            Every event in this mode is based on real conservation scenarios.
          </p>
          <button className="survive-start" onClick={start}>Begin run</button>
        </div>
      </div>
    );
  }

  // ----- loss screen (population hit 0) -----
  // Note: the optional chaining `lastChoice?.note` reads "if lastChoice
  // exists, get its .note; otherwise undefined." It's a safety net for
  // the rare case where we'd render before lastChoice is set.
  if (phase === 'loss') {
    return (
      <div className="survive-mode page-enter">
        <div className="survive-intro">
          <div className="eyebrow" style={{ color: 'var(--magenta)' }}>Population zero</div>
          <h1 className="survive-title" style={{ color: 'var(--magenta)' }}>The {species.name}<br/>did not survive.</h1>
          <SpeciesGlyph species={species} size="lg" />
          <p className="survive-blurb">{lastChoice?.note}</p>
          <p className="survive-real">
            Real-world status · <span style={{ color: status.color }}>{status.label}</span>
          </p>
          <button className="survive-start" onClick={start}>Try another species</button>
          <button className="survive-restart-text" onClick={() => setPhase('intro')}>← back to intro</button>
        </div>
      </div>
    );
  }

  // ----- win screen (made it through 6 seasons) -----
  if (phase === 'win') {
    return (
      <div className="survive-mode page-enter">
        <div className="survive-intro">
          <div className="eyebrow" style={{ color: 'var(--forest)' }}>Stabilized</div>
          <h1 className="survive-title" style={{ color: 'var(--forest)' }}>The {species.name}<br/>made it through.</h1>
          <SpeciesGlyph species={species} size="lg" />
          <p className="survive-blurb">
            Six seasons. Population at {pop}%. This is what intervention plus luck looks like.
          </p>
          <p className="survive-real">
            In the real world · <span style={{ color: status.color }}>{status.label}</span>
          </p>
          <button className="survive-start" onClick={start}>New run</button>
        </div>
      </div>
    );
  }

  // ----- event-result screen (between-seasons recap) -----
  // The conditional color expression `pop > 50 ? 'forest' : pop > 25 ? 'amber' : 'magenta'`
  // is a chain of ternaries: read it as "if pop > 50 use forest, else if
  // pop > 25 use amber, else use magenta." Forest = healthy, amber =
  // warning, magenta (clay) = critical.
  if (phase === 'event-result') {
    return (
      <div className="survive-mode page-enter">
        <div className="survive-status-row">
          <div className="survive-species">
            <SpeciesGlyph species={species} size="sm" />
            <div>
              <div className="survive-species-name">{species.name}</div>
              <div className="survive-season">Season {season} of {SEASONS_TO_WIN}</div>
            </div>
          </div>
        </div>
        <div className="survive-popbar">
          <div className="survive-popbar-label">
            <span>Population</span>
            <span style={{ color: pop > 50 ? 'var(--forest)' : pop > 25 ? 'var(--amber)' : 'var(--magenta)' }}>
              {pop}%
            </span>
          </div>
          <div className="survive-popbar-track">
            <div
              className="survive-popbar-fill"
              style={{
                width: `${pop}%`,
                background: pop > 50 ? 'var(--forest)' : pop > 25 ? 'var(--amber)' : 'var(--magenta)',
              }}
            />
          </div>
        </div>

        <div className="survive-result">
          <div
            className="survive-result-delta"
            style={{ color: lastChoice.delta >= 0 ? 'var(--forest)' : 'var(--magenta)' }}
          >
            {lastChoice.delta >= 0 ? `+${lastChoice.delta}` : lastChoice.delta}% population
          </div>
          <p className="survive-result-note">{lastChoice.note}</p>
          <button className="survive-next" onClick={advanceSeason}>
            Next season
          </button>
        </div>
      </div>
    );
  }

  // ----- playing (default branch — event card waiting for the player's choice) -----
  // The .map() call below is React's standard way to render a list:
  // for each item in event.choices, return one <button>. The `key={i}`
  // tells React how to identify each button across re-renders. Index keys
  // are fine here because the list never reorders within a single event.
  return (
    <div className="survive-mode page-enter">
      <div className="survive-status-row">
        <div className="survive-species">
          <SpeciesGlyph species={species} size="sm" />
          <div>
            <div className="survive-species-name">{species.name}</div>
            <div className="survive-season">Season {season} of {SEASONS_TO_WIN}</div>
          </div>
        </div>
      </div>

      <div className="survive-popbar">
        <div className="survive-popbar-label">
          <span>Population</span>
          <span style={{ color: pop > 50 ? 'var(--forest)' : pop > 25 ? 'var(--amber)' : 'var(--magenta)' }}>
            {pop}%
          </span>
        </div>
        <div className="survive-popbar-track">
          <div
            className="survive-popbar-fill"
            style={{
              width: `${pop}%`,
              background: pop > 50 ? 'var(--forest)' : pop > 25 ? 'var(--amber)' : 'var(--magenta)',
            }}
          />
        </div>
      </div>

      <div className="survive-event">
        <div className="eyebrow" style={{ color: 'var(--magenta)' }}>Pressure incoming</div>
        <h2 className="survive-event-text">{event.label}</h2>
      </div>

      <div className="survive-choices">
        {event.choices.map((c, i) => (
          <button key={i} className="survive-choice" onClick={() => choose(c)}>
            <span className="survive-choice-marker">→</span>
            <span>{c.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
