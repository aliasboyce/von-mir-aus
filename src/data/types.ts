/**
 * Central data model for InnerPath.
 *
 * Every domain entity is declared here so that UI and storage code share a
 * single source of truth. When new systems (Diary Cards, polyvagal curves,
 * sync, sharing…) get added later, extend the types here first.
 */

// ---------------------------------------------------------------------------
// Inner Weather
// ---------------------------------------------------------------------------

/** The seven gentle "weather" states used for the check-in. */
export type WeatherCondition =
  | 'klar'
  | 'sonnig'
  | 'bewoelkt'
  | 'windig'
  | 'regnerisch'
  | 'gewitter'
  | 'nebel';

export interface WeatherCheckIn {
  id: string;
  /** ISO timestamp of the check-in */
  createdAt: string;
  condition: WeatherCondition;
  /** Optional freeform note the person may add */
  note?: string;
  /** Optional selected need, bridges the check-in to the Bedürfnis-Kompass later */
  need?: NeedDirection;
}

/** Broad "compass" directions a need can point to — intentionally not a diagnosis.
 * Loosely informed by the GFK/NVC needs categories (Rosenberg): physical
 * needs, connection/empathy, autonomy, peace, orientation, growth/meaning. */
export type NeedDirection =
  | 'verbindung'
  | 'zugehoerigkeit'
  | 'autonomie'
  | 'sicherheit'
  | 'ruhe'
  | 'orientierung'
  | 'bewegung'
  | 'ausdruck'
  | 'wertschaetzung'
  | 'freude'
  | 'sinn'
  | 'koerperliche_versorgung'
  | 'schlaf'
  /** "Neue Beduerfnisse"-Auftrag — Selbstwirksamkeit and koerperliche
   * Unversehrtheit added as their own selectable needs, distinct from
   * existing nearby ones (koerperliche_versorgung is about GETTING
   * what the body needs; koerperliche_unversehrtheit is about safety
   * FROM harm/pain/illness — a different nuance). */
  | 'selbstwirksamkeit'
  | 'koerperliche_unversehrtheit';

/** Two loose, practical groupings — deliberately NOT a strict hierarchy
 * (see NEED_META / NeedsCompassPage for the explicit note that both
 * groups can matter at the same time; this is a filing category for the
 * picker UI, not a claim that one must come before the other). */
export type NeedCategory = 'koerperlich' | 'psychisch_sozial';

// ---------------------------------------------------------------------------
// Sicheres Netz (Safe Network) + Wichtige Kontakte
// ---------------------------------------------------------------------------

export type NetworkCategory = 'person' | 'ort' | 'aktivitaet' | 'ressource' | string;

/** What a network entry can help with — chosen by the person, not inferred. */
/** "Wie hilft mir das"-Auftrag — the four built-in values stay as
 * autocomplete-friendly literals, but the field also accepts a
 * person's own custom text now (matches the same open-string pattern
 * already used for e.g. bridge/resource categories). */
export type HelpsWith = 'alltag' | 'krise' | 'vorbeugung' | 'entscheidung' | string;

/** A user-defined (or built-in) category: label, color and icon key are all editable. */
export interface NetworkCategoryConfig {
  id: string;
  label: string;
  /** hex color, resolved from a palette or picked freely */
  color: string;
  /** key into ICONS_BY_KEY (components/icons/networkIcons.ts) */
  iconKey: string;
  isCustom: boolean;
}

export interface ColorPalette {
  id: string;
  name: string;
  /** one color per category id, keyed by NetworkCategoryConfig.id */
  colors: Record<string, string>;
  isCustom: boolean;
}

