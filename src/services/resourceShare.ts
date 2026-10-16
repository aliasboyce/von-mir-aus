import type { Resource, SkillDetails, HilfsmittelDetails, NeedDirection, AccessChannel } from '../data/types';
import type { FitProfile } from '../content/fitCriteria';
import type { ShareKind } from './sharedLinks';
import { imageForShare } from './shareImage';
import { umstandLabel } from '../features/bridges/conditions';

/**
 * Everything a person filled in for a skill / tool / place / activity travels
 * inside the link: texts, steps, circumstances, energy, time/effort, access
 * channels, the picture (as a small thumbnail). Kept on the device only: the
 * safe-place photo and voice note, favourite and network flags, and ids of
 * other items (their titles go along as a hint instead).
 */
export interface SharedResourcePayload {
  v?: 2;
  title: string;
  description?: string;
  categoryLabel?: string;
  /** built-in category id of the sender (the receiver only uses it if it knows it) */
  category?: string;
  subcategory?: string;
  link?: string;
  note?: string;
  tags?: string[];
  from?: string;
  kind?: ShareKind;
  umstaende?: Array<{ label: string; emoji?: string }>;
  linkedNeeds?: NeedDirection[];
  energyLevel?: 1 | 2 | 3 | 4;
  fit?: FitProfile;
  accessChannels?: AccessChannel[];
  skillDetails?: Partial<SkillDetails>;
  hilfsmittelDetails?: Partial<HilfsmittelDetails>;
  /** titles of the tools the sender listed as needed for this skill */
  needs?: string[];
  image?: string;
}

const nonEmpty = (v: unknown) => !(v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0));

/** drops empty values so the link stays short */
function compact<T extends object>(obj: T | undefined): Partial<T> | undefined {
  if (!obj) return undefined;
  const out: Record<string, unknown> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (nonEmpty(v)) out[k] = v;
  });
  return Object.keys(out).length ? (out as Partial<T>) : undefined;
}

export async function buildResourcePayload(
  resource: Resource,
  extra: { categoryLabel: string; from?: string; kind: ShareKind; neededTitles?: string[] },
): Promise<SharedResourcePayload> {
  const { relatedHilfsmittelIds: _ids, ...skill } = resource.skillDetails ?? {};
  void _ids;
  const payload: SharedResourcePayload = {
    v: 2,
    title: resource.title,
    description: resource.description,
    categoryLabel: extra.categoryLabel,
    category: resource.category,
    subcategory: resource.subcategory,
    link: resource.link,
    note: resource.note,
    tags: resource.tags,
    from: extra.from,
    kind: extra.kind,
    umstaende: (resource.umstaende ?? [])
      .map((k) => umstandLabel(k))
      .filter((u): u is NonNullable<typeof u> => !!u)
      .map((u) => ({ label: u.label, emoji: u.emoji })),
    linkedNeeds: resource.linkedNeeds,
    energyLevel: resource.energyLevel,
    fit: compact(resource.fit),
    accessChannels: resource.accessChannels,
    skillDetails: resource.skillDetails ? compact(skill) : undefined,
    hilfsmittelDetails: compact(resource.hilfsmittelDetails),
    needs: extra.neededTitles,
    image: await imageForShare(resource.image),
  };
  // JSON.stringify drops undefined; empty arrays/strings are removed here
  Object.keys(payload).forEach((k) => {
    const key = k as keyof SharedResourcePayload;
    if (!nonEmpty(payload[key])) delete payload[key];
  });
  return payload;
}

const str = (v: unknown, max = 4000) => (typeof v === 'string' && v.trim() ? v.slice(0, max) : undefined);
const strList = (v: unknown, maxItems = 40) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, maxItems).map((x) => x.slice(0, 1000)) : undefined);

function pickStrings<K extends string>(src: unknown, keys: readonly K[], lists: readonly K[] = []): Partial<Record<K, string | string[]>> {
  const out: Partial<Record<K, string | string[]>> = {};
  if (!src || typeof src !== 'object') return out;
  const o = src as Record<string, unknown>;
  keys.forEach((k) => {
    const v = lists.includes(k) ? strList(o[k]) : str(o[k]);
    if (v && (!Array.isArray(v) || v.length)) out[k] = v;
  });
  return out;
}

const SKILL_KEYS = ['subtitle', 'modality', 'zoneIds', 'anspannungsbereich', 'ausloeser', 'fruehwarnzeichen', 'wirkung', 'wirkungsdauer', 'schritte', 'gegenanzeigen', 'unterwegsAlternative'] as const;
const HILFSMITTEL_KEYS = ['subtitle', 'zoneIds', 'beruhigungTrost', 'fokusAblenkung', 'ventilAnspannung', 'anspannungsbereich', 'alarmSituation', 'dauer', 'methode', 'ausschlusskriterium', 'platzZuhause', 'platzUnterwegs', 'bereitschaft'] as const;

/** Only known fields of the right type are taken over from a received link. */
export function sanitizeDetails(p: SharedResourcePayload): { skillDetails?: SkillDetails; hilfsmittelDetails?: HilfsmittelDetails } {
  const out: { skillDetails?: SkillDetails; hilfsmittelDetails?: HilfsmittelDetails } = {};
  if (p.skillDetails) {
    const s = pickStrings(p.skillDetails, SKILL_KEYS, ['zoneIds', 'schritte']) as Record<string, unknown>;
    if (s.modality !== 'koerper' && s.modality !== 'kognitiv') delete s.modality;
    if (Object.keys(s).length) out.skillDetails = s as SkillDetails;
  }
  if (p.hilfsmittelDetails) {
    const h = pickStrings(p.hilfsmittelDetails, HILFSMITTEL_KEYS, ['zoneIds']);
    if (Object.keys(h).length) out.hilfsmittelDetails = h as HilfsmittelDetails;
  }
  return out;
}

export function sanitizeFit(fit: unknown): FitProfile | undefined {
  if (!fit || typeof fit !== 'object') return undefined;
  const f = fit as Record<string, unknown>;
  const out: FitProfile = {};
  if (typeof f.minutes === 'number' && f.minutes > 0 && f.minutes < 1000) out.minutes = f.minutes;
  if (f.effort === 1 || f.effort === 2 || f.effort === 3) out.effort = f.effort;
  return Object.keys(out).length ? out : undefined;
}

export { str as sharedStr, strList as sharedStrList };
