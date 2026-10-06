import { showIOSPrintFallback } from './iosPrintFallbackBus';
import { exportPrintBlocksToPdf } from './pdf/domToPdf';

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
 * attempted, false if it was blocked — callers generally don't need
 * the return value, but it's there for the rare case a caller wants
 * to know.
 *
 * "PDF funktioniert bei iOS aus der App heraus nicht"-Auftrag — since
 * window.print() is a documented no-op in iOS standalone mode with no
 * workaround, the fix is a working escape hatch: a real <a> tag click
 * to the current URL with target="_blank" reliably breaks out of
 * standalone mode and opens the same page in actual Safari, where
 * printing/"Save to Files as PDF" works normally. A plain
 * window.open() call from JS is less reliable for this on iOS than a
 * genuine anchor click, so this dispatches one instead of using
 * window.open directly.
 */
export function triggerPrint(_explanationText: string, only?: string): boolean {
  // "Mehrere Druckbereiche auf einer Seite"-Fund — window.print() prints
  // EVERY .print-only block in the document, so a button on a page with
  // two of them (Meine Entwicklung) printed both documents together.
  // `only` names the one block (its data-print-id) this button means.
  const blocks = [...document.querySelectorAll<HTMLElement>('.print-only')];
  const skip = only ? blocks.filter((e) => e.dataset.printId !== only) : [];
  skip.forEach((e) => e.setAttribute('data-print-skip', ''));
  const restore = () => skip.forEach((e) => e.removeAttribute('data-print-skip'));
  if (isStandaloneIOS()) {
    // "Das PDF braucht Safari, aber da geht's auch nicht"-Fund — the
    // Safari escape hatch never worked reliably. The print view that is
    // already in the document is turned into a real PDF file and handed
    // to the share sheet instead; the old explanation dialog only
    // appears if there is no print view to convert.
    void exportPrintBlocksToPdf('dokument', only).then((ok) => {
      restore();
      if (!ok) showIOSPrintFallback();
    });
    return false;
  }
  window.addEventListener('afterprint', restore, { once: true });
  window.setTimeout(restore, 120000);
  window.print();
  return true;
}

/** Opens the current page in real Safari from an iOS standalone PWA —
 * see triggerPrint's doc comment for why a synthetic anchor click is
 * used instead of window.open(). */
export function openCurrentUrlInSafari() {
  const a = document.createElement('a');
  a.href = window.location.href;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
