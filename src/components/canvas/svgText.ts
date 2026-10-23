/** Rough text metrics for drawing labels into SVG (print/export), where there is no DOM to measure. */
export function approxTextWidth(text: string, fontSize: number): number {
  let w = 0;
  for (const ch of text) {
    if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(ch)) w += fontSize * 1.15;
    else if (/[A-ZÄÖÜMW@%]/.test(ch)) w += fontSize * 0.68;
    else if (/[ilIjt.,;:'!|]/.test(ch)) w += fontSize * 0.3;
    else w += fontSize * 0.54;
  }
  return w;
}

/** Break text into lines no wider than maxWidth (words stay whole unless a single word is too long). */
export function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\n/)) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push('');
      continue;
    }
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (approxTextWidth(test, fontSize) <= maxWidth || !line) {
        line = test;
        // a single very long word: hard-break it
        while (approxTextWidth(line, fontSize) > maxWidth && line.length > 4) {
          let cut = line.length - 1;
          while (cut > 2 && approxTextWidth(line.slice(0, cut), fontSize) > maxWidth) cut--;
          out.push(line.slice(0, cut));
          line = line.slice(cut);
        }
      } else {
        out.push(line);
        line = w;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

export function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
