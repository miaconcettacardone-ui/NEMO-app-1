/**
 * BottomNav.jsx — the persistent bottom navigation bar.
 *
 * Five tabs, one per gameplay mode. Sticks to the bottom of the screen so it's
 * always reachable with one thumb on mobile (the "thumb zone"). The active
 * tab is visually highlighted; tapping a tab tells the parent (App) to switch
 * modes.
 *
 * This is a "controlled" component: it doesn't track which tab is active
 * itself. The parent passes `active` (current tab id) and `onChange`
 * (function to call when user taps a tab) as props. This keeps the source
 * of truth in one place (App's useState).
 */

// CSS for this component's styles. Vite bundles this into the final stylesheet.
import './nav.css';

/**
 * The list of tabs. Defined as a constant outside the component so it doesn't
 * get recreated on every render — small thing, but a good habit.
 *
 * The `icon` field uses Unicode symbols rather than icon fonts or SVGs because:
 *   1. They're text, so they inherit color from CSS automatically
 *   2. Zero extra bytes — they're just characters
 *   3. They scale perfectly at any font size
 *
 * The Survive icon ❋ (six-spoked floret) reads as foliage/growth — chosen to
 * fit alongside the abstract geometric icons of the other tabs and to evoke
 * the "you are the species" framing of Survive mode.
 */
const TABS = [
  { id: 'swipe', label: 'Swipe', icon: '◇' },
  { id: 'id', label: 'Speed-ID', icon: '◎' },
  { id: 'quiz', label: 'Quiz', icon: '?' },
  { id: 'habitat', label: 'Habitat', icon: '⌬' },
  { id: 'survive', label: 'Survive', icon: '❋' },
  // Explore — the systems-view sixth mode. The ◈ glyph reads as a region
  // or territory marker, sitting comfortably alongside the abstract
  // geometric icons of the other tabs without competing with them.
  { id: 'explore', label: 'Explore', icon: '◈' },
];

/**
 * The component itself.
 *
 * Props:
 *   active   — the id of the currently active tab (string)
 *   onChange — function called with a tab id when the user taps a tab
 *
 * `{ active, onChange }` is destructuring: it pulls those two specific props
 * out of the props object so we can use them as bare variables below.
 */
export function BottomNav({ active, onChange }) {
  return (
    // <nav> is the semantic HTML element for navigation. role="navigation"
    // is technically redundant on a <nav> tag but harmless and explicit for
    // screen readers on older browsers.
    <nav className="bottom-nav" role="navigation">
      {/*
        TABS.map(...) — for each tab in our array, return a <button>. React
        renders the resulting array as a list of elements. This is how you
        render a dynamic list of anything in React: map an array to JSX.
      */}
      {TABS.map((tab) => (
        <button
          // `key` helps React efficiently update the list when items change.
          // Always use a stable id, not the array index. Since tab ids never
          // change, this is perfect.
          key={tab.id}

          // Conditionally include the 'is-active' class. The template literal
          // (backticks) lets us interpolate JS expressions with `${...}`. If
          // this tab is the active one, we add the class; otherwise empty string.
          className={`nav-tab ${active === tab.id ? 'is-active' : ''}`}

          // When clicked, call onChange with this tab's id. The arrow function
          // is needed because we want to pass tab.id, not call onChange right now.
          // (`onClick={onChange(tab.id)}` would call it during render — wrong.)
          onClick={() => onChange(tab.id)}

          // ARIA attribute that announces "current page" to screen readers
          // for the active tab. `undefined` removes the attribute entirely
          // for inactive tabs, which is the correct ARIA pattern.
          aria-current={active === tab.id ? 'page' : undefined}
        >
          {/*
            aria-hidden tells screen readers to skip the icon — they'll just
            read the label, which is more useful. Decorative content always
            gets aria-hidden.
          */}
          <span className="nav-icon" aria-hidden>{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
