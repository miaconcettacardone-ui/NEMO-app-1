/**
 * NEMO X Species Catalog
 * ----------------------
 * Same species universe as the Field Journal, restructured for the kinetic
 * dopamine loop. Every species carries:
 *
 *  - hook: one-line dopamine-grade fact, the "wait WHAT" line that's
 *    designed to land on a swipe card in under 2 seconds.
 *  - silhouette: a simple SVG path used for the swipe card glyph. Keeps
 *    the package zero-asset (no images to host).
 *  - quizzes: 1–3 multiple-choice questions per species, each with a
 *    correct answer and 3 plausible decoys. Used by Speed-ID and Trivia.
 *  - decoy_names: 3–4 plausibly-confusable species names, used by the
 *    Speed-ID mode to create real ID pressure.
 *  - status: matches Field Journal taxonomy (secure | watch | decline |
 *    critical | extinct).
 *
 * When the real backend is ready, replace this static export with a
 * fetch() call; the components don't change.
 */

export const SPECIES = [
  {
    id: 'jaguar',
    name: 'Jaguar',
    scientific: 'Panthera onca',
    biome: 'rainforest',
    status: 'decline',
    hook: 'Bite force strong enough to punch through a turtle shell — or a skull.',
    long: "The third-largest cat in the world, and the only big cat in the Americas. Jaguars hunt by ambushing prey from above and biting through the skull — a technique no other cat uses. Their range has shrunk by half in the last century.",
    silhouette: 'M50 80 Q30 80 25 60 Q20 50 30 45 Q40 50 50 50 Q60 50 70 45 Q80 50 75 60 Q70 80 50 80 M35 55 L40 60 M60 60 L65 55',
    decoy_names: ['Leopard', 'Puma', 'Ocelot', 'Cheetah'],
    quizzes: [
      {
        q: 'Where do jaguars do most of their hunting?',
        choices: ['From treetops, leaping down', 'In open grassland', 'In rivers, swimming', 'Underground in dens'],
        a: 0,
        why: "They're one of the few big cats that ambush from above — and yes, they swim like champs too.",
      },
      {
        q: "What's the jaguar's signature kill technique?",
        choices: ['Suffocation by throat bite', 'Bite through the skull', 'Chasing prey to exhaustion', 'Pack hunting'],
        a: 1,
        why: "No other big cat does this. Their bite force per square inch is the strongest of any cat.",
      },
    ],
  },
  {
    id: 'poison_dart_frog',
    name: 'Golden Poison Frog',
    scientific: 'Phyllobates terribilis',
    biome: 'rainforest',
    status: 'critical',
    hook: 'One frog carries enough poison to kill ten grown adults.',
    long: "The most poisonous vertebrate on Earth. Indigenous Emberá hunters wipe blowdart tips on their backs — hence the name. Captive frogs raised on a different diet eventually lose their toxicity, suggesting the poison comes from what they eat in the wild.",
    silhouette: 'M50 70 Q30 70 25 55 Q25 40 35 35 Q50 30 65 35 Q75 40 75 55 Q70 70 50 70 M40 50 Q40 45 42 45 M58 50 Q58 45 60 45',
    decoy_names: ['Tree frog', 'Glass frog', 'Tomato frog', 'Dyeing dart frog'],
    quizzes: [
      {
        q: 'Where does the golden poison frog get its toxin?',
        choices: ['It produces it from birth', 'From its diet of certain insects', 'From sunlight on its skin', 'From the soil it sits on'],
        a: 1,
        why: "Captive frogs fed crickets eventually become harmless. The toxin comes from specific wild prey.",
      },
    ],
  },
  {
    id: 'leaf_cutter_ant',
    name: 'Leafcutter Ant',
    scientific: 'Atta cephalotes',
    biome: 'rainforest',
    status: 'secure',
    hook: 'Invented agriculture 50 million years before humans did.',
    long: "Leafcutters don't eat the leaves they carry — they feed them to a fungus they cultivate underground. The fungus is the food. Each colony is a farm with millions of workers and a single queen, running for decades.",
    silhouette: 'M50 60 L45 50 L48 45 L52 45 L55 50 Z M50 60 L40 65 L35 70 M50 60 L60 65 L65 70 M40 50 L30 48 M60 50 L70 48',
    decoy_names: ['Army ant', 'Fire ant', 'Bullet ant', 'Carpenter ant'],
    quizzes: [
      {
        q: "What do leafcutter ants actually eat?",
        choices: ['The leaves they cut', 'A fungus they grow on the leaves', 'Other insects', 'Tree sap'],
        a: 1,
        why: "They're farmers. The leaves are compost for an underground fungus that feeds the colony.",
      },
    ],
  },
  {
    id: 'harpy_eagle',
    name: 'Harpy Eagle',
    scientific: 'Harpia harpyja',
    biome: 'rainforest',
    status: 'decline',
    hook: 'Talons longer than a grizzly bear\'s claws.',
    long: "One of the largest eagles in the world. Hunts monkeys and sloths in the rainforest canopy, snatching them mid-branch. Pairs raise a single chick over two years — slow reproduction makes them especially vulnerable to deforestation.",
    silhouette: 'M50 35 Q35 30 30 40 Q25 50 35 55 L50 60 L65 55 Q75 50 70 40 Q65 30 50 35 M50 35 L48 25 L52 25 Z M50 60 L45 75 M50 60 L55 75',
    decoy_names: ['Bald eagle', 'Golden eagle', 'Crested eagle', 'Philippine eagle'],
    quizzes: [
      {
        q: 'What do harpy eagles primarily hunt?',
        choices: ['Fish, like ospreys', 'Monkeys and sloths', 'Snakes on the ground', 'Other birds'],
        a: 1,
        why: "They snatch tree-dwelling mammals out of the canopy. Their talons are built for it.",
      },
    ],
  },
  {
    id: 'saguaro',
    name: 'Saguaro Cactus',
    scientific: 'Carnegiea gigantea',
    biome: 'desert',
    status: 'watch',
    hook: "Doesn't grow its first arm until it's about 75 years old.",
    long: "A keystone species of the Sonoran. A single saguaro can live 200 years, store 1,500 liters of water, and host more than 100 species — birds nesting in its cavities, bats drinking its nectar, animals eating its fruit. Slow to grow, slow to recover.",
    silhouette: 'M45 25 L45 75 L55 75 L55 25 Q55 18 50 18 Q45 18 45 25 M45 40 L35 40 L35 55 L40 55 L40 45 M55 35 L65 35 L65 50 L60 50 L60 40',
    decoy_names: ['Barrel cactus', 'Organ pipe cactus', 'Cardón', 'Joshua tree'],
    quizzes: [
      {
        q: "How old is a saguaro before it grows its first arm?",
        choices: ['About 5 years', 'About 25 years', 'About 75 years', 'About 200 years'],
        a: 2,
        why: "They're slow. A saguaro you see with arms is older than most humans alive.",
      },
    ],
  },
  {
    id: 'gila_monster',
    name: 'Gila Monster',
    scientific: 'Heloderma suspectum',
    biome: 'desert',
    status: 'watch',
    hook: 'Its venom is the basis for a real diabetes drug.',
    long: "One of only two venomous lizards in the world. Spends 95% of its life underground. A protein in its saliva — exendin-4 — became the diabetes medication exenatide, which has helped millions of people. The animal that doesn't move much made one of medicine's biggest contributions.",
    silhouette: 'M25 55 Q25 50 30 48 L70 48 Q75 50 75 55 Q75 60 70 62 L30 62 Q25 60 25 55 M30 55 L35 50 M40 55 L45 50 M50 55 L55 50 M60 55 L65 50',
    decoy_names: ['Beaded lizard', 'Tegu', 'Komodo dragon', 'Monitor lizard'],
    quizzes: [
      {
        q: "What human medical advance came from gila monster venom?",
        choices: ['A diabetes medication', 'A blood thinner', 'A pain reliever', 'An antibiotic'],
        a: 0,
        why: "Exenatide, derived from a protein in Gila saliva, treats type 2 diabetes.",
      },
    ],
  },
  {
    id: 'kit_fox',
    name: 'Kit Fox',
    scientific: 'Vulpes macrotis',
    biome: 'desert',
    status: 'watch',
    hook: 'Ears built like radiators — they shed heat, not just hear.',
    long: "The smallest fox in North America. Those oversized ears do double duty: precise hearing for hunting at night, and dumping body heat in 110°F summers. Lives in burrow networks they constantly remodel.",
    silhouette: 'M50 60 Q35 60 30 50 L25 35 L35 45 Q45 40 50 45 Q55 40 65 45 L75 35 L70 50 Q65 60 50 60 M40 50 L42 50 M58 50 L60 50',
    decoy_names: ['Fennec fox', 'Red fox', 'Swift fox', 'Arctic fox'],
    quizzes: [
      {
        q: "Why do kit foxes have such large ears?",
        choices: ['To intimidate predators', 'To hear AND shed body heat', 'To dig burrows', 'For courtship displays'],
        a: 1,
        why: "Big ears = big surface area for radiating heat. Useful when it's 110° outside.",
      },
    ],
  },
  {
    id: 'great_white_shark',
    name: 'Great White Shark',
    scientific: 'Carcharodon carcharias',
    biome: 'ocean',
    status: 'decline',
    hook: 'Can detect a single drop of blood in 100 liters of water.',
    long: "Apex predator of temperate seas. Despite their reputation, attacks on humans are extraordinarily rare and almost always cases of mistaken identity. Their numbers have plummeted from finning, bycatch, and habitat loss. They are not the villain.",
    silhouette: 'M20 50 L35 45 L70 40 L80 50 L70 60 L35 55 Z M70 35 L75 25 L72 35 M70 65 L75 75 L72 65 M50 50 L50 52',
    decoy_names: ['Bull shark', 'Tiger shark', 'Mako shark', 'Hammerhead'],
    quizzes: [
      {
        q: "How rare are great white attacks on humans?",
        choices: ['Daily, in all coastal waters', 'A few hundred a year', 'About 5–10 a year worldwide', 'Never recorded'],
        a: 2,
        why: "Statistically, you're more likely to be hit by lightning. They mostly mistake surfers for seals.",
      },
    ],
  },
  {
    id: 'octopus',
    name: 'Common Octopus',
    scientific: 'Octopus vulgaris',
    biome: 'ocean',
    status: 'secure',
    hook: 'Has nine brains. Three hearts. Blue blood.',
    long: "A central brain plus a smaller one in each arm — meaning each arm can problem-solve independently. They taste with their suckers, change skin color despite being colorblind, and have been observed using tools. The closest thing to alien intelligence on Earth.",
    silhouette: 'M50 30 Q35 30 30 45 Q30 55 50 55 Q70 55 70 45 Q65 30 50 30 M30 55 Q25 70 30 80 M40 55 Q38 75 45 80 M50 55 Q50 75 55 80 M60 55 Q62 75 60 80 M70 55 Q75 70 70 80',
    decoy_names: ['Squid', 'Cuttlefish', 'Nautilus', 'Sea slug'],
    quizzes: [
      {
        q: "How many brains does an octopus have?",
        choices: ['One', 'Three', 'Nine', 'Twelve'],
        a: 2,
        why: "One central brain plus a mini-brain in each of eight arms. Each arm can think for itself.",
      },
    ],
  },
  {
    id: 'mantis_shrimp',
    name: 'Mantis Shrimp',
    scientific: 'Odontodactylus scyllarus',
    biome: 'ocean',
    status: 'secure',
    hook: 'Punches with the speed of a .22 caliber bullet.',
    long: "Their club-like appendages strike so fast the water around them boils — yes, actually boils, briefly forming plasma. They see colors humans can't even imagine, with sixteen color receptors to our three. They will break aquarium glass.",
    silhouette: 'M25 50 L40 45 L70 45 L80 50 L70 55 L40 55 Z M40 45 L35 35 L45 40 M40 55 L35 65 L45 60 M70 50 L80 40 L82 45',
    decoy_names: ['Praying mantis', 'Lobster', 'Crayfish', 'Pistol shrimp'],
    quizzes: [
      {
        q: "How fast does a mantis shrimp's punch travel?",
        choices: ['About a meter per second', 'Bicycle speed', 'Speed of a .22 bullet', 'Speed of sound'],
        a: 2,
        why: "The strike is so fast it cavitates the water — produces a flash of light and heat.",
      },
    ],
  },
  {
    id: 'arctic_fox',
    name: 'Arctic Fox',
    scientific: 'Vulpes lagopus',
    biome: 'tundra',
    status: 'watch',
    hook: 'Survives -50°C without shivering.',
    long: "Coat insulates better than any other mammal — they don't even start shivering until -70°C. They change color seasonally: white in winter, brown-gray in summer. Climate change is bringing red foxes north into their range, and red foxes win.",
    silhouette: 'M50 55 Q35 55 28 45 L22 32 L35 42 Q45 38 50 42 Q55 38 65 42 L78 32 L72 45 Q65 55 50 55 M45 47 L46 47 M54 47 L55 47',
    decoy_names: ['Red fox', 'Fennec fox', 'Snow leopard', 'Ermine'],
    quizzes: [
      {
        q: "What's the biggest threat to arctic foxes today?",
        choices: ['Hunting for fur', 'Red foxes moving north', 'Lack of prey', 'Pollution'],
        a: 1,
        why: "Warmer winters let red foxes — bigger, more aggressive — invade arctic fox territory.",
      },
    ],
  },
  {
    id: 'narwhal',
    name: 'Narwhal',
    scientific: 'Monodon monoceros',
    biome: 'tundra',
    status: 'watch',
    hook: 'That tusk is actually a tooth. With ten million nerve endings.',
    long: "The unicorn of the sea — and yes, the spiral tusk is an oversized canine tooth, growing through the upper lip. It's a sensory organ, detecting water temperature, salinity, and pressure. Climate change is shrinking the sea ice they depend on.",
    silhouette: 'M20 55 Q40 50 60 52 L75 50 L78 35 L78 50 L72 56 Q40 60 20 55 Z M65 52 L80 52',
    decoy_names: ['Beluga whale', 'Orca', 'Walrus', 'Sperm whale'],
    quizzes: [
      {
        q: "What is a narwhal's tusk, anatomically?",
        choices: ['A horn, like a rhino', 'A modified fin', 'A tooth, growing through the lip', 'A bone outgrowth'],
        a: 2,
        why: "It's a sensory tooth — packed with nerves and sensitive to ocean conditions.",
      },
    ],
  },
  // ============================================================
  // THE ARCHIVE — recently lost & critically imperiled
  // ============================================================
  {
    id: 'vaquita',
    name: 'Vaquita',
    scientific: 'Phocoena sinus',
    biome: 'archive',
    status: 'critical',
    hook: 'Fewer than 10 left on Earth. All of them.',
    long: "The world's smallest porpoise, found only in the northern Gulf of California. Drowning in illegal gillnets set for another endangered fish. We have a complete population census because there are so few left we know each one by sight.",
    silhouette: 'M25 50 Q40 45 55 50 L70 48 L72 42 L72 50 L68 54 Q40 58 25 50 Z M50 48 L52 50 L50 52',
    decoy_names: ['Harbor porpoise', "Dall's porpoise", 'Maui dolphin', 'River dolphin'],
    quizzes: [
      {
        q: "What's killing the vaquita?",
        choices: ['Climate change', 'Direct hunting', 'Bycatch in illegal gillnets', 'Disease'],
        a: 2,
        why: "They drown in nets set for the totoaba, another endangered fish poached for its swim bladder.",
      },
    ],
  },
  {
    id: 'thylacine',
    name: 'Thylacine',
    scientific: 'Thylacinus cynocephalus',
    biome: 'archive',
    status: 'extinct',
    hook: 'The last one died alone in a zoo in 1936. We have video.',
    long: "The Tasmanian tiger. A marsupial predator that looked like a striped wolf, killed by a government bounty program. The last known individual, named Benjamin, died of exposure after being locked out of his shelter on a cold night.",
    silhouette: 'M20 55 Q30 50 40 52 L60 52 Q72 50 80 55 L78 60 L60 62 L40 62 L22 60 Z M30 52 L30 48 M70 52 L70 48 M45 58 L45 60 M55 58 L55 60',
    decoy_names: ['Tasmanian devil', 'Dingo', 'Quoll', 'Numbat'],
    quizzes: [
      {
        q: "Why did the thylacine go extinct?",
        choices: ['A disease swept through', 'A government-paid bounty hunt', 'Climate change', 'Loss of prey species'],
        a: 1,
        why: "Tasmania paid £1 per dead thylacine for decades. The bounty was lifted 59 days before the last one died.",
      },
    ],
  },
  {
    id: 'kakapo',
    name: 'Kākāpō',
    scientific: 'Strigops habroptilus',
    biome: 'archive',
    status: 'critical',
    hook: 'Every single living kākāpō has a name.',
    long: "The world's heaviest, only flightless, only nocturnal parrot. Down to 252 individuals — every one is microchipped, named, and managed by a New Zealand recovery team. They smell like honey. They climb trees instead of flying. They are charming beyond all reason.",
    silhouette: 'M50 60 Q35 60 30 50 Q28 38 40 35 Q50 32 60 35 Q72 38 70 50 Q65 60 50 60 M44 48 L46 48 M54 48 L56 48 M48 55 Q50 57 52 55',
    decoy_names: ['Kea', 'Kiwi', 'Takahē', 'Tui'],
    quizzes: [
      {
        q: "How many kākāpō are alive today?",
        choices: ['Around 50', 'Around 250', 'Around 2,500', 'Around 25,000'],
        a: 1,
        why: "Roughly 252 individuals as of recent counts — every one is named and tracked.",
      },
    ],
  },
];

export const BIOMES = [
  { id: 'rainforest', name: 'Rainforest', accent: 'var(--acid)' },
  { id: 'desert', name: 'Desert', accent: 'var(--amber)' },
  { id: 'ocean', name: 'Ocean', accent: 'var(--cyan)' },
  { id: 'tundra', name: 'Tundra', accent: 'var(--sage)' },
  { id: 'archive', name: 'The Archive', accent: 'var(--magenta)' },
];

export const STATUS_LABELS = {
  secure: { label: 'Stable', color: 'var(--status-secure)' },
  watch: { label: 'Watch', color: 'var(--status-watch)' },
  decline: { label: 'Declining', color: 'var(--status-decline)' },
  critical: { label: 'Critical', color: 'var(--status-critical)' },
  extinct: { label: 'Extinct', color: 'var(--status-extinct)' },
};

export const getById = (id) => SPECIES.find((s) => s.id === id);
