import { BODY_SENSATIONS_DE, CONNECTION_ITEMS_DE, FEELING_GROUPS, NEED_CATEGORY_GROUPS } from '../zugang/zugangContent';
import { SENSATION_DESCRIPTIONS_DE, SENSATION_DESCRIPTIONS_EN } from '../zugang/sensationDescriptions';
import { bandForSensation, colorForSensation } from '../zugang/sensationZones';
import { zl } from '../zugang/zugangEn';
import { FEELING_DETAILS } from '../feelings/feelingDetails';
import { indicatorsFor } from '../wertekompass/valueIndicators';
import { valueCardFor } from '../wertekompass/wertekompassData';
import { ACCESS_CHANNEL_META, ACCESS_CHANNEL_ORDER } from '../zugangskanaele/accessChannels';
import { CHANNEL_EXAMPLES } from '../zugangskanaele/channelExamples';
import type { AccessChannel } from '../../data/types';
import { buildEchoIndex, echoLines } from './wordEcho';
import { FEELING_WORD_DE, NEED_WORD_DE } from './wordDescriptions';
import type { CardModel } from './cardTypes';
import type { BuildCtx } from './autoCards';

type Draft = Omit<CardModel, 'number' | 'rarity' | 'color'> & { color?: string };

/** Kurzbeschreibung je Wert (die „Woran merke ich es“-Sätze kommen aus valueIndicators). */
const VALUE_DESC_DE: Record<string, string> = {
  Kreativität: 'Etwas Eigenes entstehen lassen: Ideen, Formen, Wege.',
  Produktivität: 'Etwas schaffen und abschließen, das dir wichtig ist.',
  'soziale Verbindung': 'Mit anderen Menschen im Austausch und zusammen sein.',
  'emotionale Verbindung': 'Sich innerlich mit jemandem verbunden fühlen und Persönliches teilen.',
  Verantwortung: 'Für etwas oder jemanden einstehen, das dir anvertraut ist.',
  Dankbarkeit: 'Das Gute bemerken und wertschätzen.',
  Familie: 'Zugehörigkeit zu Menschen, mit denen du verwandt oder wie verwandt bist.',
  Partnerschaft: 'Eine enge, vertraute Beziehung zu einem Menschen.',
  Freundschaft: 'Beziehungen, die auf Wahl, Vertrauen und Freude beruhen.',
  Gemeinschaft: 'Teil von etwas Größerem zu sein.',
  Identität: 'Wissen, wer du bist, und danach leben.',
  Tageslicht: 'Hell, Sonne, frische Luft: der Körper orientiert sich am Tag.',
  Rhythmus: 'Verlässliche Abläufe, die Halt geben.',
  Natur: 'Verbundenheit mit Pflanzen, Tieren, Jahreszeiten und draußen.',
  Tiere: 'Nähe zu Tieren und Sorge für sie.',
  Schlaf: 'Ausreichend und gut zu schlafen.',
  Erholung: 'Zeiten, in denen du dich ausruhen darfst.',
  'Wasser/Nahrung': 'Dich körperlich versorgen mit Trinken und Essen.',
  Bewegung: 'Deinen Körper bewegen, wie es dir guttut.',
  Integrität: 'Dass dein Handeln zu deinen Überzeugungen passt.',
  Ehrlichkeit: 'Wahrhaftig sein, zu dir und anderen.',
  Spiritualität: 'Verbindung zu etwas, das größer ist als du, wie du es nennst.',
  Sinn: 'Das Gefühl, dass dein Tun und dein Leben Bedeutung hat.',
  Humor: 'Dinge mit Leichtigkeit und Augenzwinkern nehmen.',
  Lachen: 'Herzliches Lachen, allein oder gemeinsam.',
  Neugier: 'Lust, Neues zu entdecken und zu verstehen.',
  Lernen: 'Wachsen, indem du etwas Neues verstehst oder kannst.',
};

const CHANNEL_EMOJI: Record<AccessChannel, string> = {
  denken: '💭', erinnerung: '📖', fuehlen: '💗', koerper_innen: '🫀', sinne: '👁️',
  aufmerksamkeit: '🎯', bewegung: '🚶', ausfuehren: '▶️', beziehung: '🤝', ort_zeit: '🧭',
};

