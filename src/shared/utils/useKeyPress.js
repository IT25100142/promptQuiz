import { useEffect } from 'react';

/**
 * Custom hook to bind a map of keys to handler functions.
 * Handles auto-cleanup to prevent memory leaks.
 * 
 * @param {Object} keyMap - An object mapping keys (e.g. 'Escape', ' ', '1') to callback functions.
 * @param {boolean} disabled - Whether the listeners are disabled.
 */
export function useKeyPress(keyMap, disabled = false) {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event) => {
      // Ignore keypresses if the user is typing in an input or textarea
      const targetTag = event.target.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') {
        return;
      }

      const handler = keyMap[event.key];
      if (handler) {
        // Prevent browser default behaviors (like space scrolling page down)
        if (event.key === ' ') {
          event.preventDefault();
        }
        handler(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [keyMap, disabled]);
}
