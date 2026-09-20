import { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Modal } from '../../components/ui/Modal';
import { InlineCompanionNote } from './InlineCompanionNote';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import {
  isGroundingStepActive,
  setGroundingStepActive,
  getCustomGroundingSteps,
  addCustomGroundingStep,
  updateCustomGroundingStep,
  removeCustomGroundingStep,
  moveCustomGroundingStep,
  moveBuiltinGroundingStep,
  getOrderedBuiltinStepsForManagement,
} from './groundingManagement';
import {
  COMPANION_LINES,
  type CompanionCategory,
  type CompanionTrigger,
} from './companionRegistry';
import {
  isDeactivated,
  setLineActive,
  getCustomLines,
  addCustomLine,
  updateCustomLine,
  removeCustomLine,
  OWN_TEXT_SOURCE,
  type CustomCompanionLine,
} from './companionContentManagement';
import { DISTRACTION_ITEMS, type DistractionKind } from './distractionContent';
import { getDeactivatedDistractionTexts, setDistractionActive } from './distractionManagement';
import { CustomDistractionManageModal } from './CustomDistractionManageModal';
import { VocabManageModal } from './VocabManageModal';
import { Sparkles, BookOpen } from 'lucide-react';

const CATEGORY_ORDER: CompanionCategory[] = [
  'einfuehrung', 'anleitung', 'erklaerung', 'tipp', 'ermutigung',
  'beruhigend', 'positiv', 'humorvoll', 'feedback', 'funktionshinweis', 'kontext',
];

// A short, human-readable picker rather than exposing raw route paths —
// Point 6 explicitly asks for something simpler than free-text entry.
const KNOWN_PAGES: { value: string; labelKey: 'anywhere' | 'home' | 'zugang' | 'bridges' | 'safety' | 'garden' | 'diary' }[] = [
  { value: '*', labelKey: 'anywhere' },
  { value: '/', labelKey: 'home' },
  { value: '/zugang', labelKey: 'zugang' },
  { value: '/bruecken', labelKey: 'bridges' },
  { value: '/sicherheit', labelKey: 'safety' },
  { value: '/entdecken/garten', labelKey: 'garden' },
  { value: '/sicherheit/tagebuch', labelKey: 'diary' },
];

const TIME_OF_DAY_ORDER: NonNullable<CustomCompanionLine['timeOfDay']>[] = ['any', 'morgens', 'mittags', 'abends', 'nachts'];
const FREQUENCY_ORDER: NonNullable<CustomCompanionLine['frequency']>[] = ['selten', 'gelegentlich', 'haeufig'];

interface DraftLine {
  id?: string;
  text: string;
  textEn: string;
  category: CompanionCategory;
  page: string;
  trigger: CompanionTrigger;
  source: string;
  timeOfDay?: CustomCompanionLine['timeOfDay'];
  frequency?: CustomCompanionLine['frequency'];
}

const EMPTY_DRAFT: DraftLine = { text: '', textEn: '', category: 'tipp', page: '*', trigger: 'leerlauf', source: '', timeOfDay: 'any', frequency: 'gelegentlich' };

/**
 * Point 10/11 — the actual management surface. Built-in lines can only
 * be switched active/inactive (their text lives in code, not here —
 * COMPANION_LINES stays the single source of truth for what a line
 * *says*); custom lines are fully editable since the person owns them
 * entirely. Grouped by category with a text filter, since the
 * collection is large enough that a flat unfiltered list would be
 * genuinely hard to work with.
 */
/** Punkt 8 — three conceptually distinct buckets instead of one large
 * "everything except tipp" catch-all: A) page-tied functional content,
 * B) warm/light asides that can surface anywhere, C) acknowledgment
 * after something the person actually did. */
const SEITENBEZOGEN_CATEGORIES: CompanionCategory[] = ['einfuehrung', 'anleitung', 'erklaerung', 'tipp', 'funktionshinweis', 'kontext'];
const ZWISCHENDURCH_CATEGORIES: CompanionCategory[] = ['beruhigend', 'positiv', 'humorvoll', 'ermutigung'];
const FEEDBACK_CATEGORIES: CompanionCategory[] = ['feedback'];
const ALLE_MITTEILUNGEN_CATEGORIES: CompanionCategory[] = [...SEITENBEZOGEN_CATEGORIES, ...ZWISCHENDURCH_CATEGORIES, ...FEEDBACK_CATEGORIES];

