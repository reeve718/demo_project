/**
 * Tracks a single in-flight AbortController and exposes a `run` helper that
 * cancels any previous request before starting a new one. Components and
 * composables use this to debounce map-bbox queries without losing race
 * protection.
 */
export function useAbortableRequest() {
  let controller: AbortController | null = null;

  function run(): AbortSignal {
    if (controller) controller.abort();
    controller = new AbortController();
    return controller.signal;
  }

  function cancel(): void {
    if (controller) {
      controller.abort();
      controller = null;
    }
  }

  function isCurrent(signal: AbortSignal): boolean {
    return controller?.signal === signal;
  }

  return { run, cancel, isCurrent };
}