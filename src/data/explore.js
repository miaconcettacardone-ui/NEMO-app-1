/**
 * explore.js — the scenario bank for Explore mode.
 *
 * Explore is a Reigns-style decision-card game wrapped around a biome map.
 * Per AGENTS.md: scenarios are HAND-AUTHORED, never procedural, so we can
 * guarantee accuracy to real conservation data. Cards are gated by biome
 * — visiting the rainforest never surfaces a sea-ice card.
 *
 * THE FOUR WORLD METERS
 *   biodiversity — how varied and abundant life is in this region
 *   climate      — atmospheric/oceanographic stability (carbon, temperature)
 *   prosperity   — human prosperity in the region (food security, livelihoods)
 *   biosphere    — overall ecosystem function (water, soil, pollinators)
 *
 * These four were chosen because real conservation tradeoffs almost always
 * pit at least two of them against each other: a logging concession trades
 * biodiversity AND biosphere for prosperity; a strict no-take marine reserve
 * trades short-term prosperity (fishing income) for biodiversity and
 * biosphere; a coal plant trades climate for prosperity. The mode lets
 * players feel those tradeoffs without dressing them up as good-vs-evil.
 *
 * SHAPE OF A SCENARIO
 *   id        — stable string. Used both as React key and as the "do not
 *                repeat within a session" identifier.
 *   biome     — 'rainforest' | 'desert' | 'ocean' | 'tundra'. Cards only
 *                surface when the player has tapped that biome on the map.
 *   prompt    — the situation, in second-person. Short. The card has to
 *                read in under five seconds.
 *   flavor    — a one-sentence framing line shown above the prompt. Sets
 *                the scene without burying the choice.
 *   choices   — array of 2–3 options. Each:
 *      label    — what the player taps
 *      effects  — { biodiversity, climate, prosperity, biosphere } deltas.
 *                  Any number is valid; aim for ±5–18 for normal pressure
 *                  and ±20+ only for genuinely consequential choices.
 *      note     — the after-action explanation. This is the teaching moment.
 *                  Plain language. Cite real history when relevant — that's
 *                  how we keep the mode honest.
 *
 * AUTHORING RULES
 *   - No "obvious right answer" cards. Every choice should cost something.
 *     If a choice is pure win (positive on all four), the scenario is too
 *     easy and should be tightened until it stops being a freebie.
 *   - Notes acknowledge complexity. "This is what works" is fine when it's
 *     true (protected areas, e.g.); "this is what conservationists actually
 *     debate" is also fine. What's not fine is pretending a real-world
 *     debate is settled.
 *   - Numbers are tunable. When playtesting reveals a meter that always
 *     dies first, retune deltas — don't add a new card to compensate.
 *
 * EXTENDING THIS FILE
 *   Append; never reorder existing entries. Four cards per biome at minimum
 *   so the gating logic always has something to draw from. When adding a
 *   new biome, add the constant in BIOMES and ship at least four cards for
 *   it in the same commit.
 */

// The four real biomes the player can visit. 'archive' (the extinct-species
// bucket from the species catalog) intentionally isn't a destination — you
// can't make decisions in a biome that no longer exists.
export const BIOMES = [
  {
    id: 'rainforest',
    name: 'Rainforest',
    blurb: 'Old-growth canopy. Half the world\'s species live in forests like this.',
  },
  {
    id: 'desert',
    name: 'Desert',
    blurb: 'Arid land. Looks empty; isn\'t — every square meter is fought over.',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    blurb: 'Open and reef. The largest carbon sink on the planet.',
  },
  {
    id: 'tundra',
    name: 'Tundra',
    blurb: 'Frozen ground, brief summer. Warming three to four times the global average.',
  },
];

// Default starting values for the four world meters. 70 each gives the
// player headroom — they can absorb several bad choices before any meter
// hits the lose threshold (0).
export const WORLD_INITIAL = {
  biodiversity: 70,
  climate: 70,
  prosperity: 70,
  biosphere: 70,
};