export interface NetworkEntry {
  id: string;
  name: string;
  category: NetworkCategory;
  /** e.g. "Vertrauter Freund", "Fachärztliche Hilfe" */
  role?: string;
  description?: string;
  note?: string;
  phone?: string;
  email?: string;
  helpsWith: HelpsWith[];
  /** Marks entries surfaced in the dedicated "Wichtige Kontakte" list (capped to 5 shown, rest reachable via "Alle Kontakte") */
  isImportantContact?: boolean;
  /**
   * Normalized position (0–1 on both axes) within the network graph canvas,
   * 0.5/0.5 being the center. Unset until the user drags the node for the
   * first time — until then an auto-layout places it in a circle.
   */
  position?: { x: number; y: number };
  /** key into ICONS_BY_KEY — used when no photo is set */
  iconKey?: string;
  /** base64 data URL of an uploaded photo; takes precedence over iconKey when set */
  photoDataUrl?: string;
  /** zoom (1 = fills the circle, up to ~2.5) and pan offset (-50 to 50, in
   * percent of the frame) for positioning the photo within its circular
   * avatar — lets the person recenter a photo instead of being stuck with
   * whatever the default center-crop happens to show. */
  photoScale?: number;
  photoOffsetX?: number;
  photoOffsetY?: number;
  /**
   * ids of other (person) entries this one is in active exchange with —
   * rendered as a distinct "communication path" between the two nodes.
   */
  connections?: string[];
  /**
   * Free-form structural links to other entries (any category, not just
   * people) — a mindmap-style connection distinct from the "communication"
   * one above. Rendered as a solid line, no phone icon, so it reads
   * visually differently from an active-exchange connection.
   */
  linkedTo?: string[];
  /** links an "aktivitaet"/"ressource" node to a concrete Resource entry */
  linkedResourceId?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Zugangsrad (Access Wheel)
// ---------------------------------------------------------------------------

export type AccessWheelDomain =
  | 'wissen'
  | 'faehigkeiten'
  | 'ressourcen'
  | 'menschen'
  | 'orte'
  | 'handlung'
  | 'strategien';

export interface AccessWheelEntry {
  id: string;
  domain: AccessWheelDomain;
  label: string;
  /** 0 (kaum zugänglich) – 100 (gut zugänglich), self-reported, not scored */
  accessibility: number;
  /** concrete, already-saved things that represent this domain — turns the
   * abstract self-rating into a real link to what actually helps */
  linkedResourceIds: string[];
  linkedBridgeIds: string[];
  linkedContactIds: string[];
  updatedAt: string;
}

export const ACCESS_WHEEL_DOMAIN_ORDER: AccessWheelDomain[] = [
  'wissen',
  'faehigkeiten',
  'ressourcen',
  'menschen',
  'orte',
  'handlung',
  'strategien',
];

// ---------------------------------------------------------------------------
// Brücken (Bridges)
// ---------------------------------------------------------------------------

export type BridgeCategory = 'zu_mir' | 'zum_koerper' | 'zu_anderen' | 'nach_aussen' | string;

export interface BridgeLevel {
  level: number;
  title: string;
  description: string;
  /** "Level einem Energielevel zuordnen, genauso wie bei Ressourcen"-
   * Auftrag — same 1/2/3 scale as Resource.energyLevel, so a person
   * can filter/pick a bridge level by how much capacity they have
   * right now, not just by intensity/depth. */
  energyLevel?: 1 | 2 | 3;
}

export interface Bridge {
  id: string;
  title: string;
  category: BridgeCategory;
  /** "Mehrere Kategorien gleichzeitig auswaehlbar"-Auftrag — optional,
   * additive alongside `category` (which stays the primary/first pick
   * and is what every existing display spot still reads for a single
   * badge or icon). When set, this is the FULL set the person chose,
   * and is what filtering checks against so a bridge can show up
   * under every category it belongs to, not just one. Undefined for
   * any bridge that only ever had the single legacy `category` —
   * callers that care about the full set should read
   * `bridge.categories ?? [bridge.category]`. */
  categories?: BridgeCategory[];
  /** Path or URL to a representative image */
  image: string;
  description: string;
  levels: BridgeLevel[];
  tip?: string;
  favorite: boolean;
  /** Demo content ships with isCustom = false; user-created bridges are custom */
  isCustom: boolean;
  /** Which values/life directions this bridge can serve — deliberately
   * multiple, not a single forced category (see the "Verbindung, Inhalt"
   * brief, Section 17/18: a bridge like "walk in the park with someone"
   * can be Nature, Connection, and Movement at once). Reuses the exact
   * same vocabulary as Zugang's own "Verbindung zum Leben" step
   * (CONNECTION_ITEMS_DE) and the Wertekompass — no second value list. */
  connectionTags?: string[];
  /** "Verbinden" brief, Section 8 — a bridge can also optionally be
   * linked to the needs it addresses and the obstacles it helps with
   * despite, using the exact same vocabularies as Zugang's own need/
   * obstacle steps (NEED_CATEGORY_GROUPS / OBSTACLES_DE) — no second
   * parallel list, same principle as connectionTags above. */
  linkedNeeds?: string[];
  linkedObstacles?: string[];
  /** "ChatGPT-Konzept" brief — a new category the user explicitly asked
   * for: not just "did this help" but "under what conditions does it
   * actually work". A bridge like "reading" might only be accessible
   * in the morning, with tea, without time pressure — capturing that
   * is far more useful than a flat yes/no on the activity itself. */
  conditions?: string[];
  /** Same sensory-modality tagging as Resource — a bridge often engages
   * a sense directly (e.g. "cold water on wrists" is tactile). */
  sensoryModalities?: string[];
}

// ---------------------------------------------------------------------------
// Ressourcen
// ---------------------------------------------------------------------------

export type ResourceCategory =
  | 'musik'
  | 'natur'
  | 'wissen'
  | 'videos'
  | 'texte'
  | 'orte'
  | 'uebungen'
  | 'menschen'
  | 'sonstiges'
  | string;

export interface Resource {
  id: string;
  title: string;
  description?: string;
  category: ResourceCategory;
  /** Path or URL to a representative image — REQUIRED, deliberately
   * matching Bridge.image's non-optional pattern. This field being
   * optional was the exact structural gap that let the photo feature
   * silently regress to icons/emoji in past sessions: an optional
   * field lets code compile even when a resource is created without a
   * picked image, so the omission is invisible until someone notices
   * a blank card. Making it required means any future code path that
   * forgets to set an image fails to compile instead of failing
   * silently — see suggestedImage() in services/suggestedImages.ts for
   * the real-photo (Lorem Picsum) default. */
  image: string;
  /** "Energie als Kostenfilter"-Brief — deliberately NOT a new
   * screening flow or mandatory field: an optional, quiet tag for how
   * much energy this resource typically takes. Resources only —
   * Bridges already have their own "levels" progression and don't
   * need a second, overlapping energy concept on top of that. 1 =
   * sehr wenig, 2 = etwas, 3 = geht gerade. */
  energyLevel?: 1 | 2 | 3;
  note?: string;
  link?: string;
  tags: string[];
  /** Ergotherapie-Perspektive, Perspektiven-Audit — which sense(s) this
   * resource primarily works through, independent of its category.
   * Lets someone find "what regulates through movement" rather than
   * only browsing by topic. See sensoryModalities.ts for the full list. */
  sensoryModalities?: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Sicherheitsplan (Safety Plan)
// ---------------------------------------------------------------------------

export interface SafetyPlanSection {
  /** stable key, e.g. 'wasbrauche' */
  key: string;
  title: string;
  items: string[];
}

/** Traffic-light tiers for escalation, from "beginnt gerade" to "außer Kontrolle". */
export type WarningTier = 'gelb' | 'orange' | 'rot';

export interface TieredItem {
  id: string;
  text: string;
  tier: WarningTier;
}

/** references into other parts of the app, scoped to one warning tier —
 * up to 3 of each per tier, so a crisis moment offers a short, chosen list
 * for exactly the situation at hand rather than one long undifferentiated one */
export interface TierLinkedItems {
  resourceIds: string[];
  bridgeIds: string[];
  contactIds: string[];
}

export interface SafetyPlan {
  /** now supports multiple named plans, e.g. one general + one for dissociation */
  id: string;
  name: string;
  warningSignals: TieredItem[];
  /** free-text "what helps" notes, still tier-tagged — kept alongside the
   * structured linkedByTier picks below rather than replaced by them, so
   * nothing a person already wrote here is lost */
  helpItems: TieredItem[];
  linkedByTier: Record<WarningTier, TierLinkedItems>;
  sections: SafetyPlanSection[];
  updatedAt: string;
}

export interface CrisisContact {
  label: string;
  number: string;
  hint: string;
}

/** Fixed, official, nationwide (Germany) — not user-editable, always shown. */
export const OFFICIAL_CRISIS_CONTACTS: CrisisContact[] = [
  { label: 'TelefonSeelsorge', number: '116123', hint: '24/7 · kostenlos · anonym · bei jeder Art von Krise' },
  { label: 'Ärztlicher Bereitschaftsdienst', number: '116117', hint: 'dringende, nicht lebensbedrohliche Anliegen' },
  { label: 'Notruf', number: '112', hint: 'bei akuter Lebensgefahr' },
];

/** Additional, less universally-relevant crisis contacts — kept separate
 * and collapsed behind "Weitere Anlaufstellen" so the screen doesn't show
 * many numbers at once. Verified against each organization's own current
 * page (see docs/open-issues.md) rather than assumed from memory. */
export const ADDITIONAL_CRISIS_CONTACTS: CrisisContact[] = [
  {
    label: 'Hilfetelefon Gewalt gegen Frauen',
    number: '116016',
    hint: '24/7 · kostenlos · anonym · auch erreichbar unter 08000 116 016',
  },
  {
    label: 'LARA — Fachstelle gegen sexualisierte Gewalt (Berlin)',
    number: '03021688 88',
    hint: 'Mo–Fr 9–18 Uhr · für Frauen, trans*, inter* und nicht-binäre Personen',
  },
];

// ---------------------------------------------------------------------------
// Tagebuch (Diary)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Gespeicherte Quellen / Lesezeichen
// ---------------------------------------------------------------------------

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  note?: string;
  /** references a BookmarkCategory id — categories are fully user-editable,
   * unlike Bridges/Resources' fixed-plus-custom split */
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType = 'resource' | 'bridge' | 'contact' | 'checkin';

/**
 * A lightweight, shared log of "I used/did this" moments — the single
 * underlying data source for several Phase-9 features (Zuletzt genutzt,
 * Wochenrückblick, Das habe ich geschafft, Hat mir geholfen) so each of
 * those is a different VIEW over the same events, not four separate
 * tracking systems. Stores `label` redundantly (not just refId) so an
 * entry still reads sensibly even if the referenced resource/bridge was
 * later renamed or deleted.
 */
export interface ActivityEvent {
  id: string;
  type: ActivityType;
  refId?: string;
  label: string;
  createdAt: string;
  /** optional, only set if the person answered "Hat mir geholfen?" — the
   * app never asks this itself as a requirement, it's always skippable */
  helpfulness?: 'ja' | 'einBisschen' | 'nein';
}

// ---------------------------------------------------------------------------
// Mein Garten — ONE unified system for both "things I want to build up"
// and "things I want to change/reduce". Both are day-based trackers that
// make a shared garden grow; they differ in how progress is measured
// (continuous days vs. discrete check-ins), tracked via `kind`.
// ---------------------------------------------------------------------------

export type GardenEntryKind = 'aufbau' | 'veraenderung';
export type GardenEntryStatus = 'active' | 'paused' | 'ended';
export type GardenPlantStyle =
  | 'bluete_rose'
  | 'bluete_gaensebluemchen'
  | 'bluete_mohn'
  | 'bluete_tulpe'
  | 'bluete_sonnenblume'
  | 'bluete_lavendel'
  | 'strauch'
  | 'ranke'
  | 'sukkulente'
  | 'baum_rund'
  | 'baum_schlank'
  | 'baum_ausladend'
  | 'baum_bluetenbaum'
  | 'baum_nadelbaum';
export type HabitFrequency = 'daily' | 'weekly' | 'weekday';
export type GardenWeekday = 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su';
/** Purely a display choice — "how the personal counter is framed" —
 * never affects how often the garden itself is allowed to grow (see
 * gardenGrowth.ts: growth is always capped at once per calendar day,
 * regardless of this setting). */
export type GardenCountingMode = 'days' | 'hours' | 'sunrises';

export interface GardenHistoryEvent {
  id: string;
  type: 'started' | 'reset' | 'paused' | 'resumed' | 'ended' | 'milestone';
  at: string;
  note?: string;
}

export interface GardenEntry {
  id: string;
  name: string;
  kind: GardenEntryKind;
  createdAt: string;
  status: GardenEntryStatus;
  /** a small personalization touch (Punkt 20) — which plant shape
   * represents this entry in the shared garden scene */
  plantStyle: GardenPlantStyle;

