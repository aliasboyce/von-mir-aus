/**
 * "An Freunde senden / Hilfe holen / Plan teilen" — one shared way to
 * hand text or a link to another person, with a fallback chain that
 * never ends in silence (the previous per-page copies swallowed a
 * failed clipboard write, so on some devices the button seemed dead,
 * and the emergency "Hilfe holen" message did not even tell the person
 * it had been copied):
 *   1. the system share sheet (phones, the iOS home-screen app);
 *   2. the clipboard, with a confirmation;
 *   3. the old execCommand copy;
 *   4. a prompt that shows the text so it can be copied by hand.
 * Cancelling the share sheet is not an error and falls through to
 * nothing; any OTHER share failure continues down the chain.
 */
export type ShareOutcome = 'shared' | 'copied' | 'manual' | 'cancelled';

export async function shareOrCopy(data: { title?: string; text?: string; url?: string }, copiedMessage: string): Promise<ShareOutcome> {
  const content = data.url ?? data.text ?? '';
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: data.title, text: data.text, url: data.url });
      return 'shared';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return 'cancelled';
      // not allowed / unsupported payload — try copying instead
    }
  }
  try {
    await navigator.clipboard.writeText(content);
    alert(copiedMessage);
    return 'copied';
  } catch {
    // fall through
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = content;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (ok) {
      alert(copiedMessage);
      return 'copied';
    }
  } catch {
    // fall through
  }
  window.prompt(copiedMessage, content);
  return 'manual';
}
