/**
 * useLocalStorage.js — a custom hook for state that survives page reloads.
 *
 * THE PROBLEM: useState gives you a value that lives only as long as the
 * component is mounted. Refresh the page and it's gone. For things like
 * "how many species has the user collected" or "have they finished onboarding,"
 * we want the value to persist across sessions.
 *
 * THE SOLUTION: this hook acts exactly like useState (returns [value, setValue])
 * but also reads from and writes to the browser's localStorage so the value
 * sticks around. Once the backend lands, the same interface can be swapped to
 * sync to a server — no calling code has to change.
 *
 * USAGE:
 *   const [points, setPoints] = useLocalStorage('nemox-points', 0);
 *
 * The first argument is the localStorage key (always namespace with 'nemox-'
 * to avoid collisions with anything else on the same domain). The second is
 * the default value to use the very first time the hook runs (before anything
 * is in storage yet).
 */

// useState gives us the in-memory value. useEffect lets us run side effects
// (like writing to localStorage) after a render commits.
import { useEffect, useState } from 'react';

/**
 * @param {string} key — the localStorage key, e.g. 'nemox-collected'
 * @param {*} initialValue — what to return if there's nothing in storage yet
 * @returns {[*, Function]} — same shape as useState: [value, setValue]
 */
export function useLocalStorage(key, initialValue) {
  // useState here is doing two things:
  //
  // 1. Holding the value in memory so React can re-render when it changes.
  // 2. Initializing that value by reading from localStorage on the very first
  //    render (and ONLY the first render — that's why we pass a function).
  //
  // Passing a function to useState (called "lazy initialization") means React
  // only runs that function once, on the initial mount. If we wrote
  // `useState(JSON.parse(localStorage.getItem(key)))` directly, that read
  // would happen on every render — wasteful and slow.
  const [value, setValue] = useState(() => {
    try {
      // localStorage stores everything as strings. We get back the raw string,
      // then parse it as JSON to recover the original shape (object, array,
      // number, whatever).
      const raw = window.localStorage.getItem(key);

      // null means "key has never been set." Use the caller's default.
      if (raw === null) return initialValue;

      // Otherwise, parse and return whatever we found.
      return JSON.parse(raw);
    } catch {
      // try/catch because:
      //   - JSON.parse throws on malformed JSON (could happen if the schema
      //     changed between versions)
      //   - localStorage access can throw in private/incognito mode in some browsers
      // If anything goes wrong, fall back to the default value so the app
      // still works rather than crashing.
      return initialValue;
    }
  });

  // useEffect runs AFTER React has rendered to the DOM. We use it here to write
  // the value to localStorage every time it changes.
  //
  // The second argument `[key, value]` is the "dependency array." React only
  // re-runs the effect when one of these values changes between renders. So
  // we only write to localStorage when the value actually changed — not on
  // every single render of the component using this hook.
  useEffect(() => {
    try {
      // Convert back to a string for storage.
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Writes can fail too: quota exceeded (very rare with our small data),
      // or private/incognito mode in older Safari. Either way, the in-memory
      // value still works fine for this session — we just lose persistence.
      // Silently ignoring is the right call: there's nothing useful we can
      // do, and crashing the app over a localStorage write is hostile to the user.
    }
  }, [key, value]);

  // Return the same shape useState returns, so this hook is a drop-in replacement.
  return [value, setValue];
}
