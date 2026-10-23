let listener: (() => void) | null = null;

export function registerIOSPrintFallbackListener(fn: () => void) {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

/** Call this from anywhere to show the shared "open in Safari"
 * fallback modal (rendered once, at the AppShell level). No-op if
 * the modal host isn't mounted for some reason — callers don't need
 * to check. */
export function showIOSPrintFallback() {
  listener?.();
}
