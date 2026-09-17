import { customRef } from 'vue';

/**
 * Returns a ref that only updates after `delayMs` of inactivity.
 * Useful for wiring search inputs to async queries without thrashing
 * the API on every keystroke.
 */
export function useDebounce<T>(initial: T, delayMs = 300) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return customRef<T>((track, trigger) => {
    let value = initial;
    return {
      get() {
        track();
        return value;
      },
      set(newValue: T) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          value = newValue;
          trigger();
        }, delayMs);
      },
    };
  });
}