export function CompanionContentPage() {
  const t = useT();
  const navigate = useNavigate();
  const [, forceRefresh] = useState(0);
  // Punkt 5 — three clearly separated top-level areas as requested,
  // not five: "Tipps & Mitteilungen" (which internally keeps the
  // seitenbezogen/zufällig/feedback distinction via a sub-filter row
  // rather than as its own top-level tab), "Orientierung", "Ablenkung".
  const [tab, setTab] = useState<'mitteilungen' | 'ablenken' | 'orientierung'>('mitteilungen');
  const [mitteilungenFilter, setMitteilungenFilter] = useState<'alle' | 'seitenbezogen' | 'zwischendurch' | 'feedback'>('alle');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CompanionCategory | 'all'>('all');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [editing, setEditing] = useState<DraftLine | null>(null);

  const customLines = getCustomLines();
  const bucketCategories =
    tab !== 'mitteilungen'
      ? []
      : mitteilungenFilter === 'seitenbezogen'
        ? SEITENBEZOGEN_CATEGORIES
        : mitteilungenFilter === 'zwischendurch'
          ? ZWISCHENDURCH_CATEGORIES
          : mitteilungenFilter === 'feedback'
            ? FEEDBACK_CATEGORIES
            : ALLE_MITTEILUNGEN_CATEGORIES;
  const tabLines = [...COMPANION_LINES, ...customLines].filter((l) => bucketCategories.includes(l.category));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tabLines.filter((l) => {
      if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
      const active = !isDeactivated(l.id);
      if (showOnlyActive && !active) return false;
      if (q && !l.text.toLowerCase().includes(q) && !l.textEn.toLowerCase().includes(q)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, categoryFilter, showOnlyActive, customLines.length, tab]);

  // Switching tabs or the Mitteilungen sub-filter resets the category
  // filter — a category from "Seitenbezogen" (e.g. "Erklärung") wouldn't
  // exist in "Zwischendurch"'s chip row, so carrying it over would
  // silently show zero results.
  const prevTab = useRef(tab);
  const prevMitteilungenFilter = useRef(mitteilungenFilter);
  if (prevTab.current !== tab || prevMitteilungenFilter.current !== mitteilungenFilter) {
    prevTab.current = tab;
    prevMitteilungenFilter.current = mitteilungenFilter;
    if (categoryFilter !== 'all') setCategoryFilter('all');
  }

  function refresh() {
    forceRefresh((n) => n + 1);
  }

  function toggleActive(id: string) {
    setLineActive(id, isDeactivated(id));
    refresh();
  }

  function isCustom(id: string): boolean {
    return id.startsWith('custom-line');
  }

  function saveDraft() {
    if (!editing || !editing.text.trim() || !editing.source.trim()) return;
    if (editing.id) {
      updateCustomLine(editing.id, {
        text: editing.text.trim(),
        textEn: editing.textEn.trim() || editing.text.trim(),
        category: editing.category,
        page: editing.page.trim() || '*',
        trigger: editing.trigger,
        source: editing.source.trim(),
        timeOfDay: editing.timeOfDay ?? 'any',
        frequency: editing.frequency ?? 'gelegentlich',
      });
    } else {
      addCustomLine({
        text: editing.text.trim(),
        textEn: editing.textEn.trim() || editing.text.trim(),
        category: editing.category,
        page: editing.page.trim() || '*',
        trigger: editing.trigger,
        source: editing.source.trim(),
        timeOfDay: editing.timeOfDay ?? 'any',
        frequency: editing.frequency ?? 'gelegentlich',
      });
    }
    setEditing(null);
    refresh();
  }

  function deleteCustom(id: string) {
    if (!window.confirm(t.companionContent.confirmDelete)) return;
    removeCustomLine(id);
    refresh();
  }

  return (
    <div className="animate-in">
      <TopBar onBack={() => navigate('/einstellungen')} action={<HelpButton helpKey="wesenInhalte" />} />
      <div className="px-5 pb-6">
        <h1 className="text-[24px] mb-1">{t.companionContent.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-4">{t.companionContent.subtitle}</p>

        <div className="chip-row no-scrollbar mb-3 -mx-5 px-5">
          <Chip selected={tab === 'mitteilungen'} onClick={() => setTab('mitteilungen')}>
            💬 {t.companionContent.tabMitteilungenGroup}
          </Chip>
          <Chip selected={tab === 'orientierung'} onClick={() => setTab('orientierung')}>
            🧭 {t.companionContent.tabOrientierung}
          </Chip>
          <Chip selected={tab === 'ablenken'} onClick={() => setTab('ablenken')}>
            🎲 {t.companionContent.tabAblenken}
          </Chip>
        </div>

        {tab === 'mitteilungen' && (
          <div className="flex items-center justify-end -mb-1">
            <HelpButton helpKey="wesenMitteilungen" className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--color-text-faint)] flex-shrink-0" />
          </div>
        )}
        {tab === 'mitteilungen' && (
          <div className="chip-row no-scrollbar mb-4 -mx-5 px-5">
            <Chip selected={mitteilungenFilter === 'alle'} onClick={() => setMitteilungenFilter('alle')}>
              {t.common.all}
            </Chip>
            <Chip selected={mitteilungenFilter === 'seitenbezogen'} onClick={() => setMitteilungenFilter('seitenbezogen')}>
              {t.companionContent.tabSeitenbezogen}
            </Chip>
            <Chip selected={mitteilungenFilter === 'zwischendurch'} onClick={() => setMitteilungenFilter('zwischendurch')}>
              {t.companionContent.tabZwischendurch}
            </Chip>
            <Chip selected={mitteilungenFilter === 'feedback'} onClick={() => setMitteilungenFilter('feedback')}>
              {t.companionContent.tabFeedback}
            </Chip>
          </div>
        )}
        {tab === 'mitteilungen' && mitteilungenFilter === 'seitenbezogen' && (
          <p className="text-[12px] text-[var(--color-text-faint)] mb-4">{t.companionContent.bucketHintSeitenbezogen}</p>
        )}
        {tab === 'mitteilungen' && mitteilungenFilter === 'zwischendurch' && (
          <p className="text-[12px] text-[var(--color-text-faint)] mb-4">{t.companionContent.bucketHintZwischendurch}</p>
        )}
        {tab === 'mitteilungen' && mitteilungenFilter === 'feedback' && (
          <p className="text-[12px] text-[var(--color-text-faint)] mb-4">{t.companionContent.bucketHintFeedback}</p>
        )}
        {tab === 'mitteilungen' && mitteilungenFilter === 'alle' && (
          <p className="text-[12px] text-[var(--color-text-faint)] mb-4">{t.companionContent.bucketHintAlle}</p>
        )}

        {tab === 'mitteilungen' && (
          <>
        <Button fullWidth icon={<Plus size={17} />} onClick={() => setEditing({ ...EMPTY_DRAFT })} className="mb-4">
          {t.companionContent.addNew}
        </Button>

        <div className="relative mb-3">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] pointer-events-none" />
          <input
            className="input"
            style={{ paddingLeft: 38 }}
            placeholder={t.companionContent.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="chip-row no-scrollbar mb-2 -mx-5 px-5">
          <Chip selected={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>
            {t.common.all}
          </Chip>
          {bucketCategories.map((c) => (
            <Chip key={c} selected={categoryFilter === c} onClick={() => setCategoryFilter(c)}>
              {t.companionContent.categoryLabels[c]}
            </Chip>
          ))}
        </div>

        <label className="flex items-center gap-2 mb-5">
          <input type="checkbox" checked={showOnlyActive} onChange={(e) => setShowOnlyActive(e.target.checked)} className="w-4 h-4 accent-[var(--color-primary)]" />
          <span className="text-[13px] text-[var(--color-text-muted)]">{t.companionContent.showOnlyActive}</span>
        </label>

        <p className="text-[12px] text-[var(--color-text-faint)] mb-3">
          {t.companionContent.resultCount.replace('{n}', String(filtered.length))}
        </p>

        <div className="flex flex-col gap-2.5">
          {filtered.map((line) => {
            const active = !isDeactivated(line.id);
            const custom = isCustom(line.id);
            return (
              <Card key={line.id} className="flex flex-col gap-1.5" style={{ opacity: active ? 1 : 0.55 }}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[14px] text-[var(--color-text)] flex-1">{line.text}</p>
                  <button
                    role="switch"
                    aria-checked={active}
                    onClick={() => toggleActive(line.id)}
                    className="w-9 h-5 rounded-full relative flex-shrink-0 mt-0.5"
                    style={{ background: active ? 'var(--color-primary)' : 'var(--color-border)' }}
                  >
                    <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: active ? 16 : 2 }} />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--color-text-faint)]">
                  <span>{t.companionContent.categoryLabels[line.category]}</span>
                  <span>·</span>
                  <span>{line.page === '*' ? t.companionContent.anyPage : line.page}</span>
                  <span>·</span>
                  <span>{line.trigger}</span>
                  {custom && (
                    <>
                      <span>·</span>
                      <span className="italic">{(line as CustomCompanionLine).source}</span>
                    </>
                  )}
                  {!custom && (
                    <>
                      <span>·</span>
                      <span className="italic">{OWN_TEXT_SOURCE}</span>
                    </>
                  )}
                </div>
                {custom && (
                  <div className="flex gap-3 mt-1">
                    <button
                      onClick={() =>
                        setEditing({
                          id: line.id,
                          text: line.text,
                          textEn: line.textEn,
                          category: line.category,
                          page: line.page,
                          trigger: line.trigger,
                          source: (line as CustomCompanionLine).source,
                          timeOfDay: (line as CustomCompanionLine).timeOfDay,
                          frequency: (line as CustomCompanionLine).frequency,
                        })
                      }
                      className="flex items-center gap-1 text-[12px] text-[var(--color-primary)]"
                    >
                      <Pencil size={12} /> {t.common.edit}
                    </button>
                    <button onClick={() => deleteCustom(line.id)} className="flex items-center gap-1 text-[12px] text-[var(--color-danger)]">
                      <Trash2 size={12} /> {t.common.delete}
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
          </>
        )}

        {tab === 'ablenken' && <AblenkenTab />}
        {tab === 'orientierung' && <OrientierungTab />}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? t.companionContent.editTitle : t.companionContent.addNew}>
        {editing && (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.companionContent.textLabel}</span>
              <textarea
                autoFocus
                className="input"
                rows={3}
                value={editing.text}
                onChange={(e) => setEditing({ ...editing, text: e.target.value })}
              />
            </label>

            {editing.text.trim() && (
              <div>
                <span className="text-[12px] text-[var(--color-text-faint)] mb-2 block">{t.companionContent.previewLabel}</span>
                <div className="flex items-start gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] p-3">
                  <InlineCompanionNote />
                  <p className="text-[13px] text-[var(--color-text)] leading-relaxed flex-1">{editing.text}</p>
                </div>
              </div>
            )}

            <div>
              <span className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5 block">{t.companionContent.categoryPickLabel}</span>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ORDER.map((c) => (
                  <Chip key={c} selected={editing.category === c} onClick={() => setEditing({ ...editing, category: c })}>
                    {t.companionContent.categoryLabels[c]}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5 block">{t.companionContent.placeLabel}</span>
              <div className="flex flex-wrap gap-2">
                {KNOWN_PAGES.map((p) => (
                  <Chip key={p.value} selected={editing.page === p.value} onClick={() => setEditing({ ...editing, page: p.value })}>
                    {t.companionContent.pageOptions[p.labelKey]}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5 block">{t.companionContent.timeLabel}</span>
              <div className="flex flex-wrap gap-2">
                {TIME_OF_DAY_ORDER.map((tod) => (
                  <Chip key={tod} selected={(editing.timeOfDay ?? 'any') === tod} onClick={() => setEditing({ ...editing, timeOfDay: tod })}>
                    {t.companionContent.timeOfDayLabels[tod]}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5 block">{t.companionContent.frequencyLabel}</span>
              <div className="flex flex-wrap gap-2">
                {FREQUENCY_ORDER.map((f) => (
                  <Chip key={f} selected={(editing.frequency ?? 'gelegentlich') === f} onClick={() => setEditing({ ...editing, frequency: f })}>
                    {t.companionContent.frequencyLabels[f]}
                  </Chip>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.companionContent.sourceLabel}</span>
              <input
                className="input"
                placeholder={t.companionContent.sourcePlaceholder}
                value={editing.source}
                onChange={(e) => setEditing({ ...editing, source: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setEditing({ ...editing, source: OWN_TEXT_SOURCE })}
                className="text-[12px] text-[var(--color-primary)] text-left"
              >
                {t.companionContent.markAsOwnText}
              </button>
            </label>
            <Button fullWidth onClick={saveDraft} disabled={!editing.text.trim() || !editing.source.trim()}>
              {t.common.save}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

const DISTRACTION_KIND_ORDER: DistractionKind[] = ['raetsel', 'brueckenwort', 'fakt', 'wissen', 'frage', 'entweder_oder', 'beobachtung'];

/** Manages DISTRACTION_ITEMS — same active/inactive idea as the lines
 * above, but keyed by text (see distractionManagement.ts) since these
 * items have no id field of their own. */
function AblenkenTab() {
  const t = useT();
  const [, refresh] = useState(0);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [kindFilter, setKindFilter] = useState<DistractionKind | 'all'>('all');
  const [search, setSearch] = useState('');
  const [manageCustomOpen, setManageCustomOpen] = useState(false);
  const [vocabManageOpen, setVocabManageOpen] = useState(false);
  const deactivated = getDeactivatedDistractionTexts();
  const hiddenItems = DISTRACTION_ITEMS.filter((i) => deactivated.has(i.text));

  const filtered = (kindFilter === 'all' ? DISTRACTION_ITEMS : DISTRACTION_ITEMS.filter((i) => i.kind === kindFilter)).filter(
    (i) => !search.trim() || i.text.toLowerCase().includes(search.trim().toLowerCase())
  );

  function bump() {
    refresh((n) => n + 1);
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-2 mb-4">
        <p className="text-[12px] text-[var(--color-text-faint)] flex-1">{t.companionContent.ablenkenHint}</p>
        <HelpButton helpKey="wesenAblenkung" className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--color-text-faint)] flex-shrink-0 -mt-1" />
      </div>

      {/* Punkt 6 — genau hier, unter Wesen verwalten → Ablenkung, und
       * nicht mehr zusätzlich in den allgemeinen Einstellungen versteckt. */}
      <div className="flex flex-col gap-2 mb-5">
        <button
          onClick={() => setManageCustomOpen(true)}
          className="flex items-center gap-2 text-[14px] text-[var(--color-primary)] text-left"
        >
          <Sparkles size={15} className="flex-shrink-0" />
          {t.settings.manageCustomCategories}
        </button>
        <button
          onClick={() => setVocabManageOpen(true)}
          className="flex items-center gap-2 text-[14px] text-[var(--color-primary)] text-left"
        >
          <BookOpen size={15} className="flex-shrink-0" />
          {t.vocab.manageTitle}
        </button>
      </div>

      {/* Point 6 — a "das möchte ich nicht mehr sehen" model instead of
       * a giant per-item toggle list: hiding happens at the point of
       * encounter (a small link right under the content while using
       * Ablenken), and this page only needs to show what's actually
       * been hidden so it can be reversed — not every one of the ~100+
       * built-in items with its own switch. */}
      <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.companionContent.hiddenContentTitle}</p>
      {hiddenItems.length === 0 ? (
        <p className="text-[13px] text-[var(--color-text-faint)] mb-5">{t.companionContent.hiddenContentEmpty}</p>
      ) : (
        <div className="flex flex-col gap-2 mb-5">
          {hiddenItems.map((item, i) => (
            <Card key={i} className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-[var(--color-text)] flex-1">{item.text}</p>
              <button
                onClick={() => {
                  setDistractionActive(item.text, true);
                  bump();
                }}
                className="text-[12px] text-[var(--color-primary)] flex-shrink-0"
              >
                {t.companionContent.showAgainCta}
              </button>
            </Card>
          ))}
        </div>
      )}

      <button onClick={() => setBrowseOpen((v) => !v)} className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] mb-3">
        <Search size={14} />
        {browseOpen ? t.companionContent.hideBrowseAll : t.companionContent.showBrowseAll}
      </button>

      {browseOpen && (
        <>
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] pointer-events-none" />
            <input
              className="input"
              style={{ paddingLeft: 38 }}
              placeholder={t.common.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="chip-row no-scrollbar mb-4 -mx-5 px-5">
            <Chip selected={kindFilter === 'all'} onClick={() => setKindFilter('all')}>
              {t.common.all}
            </Chip>
            {DISTRACTION_KIND_ORDER.map((k) => (
              <Chip key={k} selected={kindFilter === k} onClick={() => setKindFilter(k)}>
                {t.companion.distractionKinds[k]}
              </Chip>
            ))}
          </div>
          <div className="flex flex-col gap-2.5">
            {filtered.map((item, i) => {
              const active = !deactivated.has(item.text);
              return (
                <Card key={i} className="flex items-start justify-between gap-3" style={{ opacity: active ? 1 : 0.55 }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[var(--color-text)]">{item.text}</p>
                    <p className="text-[11px] text-[var(--color-text-faint)] mt-0.5">
                      {t.companion.distractionKinds[item.kind]}
                      {item.difficulty ? ` · ${item.difficulty}` : ''}
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={active}
                    onClick={() => {
                      setDistractionActive(item.text, !active);
                      bump();
                    }}
                    className="w-9 h-5 rounded-full relative flex-shrink-0 mt-0.5"
                    style={{ background: active ? 'var(--color-primary)' : 'var(--color-border)' }}
                  >
                    <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: active ? 16 : 2 }} />
                  </button>
                </Card>
              );
            })}
          </div>
        </>
      )}
      <CustomDistractionManageModal open={manageCustomOpen} onClose={() => setManageCustomOpen(false)} />
      <VocabManageModal open={vocabManageOpen} onClose={() => setVocabManageOpen(false)} />
    </div>
  );
}

/** Orientierung's steps live as a plain ordered string array in i18n
 * (see t.companion.groundingSteps), not individual records — so unlike
 * the other three tabs, this is a read-only overview of the current
 * sequence rather than per-item add/edit/delete. Still gives real
 * visibility into what the exercise actually says, which is the part
 * of "verwaltbar" that's meaningfully deliverable here without
 * restructuring the whole exercise into a database-backed system. */
function OrientierungTab() {
  const t = useT();
  const { settings } = useSettings();
  const isEn = settings.language === 'en';
  const [, refresh] = useState(0);
  const [editing, setEditing] = useState<{ id?: string; text: string; hasInput: boolean; source: string } | null>(null);

  function bump() {
    refresh((n) => n + 1);
  }

  function saveStep() {
    if (!editing || !editing.text.trim() || !editing.source.trim()) return;
    if (editing.id) {
      updateCustomGroundingStep(editing.id, { text: editing.text.trim(), textEn: editing.text.trim(), hasInput: editing.hasInput, source: editing.source.trim() });
    } else {
      addCustomGroundingStep({ text: editing.text.trim(), textEn: editing.text.trim(), hasInput: editing.hasInput, source: editing.source.trim() });
    }
    setEditing(null);
    bump();
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-[12px] text-[var(--color-text-faint)] flex-1">{t.companionContent.orientierungHint}</p>
        <HelpButton helpKey="wesenOrientierung" className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--color-text-faint)] flex-shrink-0 -mt-1" />
      </div>

      <Button fullWidth icon={<Plus size={16} />} onClick={() => setEditing({ text: '', hasInput: true, source: '' })} className="mb-4">
        {t.companionContent.addOwnStepCta}
      </Button>

      <div className="flex flex-col gap-2">
        {getOrderedBuiltinStepsForManagement().map((step, _i, arr) => {
          const active = isGroundingStepActive(step.id);
          const canMove = step.id !== 'intro' && step.id !== 'closing';
          const middleArr = arr.filter((s) => s.id !== 'intro' && s.id !== 'closing');
          const middleIdx = middleArr.findIndex((s) => s.id === step.id);
          return (
            <Card key={step.id} className="flex items-center justify-between gap-3" style={{ opacity: active ? 1 : 0.55 }}>
              <p className="text-[13px] text-[var(--color-text)] flex-1">
                {step.isBreath ? t.companionContent.orientierungBreathStep : isEn ? step.textEn : step.text}
              </p>
              {canMove && (
                <div className="flex items-center flex-shrink-0">
                  <button
                    onClick={() => {
                      moveBuiltinGroundingStep(step.id, 'up');
                      bump();
                    }}
                    disabled={middleIdx === 0}
                    aria-label={t.common.moveUp}
                    className="p-1 text-[var(--color-text-muted)] disabled:opacity-30"
                  >
                    <ChevronUp size={15} />
                  </button>
                  <button
                    onClick={() => {
                      moveBuiltinGroundingStep(step.id, 'down');
                      bump();
                    }}
                    disabled={middleIdx === middleArr.length - 1}
                    aria-label={t.common.moveDown}
                    className="p-1 text-[var(--color-text-muted)] disabled:opacity-30"
                  >
                    <ChevronDown size={15} />
                  </button>
                </div>
              )}
              <button
                role="switch"
                aria-checked={active}
                onClick={() => {
                  setGroundingStepActive(step.id, !active);
                  bump();
                }}
                className="w-9 h-5 rounded-full relative flex-shrink-0"
                style={{ background: active ? 'var(--color-primary)' : 'var(--color-border)' }}
              >
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: active ? 16 : 2 }} />
              </button>
            </Card>
          );
        })}
      </div>

      {getCustomGroundingSteps().length > 0 && (
        <>
          <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mt-5 mb-2">{t.companionContent.ownStepsLabel}</p>
          <div className="flex flex-col gap-2">
            {getCustomGroundingSteps().map((step, i, arr) => (
              <Card key={step.id} className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[var(--color-text)]">{step.text}</p>
                    <p className="text-[11px] text-[var(--color-text-faint)] italic">{step.source}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditing({ id: step.id, text: step.text, hasInput: step.hasInput, source: step.source })}
                    className="flex items-center gap-1 text-[12px] text-[var(--color-primary)]"
                  >
                    <Pencil size={12} /> {t.common.edit}
                  </button>
                  <button
                    onClick={() => {
                      removeCustomGroundingStep(step.id);
                      bump();
                    }}
                    className="flex items-center gap-1 text-[12px] text-[var(--color-danger)]"
                  >
                    <Trash2 size={12} /> {t.common.delete}
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => {
                      moveCustomGroundingStep(step.id, 'up');
                      bump();
                    }}
                    disabled={i === 0}
                    aria-label={t.common.moveUp}
                    className="p-1 text-[var(--color-text-muted)] disabled:opacity-30"
                  >
                    <ChevronUp size={15} />
                  </button>
                  <button
                    onClick={() => {
                      moveCustomGroundingStep(step.id, 'down');
                      bump();
                    }}
                    disabled={i === arr.length - 1}
                    aria-label={t.common.moveDown}
                    className="p-1 text-[var(--color-text-muted)] disabled:opacity-30"
                  >
                    <ChevronDown size={15} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? t.customDistraction.addOwnToCategoryCta : t.companionContent.addOwnStepCta}>
        {editing && (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.customDistraction.textLabel}</span>
              <textarea autoFocus className="input" rows={2} value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={editing.hasInput} onChange={(e) => setEditing({ ...editing, hasInput: e.target.checked })} className="w-4 h-4 accent-[var(--color-primary)]" />
              <span className="text-[13px] text-[var(--color-text-muted)]">{t.companionContent.stepHasInputLabel}</span>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.customDistraction.sourceLabel}</span>
              <input className="input" placeholder={t.customDistraction.sourcePlaceholder} value={editing.source} onChange={(e) => setEditing({ ...editing, source: e.target.value })} />
              <button type="button" onClick={() => setEditing({ ...editing, source: OWN_TEXT_SOURCE })} className="text-[12px] text-[var(--color-primary)] text-left">
                {t.companionContent.markAsOwnText}
              </button>
            </label>
            <Button fullWidth onClick={saveStep} disabled={!editing.text.trim() || !editing.source.trim()}>
              {t.common.save}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
