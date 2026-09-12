export type DiaryFont = 'klar' | 'sanft' | 'handschriftlich' | 'elegant' | 'verspielt';

export const DIARY_FONT_ORDER: DiaryFont[] = ['klar', 'sanft', 'handschriftlich', 'elegant', 'verspielt'];

/** A small, curated set rather than a long font picker - quality over
 * quantity. Legibility is preserved even for the more characterful
 * options: "handschriftlich" and "verspielt" use a larger base size and
 * more line-height so they stay comfortably readable at diary-entry
 * length, not just for a short heading. */
export const DIARY_FONT_META: Record<DiaryFont, { family: string; fontSize: string; lineHeight: string }> = {
  klar: { family: "'Inter', system-ui, sans-serif", fontSize: '15px', lineHeight: '1.7' },
  sanft: { family: "'Quicksand', system-ui, sans-serif", fontSize: '15px', lineHeight: '1.75' },
  handschriftlich: { family: "'Caveat', cursive", fontSize: '19px', lineHeight: '1.5' },
  elegant: { family: "'Fraunces', Georgia, serif", fontSize: '15px', lineHeight: '1.75' },
  verspielt: { family: "'Baloo 2', system-ui, sans-serif", fontSize: '15px', lineHeight: '1.75' },
};
