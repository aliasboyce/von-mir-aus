/**
 * iOS Safari, when a web app is added to the home screen and launched
 * in standalone mode, has no print UI at all — window.print() is a
 * documented no-op there (WebKit limitation, not a bug in this app).
 * Everywhere else (regular mobile browser tabs, desktop, Android)
 * printing works normally. This is very likely the exact cause behind
 * "I can't tell whether this is just my test environment" — nothing
 * visibly happens, no error, no dialog, because there genuinely is no
 * print capability to invoke in that mode.
 */
export function isStandaloneIOS(): boolean {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    // Older iOS Safari exposes this non-standard property directly.
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return isIOS && isStandalone;
}

/**
 * Call this instead of window.print() directly wherever the app
 * triggers a PDF export. Returns true if printing was actually
 * attempted, false if it was blocked with an explanation shown
 * instead — callers generally don't need the return value, but it's
 * there for the rare case a caller wants to know.
 */
export function triggerPrint(explanationText: string): boolean {
  if (isStandaloneIOS()) {
    window.alert(explanationText);
    return false;
  }
  window.print();
  return true;
}
