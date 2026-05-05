import './nav.css';

/**
 * Bottom nav — sticky, thumb-zone friendly.
 * Each tab is a game mode. The five modes correspond to the dopamine-loop
 * mechanics outlined in the project brief:
 *   SWIPE   → Swipe-to-learn (Tinder-for-species)
 *   ID      → Speed-ID (flash-card biome ID)
 *   QUIZ    → Trivia with stakes
 *   HABITAT → Idle/collector view (Pokémon-style "gotta document 'em all")
 *   SURVIVE → Survival sim
 */
const TABS = [
  { id: 'swipe', label: 'Swipe', icon: '◇' },
  { id: 'id', label: 'Speed-ID', icon: '◎' },
  { id: 'quiz', label: 'Quiz', icon: '?' },
  { id: 'habitat', label: 'Habitat', icon: '⌬' },
  { id: 'survive', label: 'Survive', icon: '❋' },
];

export function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav" role="navigation">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`nav-tab ${active === tab.id ? 'is-active' : ''}`}
          onClick={() => onChange(tab.id)}
          aria-current={active === tab.id ? 'page' : undefined}
        >
          <span className="nav-icon" aria-hidden>{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