// Number of cards per Explore session. Five was chosen so a session takes
// 30–60 seconds — enough to feel like a session, short enough to invite
// a second one. Tunable.
export const TURNS_PER_SESSION = 5;

// Threshold that defines a "good run." If all four meters remain above
// this value at the end of TURNS_PER_SESSION, the run is logged as a win.
// Below it (but above zero) is "stable but stressed"; any meter at zero
// is a loss.
export const WIN_THRESHOLD = 50;

// ---------------------------------------------------------------------------
// THE SCENARIO BANK
// ---------------------------------------------------------------------------
// Sixteen scenarios, four per biome. Order is intentional within each biome:
// earlier scenarios establish the biome's signature pressures, later ones
// push into harder tradeoffs.

export const SCENARIOS = [
  // ===== RAINFOREST =====================================================
  {
    id: 'rf-logging-concession',
    biome: 'rainforest',
    flavor: 'A timber company applies for a 50,000-hectare concession.',
    prompt: 'The forestry ministry asks how the concession should proceed.',
    choices: [
      {
        label: 'Approve — selective logging only',
        effects: { biodiversity: -10, climate: -6, prosperity: 12, biosphere: -8 },
        note: 'Selective logging is less harmful than clear-cut, but roads remain — and roads bring poaching, fire risk, and second-wave settlers.',
      },
      {
        label: 'Deny — designate as protected reserve',
        effects: { biodiversity: 12, climate: 6, prosperity: -10, biosphere: 8 },
        note: 'Protected areas are the most reliable conservation tool we have. The lost timber revenue is real, though, and that political cost is what makes this hard.',
      },
      {
        label: 'Approve, with Indigenous co-management',
        effects: { biodiversity: 4, climate: 0, prosperity: 6, biosphere: 4 },
        note: 'Indigenous-managed forests show deforestation rates 2–3x lower than state-protected ones in the Amazon. Slower revenue, more durable outcome.',
      },
    ],
  },
  {
    id: 'rf-palm-oil',
    biome: 'rainforest',
    flavor: 'A multinational offers to buy 20,000 hectares for an oil palm plantation.',
    prompt: 'The province needs the jobs. The forest is intact lowland habitat.',
    choices: [
      {
        label: 'Accept the deal',
        effects: { biodiversity: -22, climate: -10, prosperity: 18, biosphere: -14 },
        note: 'Lowland forest converted to palm holds about a tenth of the original species. The jobs are real; orangutans don\'t have a vote.',
      },
      {
        label: 'Refuse; push for sustainable agroforestry instead',
        effects: { biodiversity: 4, climate: 2, prosperity: 4, biosphere: 4 },
        note: 'Diversified smallholder agroforestry generates less revenue per hectare but supports more livelihoods and keeps canopy. The deal-makers will be unhappy.',
      },
      {
        label: 'Accept, but require RSPO-certified practices',
        effects: { biodiversity: -12, climate: -6, prosperity: 12, biosphere: -8 },
        note: 'RSPO certification helps at the margins. Independent audits regularly find certified plantations clearing primary forest anyway.',
      },
    ],
  },
  {
    id: 'rf-ranger-shortfall',
    biome: 'rainforest',
    flavor: 'Park rangers report poaching pressure rising. The patrol budget is short.',
    prompt: 'Funding has to come from somewhere.',
    choices: [
      {
        label: 'Reallocate from the regional roads budget',
        effects: { biodiversity: 10, climate: 0, prosperity: -8, biosphere: 6 },
        note: 'Better patrols cut poaching measurably within months. Rural communities feel the road cuts immediately.',
      },
      {
        label: 'Open the park to limited eco-tourism to fund itself',
        effects: { biodiversity: 0, climate: -2, prosperity: 8, biosphere: -2 },
        note: 'Eco-tourism funds rangers in places like Rwanda and Costa Rica. It also brings access roads, lodges, and pressure on wildlife behavior.',
      },
      {
        label: 'Do nothing; hope it stabilizes',
        effects: { biodiversity: -16, climate: 0, prosperity: 0, biosphere: -10 },
        note: 'Poaching pressure rarely self-resolves. The vaquita, the Sumatran rhino, the Western black rhino — that\'s the cost of waiting.',
      },
    ],
  },
  {
    id: 'rf-corridor',
    biome: 'rainforest',
    flavor: 'A 12-km wildlife corridor would reconnect two fragments of jaguar habitat.',
    prompt: 'It runs through cattle ranchland. The ranchers want compensation.',
    choices: [
      {
        label: 'Compensate the ranchers in full',
        effects: { biodiversity: 16, climate: 4, prosperity: -10, biosphere: 10 },
        note: 'Corridor connectivity is one of the highest-impact things you can do for large carnivores. Compensation funds usually come from foreign donors, not the host country.',
      },
      {
        label: 'Negotiate easements; partial compensation',
        effects: { biodiversity: 8, climate: 2, prosperity: -2, biosphere: 4 },
        note: 'Easements work in places with strong legal frameworks. Where enforcement is weak, easements decay quietly within a decade.',
      },
    ],
  },

  // ===== DESERT =========================================================
  {
    id: 'ds-solar-farm',
    biome: 'desert',
    flavor: 'A 4-square-kilometer solar farm is proposed on Bureau land.',
    prompt: 'It would meaningfully cut national grid emissions.',
    choices: [
      {
        label: 'Approve as proposed',
        effects: { biodiversity: -14, climate: 18, prosperity: 8, biosphere: -8 },
        note: 'Utility-scale solar in fragile desert displaces tortoises, kit foxes, and millennia-old creosote stands. The climate gain is real and so is the loss.',
      },
      {
        label: 'Approve, but on already-degraded land only',
        effects: { biodiversity: -2, climate: 14, prosperity: 6, biosphere: -2 },
        note: 'Brownfield siting (old mines, ag land) yields the climate benefit without the biodiversity cost. Permitting takes longer; some developers walk.',
      },
      {
        label: 'Deny; require offshore wind alternatives',
        effects: { biodiversity: 6, climate: 4, prosperity: -4, biosphere: 4 },
        note: 'Offshore wind has its own ecological footprint (whales, seabirds), but desert habitat once lost takes centuries to recover. There is no zero-cost grid.',
      },
    ],
  },
  {
    id: 'ds-groundwater',
    biome: 'desert',
    flavor: 'Industrial agriculture is drawing the aquifer down 1.5 meters a year.',
    prompt: 'The springs that wildlife depend on are starting to dry.',
    choices: [
      {
        label: 'Cap pumping at the recharge rate',
        effects: { biodiversity: 14, climate: 0, prosperity: -16, biosphere: 12 },
        note: 'Sustainable yield is the right answer ecologically. Farmers who built businesses on the old rate will go bankrupt without transition support.',
      },
      {
        label: 'Phased reduction over 10 years',
        effects: { biodiversity: 4, climate: 0, prosperity: -4, biosphere: 4 },
        note: 'Phased plans give farmers time to switch crops or sell out. They also lock in a decade more of overdraft, which the springs may not survive.',
      },
      {
        label: 'No change; subsidize new wells instead',
        effects: { biodiversity: -16, climate: -2, prosperity: 8, biosphere: -16 },
        note: 'This is the path the Ogallala is on. The aquifer wins for a while; everything else loses.',
      },
    ],
  },
  {
    id: 'ds-rewilding',
    biome: 'desert',
    flavor: 'A coalition wants to reintroduce a locally-extinct herbivore.',
    prompt: 'Local ranchers worry about competition with their cattle.',
    choices: [
      {
        label: 'Proceed with full reintroduction',
        effects: { biodiversity: 14, climate: 2, prosperity: -8, biosphere: 8 },
        note: 'Returning a missing keystone herbivore can shift soils, plants, and predators. Rancher relations can go sideways quickly without buy-in.',
      },
      {
        label: 'Pilot in one fenced area first',
        effects: { biodiversity: 4, climate: 0, prosperity: -2, biosphere: 2 },
        note: 'Pilots build evidence and trust. They also cost time the species may not have.',
      },
      {
        label: 'Cancel; protect existing range instead',
        effects: { biodiversity: 2, climate: 0, prosperity: 4, biosphere: 2 },
        note: 'Protecting existing populations is generally more cost-effective than reintroduction. It does nothing for the gap left by the species that\'s already gone.',
      },
    ],
  },
  {
    id: 'ds-mining-claim',
    biome: 'desert',
    flavor: 'A lithium mining claim is filed on critical desert tortoise habitat.',
    prompt: 'EV batteries need lithium. So do tortoises need habitat.',
    choices: [
      {
        label: 'Permit the mine, with translocation plan',
        effects: { biodiversity: -16, climate: 8, prosperity: 10, biosphere: -8 },
        note: 'Tortoise translocations have mortality rates of 20–50% in the first year. Saying "we relocated them" and saying "they survived" are different sentences.',
      },
      {
        label: 'Deny; require recycled-lithium alternatives',
        effects: { biodiversity: 8, climate: -4, prosperity: -4, biosphere: 4 },
        note: 'Recycling lithium at scale is technically possible and economically marginal today. Denying this mine pushes demand to other places — possibly worse ones.',
      },
    ],
  },

  // ===== OCEAN ==========================================================
  {
    id: 'oc-mpa',
    biome: 'ocean',
    flavor: 'A proposed Marine Protected Area would close 30% of the regional fishery.',
    prompt: 'Fish stocks have declined 60% in two decades.',
    choices: [
      {
        label: 'Establish the MPA as proposed',
        effects: { biodiversity: 18, climate: 4, prosperity: -16, biosphere: 14 },
        note: 'Well-enforced MPAs reliably increase fish biomass inside their borders within 5–10 years. The fishing communities feel the loss in year one.',
      },
      {
        label: 'Smaller MPA + community quotas',
        effects: { biodiversity: 6, climate: 2, prosperity: -4, biosphere: 6 },
        note: 'Community-managed quotas (territorial use rights, e.g.) work in places with strong local institutions and weakly elsewhere.',
      },
      {
        label: 'Reject; manage by catch limit only',
        effects: { biodiversity: -8, climate: 0, prosperity: 4, biosphere: -8 },
        note: 'Catch limits without spatial protection allow continued damage to nursery habitat. Most collapsed fisheries had catch limits.',
      },
    ],
  },
  {
    id: 'oc-bycatch',
    biome: 'ocean',
    flavor: 'A fleet\'s gillnets are killing endangered porpoises.',
    prompt: 'The fleet supports 400 families.',
    choices: [
      {
        label: 'Ban gillnets entirely',
        effects: { biodiversity: 18, climate: 0, prosperity: -18, biosphere: 8 },
        note: 'This is the only intervention that has actually prevented porpoise extinctions historically. The economic harm is severe and immediate.',
      },
      {
        label: 'Subsidize alternative gear (alternative trawls)',
        effects: { biodiversity: 8, climate: -2, prosperity: 4, biosphere: 4 },
        note: 'Gear-swap programs work where well-funded and enforced. The vaquita\'s gear-swap was both — and there are still fewer than 10 vaquitas.',
      },
      {
        label: 'Voluntary compliance; no enforcement',
        effects: { biodiversity: -20, climate: 0, prosperity: 6, biosphere: -10 },
        note: 'Voluntary marine compliance fails reliably. The economic incentive to cheat is too strong, the ocean too vast to patrol passively.',
      },
    ],
  },
  {
    id: 'oc-coral',
    biome: 'ocean',
    flavor: 'A heat wave is bleaching the reef. A research team has shade-cloth interventions ready.',
    prompt: 'The interventions cost real money and only buy time.',
    choices: [
      {
        label: 'Fund the shade-cloth deployment',
        effects: { biodiversity: 8, climate: 0, prosperity: -6, biosphere: 6 },
        note: 'Localized shading has reduced bleaching mortality in trials. It scales poorly to whole reefs and does nothing about the underlying warming.',
      },
      {
        label: 'Skip; redirect funds to climate policy work',
        effects: { biodiversity: -6, climate: 8, prosperity: 0, biosphere: -2 },
        note: 'The reef will not survive without climate stabilization. The reef may also not survive long enough to see climate stabilization arrive.',
      },
      {
        label: 'Both, half-funded each',
        effects: { biodiversity: 2, climate: 4, prosperity: -4, biosphere: 2 },
        note: 'Half-funding two strategies often delivers neither well. Splitting is sometimes wisdom and sometimes hedging — knowing which is the job.',
      },
    ],
  },
  {
    id: 'oc-aquaculture',
    biome: 'ocean',
    flavor: 'A salmon-farming operation wants to expand into a coastal bay.',
    prompt: 'The bay is migratory salmon habitat — wild and farmed don\'t mix well.',
    choices: [
      {
        label: 'Approve the expansion',
        effects: { biodiversity: -14, climate: -2, prosperity: 14, biosphere: -10 },
        note: 'Open-net pen salmon farms shed sea lice and disease into wild stocks. British Columbia, Norway, and Chile have all run this experiment.',
      },
      {
        label: 'Approve only with closed-containment systems',
        effects: { biodiversity: -2, climate: -4, prosperity: 6, biosphere: -2 },
        note: 'Closed containment eliminates most disease transfer. It\'s also more expensive, more energy-intensive, and most operators won\'t adopt it without mandate.',
      },
      {
        label: 'Deny the expansion',
        effects: { biodiversity: 8, climate: 2, prosperity: -8, biosphere: 6 },
        note: 'Wild salmon fisheries support more total jobs than salmon farming, but the jobs are seasonal and dispersed — politically weaker.',
      },
    ],
  },

  // ===== TUNDRA =========================================================
  {
    id: 'tu-pipeline',
    biome: 'tundra',
    flavor: 'An oil pipeline corridor is proposed across caribou calving grounds.',
    prompt: 'The project promises a decade of regional employment.',
    choices: [
      {
        label: 'Approve along the proposed route',
        effects: { biodiversity: -18, climate: -14, prosperity: 16, biosphere: -10 },
        note: 'Caribou avoid pipeline corridors at distances much greater than the corridor itself. Calving displacement reduces herd recruitment for decades.',
      },
      {
        label: 'Approve only with seasonal construction restrictions',
        effects: { biodiversity: -6, climate: -10, prosperity: 10, biosphere: -4 },
        note: 'Seasonal restrictions help during calving, but the corridor remains permanent and the climate cost of the oil it carries doesn\'t move.',
      },
      {
        label: 'Deny; invest in renewables job retraining',
        effects: { biodiversity: 10, climate: 12, prosperity: -10, biosphere: 8 },
        note: 'Just-transition programs have mixed track records. The towns that get them done well do so because they started planning a decade in advance.',
      },
    ],
  },
  {
    id: 'tu-permafrost',
    biome: 'tundra',
    flavor: 'Thawing permafrost is collapsing the only road to three Indigenous villages.',
    prompt: 'Repair, relocate, or rethink.',
    choices: [
      {
        label: 'Rebuild the road on engineered piles',
        effects: { biodiversity: -4, climate: -6, prosperity: 10, biosphere: -4 },
        note: 'Pile-supported roads buy 20–30 years. The carbon released by the construction itself is non-trivial in cumulative terms.',
      },
      {
        label: 'Subsidize village relocation',
        effects: { biodiversity: 4, climate: 0, prosperity: -10, biosphere: 0 },
        note: 'Newtok, Alaska has been trying to relocate since 1996 and only finished in 2024. Relocation is rarely fast, rarely cheap, rarely uncontested.',
      },
      {
        label: 'Switch the route to seasonal ice roads + barge',
        effects: { biodiversity: 0, climate: 2, prosperity: -2, biosphere: 0 },
        note: 'Ice-road seasons are shrinking 10–14 days per decade. This is a stopgap, not a strategy.',
      },
    ],
  },
  {
    id: 'tu-fox-translocation',
    biome: 'tundra',
    flavor: 'Red foxes are displacing arctic foxes from southern range.',
    prompt: 'A wildlife agency proposes lethal control of red foxes in the contact zone.',
    choices: [
      {
        label: 'Approve the lethal control program',
        effects: { biodiversity: 8, climate: 0, prosperity: -4, biosphere: 4 },
        note: 'Targeted predator control has saved island species (kakapo, kiwi). On continents it tends to suppress without resolving — red foxes recolonize.',
      },
      {
        label: 'Decline; address through habitat restoration',
        effects: { biodiversity: -10, climate: 2, prosperity: 0, biosphere: 0 },
        note: 'Habitat restoration won\'t reverse the fundamental driver — warming is opening tundra to red foxes. This is a polite form of doing nothing.',
      },
      {
        label: 'Captive breeding for arctic fox release',
        effects: { biodiversity: 4, climate: 0, prosperity: -6, biosphere: 0 },
        note: 'Norwegian and Swedish captive breeding has stabilized small populations. It does not address the underlying competitive pressure.',
      },
    ],
  },
  {
    id: 'tu-mining',
    biome: 'tundra',
    flavor: 'A rare-earth deposit critical for wind turbines sits under intact tundra.',
    prompt: 'Climate goals demand the metals. The land doesn\'t volunteer.',
    choices: [
      {
        label: 'Permit the mine',
        effects: { biodiversity: -14, climate: 12, prosperity: 12, biosphere: -10 },
        note: 'There is no clean source of these metals at scale. "Permit it elsewhere" usually means permit it where the regulations are weaker.',
      },
      {
        label: 'Permit, with full restoration bond',
        effects: { biodiversity: -8, climate: 10, prosperity: 6, biosphere: -6 },
        note: 'Restoration bonds make companies leave a deposit they forfeit if they walk away. Tundra restoration is genuinely difficult; bonds rarely cover the real cost.',
      },
      {
        label: 'Deny; push for substitute materials research',
        effects: { biodiversity: 8, climate: -8, prosperity: -6, biosphere: 6 },
        note: 'Magnet research has produced lower-rare-earth designs slowly over 20 years. "Push harder" is real but not on a timeline that matches the climate.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helper: pick the next scenario for a given biome, avoiding repeats.
// ---------------------------------------------------------------------------
//
// Mirrors the SurviveMode.pickEventForSpecies pattern: prefer biome-fresh
// scenarios; fall back to any unused scenario in the biome; finally, accept
// a repeat. Returns a scenario object.
export function pickScenario(biomeId, usedIds) {
  const inBiome = SCENARIOS.filter((s) => s.biome === biomeId);

  // Primary: biome match + not used yet.
  const fresh = inBiome.filter((s) => !usedIds.includes(s.id));
  if (fresh.length > 0) {
    return fresh[Math.floor(Math.random() * fresh.length)];
  }

  // Fallback: any scenario in this biome (ran out of fresh ones — probably
  // because the player keeps picking the same biome). Repeats are acceptable
  // because the choice deltas still differ session-to-session.
  if (inBiome.length > 0) {
    return inBiome[Math.floor(Math.random() * inBiome.length)];
  }

  // Should never hit this — every biome ships with at least four cards.
  // If it does, the player picked an unknown biome id, which is a bug.
  return null;
}
