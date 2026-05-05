import { useEffect, useState } from 'react';

/**
 * Tiny localStorage-backed state hook.
 * Reads on mount, writes on every change. Keys are namespaced by the caller.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initialValue;
      return JSON.parse(raw);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota exceeded / private mode — ignore, in-memory state still works
    }
  }, [key, value]);

  return [value, setValue];
}
