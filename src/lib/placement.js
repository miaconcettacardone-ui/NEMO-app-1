/**
 * placement.js — five-question placement quiz used in onboarding.
 *
 * Purpose: adjust the tier guess from age + schooling pickers up or down
 * based on actual demonstrated knowledge. NOT a knowledge gate — players
 * who skip it just go with the picker's guess.
 *
 * QUESTION DESIGN
 *   - 5 questions total. Short. None of them depend on memorizing an
 *     obscure species name.
 *   - Roughly: Q1 easy (anyone with K-2 schooling can answer), Q2-3 medium
 *     (high school general science), Q4-5 harder (undergrad ecology /
 *     biology / earth science territory).
 *   - Each question has 4 choices and exactly one correct answer (`a` is
 *     the index, 0-based, matching the `choices` array).
 *   - `topic` is only metadata — used in case we ever want to show "you
 *     scored well on X, weak on Y" feedback. Not currently surfaced.
 *
 * SCORING (handled in tier.js inferTierFromOnboarding)
 *   0–1 right → simple
 *   2–3 right → standard
 *   4–5 right → expert
 *
 * If we add or remove questions, update the scoring bands in tier.js.
 * Five was chosen because it's enough variance to matter (each question
 * is worth 20 percentage points) without being a slog.
 */

export const PLACEMENT_QUESTIONS = [
  {
    id: 'q1-photosynthesis',
    topic: 'basic biology',
    q: 'What do plants need to make their food?',
    choices: [
      'Sunlight, water, and air',
      'Soil and rain only',
      'Other plants nearby',
      'They eat insects to grow',
    ],
    a: 0,
  },
  {
    id: 'q2-food-chain',
    topic: 'ecology basics',
    q: 'In a food chain, an animal that eats plants is called a:',
    choices: [
      'Predator',
      'Producer',
      'Herbivore',
      'Decomposer',
    ],
    a: 2,
  },
  {
    id: 'q3-climate',
    topic: 'climate / atmosphere',
    q: 'Which of these is the main cause of recent global warming?',
    choices: [
      'The sun getting hotter',
      'Burning fossil fuels (coal, oil, gas)',
      'Earth\'s tilt changing',
      'Volcano eruptions in the last decade',
    ],
    a: 1,
  },
  {
    id: 'q4-biodiversity',
    topic: 'conservation biology',
    q: 'Why does habitat fragmentation hurt species more than just losing the same total area in one piece?',
    choices: [
      'Fragmented patches have more animals competing in less space',
      'Smaller patches lose genetic diversity and animals can\'t move between them',
      'It only matters for plants, not animals',
      'It doesn\'t — total area is what matters',
    ],
    a: 1,
  },
  {
    id: 'q5-trophic',
    topic: 'ecosystem ecology',
    q: 'Roughly how much energy passes from one trophic level to the next in a typical food chain?',
    choices: [
      'About 90%',
      'About 50%',
      'About 10%',
      'It depends entirely on the species',
    ],
    a: 2,
  },
];