const LATE = '9999-12-31';

/**
 * Vorgefertigte Wort-Karten für „Mein Sammelalbum“: jeder Begriff, den es in der App zu Körperwahrnehmung, Gefühlen,
 * Werten, Bedürfnissen und Zugangskanälen gibt, bekommt eine eigene Karte mit Beschreibung. Sie lesen aus denselben
 * Quellen wie der Rest der App (nichts doppelt gepflegt) und lassen sich im Album ausblenden.
 */
export function buildWordDrafts(ctx: BuildCtx): Draft[] {
  const { t, lang } = ctx;
  const en = lang === 'en';
  const L = (de: string, e: string) => (en ? e : de);
  const out: Draft[] = [];
  const echo = buildEchoIndex();
  const echoDetail = (kind: 'koerper' | 'gefuehl' | 'beduerfnis', w: string) => { const x = echoLines(echo, kind, w, lang); return x ? [{ label: L('Das kennst du schon', 'You already know this'), text: x }] : []; };
  let i = 0;
  const at = () => `${LATE}-${String(i++).padStart(4, '0')}`;

  // Körperwahrnehmung
  [...new Set(BODY_SENSATIONS_DE)].forEach((term) => {
    const desc = (en ? SENSATION_DESCRIPTIONS_EN : SENSATION_DESCRIPTIONS_DE)[term] ?? SENSATION_DESCRIPTIONS_DE[term];
    const band = bandForSensation(term);
    out.push({
      key: `koerper:${term}`,
      kind: 'koerper',
      title: en ? zl(term) : term,
      subtitle: L('Körperwahrnehmung', 'Body sensation'),
      text: desc,
      details: [
        ...(desc ? [{ label: L('Das kann bedeuten', 'This can mean'), text: desc }] : []),
        ...echoDetail('koerper', term),
        ...(band ? [{ label: L('Erregungs-Zone', 'Arousal zone'), text: `${t.polyvagal.arousalZones[band.labelKey as keyof typeof t.polyvagal.arousalZones].label}: ${t.polyvagal.arousalZones[band.labelKey as keyof typeof t.polyvagal.arousalZones].hint}` }] : []),
      ],
      emoji: '🫀',
      color: colorForSensation(term),
      createdAt: at(),
      route: '/zugang',
    });
  });

  // Gefühle: erst die Gefühlsfamilien, dann jedes Gefühlswort einzeln
  const seen = new Set<string>();
  FEELING_GROUPS.forEach((g) => {
    const d = FEELING_DETAILS[g.id];
    out.push({
      key: `gefuehl:group-${g.id}`,
      kind: 'gefuehl',
      title: en ? g.labelEn : g.label,
      subtitle: L('Gefühlsfamilie', 'Feeling family'),
      text: d ? (en ? d.meaningEn : d.meaning) : undefined,
      details: d ? [
        { label: L('Das kann bedeuten', 'This can mean'), text: en ? d.meaningEn : d.meaning },
        { label: L('Typische Gedanken', 'Typical thoughts'), text: (en ? d.typicalThoughtsEn : d.typicalThoughts).join(' · ') },
        { label: L('Im Körper', 'In the body'), text: (en ? d.bodySensationsEn : d.bodySensations).join(', ') },
        { label: L('Gehört dazu', 'Includes'), text: (en ? g.subEn : g.sub).join(', ') },
      ] : [{ label: L('Gehört dazu', 'Includes'), text: (en ? g.subEn : g.sub).join(', ') }],
      emoji: '💗',
      color: g.color,
      createdAt: at(),
      route: '/entdecken/gefuehle',
    });
  });
  FEELING_GROUPS.forEach((g) => {
    const d = FEELING_DETAILS[g.id];
    g.sub.forEach((w, idx) => {
      if (seen.has(w)) return;
      seen.add(w);
      const own = FEELING_WORD_DE[w];
      const fallback = d ? (en ? d.meaningEn : d.meaning) : undefined;
      const text = en ? fallback : own ?? fallback;
      out.push({
        key: `gefuehl:${w}`,
        kind: 'gefuehl',
        title: en ? g.subEn[idx] ?? w : w,
        subtitle: `${L('Gefühl', 'Feeling')} · ${en ? g.labelEn : g.label}`,
        text,
        details: [
          ...(text ? [{ label: L('Das kann bedeuten', 'This can mean'), text }] : []),
          ...echoDetail('gefuehl', w),
          { label: L('Gefühlsfamilie', 'Feeling family'), text: en ? g.labelEn : g.label },
          ...(d ? [{ label: L('Im Körper oft', 'Often in the body'), text: (en ? d.bodySensationsEn : d.bodySensations).join(', ') }] : []),
        ],
        emoji: '💗',
        color: g.color,
        createdAt: at(),
        route: '/entdecken/gefuehle',
      });
    });
  });

  // Werte (Wertekompass)
  CONNECTION_ITEMS_DE.forEach((v) => {
    const ind = indicatorsFor(v);
    const mine = valueCardFor(v);
    const desc = VALUE_DESC_DE[v];
    out.push({
      key: `wert:${v}`,
      kind: 'wert',
      title: en ? zl(v) : v,
      subtitle: L('Wert', 'Value'),
      text: en ? undefined : desc,
      details: [
        ...(!en && desc ? [{ label: L('Was das ist', 'What it is'), text: desc }] : []),
        ...(ind ? [{ label: L('Woran ich es merke', 'How I notice it'), text: (en ? ind.indicatorsEn : ind.indicators).map((x) => `• ${x}`).join('\n') }] : []),
        ...(mine?.personalMeaning ? [{ label: L('Was es für mich bedeutet', 'What it means to me'), text: mine.personalMeaning }] : []),
      ],
      emoji: '🧭',
      createdAt: at(),
      route: '/entdecken/wertekompass',
    });
  });

  // Bedürfnisse
  const seenNeed = new Set<string>();
  NEED_CATEGORY_GROUPS.forEach((g) => {
    g.items.forEach((w, idx) => {
      if (seenNeed.has(w)) return;
      seenNeed.add(w);
      const desc = NEED_WORD_DE[w];
      out.push({
        key: `beduerfnis:${w}`,
        kind: 'beduerfnis',
        title: en ? g.itemsEn[idx] ?? w : w,
        subtitle: `${L('Bedürfnis', 'Need')} · ${en ? g.labelEn : g.label}`,
        text: en ? undefined : desc,
        details: [
          ...(!en && desc ? [{ label: L('Was das ist', 'What it is'), text: desc }] : []),
          ...echoDetail('beduerfnis', w),
          { label: L('Bedürfnisfamilie', 'Need family'), text: `${g.emoji} ${en ? g.labelEn : g.label}` },
        ],
        emoji: g.emoji,
        createdAt: at(),
        route: '/entdecken/beduerfnis-kompass',
      });
    });
  });

  // Zugangskanäle
  ACCESS_CHANNEL_ORDER.forEach((c) => {
    const meta = ACCESS_CHANNEL_META[c];
    const ex = CHANNEL_EXAMPLES[c]?.[en ? 'en' : 'de'];
    out.push({
      key: `zugang:${c}`,
      kind: 'zugang',
      title: meta.label(t),
      subtitle: L('Zugangskanal', 'Access channel'),
      text: meta.hint(t),
      details: [
        { label: L('Was das ist', 'What it is'), text: meta.hint(t) },
        ...(ex ? [
          { label: L('Wenn der Zugang da ist', 'When access is there'), text: ex.there },
          { label: L('Wenn er gerade fehlt', 'When it is missing'), text: ex.missing },
        ] : []),
        ...(meta.crisisReady ? [{ label: L('Gut in schweren Momenten', 'Works in hard moments'), text: L('Dieser Kanal bleibt oft auch dann erreichbar, wenn Denken und Sprechen schwer sind.', 'This channel often stays reachable even when thinking and speaking are hard.') }] : []),
      ],
      emoji: CHANNEL_EMOJI[c],
      createdAt: at(),
      route: '/entdecken/zugangskanaele',
    });
  });

  return out;
}

/** Was im Album-Kapitel „Wörter & Begriffe“ steht (für die Beschreibung am Anfang). */
export const WORD_KINDS = ['koerper', 'gefuehl', 'wert', 'beduerfnis', 'zugang'] as const;
