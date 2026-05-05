import { useEffect, useMemo, useState } from 'react';
import { SPECIES, getById, STATUS_LABELS } from '../data/species';
import { useGameState } from '../hooks/useGameState';
import { SpeciesGlyph } from '../components/SpeciesGlyph';
import './survive.css';

/**
 * Survive Mode
 * ------------
 * You are randomly assigned a species at the start of each run. Each
 * "season" delivers a real-world pressure — habitat loss, climate shift,
 * an introduced species, illegal trade, disease — and you pick a
 * response. Your choices push your population up or down. Survive 6
 * seasons to "stabilize" and earn XP. Drop to 0 and the species is
 * archived (with a real-world note about why this actually happened).
 *
 * Every event and outcome here is rooted in real conservation
 * scenarios — habitat fragmentation, gillnet bycatch, bounty hunts,
 * climate-driven range shifts. The drama is the truth, not invented
 * for the game.
 */

// Event bank, keyed by what's plausible. Each event has 3 choices with
// different outcomes. `delta` = population change, `note` = the
// after-action explanation that's where the actual learning happens.
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

const SEASONS_TO_WIN = 6;
const STARTING_POP = 70;

function pickPlayableSpecies() {
  // Skip already-extinct from being playable starters
  return SPECIES.filter((s) => s.status !== 'extinct');
}

function pickEventForSpecies(species, usedIds) {
  const candidates = EVENTS.filter(
    (e) => e.biomes.includes(species.biome) && !usedIds.includes(e.id)
  );
  if (candidates.length === 0) {
    // Fallback: any event still unused
    const fallback = EVENTS.filter((e) => !usedIds.includes(e.id));
    if (fallback.length === 0) {
      return EVENTS[Math.floor(Math.random() * EVENTS.length)];
    }
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function SurviveMode() {
  const { recordSurvivalGain, recordSurvivalLoss } = useGameState();
  const [phase, setPhase] = useState('intro'); // intro | playing | event-result | win | loss
  const [species, setSpecies] = useState(null);
  const [pop, setPop] = useState(STARTING_POP);
  const [season, setSeason] = useState(1);
  const [event, setEvent] = useState(null);
  const [usedEvents, setUsedEvents] = useState([]);
  const [lastChoice, setLastChoice] = useState(null);

  const status = species ? STATUS_LABELS[species.status] : null;

  const start = () => {
    const playable = pickPlayableSpecies();
    const chosen = playable[Math.floor(Math.random() * playable.length)];
    const firstEvent = pickEventForSpecies(chosen, []);
    setSpecies(chosen);
    setPop(STARTING_POP);
    setSeason(1);
    setUsedEvents([firstEvent.id]);
    setEvent(firstEvent);
    setLastChoice(null);
    setPhase('playing');
  };

  const choose = (choice) => {
    const newPop = Math.max(0, Math.min(100, pop + choice.delta));
    setPop(newPop);
    setLastChoice(choice);

    if (newPop <= 0) {
      recordSurvivalLoss(8);
      setPhase('loss');
      return;
    }
    if (season >= SEASONS_TO_WIN) {
      recordSurvivalGain(12);
      setPhase('win');
      return;
    }

    setPhase('event-result');
  };

  const advanceSeason = () => {
    const nextSeason = season + 1;
    const nextEvent = pickEventForSpecies(species, usedEvents);
    setUsedEvents((u) => [...u, nextEvent.id]);
    setEvent(nextEvent);
    setSeason(nextSeason);
    setLastChoice(null);
    setPhase('playing');
  };

  // --- intro
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

  // --- loss
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

  // --- win
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

  // --- event-result (after a choice, between seasons)
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

  // --- playing (event presented)
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
