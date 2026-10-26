import { useEffect, useMemo, useRef, useState } from 'react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { deliverPdf, safeFilename } from '../../services/pdf/pdfShare';
import { buildReviewPdf, buildDiaryEntriesPdf } from '../reviews/reviewPdf';
import { gatherReviewDays } from '../reviews/reviewData';
import { localDayKey } from '../../services/groupByDay';
import { Plus, Search, Trash2, X, Tag, Type, FileDown, FileText, Mail, Image as ImageIcon, Network, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { RichTextEditor } from '../../components/shared/RichTextEditor';
import { RichText } from '../../components/shared/RichText';
import { richToPlain } from '../../services/richText';
import { mindmapRepo } from '../mindmap/mindmapModel';
import { MindmapPickerModal } from './MindmapPickerModal';
import { BookCodeModal } from './BookCodeModal';
import { BookUnlockCard } from './BookUnlockCard';
import { hasBookCode, isBookLocked, useBookLocks } from './bookLock';
import { TemplatePickerModal } from './TemplatePickerModal';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { TopBar } from '../../components/navigation/TopBar';
import { useT } from '../../i18n';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { pickLine } from '../../components/companion/companionRegistry';
import { useSettings } from '../../state/SettingsContext';
import { allDiaryTemplates, applyTemplate } from './diaryTemplates';
import { diaryRepo } from './diaryRepo';
import { DIARY_FONT_ORDER, DIARY_FONT_META, type DiaryFont } from './diaryFonts';
import { getCategoryStyle, setCategoryStyle } from './diaryCategoryStyles';
import { DiaryCategoryStyleModal } from './DiaryCategoryStyleModal';
import {
  diaryCategoriesStore,
  effectiveDiaryCategory,
  DIARY_DEFAULT_CATEGORY_ID,
  DIARY_DEFAULT_CATEGORY_LABEL,
} from './diaryCategories';
import { MiniCurve } from '../polyvagal/MiniCurve';
import { DailyReview } from './DailyReview';
import { LettersList } from '../briefAnMich/LettersList';
import { DiaryExportModal, type DiaryExportChoice } from './DiaryExportModal';
import { DiaryPrintView } from './DiaryPrintView';
import { DailyReviewPrintView } from './DailyReviewPrintView';
import { weatherRepo } from '../innerWeather/weatherRepo';
import { polyvagalRepo } from '../polyvagal/polyvagalRepo';
import { mediLogRepo } from '../mediLog/mediLogRepo';
import { createId } from '../../services/storage/repository';
import { groupByDay } from '../../services/groupByDay';
import { CompulsionAwarenessNote } from '../../components/shared/CompulsionAwarenessNote';
import type { DiaryEntry } from '../../data/types';

function formatDateTime(iso: string, locale: string) {
  const d = new Date(iso);
  return d.toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ACHIEVEMENT_CATEGORY_LABEL = 'Erfolge';

/**
 * Same aggregation approach as DailyReview.tsx (see that file — this is
 * deliberately the export counterpart, not a rewritten mechanism), but
 * for an explicit date range instead of the live view's fixed 30-day
 * cap, so a chosen export range comes back complete.
 */
function buildReviewDays(fromDate: string, toDate: string) {
  const achievementCategoryId = diaryCategoriesStore.getAll().find((c) => c.label === ACHIEVEMENT_CATEGORY_LABEL)?.id;
  const allDiary = diaryRepo.getAll().filter((d) => !isBookLocked(d.categoryId)).map((d) => ({ ...d, content: richToPlain(d.content) }));
  const generalEntries = allDiary.filter((d) => d.inReview === true);
  const achievementEntries = achievementCategoryId ? allDiary.filter((d) => d.categoryId === achievementCategoryId) : [];

  const weather = weatherRepo.getAll().filter((w) => {
    const day = w.createdAt.slice(0, 10);
    return day >= fromDate && day <= toDate;
  });
  const polyvagal = polyvagalRepo.getAll().filter((p) => {
    const day = p.createdAt.slice(0, 10);
    return day >= fromDate && day <= toDate;
  });
  const mediLog = mediLogRepo.getAll().filter((m) => {
    const day = m.takenAt.slice(0, 10);
    return m.status !== 'skipped' && day >= fromDate && day <= toDate;
  });
  const diary = generalEntries.filter((d) => {
    const day = d.createdAt.slice(0, 10);
    return day >= fromDate && day <= toDate;
  });
  const achievements = achievementEntries.filter((a) => {
    const day = a.createdAt.slice(0, 10);
    return day >= fromDate && day <= toDate;
  });

  const dayKeys = new Set<string>();
  weather.forEach((w) => dayKeys.add(w.createdAt.slice(0, 10)));
  polyvagal.forEach((p) => dayKeys.add(p.createdAt.slice(0, 10)));
  diary.forEach((d) => dayKeys.add(d.createdAt.slice(0, 10)));
  mediLog.forEach((m) => dayKeys.add(m.takenAt.slice(0, 10)));
  achievements.forEach((a) => dayKeys.add(a.createdAt.slice(0, 10)));

  // Same fix as DailyReview.tsx: group each (already date-range-bounded)
  // array by day once, instead of re-filtering the whole array for
  // every single day in the range — matters most here since a person
  // can explicitly choose a wide export range (e.g. "this year"),
  // which is exactly when the old approach got slowest.
  const weatherByDay = groupByDay(weather, (w) => w.createdAt);
  const polyvagalByDay = groupByDay(polyvagal, (p) => p.createdAt);
  const diaryByDay = groupByDay(diary, (d) => d.createdAt);
  const mediLogByDay = groupByDay(mediLog, (m) => m.takenAt);
  const achievementsByDay = groupByDay(achievements, (a) => a.createdAt);

  return Array.from(dayKeys)
    .sort((a, b) => a.localeCompare(b))
    .map((day) => ({
      day,
      weather: weatherByDay.get(day) ?? [],
      polyvagal: polyvagalByDay.get(day) ?? [],
      diary: diaryByDay.get(day) ?? [],
      mediLog: mediLogByDay.get(day) ?? [],
      achievements: achievementsByDay.get(day) ?? [],
    }));
}

export function DiaryPage() {
  const t = useT();
  const navigate = useNavigate();
  const lockVer = useBookLocks();
  const say = useCompanionSay();
  const { settings, updateSettings } = useSettings();
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';
  const diaryFont: DiaryFont = settings.diaryFont ?? 'klar';
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const diaryFontMeta = DIARY_FONT_META[diaryFont];

  // A category with its own saved style overrides the global default;
  // one without falls back to it — so nothing regresses for an existing
  // diary that never touches this new per-category setting.
  function styleForCategory(categoryId: string): React.CSSProperties {
    const override = getCategoryStyle(categoryId);
    const meta = override.font ? DIARY_FONT_META[override.font] : diaryFontMeta;
    return {
      fontFamily: meta.family,
      fontSize: meta.fontSize,
      lineHeight: meta.lineHeight,
      color: override.color,
    };
  }
  const [exportOpen, setExportOpen] = useState(false);
  const [printingEntries, setPrintingEntries] = useState<{ entries: DiaryEntry[]; fromDate?: string; toDate?: string } | null>(null);
  const [printingReview, setPrintingReview] = useState<{
    days: ReturnType<typeof buildReviewDays>;
    fromDate: string;
    toDate: string;
  } | null>(null);

  useEffect(() => {
    const clear = () => {
      setPrintingEntries(null);
      setPrintingReview(null);
    };
    window.addEventListener('afterprint', clear);
    return () => window.removeEventListener('afterprint', clear);
  }, []);

  // "Jeder Rueckblick soll als PDF erstellbar sein"-Auftrag — both export
  // kinds now produce a real PDF file (see services/pdf) instead of going
  // through window.print(), which iOS blocks in home-screen mode.
  async function handleExport(choice: DiaryExportChoice) {
    const loc = settings.language === 'de' ? 'de-DE' : 'en-US';
    if (choice.kind === 'entries') {
      const filteredForExport = diaryRepo.getAll().filter((e) => {
        const day = localDayKey(e.createdAt);
        if (day < choice.fromDate || day > choice.toDate) return false;
        if (isBookLocked(e.categoryId)) return false;
        if (choice.categoryId === 'all') return true;
        return effectiveDiaryCategory(e.categoryId) === choice.categoryId;
      });
      const bytes = buildDiaryEntriesPdf({
        title: t.diary.title,
        fromDay: choice.fromDate,
        toDay: choice.toDate,
        entries: filteredForExport.map((e) => ({ createdAt: e.createdAt, content: richToPlain(e.content), categoryLabel: categoryLabel(effectiveDiaryCategory(e.categoryId)) })),
        locale: loc,
        exportedOn: t.reviewSummary.pdfExportedOn,
      });
      await deliverPdf(bytes, safeFilename(`${t.diary.title}-${choice.fromDate}-bis-${choice.toDate}`, 'tagebuch'), t.diary.title);
    } else {
      const bytes = buildReviewPdf({
        kind: 'range',
        title: t.diary.exportKindReview,
        fromDay: choice.fromDate,
        toDay: choice.toDate,
        days: gatherReviewDays(choice.fromDate, choice.toDate),
        t,
        locale: loc,
      });
      await deliverPdf(bytes, safeFilename(`${t.diary.exportKindReview}-${choice.fromDate}-bis-${choice.toDate}`, 'rueckblick'), t.diary.exportKindReview);
    }
  }

  const [entries, setEntries] = useState<DiaryEntry[]>(() =>
    diaryRepo.getAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
  const [customCategories, setCustomCategories] = useState(() => diaryCategoriesStore.getAll());
  const [addingCategory, setAddingCategory] = useState(false);
  const [stylingCategoryId, setStylingCategoryId] = useState<string | null>(null);
  const [, forceStyleRefresh] = useState(0);
  // A handful of category ideas, freshly randomized each time the input
  // opens — a gentle nudge, not a fixed list the person has to scroll
  // through every time.
  const [categoryIdeas] = useState(() => {
    const pool = t.diary.categoryIdeaPool;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | string>(() => new URLSearchParams(window.location.search).get('cat') ?? 'all');
  const [query, setQuery] = useState('');
  const [composing, setComposing] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [draftPhoto, setDraftPhoto] = useState<string | undefined>(undefined);
  const [draftCategory, setDraftCategory] = useState<string>(DIARY_DEFAULT_CATEGORY_ID);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftInReview, setDraftInReview] = useState(false);
  const [draftMaps, setDraftMaps] = useState<string[]>([]);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [bookCodeOpen, setBookCodeOpen] = useState(false);
  const langEn = settings.language === 'en';
  // /sicherheit/tagebuch?tab=review opens straight on the Tagesrueckblick (used by "Heute bisher" on Home)
  const [view, setView] = useState<'entries' | 'review' | 'letters'>(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    return tab === 'review' ? 'review' : tab === 'briefe' ? 'letters' : 'entries';
  });
  const [fontPickerOpen, setFontPickerOpen] = useState(false);

  function categoryLabel(id: string): string {
    if (id === DIARY_DEFAULT_CATEGORY_ID) return DIARY_DEFAULT_CATEGORY_LABEL;
    return customCategories.find((c) => c.id === id)?.label ?? id;
  }

  const visibleEntries = useMemo(
    () => entries.filter((e) => !isBookLocked(e.categoryId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, lockVer],
  );
  const hiddenInLocked = entries.length - visibleEntries.length;

  const filtered = useMemo(() => {
    let list = visibleEntries;
    if (activeCategory !== 'all') {
      list = list.filter((e) => effectiveDiaryCategory(e.categoryId) === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((e) => richToPlain(e.content).toLowerCase().includes(q));
    }
    return list;
  }, [visibleEntries, activeCategory, query]);

  function refresh() {
    setEntries(diaryRepo.getAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  function addCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    const created = diaryCategoriesStore.add(name);
    setCustomCategories(diaryCategoriesStore.getAll());
    setActiveCategory(created.id);
    setNewCategoryName('');
    setAddingCategory(false);
  }

  function startNew() {
    setEditingId(null);
    setDraftText('');
    setDraftPhoto(undefined);
    setDraftMaps([]);
    setDraftInReview(false);
    setDraftCategory(activeCategory === 'all' ? DIARY_DEFAULT_CATEGORY_ID : activeCategory);
    setComposing(true);
  }

  function startNewFromTemplate(startingText: string) {
    setEditingId(null);
    setDraftText(startingText);
    setDraftPhoto(undefined);
    setDraftMaps([]);
    setDraftCategory(activeCategory === 'all' ? DIARY_DEFAULT_CATEGORY_ID : activeCategory);
    setComposing(true);
  }

  // ?template=<id> (from "Tag beginnen" / "Tag abschließen"): opens a new entry with that template
  // already filled in – and marked for the Rückblick, so the day's start/end shows up there as usual.
  const templateParamDone = useRef(false);
  useEffect(() => {
    if (templateParamDone.current) return;
    const id = new URLSearchParams(window.location.search).get('template');
    if (!id) return;
    templateParamDone.current = true;
    const tpl = allDiaryTemplates().find((x) => x.id === id);
    if (!tpl) return;
    startNewFromTemplate(applyTemplate(tpl, settings.language === 'en'));
    setDraftInReview(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startEdit(entry: DiaryEntry) {
    setEditingId(entry.id);
    setDraftInReview(entry.inReview === true);
    setDraftText(entry.content);
    setDraftPhoto(entry.photo);
    setDraftMaps(entry.mindmapIds ?? []);
    setDraftCategory(effectiveDiaryCategory(entry.categoryId));
    setComposing(true);
  }

  // ?entry=<id> (coming back from a connected mind map) opens that entry again
  const entryParamDone = useRef(false);
  useEffect(() => {
    if (entryParamDone.current) return;
    const id = new URLSearchParams(window.location.search).get('entry');
    if (!id) return;
    entryParamDone.current = true;
    const e = diaryRepo.getById(id);
    if (e && !isBookLocked(e.categoryId)) startEdit(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** writes the draft; returns the id (also used silently before jumping to a connected mind map) */
  function persistDraft(): string | null {
    if (!draftText.trim() && draftMaps.length === 0) return null;
    const now = new Date().toISOString();
    const cleanMaps = draftMaps.filter((id) => mindmapRepo.getById(id));
    const mindmapIds = cleanMaps.length ? cleanMaps : undefined;
    if (editingId) {
      const existing = diaryRepo.getById(editingId);
      if (existing) {
        diaryRepo.save({ ...existing, content: draftText, categoryId: draftCategory, photo: draftPhoto, inReview: draftInReview, mindmapIds, updatedAt: now });
        return editingId;
      }
    }
    const id = createId('diary');
    diaryRepo.save({ id, createdAt: now, updatedAt: now, content: draftText, categoryId: draftCategory, photo: draftPhoto, inReview: draftInReview, mindmapIds });
    return id;
  }

  function save() {
    const wasEditing = !!editingId;
    if (!persistDraft()) return;
    setComposing(false);
    setDraftText('');
    setDraftPhoto(undefined);
    setDraftMaps([]);
    setEditingId(null);
    refresh();
    say(pickLine({ page: '/sicherheit/tagebuch', trigger: 'speichern' }), { joy: !wasEditing });
  }

  /** opens a connected mind map; the entry is saved first so that one tap leads back to exactly this entry */
  function openMap(mapId: string, entryId?: string) {
    let id = entryId ?? null;
    if (composing) {
      id = persistDraft();
      refresh();
    }
    navigate(`/entdecken/mindmap/${mapId}`, { state: id ? { fromDiary: id } : undefined });
  }

  function remove(id: string) {
    if (!window.confirm(t.diary.confirmDelete)) return;
    diaryRepo.remove(id);
    refresh();
  }

  const allCategoryChips = [
    { id: DIARY_DEFAULT_CATEGORY_ID, label: DIARY_DEFAULT_CATEGORY_LABEL },
    ...customCategories.map((c) => ({ id: c.id, label: c.label })),
  ];

  return (
    <div className="animate-in">
      <div className="no-print">
      <TopBar
        action={
          <div className="flex items-center gap-1">
            <HelpButton helpKey="tagebuch" />
            <button
              onClick={() => setExportOpen(true)}
              aria-label={t.diary.exportTitle}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
            >
              <FileDown size={17} />
            </button>
          </div>
        }
      />
      <div className="px-5 pb-6">
        <h1 className="text-[24px] mb-1">{t.diary.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-1">{t.diary.subtitle}</p>
        <div className="mb-4">
          <CompulsionAwarenessNote />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Chip selected={view === 'entries'} onClick={() => setView('entries')}>
            {t.diary.viewEntries}
          </Chip>
          <Chip selected={view === 'review'} onClick={() => setView('review')}>
            {t.diary.viewReview}
          </Chip>
          <Chip selected={view === 'letters'} onClick={() => setView('letters')} icon={<Mail size={14} />}>
            {t.diary.viewLetters}
          </Chip>
        </div>

        <div className="mb-5">
          <button
            onClick={() => setFontPickerOpen((v) => !v)}
            className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-faint)]"
          >
            <Type size={13} />
            {t.diary.fontLabel}: {t.diary.fontNames[diaryFont]}
          </button>
          {fontPickerOpen && (
            <div className="flex flex-wrap gap-2 mt-2 animate-in">
              {DIARY_FONT_ORDER.map((f) => (
                <button
                  key={f}
                  onClick={() => updateSettings({ diaryFont: f })}
                  className="px-3 py-1.5 rounded-full text-[13px]"
                  style={{
                    fontFamily: DIARY_FONT_META[f].family,
                    background: diaryFont === f ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                    color: diaryFont === f ? 'var(--color-surface)' : 'var(--color-text)',
                  }}
                >
                  {t.diary.fontNames[f]}
                </button>
              ))}
            </div>
          )}
        </div>

        {view === 'letters' ? (
          <div className="animate-in">
            <Link to="/entdecken/brief-an-mich" className="flex items-center gap-1.5 text-[14px] text-[var(--color-primary)] mb-5" data-testid="letters-to-page">
              <Mail size={15} /> {t.diary.lettersToPage}
            </Link>
            <LettersList />
          </div>
        ) : view === 'review' ? (
          <DailyReview diaryEntries={visibleEntries} />
        ) : (
          <>
            <div className="chip-row no-scrollbar mb-5 -mx-5 px-5">
              <Chip selected={activeCategory === 'all'} onClick={() => setActiveCategory('all')}>
                {t.common.all}
              </Chip>
              {allCategoryChips.map((c) => (
                <Chip key={c.id} selected={activeCategory === c.id} onClick={() => setActiveCategory(c.id)}>
                  {c.label}
                </Chip>
              ))}
              {!addingCategory ? (
                <Chip onClick={() => setAddingCategory(true)} icon={<Plus size={14} />}>
                  {t.diary.newCategory}
                </Chip>
              ) : (
                <div className="flex flex-col gap-2 flex-shrink-0" style={{ width: 220 }}>
                  <div className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      className="input"
                      style={{ width: 140 }}
                      placeholder={t.diary.newCategoryPlaceholder}
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                    />
                    <button onClick={addCategory} className="p-2 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex-shrink-0">
                      <Plus size={15} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {categoryIdeas.map((idea) => (
                      <button
                        key={idea}
                        onClick={() => setNewCategoryName(idea)}
                        className="text-[11px] px-2 py-1 rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
                      >
                        {idea}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {activeCategory !== 'all' && (
              <div className="flex flex-wrap gap-x-4 mb-4">
                <button
                  onClick={() => setStylingCategoryId(activeCategory)}
                  className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] py-2 px-3 -mx-3 rounded-[var(--radius-md)] active:bg-[var(--color-primary-soft)]"
                >
                  <Type size={14} />
                  {t.diary.styleThisCategoryCta}
                </button>
                <button
                  onClick={() => setBookCodeOpen(true)}
                  className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] py-2 px-3 -mx-3 rounded-[var(--radius-md)] active:bg-[var(--color-primary-soft)]"
                  data-testid="book-code-open"
                >
                  <Lock size={14} />
                  {hasBookCode(activeCategory) ? (langEn ? 'Own word (set)' : 'Eigenes Wort (gesetzt)') : langEn ? 'Protect with an own word' : 'Mit eigenem Wort schützen'}
                </button>
              </div>
            )}

            {activeCategory === 'all' && hiddenInLocked > 0 && (
              <p className="text-[12.5px] text-[var(--color-text-muted)] mb-4 flex items-center gap-1.5" data-testid="diary-hidden-note">
                <Lock size={13} /> {langEn ? `${hiddenInLocked} ${hiddenInLocked === 1 ? 'entry is' : 'entries are'} hidden in closed diaries. Open the diary to see ${hiddenInLocked === 1 ? 'it' : 'them'}.` : `${hiddenInLocked} ${hiddenInLocked === 1 ? 'Eintrag ist' : 'Einträge sind'} in verschlossenen Tagebüchern verborgen. Öffne das jeweilige Tagebuch, um ${hiddenInLocked === 1 ? 'ihn' : 'sie'} zu sehen.`}
              </p>
            )}

            {activeCategory !== 'all' && isBookLocked(activeCategory) ? (
              <BookUnlockCard categoryId={activeCategory} label={categoryLabel(activeCategory)} count={entries.filter((e) => effectiveDiaryCategory(e.categoryId) === activeCategory).length} />
            ) : (
              <>

            {composing ? (
              <Card className="mb-5">
                <div className="flex flex-wrap gap-2 mb-3">
                  {allCategoryChips.filter((c) => c.id === draftCategory || !isBookLocked(c.id)).map((c) => (
                    <Chip key={c.id} selected={draftCategory === c.id} onClick={() => setDraftCategory(c.id)} icon={<Tag size={12} />}>
                      {c.label}
                    </Chip>
                  ))}
                </div>
                <RichTextEditor
                  key={editingId ?? 'new'}
                  value={draftText}
                  onChange={setDraftText}
                  placeholder={t.diary.placeholder}
                  style={styleForCategory(draftCategory)}
                  autoFocus
                  testId="diary-rte"
                />

                {/* Mindmap(s) mit dem Eintrag verbinden */}
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2 items-center">
                    {draftMaps.map((id) => {
                      const m = mindmapRepo.getById(id);
                      if (!m) return null;
                      return (
                        <span key={id} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] text-[13px]" data-testid="diary-draft-map">
                          <button type="button" onClick={() => openMap(id, editingId ?? undefined)} className="inline-flex items-center gap-1" data-testid="diary-draft-map-open"><Network size={13} /> {m.title || (langEn ? 'Mind map' : 'Mindmap')}</button>
                          <button type="button" onClick={() => setDraftMaps(draftMaps.filter((x) => x !== id))} aria-label={langEn ? 'Disconnect' : 'Lösen'} className="w-6 h-6 flex items-center justify-center"><X size={13} /></button>
                        </span>
                      );
                    })}
                    <button type="button" onClick={() => setMapPickerOpen(true)} className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] py-1.5" data-testid="diary-connect-map">
                      <Network size={15} /> {draftMaps.length ? (langEn ? 'Connect another' : 'Weitere verbinden') : langEn ? 'Connect a mind map' : 'Eine Mindmap verbinden'}
                    </button>
                  </div>
                </div>

                {/* "Das Einzige, wo man entscheidet, ob es in den Rueckblick
                 * uebernommen wird": a switch per entry */}
                <label className="flex items-start gap-2.5 mb-3 cursor-pointer">
                  <input type="checkbox" className="mt-0.5" checked={draftInReview} onChange={(e) => setDraftInReview(e.target.checked)} />
                  <span>
                    <span className="block text-[13px] text-[var(--color-text)]">{t.diary.inReviewToggle}</span>
                    <span data-hint className="block text-[11.5px] text-[var(--color-text-faint)]">{t.diary.inReviewHint}</span>
                  </span>
                </label>

                <div className="mb-3">
                  {draftPhoto ? (
                    <div className="relative inline-block">
                      <img src={draftPhoto} alt="" className="rounded-[var(--radius-lg)] max-h-[160px] max-w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setDraftPhoto(undefined)}
                        aria-label={t.diary.removePhoto}
                        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 text-[13px] text-[var(--color-primary)] cursor-pointer">
                      <ImageIcon size={16} />
                      {t.diary.addPhoto}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => setDraftPhoto(reader.result as string);
                          reader.readAsDataURL(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                  <p className="text-[11px] text-[var(--color-text-faint)] mt-1">{t.diary.photoHint}</p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={save} fullWidth>
                    {t.common.save}
                  </Button>
                  <Button variant="ghost" onClick={() => setComposing(false)}>
                    {t.common.cancel}
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="flex gap-2 mb-5">
                <Button fullWidth variant="secondary" icon={<Plus size={17} />} onClick={startNew}>
                  {t.diary.newEntry}
                </Button>
                <Button variant="secondary" icon={<FileText size={17} />} onClick={() => setTemplatePickerOpen(true)}>
                  {t.diaryTemplates.pickerCta}
                </Button>
              </div>
            )}

            {entries.length > 0 && (
              <div className="relative mb-5">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] pointer-events-none" />
                <input
                  className="input"
                  style={{ paddingLeft: 38 }}
                  placeholder={t.diary.searchPlaceholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    aria-label={t.common.close}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            )}

            {filtered.length === 0 ? (
              <EmptyState title={t.diary.empty} />
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((entry) => (
                  <Card key={entry.id} interactive onClick={() => startEdit(entry)}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-[12px] text-[var(--color-text-faint)]">
                        {formatDateTime(entry.createdAt, locale)}
                        {' · '}
                        {categoryLabel(effectiveDiaryCategory(entry.categoryId))}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(entry.id);
                        }}
                        aria-label={t.common.delete}
                        className="p-1 text-[var(--color-text-faint)] hover:text-[var(--color-danger)] flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <RichText
                      text={entry.content}
                      className="text-[var(--color-text)]"
                      style={styleForCategory(effectiveDiaryCategory(entry.categoryId))}
                      maxLines={expandedIds.has(entry.id) ? undefined : 3}
                      testId="diary-entry-text"
                    />
                    {(entry.content.length > 140 || entry.content.split('\n').length > 3) && (
                      <button
                        onClick={(e) => {
                          // "Funktioniert auf dem Handy nicht"-Auftrag —
                          // e.stopPropagation() alone stops React's own
                          // synthetic bubbling, but the surrounding Card
                          // is `interactive` (its own onClick + an
                          // active:scale-[0.99] CSS transform) — nested
                          // tappable elements with a transform on the
                          // ancestor are a known source of inconsistent
                          // touch behavior on iOS Safari specifically.
                          // stopImmediatePropagation on the native event
                          // is the more aggressive, more reliable stop
                          // for exactly this pattern.
                          e.stopPropagation();
                          e.nativeEvent.stopImmediatePropagation();
                          setExpandedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(entry.id)) next.delete(entry.id);
                            else next.add(entry.id);
                            return next;
                          });
                        }}
                        data-no-tap-feedback
                        className="text-[12px] text-[var(--color-primary)] mt-1 py-1.5 -my-1.5"
                      >
                        {expandedIds.has(entry.id) ? t.diary.showLess : t.diary.showMore}
                      </button>
                    )}
                    {entry.mindmapIds && entry.mindmapIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {entry.mindmapIds.map((mid) => {
                          const m = mindmapRepo.getById(mid);
                          if (!m) return null;
                          return (
                            <button
                              key={mid}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openMap(mid, entry.id);
                              }}
                              data-no-tap-feedback
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] text-[13px]"
                              data-testid="diary-entry-map"
                            >
                              <Network size={13} /> {m.title || (langEn ? 'Mind map' : 'Mindmap')}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {entry.photo && (
                      <img src={entry.photo} alt="" className="mt-2 rounded-[var(--radius-md)] max-h-[120px] max-w-full object-cover" />
                    )}
                    {entry.polyvagalSnapshot && entry.polyvagalSnapshot.length > 0 && (
                      <div className="mt-2 bg-[var(--color-surface-muted)] rounded-[var(--radius-md)] p-1.5 inline-block">
                        <MiniCurve points={entry.polyvagalSnapshot} width={110} height={32} />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
              </>
            )}
          </>
        )}
      </div>
      </div>

      <DiaryExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        categories={customCategories.filter((c) => c.label !== ACHIEVEMENT_CATEGORY_LABEL)}
        earliestDate={entries[entries.length - 1]?.createdAt.slice(0, 10) ?? new Date().toISOString().slice(0, 10)}
        latestDate={entries[0]?.createdAt.slice(0, 10) ?? new Date().toISOString().slice(0, 10)}
        onExport={handleExport}
      />

      {printingEntries && (
        <DiaryPrintView
          entries={printingEntries.entries}
          categoryLabel={(id) => categoryLabel(effectiveDiaryCategory(id))}
          labels={{ title: t.diary.exportTitle, period: t.diary.exportRangeLabel, noEntries: t.diary.empty }}
          formatDate={(iso) => new Date(iso).toLocaleDateString(settings.language === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          fromDate={printingEntries.fromDate}
          toDate={printingEntries.toDate}
        />
      )}

      {printingReview && (
        <DailyReviewPrintView
          days={printingReview.days}
          t={t}
          labels={{ title: t.diary.exportKindReview, period: t.diary.exportRangeLabel, noContent: t.diary.reviewEmpty }}
          formatDay={(day) => new Date(day).toLocaleDateString(settings.language === 'de' ? 'de-DE' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          fromDate={printingReview.fromDate}
          toDate={printingReview.toDate}
          formatDate={(iso) => new Date(iso).toLocaleDateString(settings.language === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        />
      )}

      {stylingCategoryId && (
        <DiaryCategoryStyleModal
          open={!!stylingCategoryId}
          onClose={() => setStylingCategoryId(null)}
          categoryLabel={categoryLabel(stylingCategoryId)}
          current={getCategoryStyle(stylingCategoryId)}
          onSave={(style) => {
            setCategoryStyle(stylingCategoryId, style);
            forceStyleRefresh((n) => n + 1);
            setStylingCategoryId(null);
          }}
        />
      )}
      <MindmapPickerModal open={mapPickerOpen} onClose={() => setMapPickerOpen(false)} selected={draftMaps} onChange={setDraftMaps} />
      {activeCategory !== 'all' && (
        <BookCodeModal open={bookCodeOpen} onClose={() => setBookCodeOpen(false)} categoryId={activeCategory} label={categoryLabel(activeCategory)} />
      )}
      <TemplatePickerModal
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onPick={startNewFromTemplate}
      />
    </div>
  );
}