  // --- 'veraenderung' entries: continuous days since startedAt, never a
  // raw stored count, so nothing needs to be kept in sync on reset ---
  startedAt?: string;
  pausedAt?: string;
  history?: GardenHistoryEvent[];

  // --- 'aufbau' entries: simple day-stamp check-ins ---
  frequency?: HabitFrequency;
  targetPerWeek?: number;
  /** only meaningful when frequency === 'weekday' — which single day of
   * the week this is meant to recur on (e.g. "every Monday") */
  weekday?: GardenWeekday;
  checkIns?: string[];
  /** opt-in for the in-app companion nudge (see GardenReminderPrompt) —
   * deliberately not tied to any push-notification system, since none
   * exists yet; this is a real, working "when you open the app" nudge,
   * not a placeholder for a future feature. */
  reminderEnabled?: boolean;
  countingMode?: GardenCountingMode;
  /** when true, check-ins record a full timestamp (see checkInTimestamps)
   * instead of just a date, since more than one per day is meaningful —
   * growth itself is still capped at once per calendar day either way. */
  multipleTimesPerDay?: boolean;
  /** Variante A: a target count per day (e.g. "3x am Tag"), shown as
   * progress toward that count rather than specific clock times. */
  dailyTargetCount?: number;
  /** Variante B: specific target times per day (e.g. ['09:00','14:00']) —
   * mutually exclusive with dailyTargetCount in the creation UI, but
   * both are optional so an entry can also have neither (open-ended
   * "as many times as you like" tracking). */
  dailyTargetTimes?: string[];
  /** full ISO timestamps, one per "Jetzt erledigt" tap, used instead of
   * (not in addition to) checkIns when multipleTimesPerDay is set. */
  checkInTimestamps?: string[];
}

/** Pure documentation, never interpretation — the app never claims a link
 * between an entry here and mood/state elsewhere. Any such connection is
 * something only the person themselves may notice and write down (in the
 * optional note), never something the app asserts. */
export interface MediLogEntry {
  id: string;
  name: string;
  /** free text on purpose — not validated against any dosage database */
  amount?: string;
  /** structured numeric dose + unit, used for the 24h/7-day/average
   * statistics and the history chart — kept separate from `amount` (free
   * text) since not every entry necessarily has a clean numeric dose. */
  doseValue?: number;
  doseUnit?: string;
  takenAt: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  /** optional reference to a SavedMedication — used to pull its color
   * into charts and to detect "same medication" reliably even if the
   * person edits the free-text name slightly on one particular entry.
   * Entries without this (older data, or one-off medications never
   * saved) still work exactly as before, grouped by name. */
  medicationId?: string;
  /** 'taken' (or absent, for backward compatibility with every entry
   * created before this field existed) means an actual dose was taken
   * and this entry counts toward mg totals, charts, and diary
   * auto-transfer. 'skipped' means a scheduled recurring dose was
   * deliberately NOT taken — it must never be silently treated as "0mg
   * taken" for statistics, but still needs to be visible in the day
   * view as a record that the choice was made. */
  status?: 'taken' | 'skipped';
  /** if this entry fulfills (confirms or skips) a specific scheduled
   * RecurringMedication instance, these two fields identify exactly
   * which one and which of its daily time slots — used purely to avoid
   * re-prompting for something already answered today. */
  recurringMedicationId?: string;
  recurringTimeSlot?: string;
}

/** A medication saved once so it doesn't need retyping every time — see
 * "Medikamente verwalten". The typical dose is only ever a suggestion:
 * MediLogEntry always stores its own doseValue independently, so a
 * person can log a different amount than usual without changing what's
 * "typical" for next time. */
export interface SavedMedication {
  id: string;
  name: string;
  typicalDoseValue?: number;
  typicalDoseUnit?: string;
  /** hex color, used consistently for this medication across all charts */
  color: string;
  createdAt: string;
}

export type RecurringMedicationDay = 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su';

/**
 * A standing rule ("this medication is scheduled daily at 08:00"), NOT
 * an actual dose taken — deliberately a separate concept from both
 * SavedMedication (just a name+typical-dose template) and MediLogEntry
 * (an actual documented dose). A RecurringMedication only ever produces
 * a real MediLogEntry once the person explicitly confirms it was taken
 * or explicitly marks it skipped; it is never assumed.
 */
export interface RecurringMedication {
  id: string;
  /** optional link to a SavedMedication for color/typical-dose reuse —
   * the name/dose below are still stored independently so this keeps
   * working even if that SavedMedication is later edited or removed. */
  medicationId?: string;
  name: string;
  /** own color, used when this recurring medication isn't linked to a
   * SavedMedication (or as an explicit override even when it is) — so
   * a manually-named recurring medication still gets a stable,
   * consistent color instead of a positional fallback. */
  color?: string;
  doseValue?: number;
  doseUnit?: string;
  /** history of dose changes over time — see doseHistory below; when
   * present, this takes precedence over the flat doseValue/doseUnit
   * pair above for anything after the earliest recorded change. */
  doseHistory?: RecurringDoseChange[];
  /** one or more times per day this is scheduled, e.g. ['08:00', '20:00'] */
  times: string[];
  /** which weekdays this applies to — defaults to all seven (daily) */
  days: RecurringMedicationDay[];
  /** deactivating pauses future prompts without touching any already-
   * recorded MediLogEntry history — reactivating simply resumes it. */
  active: boolean;
  createdAt: string;
}

/** One dose "as of" a given date — see RecurringMedication.doseHistory.
 * Entries already recorded before a change keep whatever dose they were
 * actually logged with; this only governs what gets pre-filled going
 * forward from effectiveFrom onward, so past history is never rewritten. */
export interface RecurringDoseChange {
  effectiveFrom: string; // ISO date, e.g. "2026-06-15"
  doseValue?: number;
  doseUnit?: string;
}

export interface DiaryEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  content: string;
  /** defaults to the fixed "Allgemeines" category when absent (older
   * entries, or entries from before categories existed) — custom
   * categories (e.g. "Poesie") keep their entries separate from everything
   * else instead of mixing into the general stream */
  categoryId?: string;
  /** lightweight snapshot of a day's polyvagal check-ins, present only when
   * this entry was created from "Tageskurve ins Tagebuch speichern" — lets
   * the diary render the actual mini-curve, not just descriptive text */
  polyvagalSnapshot?: { zone: PolyvagalZone; createdAt: string }[];
  /** Priority "Tagebuch – Fotos" — at most one photo per entry, stored
   * as a base64 data URI directly on the entry (no separate gallery
   * store, per the explicit "keine zusätzliche unnötige Fotogalerie"
   * instruction). The "max 1 per day" rule is enforced in the UI by
   * only offering the photo picker on a day's first/primary entry. */
  photo?: string;
}

// ---------------------------------------------------------------------------
// Settings / Profile
// ---------------------------------------------------------------------------

export type SupportedLanguage = 'de' | 'en';
export type ThemePalette = 'neutral' | 'wald' | 'meer' | 'abend' | 'sonnenaufgang' | 'lavendel' | string;

export const BUILT_IN_PALETTE_IDS: ThemePalette[] = [
  'neutral',
  'wald',
  'meer',
  'abend',
  'sonnenaufgang',
  'lavendel',
  'rose',
  'beige',
  'creme',
  'puder',
  'salbei',
];
export type ThemeMode = 'light' | 'dark' | 'system';
export type BrainState = 'awake' | 'settling' | 'sleeping' | 'waking';

export interface UserSettings {
  language: SupportedLanguage;
  themeMode: ThemeMode;
  palette: ThemePalette;
  /** optional per-section palette overrides, keyed by top-level route (e.g. '/bruecken') */
  pagePalettes?: Partial<Record<string, ThemePalette>>;
  reduceMotion: boolean;
  /** "Haptisches Feedback"-Auftrag — Web Vibration API is the only
   * reliable haptics mechanism available in a PWA (no native haptics
   * without a wrapper like Capacitor). Default true, but must be
   * fully disable-able — this flag gates every single call site. */
  hapticsEnabled: boolean;
  /** "Toene/Haptik sollen standardmaessig an sein"-Auftrag — on by
   * default (explicit later preference, overriding the original
   * "moeglichst still" default), turned off from Settings if unwanted.
   * A few key moments (see sounds.ts) get a very quiet, short,
   * synthesized tone — no audio files, generated on the fly via the
   * Web Audio API, so there's nothing to source/host/license. */
  soundsEnabled: boolean;
  brainEnabled: boolean;
  brainState: BrainState;
  /** Audit follow-up, "Nur jetzt" — a session-scoped, deliberately NOT
   * auto-persisted-forever mode (see HomePage.tsx) that hides
   * backward-looking content on the home screen. Off by default, and
   * meant to be turned on/off in the moment, not a long-term setting. */
  nurJetztMode: boolean;
  /** id of the selected Lichtwesen companion (see components/companion/lichtwesen.ts) */
  selectedBrainId: string;
  /** true once the person has answered "Wer darf dich heute begleiten?" at least once */
  companionChosen: boolean;
  /** true once the first-launch intro (companion explains the app) has been completed */
  introSeen: boolean;
  /** "Klinische Fenster-Kalibrierung"-Auftrag — an optional, individually
   * calibrated window of tolerance (0-100 scale, matching the arousal
   * ladder), for people whose window has narrowed or shifted. null/
   * undefined means no calibration set (uses the default 0-55 window).
   * When the ladder value falls outside [start,end], a "Dysregulation"
   * signal is shown. Deliberately optional and off by default — most
   * people never need to touch this. */
  arousalWindowStart?: number;
  arousalWindowEnd?: number;
  /** "Zwei Modi im Zahnrad-Panel"-Auftrag — Grundmodus (false/undefined,
   * the default) keeps the classic fixed rainbow and a fixed 0-55%
   * reference box, exactly as every everyday user already knows it.
   * Erweiterter Modus (true) is an opt-in ADDITION for people who want
   * to invest more time: the slider bar itself dynamically recolors
   * around their calibrated window instead. The underlying stored
   * check-in values are never touched by either mode — always the
   * real 0-100 biological reading. */
  arousalExtendedMode?: boolean;
  /** future: reminders are opt-in and never guilt-based */
  remindersEnabled: boolean;
  /** "HH:MM" 24h format — when set + remindersEnabled, Home shows a gentle nudge after this time if no check-in happened yet today */
  weatherReminderTime?: string;
  /** "Erinnerung immer an, mehrere Uhrzeiten"-Auftrag — the daily
   * check-in reminder is no longer an opt-in toggle (remindersEnabled
   * still exists for other reminder types, but the check-in nudge
   * itself is always active) and now supports multiple times per day
   * instead of just one. weatherReminderTime above is kept only for
   * reading old saved data; new writes go here. */
  weatherReminderTimes?: string[];
  /** when true, the previous day's polyvagal curve summary is auto-added to the diary the next time the app opens on a new day */
  autoAddCurveToDiary?: boolean;
  /** Same "write an actual diary entry" mechanism as autoAddCurveToDiary,
   * just for the independent personal tension curve — deliberately its
   * own setting, not reusing the polyvagal one, since a person may want
   * one curve auto-saved to the diary and not the other. */
  autoAddTensionToDiary?: boolean;
  dailyReviewShowTension?: boolean;
  lastAutoTensionDiaryDate?: string;
  /** internal bookkeeping — "YYYY-MM-DD" of the last date the auto-add ran, so it only runs once per day */
  lastAutoCurveDiaryDate?: string;
  displayName?: string;
  /** the person's own name, asked once at first launch ("Und wer bist
   * du?") — used occasionally and gently by the companion, changeable
   * later in Settings. Entirely optional; the question can be skipped. */
  userName?: string;
  /** the safety plan is deliberately reduced to only black or white so the
   * warning-tier colors stay the sole source of color signal — see Phase-2
   * design decision in SafetyPlanPage. Defaults to 'weiss'. */
  safetyPlanBackground?: 'weiss' | 'schwarz';
  /** when true, every newly saved Medi-Log entry that represents an
   * actually-taken dose (not a skipped recurring one) is automatically
   * also saved to the diary — off by default, since this is a real
   * behavior change the person should opt into, not something silently
   * turned on for everyone. */
  mediLogAutoDiary?: boolean;
  /** Each independently controls whether that section auto-appears in
   * Tagesrückblick — all default to true (matching how weather/polyvagal
   * already behaved before these settings existed) so nothing regresses
   * for anyone who never touches this. Both the central Settings screen
   * and each feature's own inline toggle read/write the exact same
   * fields here, never a separate shadow copy. */
  dailyReviewShowWeather?: boolean;
  dailyReviewShowPolyvagal?: boolean;
  dailyReviewShowMediLog?: boolean;
  dailyReviewShowAchievements?: boolean;
  diaryFont?: 'klar' | 'sanft' | 'handschriftlich' | 'elegant' | 'verspielt';
  /** true while the "Ich zeige dir die ganze App" tour overlay is running
   * on top of the real app (navigates through real pages) — separate from
   * introSeen so the slides and the tour are two distinct phases. */
  tourActive?: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  language: 'de',
  themeMode: 'light',
  palette: 'neutral',
  reduceMotion: false,
  hapticsEnabled: true,
  soundsEnabled: true,
  brainEnabled: true,
  brainState: 'awake',
  nurJetztMode: false,
  selectedBrainId: 'froehlich',
  companionChosen: false,
  introSeen: false,
  remindersEnabled: false,
};

// ---------------------------------------------------------------------------
// Polyvagal quick check-ins ("Spannungskurve")
// ---------------------------------------------------------------------------

/**
 * Simplified, plain-language mapping onto the three broad autonomic states
 * described by Polyvagal Theory (Porges): ventral vagal (safe/social),
 * sympathetic (fight/flight activation), dorsal vagal (shutdown/freeze).
 * Framed here as self-observation, never as a diagnosis.
 */
export type PolyvagalZone = 'ventral' | 'sympathetic' | 'dorsal';

export interface PolyvagalCheckIn {
  id: string;
  createdAt: string;
  zone: PolyvagalZone;
  /** "Alle Fs mit dazu"-Auftrag — optional specific state alongside
   * the broader zone, using the same states Zugang uses. Optional so
   * a person can still just tap a zone without picking a specific
   * reaction, and so existing check-ins remain valid. */
  survivalState?: ZugangSurvivalState;
  /** "Genauso wie im Zugang, mit dem zusammen und den Farben"-Auftrag
   * - the tension question belongs directly alongside "wo bist du
   * gerade" in the same view, exactly like Zugang's step 2 does, not
   * as a separately-reached section. Optional so older check-ins
   * remain valid. */
  tensionValue?: number;
  /** "Wertfreie Nachbesprechung/Reflexions-Tagebuch"-Auftrag — two
   * simple, non-judgmental reflection questions a person can
   * optionally answer for this specific check-in, to surface patterns
   * (e.g. chronic shutdown at certain times) over time. Both optional
   * and answerable later, never required to save a check-in. */
  reflectionTrigger?: string;
  reflectionWhatHelped?: string;
}

/**
 * A deliberately separate, independent personal record — "how tense did
 * I feel" on a simple 0-100 scale over the day. Not a replacement for
 * the polyvagal check-in above and not derived from it; the two answer
 * different questions (nervous-system state vs. subjective felt
 * tension) and a person may use either, both, or neither.
 */
export interface TensionEntry {
  id: string;
  createdAt: string;
  /** 0 (very low tension) to 100 (very high tension) */
  value: number;
  /** "Wo bist du gerade + Zustand zusammenfuehren"-Auftrag — optional
   * specific state alongside the raw percentage, using the same
   * seven states Zugang uses, so a tension entry can say both "how
   * much" and "which state" without needing a second, disconnected
   * tracking system. Optional so existing entries (and anyone who
   * just wants the quick percentage) remain valid. */
  survivalState?: ZugangSurvivalState;
}

export interface VocabCollection {
  id: string;
  name: string;
  createdAt: string;
}

export interface VocabCard {
  id: string;
  collectionId: string;
  front: string;
  back: string;
}

export interface CustomDistractionCategory {
  id: string;
  name: string;
  createdAt: string;
  /** Archived categories are hidden from the normal picker and can't be
   * accidentally selected there, but nothing is deleted — they stay
   * fully visible and restorable in the management modal's archive
   * view, together with all their content. */
  archived?: boolean;
}

export interface CustomDistractionItem {
  id: string;
  categoryId: string;
  text: string;
  /** optional — a plain prompt with nothing to check has no answer at all */
  answer?: string;
  /** required: a real source, or an explicit "own text" marker — never
   * left blank, mirroring the same rule as custom companion lines. */
  source: string;
}

/**
 * "Zugang" — the guided step-by-step pass, distinct from the Access
 * Wheel (accessWheel/, mounted at /entdecken/zugangsrad, a different,
 * separate life-domains-accessibility tool). Deliberately stores plain
 * strings for every free/multi-select step rather than typed enums —
 * every one of these steps is explicitly meant to grow with a person's
 * own added vocabulary (see zugangSuggestions.ts), so a closed enum
 * would work against the feature's actual purpose. survivalState and
 * selfSufficient are the only two steps with a genuinely fixed,
 * meaningful set of options, so those alone get real union types.
 */
export type ZugangSurvivalState =
  | 'verbunden'
  | 'mobilisiert'
  | 'flucht'
  | 'kampf'
  | 'erstarren'
  | 'kollaps'
  | 'angepasst'
  /** "Alle Fs mit dazu"-Auftrag — Fine, Flood, Friend added as
   * genuinely selectable states (previously only informational
   * content on the Nervensystem page's "erweiterte Reaktionen"
   * section). Deliberately NOT added to SURVIVAL_STATE_ORDER (the
   * core 7-state list used by ActivationWave and pattern-matching) —
   * see EXTENDED_STATE_GROUPS in zugangContent.ts for the richer,
   * zone-grouped list used specifically by the selection pickers. */
  | 'fine'
  | 'flood'
  | 'friend'
  /** "Fake-Ruhe"-Auftrag — chronic functional dissociation that reads
   * as calm from the outside (and sometimes from the inside too) but
   * is actually a dorsal shutdown state, not genuine ventral ease.
   * Named explicitly per the Stresstoleranzfenster/"Faux window"
   * material — without a distinct option for this, someone in this
   * state has no accurate way to log it; picking "erstarren" or
   * "kollaps" doesn't capture the specific "funktioniere wie ein
   * Roboter, spüre aber nichts"-quality of it. */
  | 'fakeRuhe'
  /** "6-Zonen-Modell nach Yerkes-Dodson + Stresstoleranzfenster"-Auftrag
   * — four genuinely new states from the person's detailed clinical
   * spec that don't already exist under another name:
   * - 'fokus'/'praesent': the 16-35% optimal-arousal sweetspot zone's
   *   own pair, distinct from the calmer 0-15% "fine"/"friend".
   * - 'unruhe': the 36-55% Grenzzone/Flood-adjacent state — restless,
   *   circling thoughts, still technically inside the window.
   * - 'blockiert': the 76-85% freeze/mixed-state zone's second tag,
   *   alongside the existing 'erstarren'.
   * ('Faint' at 86-100% intentionally reuses the existing 'kollaps'
   * rather than adding a fifth new state — same clinical concept.) */
  | 'fokus'
  | 'praesent'
  | 'unruhe'
  | 'blockiert';

export interface ZugangEntry {
  id: string;
  createdAt: string;
  /** "Gesamtpruefung"-Auftrag — real data-loss bug found and fixed:
   * step 0's own free-text answer to "Wo bin ich gerade?" was captured
   * in the in-progress draft (so it survived navigating away and back
   * mid-pass) but was never actually included in the final saved
   * entry — silently discarded the moment a pass completed, never
   * visible again in the Rückblick. */
  ichJetzt?: string;
  body: string[];
  survivalState?: ZugangSurvivalState;
  /** "Anspannungsskala + Zugang zusammenfuehren"-Auftrag — same 0-100
   * scale used at check-in, added alongside the existing state pick
   * so both live in the same place instead of two disconnected
   * systems. Optional, since older entries won't have it. */
  tensionValue?: number;
  feelings: string[];
  protectionStrategy: string[];
  careWish: string[];
  /** "Kann ich mir davon gerade etwas selbst geben?" — a legitimate
   * branch point, not an abort: 'nein' just means the pass was cut
   * short here in favor of pointing toward the safety net instead. */
  selfSufficient?: 'ja' | 'nein';
  need: string[];
  obstacle: string[];
  /** links back to an existing Bridge (bridgesRepo) — Zugang never
   * stores its own separate copy of a bridge's content. */
  bridgeId?: string;
  /** "Level/Timer muss im Rueckblick erscheinen"-Auftrag — which
   * level(s) of the bridge were actually engaged with this pass
   * (multi-select, matches BridgeDetailPage's selectedLevels), and
   * whether the timer was started. Both optional/undefined for older
   * entries and for passes that didn't end via a bridge at all. */
  bridgeLevels?: number[];
  bridgeTimerUsed?: boolean;
  connection: string[];
  action: string;
  /** "Wie war es danach?" — optional, filled in after the fact, often
   * on a later visit via the Rückblick list rather than in the same
   * sitting. */
  reflection?: string;
  /** How this pass ended — never used to frame anything as incomplete
   * or a failure; purely so the review list can show "weitergegangen
   * zu einer Brücke" as the legitimate branch it is, rather than
   * silently looking like an unfinished questionnaire. Defaults to
   * 'complete' for anything saved before this field existed. */
  endedVia?: 'complete' | 'bridge' | 'safetynet';
  /** "Verbinden" brief, Section 14 — never framed as success/failure.
   * What made access harder this time, and what might have helped —
   * an optional, gentle reflection, not an evaluation of the person. */
  harderFactors?: string[];
  whatMightHaveHelped?: string;
}
