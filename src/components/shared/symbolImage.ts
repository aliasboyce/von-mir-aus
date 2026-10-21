/**
 * Picture for the ready-made examples (skills, activities, bridges, impulses).
 *
 * The earlier stock photos came from a service without any keyword search, so
 * a "Piano" card could show a bicycle. These pictures are drawn locally instead:
 * a soft gradient in the colour of the item's category (for skills the colour of
 * the arousal zone they are used in) with one symbol that really fits the title.
 * They work offline, take under 1 KB, and are valid anywhere a photo URL is
 * (cards, details, backups, share links). Your own photos are never replaced.
 */

/** first match wins - more specific words first */
const SYMBOLS: Array<[RegExp, string]> = [
  [/eiskalt|kaltes wasser|tipp|kälte|eis\b/, '🧊'],
  [/gewichtsdecke|tiefendruck|decke|wärmequelle|warm/, '🧣'],
  [/tee|tasse|kaffee/, '🍵'],
  [/4-7-8|bauchatmung|box-atmung|atmung|atem|seufzer|gähn|voo/, '🌬️'],
  [/5-4-3-2-1|kognitives grounding/, '🖐️'],
  [/gewichtswahrnehmung|boden|erdung/, '🦶'],
  [/tanzen/, '💃'],
  [/musik|lied|playlist|piano|klavier|mitwippen/, '🎵'],
  [/auditiv|hören|klang|podcast/, '👂'],
  [/peripher|salamander|augen|oculocardiac|blick/, '👀'],
  [/orientierung|umschauen/, '🧭'],
  [/shaking|zittern|schulterkreisen|isometr|bewegung|bewegen/, '🙌'],
  [/carotis|hand-zug|druck/, '🤲'],
  [/schmetterling|bilateral|klopfen/, '🦋'],
  [/self-holding|umarmung|nähe ohne/, '🤗'],
  [/radikale akzeptanz|bereitwilligkeit|willingness/, '🌤️'],
  [/opposite|entgegengesetzt/, '🔄'],
  [/fakten/, '🔍'],
  [/please|selbstfürsorge/, '💛'],
  [/weise|wise mind|dialekt|balance/, '⚖️'],
  [/accepts|ablenkung/, '🎈'],
  [/improve|moment verbessern/, '🌈'],
  [/lächeln|schmunzeln|humor/, '🙂'],
  [/angenehme gefühle|positive/, '🌻'],
  [/gefühle|gefühl/, '💭'],
  [/problem/, '🧩'],
  [/mastery|innere stärke/, '💪'],
  [/cope|vorausplan|planung/, '🗓️'],
  [/give|beziehungen pflegen/, '🤝'],
  [/fast\b|selbstachtung/, '🌟'],
  [/validierung|zuhören/, '🫶'],
  [/verhaltensänderung|veränderung/, '🌱'],
  [/dear man/, '💬'],
  [/was.?-fertigkeiten|wie.?-fertigkeiten|wahrnehmen|achtsam/, '🧘'],
  [/anrufen|anruf|telefon|sprachnachricht|lebenszeichen|nachricht/, '📞'],
  [/malen|kritzeln|zeichnen|kunst|entstehen|kneten|handwerk|hände/, '🎨'],
  [/aufräumen|ordnung|winzige sache/, '🧺'],
  [/buch|lesen|gedicht|zitat|lernen|neugier|thema|frage/, '📖'],
  [/schreiben|aufschreiben|tagebuch|notiz|gutes sichtbar/, '✍️'],
  [/tier/, '🐾'],
  [/geruch|duft/, '🌸'],
  [/foto|café|cafe|ort\b|lieblingsort/, '📍'],
  [/person|freund|menschen|gespräch|familie/, '🫂'],
  [/wald|natur|baum|grün|spazier|runde gehen|strecke|spaziergang/, '🌳'],
  [/licht|sonne|tageslicht/, '☀️'],
  [/sternen|himmel|klein und gleichzeitig/, '🌌'],
  [/schlaf|ruhe|erholung|nacht/, '🌙'],
  [/rezept|gericht|essen|kochen/, '🍲'],
  [/film|serie|dokumentar/, '🎬'],
  [/spiel|ritual/, '🎲'],
  [/rhythmus|fester punkt|tag\b/, '⏰'],
  [/erinnerung/, '💫'],
  [/symbol|gegenstand|textur|kuschel/, '🧸'],
  [/identität|nur zu mir|meins/, '🔑'],
  [/jacke|hilfsmittel/, '🧰'],
  [/wasser/, '💧'],
];

function pickSymbol(text: string, fallback: string): string {
  const t = text.toLowerCase();
  for (const [re, emoji] of SYMBOLS) if (re.test(t)) return emoji;
  return fallback;
}

function mixWithWhite(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#e9e4da';
  const n = parseInt(m[1], 16);
  const ch = (shift: number) => {
    const v = (n >> shift) & 255;
    return Math.round(v + (255 - v) * amount)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}

/** SVG data URI: gradient in the given colour with a fitting symbol */
export function symbolImage(title: string, color: string, fallbackEmoji = '✨'): string {
  const emoji = pickSymbol(title, fallbackEmoji);
  const light = mixWithWhite(color, 0.82);
  const mid = mixWithWhite(color, 0.62);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${mid}"/></linearGradient></defs>` +
    `<rect width="480" height="360" fill="url(#g)"/>` +
    `<circle cx="400" cy="70" r="110" fill="#fff" opacity=".22"/>` +
    `<circle cx="70" cy="320" r="130" fill="#fff" opacity=".18"/>` +
    `<text x="240" y="225" font-size="150" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">${emoji}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function isSymbolImage(src: string | undefined): boolean {
  return !!src && src.startsWith('data:image/svg+xml;utf8,');
}
