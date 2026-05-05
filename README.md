# NEMO X

The high-energy, dopamine-loop counterpart to **ProjectNEMO Field Journal**.

Where the Field Journal is a cream-paper field notebook for slow,
contemplative discovery, NEMO X is a dark-mode kinetic interface designed
for someone scrolling on the bus who doesn't yet know they care about
wildlife. Same species universe. Same scientific grounding. Different job.

## Five modes, one loop

| Mode | What it does |
|------|-------------|
| **Swipe** | Tinder-for-species. Drag right to add to your habitat, drag left to skip. Hook line + the long story you earn. |
| **Speed-ID** | 30-second flash-card runs. Name the silhouette before the timer hits zero. Wrong answers cost time. |
| **Quiz** | Trivia with stakes. Wrong answers chip away at your global biosphere meter. Right answers rebuild it. |
| **Habitat** | The collection book. Every species you've documented, with mastery percentages, status, and full descriptions. |
| **Survive** | You are the species. Six seasons of real conservation pressures — habitat loss, gillnets, climate, bounties. Your choices, real outcomes. |

All five share one persistent state: XP, level, streak, biosphere health,
mastery per species. Performance in any mode feeds every other mode.

## Stack

- Vite + React 18 (no backend, no router, no state library)
- Vanilla CSS with CSS variables
- `localStorage` for persistence
- Google Fonts: Bricolage Grotesque (display) + JetBrains Mono (HUD)
- Zero image assets — every species visual is a hand-authored SVG silhouette

## Getting it running

```bash
npm install
npm run dev
```

That's it. Open http://localhost:5173.

To build for deployment:

```bash
npm run build
```

The `dist/` folder is fully static. Drop it on GitHub Pages, MAMP,
Netlify, or any CDN. `vite.config.js` uses `base: './'` so it works in a
subdirectory without configuration.

## Design philosophy

- **You learn best when you don't know you're being taught.** Every species,
  fact, and event in the game is real and verifiable. The "game" wrapping
  is real conservation content with the friction removed.
- **Tonal opposite of the Field Journal, not a reskin.** Different aesthetic,
  different pacing, different audience. Same scientific spine.
- **Honest framing.** The Survive mode doesn't simulate fictional pressures —
  it simulates the actual ones. The Archive doesn't celebrate extinction
  as gimmick — it remembers.

## Adding species

Edit `src/data/species.js`. Each entry has:

- `id`, `name`, `scientific`, `biome`, `status`
- `hook` — the dopamine-grade one-liner that lands on a swipe card
- `long` — the deeper paragraph users earn by tapping "tell me more"
- `silhouette` — an SVG path for the glyph (drawn on a 100x100 viewBox)
- `decoy_names` — confusable names used by Speed-ID
- `quizzes` — multiple-choice questions

When the real backend is ready, swap the static export for `fetch('/api/species')`. The components don't change.

## File layout

```
src/
├── App.jsx                 # composition root
├── main.jsx                # React entry
├── components/
│   ├── HUD.jsx             # top status bar (rank, XP, streak, biosphere)
│   ├── BottomNav.jsx       # 5-tab nav
│   ├── Onboarding.jsx      # one-tap splash
│   ├── SpeciesGlyph.jsx    # SVG silhouette renderer
│   └── ToastLayer.jsx      # level-up + new-discovery banners
├── modes/
│   ├── SwipeMode.jsx       # Tinder-for-species
│   ├── SpeedIDMode.jsx     # timed flash-card runs
│   ├── QuizMode.jsx        # trivia w/ biosphere stakes
│   ├── HabitatMode.jsx     # collection grid + detail modal
│   └── SurviveMode.jsx     # 6-season survival sim
├── hooks/
│   ├── useGameState.jsx    # central state + level curve
│   └── useLocalStorage.js  # tiny persistence hook
├── data/species.js         # species + biome catalog
└── styles/
    ├── global.css          # palette, type, motion, scan-line texture
    └── app.css             # layout shell
```

## Is this the same as the Field Journal?

No. They share the species data and the mission, but they're different
products doing different jobs:

- **Field Journal** — slow, contemplative, two-tier descriptions (general
  + scientific), researcher's notebook aesthetic. For donors, science-curious
  adults, classrooms.
- **NEMO X** — fast, kinetic, mission-control aesthetic. For someone who
  doesn't know yet that they care about wildlife.

Run them side by side. They feed the same audience pipeline from opposite
ends.

## License

For ProjectNEMO use. Contact the maintainer for anything else.
