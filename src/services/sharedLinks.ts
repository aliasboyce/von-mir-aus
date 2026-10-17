/**
 * Everything the app lets people share (resources, bridges, sources,
 * contacts, letters) travels as a link to one of the app's own
 * "…/importieren" pages. On an iPhone, tapping such a link opens Safari
 * — a different stored copy of the app than the one on the home
 * screen — so the sharing texts ask the other person to COPY the link
 * and paste it into their own app. This is the place where it is
 * pasted: it finds the import route inside whatever was pasted.
 */
const IMPORT_PATHS = [
  '/entdecken/ressourcen/importieren',
  '/bruecken/importieren',
  '/entdecken/lesezeichen/importieren',
  '/sicherheit/kontakte/importieren',
  '/brief/importieren',
  '/entdecken/mindmap/importieren',
];

/** The in-app route (path + query) found in a pasted text, or null. */
export function extractSharedRoute(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  for (const path of IMPORT_PATHS) {
    const i = text.indexOf(path);
    if (i < 0) continue;
    const rest = text.slice(i);
    // up to the next whitespace — the payload is URL-encoded, so it has none
    const end = rest.search(/\s/);
    const route = end < 0 ? rest : rest.slice(0, end);
    if (route.includes('?')) return route;
  }
  // a bare letter code ("z.…" / "p.…")
  const m = text.match(/\b([zp]\.[A-Za-z0-9_-]{8,})/);
  if (m) return `/brief/importieren?d=${m[1]}`;
  return null;
}

export function isStandaloneApp(): boolean {
  try {
    const nav = navigator as Navigator & { standalone?: boolean };
    return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
  } catch {
    return false;
  }
}

export function isIosDevice(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
}

/** True when this page was opened in a browser tab on an iPhone/iPad, i.e. NOT in the home-screen app. */
export function isIosBrowserTab(): boolean {
  return isIosDevice() && !isStandaloneApp();
}

export type ShareKind = 'skill' | 'hilfsmittel' | 'ort' | 'aktivitaet' | 'ressource' | 'bruecke' | 'quelle' | 'kontakt' | 'mindmap';

const KIND_PHRASE: Record<ShareKind, { de: string; en: string }> = {
  skill: { de: 'einen Skill', en: 'a skill' },
  hilfsmittel: { de: 'ein Hilfsmittel', en: 'a tool' },
  ort: { de: 'einen Ort', en: 'a place' },
  aktivitaet: { de: 'eine Aktivität', en: 'an activity' },
  ressource: { de: 'eine Ressource', en: 'a resource' },
  bruecke: { de: 'eine Brücke', en: 'a bridge' },
  quelle: { de: 'eine Quelle', en: 'a source' },
  kontakt: { de: 'einen Kontakt', en: 'a contact' },
  mindmap: { de: 'eine Mindmap', en: 'a mind map' },
};

export function isShareKind(x: unknown): x is ShareKind {
  return typeof x === 'string' && x in KIND_PHRASE;
}

/** "Anna hat dir einen Ort geschickt" — who sent what, as an idea. */
export function sharedHeadline(kind: ShareKind | undefined, from: string | undefined, lang: 'de' | 'en'): string {
  const what = KIND_PHRASE[kind ?? 'ressource'][lang];
  const who = (from ?? '').trim();
  if (lang === 'en') return `${who || 'Someone'} sent you ${what}`;
  return `${who || 'Jemand'} hat dir ${what} geschickt`;
}

/** The message that travels with a shared link — tells the other person how to take it over. */
export function buildShareText(opts: { kind: ShareKind; title: string; url: string; from?: string; lang: 'de' | 'en' }): string {
  const { kind, title, url, from, lang } = opts;
  if (lang === 'en') {
    return `${sharedHeadline(kind, from, 'en')} from “von mir aus” – as an idea to try: “${title}”.\n\nTo take it over: copy this whole message or the link (do not tap the link – on an iPhone that only opens Safari, not your app). Then open your app and paste it under “Received something from someone”.\n\n${url}`;
  }
  return `${sharedHeadline(kind, from, 'de')} aus „von mir aus“ – als Idee zum Ausprobieren: „${title}“.\n\nSo übernimmst du es: Link kopieren (nicht antippen – auf dem iPhone öffnet sich sonst nur Safari, nicht deine App). Dann deine App öffnen und unter „Etwas von jemandem erhalten“ einfügen.\n\n${url}`;
}
