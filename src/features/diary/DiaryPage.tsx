import { useEffect, useMemo, useState } from 'react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { triggerPrint } from '../../services/printSupport';
import { Plus, Search, Trash2, X, Tag, Type, FileDown, FileText, Mail, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const allDiary = diaryRepo.getAll();
  const generalEntries = allDiary.filter((d) => effectiveDiaryCategory(d.categoryId) === DIARY_DEFAULT_CATEGORY_ID);
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

  function handleExport(choice: DiaryExportChoice) {
    if (choice.kind === 'entries') {
      const filteredForExport = diaryRepo.getAll().filter((e) => {
        const day = e.createdAt.slice(0, 10);
        if (day < choice.fromDate || day > choice.toDate) return false;
        if (choice.categoryId === 'all') return true;
        return effectiveDiaryCategory(e.categoryId) === choice.categoryId;
      });
      setPrintingEntries({ entries: filteredForExport, fromDate: choice.fromDate, toDate: choice.toDate });
    } else {
      setPrintingReview({ days: buildReviewDays(choice.fromDate, choice.toDate), fromDate: choice.fromDate, toDate: choice.toDate });
    }
    setTimeout(() => triggerPrint(t.common.printStandaloneExplanation), 50);
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
  const [activeCategory, setActiveCategory] = useState<'all' | string>('all');
  const [query, setQuery] = useState('');
  const [composing, setComposing] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [draftPhoto, setDraftPhoto] = useState<string | undefined>(undefined);
  const [draftCategory, setDraftCategory] = useState<string>(DIARY_DEFAULT_CATEGORY_ID);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [view, setView] = useState<'entries' | 'review'>('entries');
  const [fontPickerOpen, setFontPickerOpen] = useState(false);

  function categoryLabel(id: string): string {
    if (id === DIARY_DEFAULT_CATEGORY_ID) return DIARY_DEFAULT_CATEGORY_LABEL;
    return customCategories.find((c) => c.id === id)?.label ?? id;
  }

  const filtered = useMemo(() => {
    let list = entries;
    if (activeCategory !== 'all') {
      list = list.filter((e) => effectiveDiaryCategory(e.categoryId) === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((e) => e.content.toLowerCase().includes(q));
    }
    return list;
  }, [entries, activeCategory, query]);

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
    setDraftCategory(activeCategory === 'all' ? DIARY_DEFAULT_CATEGORY_ID : activeCategory);
    setComposing(true);
  }

  function startNewFromTemplate(startingText: string) {
    setEditingId(null);
    setDraftText(startingText);
    setDraftPhoto(undefined);
    setDraftCategory(activeCategory === 'all' ? DIARY_DEFAULT_CATEGORY_ID : activeCategory);
    setComposing(true);
  }

  function startEdit(entry: DiaryEntry) {
    setEditingId(entry.id);
    setDraftText(entry.content);
    setDraftPhoto(entry.photo);
    setDraftCategory(effectiveDiaryCategory(entry.categoryId));
    setComposing(true);
  }

  function save() {
    if (!draftText.trim()) return;
    const now = new Date().toISOString();
    if (editingId) {
      const existing = diaryRepo.getById(editingId);
      if (existing) {
        diaryRepo.save({ ...existing, content: draftText, categoryId: draftCategory, photo: draftPhoto, updatedAt: now });
      }
    } else {
      diaryRepo.save({ id: createId('diary'), createdAt: now, updatedAt: now, content: draftText, categoryId: draftCategory, photo: draftPhoto });
    }
    setComposing(false);
    setDraftText('');
    setDraftPhoto(undefined);
    setEditingId(null);
    refresh();
    say(pickLine({ page: '/sicherheit/tagebuch', trigger: 'speichern' }), { joy: !editingId });
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
        <CompulsionAwarenessNote />

        <div className="flex gap-2 mb-4">
          <Chip selected={view === 'entries'} onClick={() => setView('entries')}>
            {t.diary.viewEntries}
          </Chip>
          <Chip selected={view === 'review'} onClick={() => setView('review')}>
            {t.diary.viewReview}
          </Chip>
        </div>

        <Link to="/entdecken/brief-an-mich" className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] mb-5">
          <Mail size={14} /> {t.diary.lettersLinkCta}
        </Link>

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

        {view === 'review' ? (
          <DailyReview diaryEntries={entries} />
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
              <button
                onClick={() => setStylingCategoryId(activeCategory)}
                className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] mb-4 py-2 px-3 -mx-3 rounded-[var(--radius-md)] active:bg-[var(--color-primary-soft)]"
              >
                <Type size={14} />
                {t.diary.styleThisCategoryCta}
              </button>
            )}

            {composing ? (
              <Card className="mb-5">
                <div className="flex flex-wrap gap-2 mb-3">
                  {allCategoryChips.map((c) => (
                    <Chip key={c.id} selected={draftCategory === c.id} onClick={() => setDraftCategory(c.id)} icon={<Tag size={12} />}>
                      {c.label}
                    </Chip>
                  ))}
                </div>
                <textarea
                  autoFocus
                  className="input mb-3"
                  rows={6}
                  placeholder={t.diary.placeholder}
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  style={styleForCategory(draftCategory)}
                />

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
                    <p
                      className={expandedIds.has(entry.id) ? 'text-[var(--color-text)] whitespace-pre-wrap' : 'text-[var(--color-text)] line-clamp-3 whitespace-pre-wrap'}
                      style={styleForCategory(effectiveDiaryCategory(entry.categoryId))}
                    >
                      {entry.content}
                    </p>
                    {entry.content.length > 140 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(entry.id)) next.delete(entry.id);
                            else next.add(entry.id);
                            return next;
                          });
                        }}
                        className="text-[12px] text-[var(--color-primary)] mt-1"
                      >
                        {expandedIds.has(entry.id) ? t.diary.showLess : t.diary.showMore}
                      </button>
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
      <TemplatePickerModal
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onPick={startNewFromTemplate}
      />
    </div>
  );
}
