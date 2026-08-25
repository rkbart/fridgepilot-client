import { useEffect, type RefObject } from 'react';

/**
 * Focus the referenced search input when the user presses "/" outside
 * of a text-entry element.
 */
export function useFocusSearch(ref: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/') return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (ref.current) {
        e.preventDefault();
        ref.current.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [ref]);
}
