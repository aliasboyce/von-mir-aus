import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpButton } from '../../components/navigation/HelpButton';
import { triggerPrint } from '../../services/printSupport';
import { createPortal } from 'react-dom';
import { Plus, Pencil, Trash2, Pill, ChevronRight, ChevronLeft, NotebookPen, Settings2, Maximize2, X, FileDown, CalendarRange, Repeat, Package } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { pickLine } from '../../components/companion/companionRegistry';
import { mediLogRepo } from './mediLogRepo';
import { MediLogChart } from './MediLogChart';
import { MediLogOverallChart } from './MediLogOverallChart';
import { MediLogPrintView } from './MediLogPrintView';
import { MediLogOverallPrintView } from './MediLogOverallPrintView';
import { RangeEntryModal } from './RangeEntryModal';
import { RecurringMedicationsModal } from './RecurringMedicationsModal';
import { RecurringConfirmationPrompt } from './RecurringConfirmationPrompt';
import { recurringMedicationsRepo, doseForDate } from './recurringMedicationsRepo';
import { pendingRecurringInstances, type PendingInstance } from './recurringPending';
import { MedicationManagerModal } from './MedicationManagerModal';
import { savedMedicationsRepo, MEDICATION_COLOR_PALETTE } from './savedMedicationsRepo';
import { createId } from '../../services/storage/repository';
import { diaryRepo } from '../diary/diaryRepo';
import { DIARY_DEFAULT_CATEGORY_ID } from '../diary/diaryCategories';
import type { MediLogEntry, SavedMedication, RecurringMedication } from '../../data/types';

function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function todayKey(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function MediLogPage() {
  const t = useT();
  const navigate = useNavigate();
  const say = useCompanionSay();
  const { settings, updateSettings } = useSettings();
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';
  const [entries, setEntries] = useState<MediLogEntry[]>(() =>
    mediLogRepo.getAll().sort((a, b) => b.takenAt.localeCompare(a.takenAt)),
  );
  const [editing, setEditing] = useState<MediLogEntry | null>(null);
  const [view, setView] = useState<'tag' | 'medikament' | 'gesamt'>('tag');
  const [openMedication, setOpenMedication] = useState<string | null>(null);
  const [managingMedications, setManagingMedications] = useState(false);
  const [rangeEntryOpen, setRangeEntryOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [recurringPrefill, setRecurringPrefill] = useState<SavedMedication | null>(null);
  const [recurring, setRecurring] = useState<RecurringMedication[]>(() => recurringMedicationsRepo.getAll());
  const pending = useMemo(() => pendingRecurringInstances(recurring, entries), [recurring, entries]);

  function handleRecurringAnswer(instance: PendingInstance, answer: 'taken' | 'skipped' | 'now') {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const takenAt =
      answer === 'now' ? now.toISOString() : new Date(`${today}T${instance.time}:00`).toISOString();
    const dose = doseForDate(instance.recurring, takenAt.slice(0, 10));
    const entry: MediLogEntry = {
      id: createId('medi'),
      name: instance.recurring.name,
      medicationId: instance.recurring.medicationId,
      doseValue: dose.doseValue,
      doseUnit: dose.doseUnit,
      takenAt,
      status: answer === 'skipped' ? 'skipped' : 'taken',
      recurringMedicationId: instance.recurring.id,
      recurringTimeSlot: instance.time,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    mediLogRepo.save(entry);
    // A skipped dose is explicitly never handed to the diary as if it
    // were taken — only actually-confirmed intakes qualify, matching the
    // same rule the manual auto-transfer setting follows below.
    if (settings.mediLogAutoDiary && entry.status !== 'skipped') {
      autoTransferToDiary(entry);
    }
    refresh();
  }
  const [chartFullscreen, setChartFullscreen] = useState(false);
  const [overallFullscreen, setOverallFullscreen] = useState(false);
  const [overallPdfOpen, setOverallPdfOpen] = useState(false);
  const [overallPdfFrom, setOverallPdfFrom] = useState('');
  const [overallPdfTo, setOverallPdfTo] = useState('');
  const [printingOverallPdf, setPrintingOverallPdf] = useState<{
    medications: typeof overallMedications;
    fromDate: string;
    toDate: string;
  } | null>(null);
  const [pdfRangeFor, setPdfRangeFor] = useState<string | null>(null);
  const [pdfFrom, setPdfFrom] = useState('');
  const [pdfTo, setPdfTo] = useState('');
  const [printingPdf, setPrintingPdf] = useState<{
    medicationName: string;
    entries: MediLogEntry[];
    fromDate: string;
    toDate: string;
    color: string;
  } | null>(null);

  function openPdfRangePicker(medicationKey: string, medicationEntries: MediLogEntry[]) {
    const sorted = [...medicationEntries].sort((a, b) => a.takenAt.localeCompare(b.takenAt));
    setPdfFrom(sorted[0]?.takenAt.slice(0, 10) ?? todayKey());
    setPdfTo(sorted[sorted.length - 1]?.takenAt.slice(0, 10) ?? todayKey());
    setPdfRangeFor(medicationKey);
  }

  function generatePdf() {
    if (!pdfRangeFor || !activeMedication) return;
    const inRange = chartEntries.filter((e) => {
      const day = e.takenAt.slice(0, 10);
      return day >= pdfFrom && day <= pdfTo;
    });
    setPrintingPdf({
      medicationName: activeMedication.displayName,
      entries: inRange,
      fromDate: pdfFrom,
      toDate: pdfTo,
      color: activeMedicationColor ?? MEDICATION_COLOR_PALETTE[0],
    });
    setPdfRangeFor(null);
    setTimeout(() => triggerPrint(t.common.printStandaloneExplanation), 50);
  }

  useEffect(() => {
    const clear = () => {
      setPrintingPdf(null);
      setPrintingOverallPdf(null);
    };
    window.addEventListener('afterprint', clear);
    return () => window.removeEventListener('afterprint', clear);
  }, []);

  function openOverallPdfRangePicker() {
    const all = overallMedications.flatMap((m) => m.entries);
    const sorted = [...all].sort((a, b) => a.takenAt.localeCompare(b.takenAt));
    setOverallPdfFrom(sorted[0]?.takenAt.slice(0, 10) ?? todayKey());
    setOverallPdfTo(sorted[sorted.length - 1]?.takenAt.slice(0, 10) ?? todayKey());
    setOverallPdfOpen(true);
  }

  function generateOverallPdf() {
    setPrintingOverallPdf({ medications: filteredOverallMedications, fromDate: overallPdfFrom, toDate: overallPdfTo });
    setOverallPdfOpen(false);
    setTimeout(() => triggerPrint(t.common.printStandaloneExplanation), 50);
  }
  const [savedMeds, setSavedMeds] = useState<SavedMedication[]>(() => savedMedicationsRepo.getAll());

  function applySavedMedication(m: SavedMedication) {
    if (!editing) return;
    setEditing({
      ...editing,
      name: m.name,
      medicationId: m.id,
      doseValue: m.typicalDoseValue,
      doseUnit: m.typicalDoseUnit,
    });
  }

  function refresh() {
    setEntries(mediLogRepo.getAll().sort((a, b) => b.takenAt.localeCompare(a.takenAt)));
  }

  function openNew() {
    const now = new Date().toISOString();
    setEditing({ id: createId('medi'), name: '', amount: '', takenAt: now, note: '', createdAt: now, updatedAt: now });
  }

  function save() {
    if (!editing || !editing.name.trim()) return;
    const isNew = !mediLogRepo.getAll().some((e) => e.id === editing.id);
    mediLogRepo.save({ ...editing, updatedAt: new Date().toISOString() });
    if (isNew && settings.mediLogAutoDiary) {
      autoTransferToDiary(editing);
    }
    setEditing(null);
    refresh();
    say(pickLine({ page: '*', trigger: 'speichern' }));
  }

  const [diaryDraft, setDiaryDraft] = useState<{ entry: MediLogEntry; text: string } | null>(null);

  function composeAndOpenDiaryDraft(entry: MediLogEntry) {
    const dose = entry.doseValue != null ? `${entry.doseValue} ${entry.doseUnit ?? ''}`.trim() : entry.amount;
    const parts = [entry.name, dose].filter(Boolean).join(' · ');
    const timeLabel = new Date(entry.takenAt).toLocaleString(locale, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const text = [`Medi-Log: ${parts}`, timeLabel, entry.note].filter(Boolean).join('\n');
    setDiaryDraft({ entry, text });
  }

  function confirmDiaryDraft() {
    if (!diaryDraft) return;
    const now = new Date().toISOString();
    diaryRepo.save({
      id: createId('diary'),
      createdAt: diaryDraft.entry.takenAt,
      updatedAt: now,
      categoryId: DIARY_DEFAULT_CATEGORY_ID,
      content: diaryDraft.text,
    });
    setDiaryDraft(null);
    say(pickLine({ page: '/sicherheit/tagebuch', trigger: 'speichern' }), { joy: true });
  }

  // Used only from the entry-creation flows below (manual "Neuer
  // Eintrag" save, the range-entry batch save, and confirmed recurring
  // instances) — never re-triggered by a render or effect, so each
  // MediLogEntry only ever produces at most one automatic diary entry,
  // regardless of how many times the page re-renders afterward.
  function autoTransferToDiary(entry: MediLogEntry) {
    const dose = entry.doseValue != null ? `${entry.doseValue} ${entry.doseUnit ?? ''}`.trim() : entry.amount;
    const parts = [entry.name, dose].filter(Boolean).join(' · ');
    const timeLabel = new Date(entry.takenAt).toLocaleString(locale, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const text = [`Medi-Log: ${parts}`, timeLabel, entry.note].filter(Boolean).join('\n');
    const now = new Date().toISOString();
    diaryRepo.save({
      id: createId('diary'),
      createdAt: entry.takenAt,
      updatedAt: now,
      categoryId: DIARY_DEFAULT_CATEGORY_ID,
      content: text,
    });
  }

  function remove(id: string) {
    if (!window.confirm(t.mediLog.confirmDelete)) return;
    mediLogRepo.remove(id);
    refresh();
  }

  const todayEntries = useMemo(
    () =>
      entries
        .filter((e) => e.takenAt.slice(0, 10) === todayKey())
        .sort((a, b) => a.takenAt.localeCompare(b.takenAt)),
    [entries],
  );
  const todayCount = todayEntries.length;

  const byDay = useMemo(() => {
    const map = new Map<string, MediLogEntry[]>();
    entries.forEach((e) => {
      const day = e.takenAt.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(e);
    });
    return Array.from(map.entries());
  }, [entries]);

  const byMedication = useMemo(() => {
    const map = new Map<string, MediLogEntry[]>();
    entries.forEach((e) => {
      const key = e.name.trim().toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.entries())
      .map(([key, list]) => ({
        key,
        displayName: list[0].name,
        entries: list.sort((a, b) => b.takenAt.localeCompare(a.takenAt)),
      }))
      .sort((a, b) => b.entries.length - a.entries.length);
  }, [entries]);

  function colorForEntry(entry: MediLogEntry): string | undefined {
    if (!entry.medicationId) return undefined;
    return savedMeds.find((m) => m.id === entry.medicationId)?.color;
  }

  function renderEntryCard(entry: MediLogEntry) {
    const color = colorForEntry(entry);
    return (
      <Card key={entry.id} className="flex items-start gap-3" style={entry.status === 'skipped' ? { opacity: 0.6 } : undefined}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: color ? `${color}22` : 'var(--color-primary-soft)',
            color: color ?? 'var(--color-primary)',
          }}
        >
          <Pill size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] text-[var(--color-text)]">
            {entry.name}
            {entry.doseValue != null && (
              <span className="text-[var(--color-text-muted)]">
                {' '}
                · {entry.doseValue} {entry.doseUnit ?? ''}
              </span>
            )}
            {entry.doseValue == null && entry.amount && <span className="text-[var(--color-text-muted)]"> · {entry.amount}</span>}
            {entry.status === 'skipped' && (
              <span className="text-[12px] text-[var(--color-text-faint)] italic"> · {t.mediLog.skippedLabel}</span>
            )}
          </p>
          <p className="text-[12px] text-[var(--color-text-faint)]">
            {new Date(entry.takenAt).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}
            {' · '}
            {new Date(entry.takenAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
          </p>
          {entry.note && (
            <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
              <span className="text-[var(--color-text-faint)]">{t.mediLog.noteLabel}: </span>
              {entry.note}
            </p>
          )}
          {entry.amount && (
            <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
              <span className="text-[var(--color-text-faint)]">{t.mediLog.amountLabel}: </span>
              {entry.amount}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => composeAndOpenDiaryDraft(entry)}
            aria-label={t.mediLog.addToDiary}
            className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
          >
            <NotebookPen size={14} />
          </button>
          <button
            onClick={() => setEditing(entry)}
            aria-label={t.common.edit}
            className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => remove(entry.id)}
            aria-label={t.common.delete}
            className="p-1.5 rounded-full text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </Card>
    );
  }

  const activeMedication = byMedication.find((m) => m.key === openMedication);
  const activeMedicationColor = activeMedication
    ? savedMeds.find((m) => m.id === activeMedication.entries.find((e) => e.medicationId)?.medicationId)?.color ??
      recurring.find((r) => r.id === activeMedication.entries.find((e) => e.recurringMedicationId)?.recurringMedicationId)?.color
    : undefined;
  // Skipped recurring instances must never count as "0mg taken" in any
  // statistic or chart — they're a record that a dose was deliberately
  // not taken, not data about an actual dose. The unfiltered
  // activeMedication.entries (including skipped ones) is still used for
  // the plain entry list, so a skipped dose stays visible there.
  const chartEntries = activeMedication ? activeMedication.entries.filter((e) => e.status !== 'skipped') : [];
  const overallMedications = useMemo(
    () =>
      byMedication.map((m, i) => {
        const linkedSavedColor = savedMeds.find((sm) => sm.id === m.entries.find((e) => e.medicationId)?.medicationId)?.color;
        const linkedRecurring = recurring.find((r) => r.id === m.entries.find((e) => e.recurringMedicationId)?.recurringMedicationId);
        return {
          key: m.key,
          displayName: m.displayName,
          // Saved-medication color wins when both exist (it's the more
          // general, reusable source of truth), then a recurring
          // medication's own color, then the positional palette — never
          // silently ignoring a color the person deliberately picked.
          color: linkedSavedColor ?? linkedRecurring?.color ?? MEDICATION_COLOR_PALETTE[i % MEDICATION_COLOR_PALETTE.length],
          entries: m.entries.filter((e) => e.status !== 'skipped'),
        };
      }),
    [byMedication, savedMeds, recurring],
  );

  // Which medication keys are checked in the "Verlauf anzeigen für"
  // filter — undefined means "no explicit selection yet", which is
  // treated as "all", so a person who never touches the filter sees
  // the exact same all-medications view as before this feature existed.
  // "PDF-Export soll die Auswahl beachten"-Auftrag — the PDF export now
  // uses this same filtered selection too (see generateOverallPdf
  // above), instead of always exporting every medication regardless of
  // what's shown on screen.
  const [selectedMedicationKeys, setSelectedMedicationKeys] = useState<string[] | null>(null);
  const filteredOverallMedications = useMemo(
    () => (selectedMedicationKeys === null ? overallMedications : overallMedications.filter((m) => selectedMedicationKeys.includes(m.key))),
    [overallMedications, selectedMedicationKeys],
  );
  function toggleMedicationFilter(key: string) {
    setSelectedMedicationKeys((prev) => {
      const current = prev ?? overallMedications.map((m) => m.key);
      return current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    });
  }
  function isMedicationSelected(key: string): boolean {
    return selectedMedicationKeys === null || selectedMedicationKeys.includes(key);
  }

  return (
    <div className="animate-in">
      <div className="no-print">
      <TopBar action={<HelpButton helpKey="mediLog" />} />
      <div className="px-5 pb-6">
        <h1 className="text-[24px] mb-1">{t.mediLog.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-1">{t.mediLog.subtitle}</p>
        <p className="text-[12px] text-[var(--color-text-faint)] mb-4">{t.mediLog.subtitleSecondary}</p>

        <Button fullWidth icon={<Plus size={17} />} onClick={openNew} className="mb-5">
          {t.mediLog.addNew}
        </Button>

        <div className="flex items-center gap-4 mb-5">
          <button
            onClick={() => setManagingMedications(true)}
            className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)]"
          >
            <Settings2 size={14} />
            {t.mediLog.manageMedications}
          </button>
          <button
            onClick={() => navigate('/entdecken/medi-log/packungen')}
            className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)]"
          >
            <Package size={14} />
            {t.medPackages.title}
          </button>
          <button
            onClick={() => setRangeEntryOpen(true)}
            className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)]"
          >
            <CalendarRange size={14} />
            {t.mediLog.rangeEntryTitle}
          </button>
          <button
            onClick={() => setRecurringOpen(true)}
            className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)]"
          >
            <Repeat size={14} />
            {t.mediLog.manageRecurring}
          </button>
        </div>

        <div className="flex items-center justify-between mb-5">
          <span className="text-[13px] text-[var(--color-text-muted)]">{t.settings.dailyReviewMediLog}</span>
          <button
            role="switch"
            aria-checked={settings.dailyReviewShowMediLog !== false}
            onClick={() => updateSettings({ dailyReviewShowMediLog: !(settings.dailyReviewShowMediLog !== false) })}
            className="w-10 h-6 rounded-full relative flex-shrink-0"
            style={{ background: settings.dailyReviewShowMediLog !== false ? 'var(--color-primary)' : 'var(--color-border)' }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
              style={{ left: settings.dailyReviewShowMediLog !== false ? 18 : 2 }}
            />
          </button>
        </div>

        <RecurringConfirmationPrompt pending={pending} onAnswer={handleRecurringAnswer} />

        <Card padding="md" className="mb-5">
          <div className="text-center mb-2">
            <p className="text-[28px] leading-none text-[var(--color-primary)] font-medium mb-1">{todayCount}</p>
            <p className="text-[13px] text-[var(--color-text-muted)]">{t.mediLog.todayCount}</p>
          </div>
          {todayEntries.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--color-border)] mt-2">
              {todayEntries.map((e) => {
                const color = colorForEntry(e);
                const dose = e.doseValue != null ? `${e.doseValue} ${e.doseUnit ?? ''}`.trim() : e.amount;
                return (
                  <div key={e.id} className="flex items-center gap-2 text-[13px]">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color ?? 'var(--color-text-faint)' }} />
                    <span className="text-[var(--color-text-faint)] flex-shrink-0">
                      {new Date(e.takenAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[var(--color-text)] truncate">{e.name}</span>
                    {dose && <span className="text-[var(--color-text-muted)] flex-shrink-0">— {dose}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {entries.length > 0 && (
          <div className="flex gap-2 mb-5">
            <Chip selected={view === 'tag'} onClick={() => setView('tag')}>
              {t.mediLog.viewByDay}
            </Chip>
            <Chip selected={view === 'medikament'} onClick={() => setView('medikament')}>
              {t.mediLog.viewByMedication}
            </Chip>
            {byMedication.length > 1 && (
              <Chip selected={view === 'gesamt'} onClick={() => setView('gesamt')}>
                {t.mediLog.viewOverall}
              </Chip>
            )}
          </div>
        )}

        {entries.length === 0 ? (
          <EmptyState title={t.mediLog.empty} />
        ) : view === 'tag' ? (
          <div className="flex flex-col gap-5 mb-4">
            {byDay.map(([day, dayEntries]) => (
              <div key={day}>
                <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
                  {new Date(day).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                  {' · '}
                  {t.mediLog.entryCount.replace('{count}', String(dayEntries.length))}
                </p>
                <div className="flex flex-col gap-2">{dayEntries.map(renderEntryCard)}</div>
              </div>
            ))}
          </div>
        ) : view === 'gesamt' ? (
          <div className="mb-4">
            <Card padding="md" className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)]">
                  {t.mediLog.overallChartTitle}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={openOverallPdfRangePicker}
                    aria-label={t.mediLog.exportPdf}
                    className="p-1 text-[var(--color-text-faint)]"
                  >
                    <FileDown size={15} />
                  </button>
                  <button
                    onClick={() => setOverallFullscreen(true)}
                    aria-label={t.mediLog.enlargeChart}
                    className="p-1 text-[var(--color-text-faint)]"
                  >
                    <Maximize2 size={15} />
                  </button>
                </div>
              </div>
              {overallMedications.length > 1 && (
                <>
                  <p className="text-[11px] text-[var(--color-text-faint)] mb-2">{t.mediLog.filterDiscoveryHint}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {overallMedications.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => toggleMedicationFilter(m.key)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px]"
                      style={{
                        background: isMedicationSelected(m.key) ? `${m.color}22` : 'var(--color-surface-muted)',
                        outline: isMedicationSelected(m.key) ? `1.5px solid ${m.color}` : '1px solid transparent',
                        color: 'var(--color-text)',
                        opacity: isMedicationSelected(m.key) ? 1 : 0.5,
                      }}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                      {m.displayName}
                    </button>
                  ))}
                  </div>
                </>
              )}
              <MediLogOverallChart medications={filteredOverallMedications} />
            </Card>
          </div>
        ) : activeMedication ? (
          <div className="mb-4">
            <button
              onClick={() => setOpenMedication(null)}
              className="flex items-center gap-1 text-[13px] text-[var(--color-primary)] mb-3"
            >
              <ChevronLeft size={15} />
              {t.mediLog.backToOverview}
            </button>
            <p className="text-[16px] text-[var(--color-text)] mb-1">{activeMedication.displayName}</p>
            <p className="text-[13px] text-[var(--color-text-muted)] mb-4">
              {t.mediLog.totalCount.replace('{count}', String(chartEntries.length))}
            </p>

            {(() => {
              const now = Date.now();
              const entries24h = chartEntries.filter(
                (e) => now - new Date(e.takenAt).getTime() <= 24 * 60 * 60 * 1000,
              );
              const entries7d = chartEntries.filter(
                (e) => now - new Date(e.takenAt).getTime() <= 7 * 24 * 60 * 60 * 1000,
              );
              const firstEntry = [...chartEntries].sort((a, b) =>
                a.takenAt.localeCompare(b.takenAt),
              )[0];
              const daysSinceFirst = Math.max(
                1,
                Math.ceil((now - new Date(firstEntry.takenAt).getTime()) / (24 * 60 * 60 * 1000)),
              );

              // Determine the medication's "main" unit (most common non-empty
              // unit among its entries) — sums only entries using that same
              // unit, so e.g. "mg" and "Tropfen" for the same medication
              // never get silently added together into a meaningless number.
              const unitCounts = new Map<string, number>();
              chartEntries.forEach((e) => {
                if (e.doseUnit) unitCounts.set(e.doseUnit, (unitCounts.get(e.doseUnit) ?? 0) + 1);
              });
              const mainUnit = [...unitCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
              const sumFor = (list: typeof chartEntries) =>
                mainUnit
                  ? list.filter((e) => e.doseUnit === mainUnit).reduce((sum, e) => sum + (e.doseValue ?? 0), 0)
                  : null;
              const total24h = sumFor(entries24h);
              const total7d = sumFor(entries7d);
              const totalAll = sumFor(chartEntries);
              const dailyAvgDose = totalAll != null ? totalAll / daysSinceFirst : null;

              const fmt = (n: number) => n.toFixed(2).replace(/\.?0+$/, '').replace('.', locale.startsWith('de') ? ',' : '.');

              return (
                <div className="grid grid-cols-2 gap-2 mb-5">
                  <Card padding="md" className="text-center">
                    <p className="text-[20px] leading-none text-[var(--color-primary)] font-medium mb-1">{entries24h.length}</p>
                    <p className="text-[11px] text-[var(--color-text-faint)] mb-1">{t.mediLog.stat24h}</p>
                    {total24h != null && (
                      <p className="text-[12px] text-[var(--color-text-muted)]">
                        {t.mediLog.statTotal}: {fmt(total24h)} {mainUnit}
                      </p>
                    )}
                  </Card>
                  <Card padding="md" className="text-center">
                    <p className="text-[20px] leading-none text-[var(--color-primary)] font-medium mb-1">{entries7d.length}</p>
                    <p className="text-[11px] text-[var(--color-text-faint)] mb-1">{t.mediLog.stat7d}</p>
                    {total7d != null && (
                      <p className="text-[12px] text-[var(--color-text-muted)]">
                        {t.mediLog.statTotal}: {fmt(total7d)} {mainUnit}
                      </p>
                    )}
                  </Card>
                  {dailyAvgDose != null && (
                    <Card padding="md" className="text-center col-span-2">
                      <p className="text-[13px] text-[var(--color-text-muted)]">
                        {t.mediLog.statAverage}: {fmt(dailyAvgDose)} {mainUnit} / {t.mediLog.perDay}
                      </p>
                    </Card>
                  )}
                </div>
              );
            })()}

            <Card padding="md" className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)]">
                  {t.mediLog.chartTitle}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openPdfRangePicker(activeMedication.key, chartEntries)}
                    aria-label={t.mediLog.exportPdf}
                    className="p-1 text-[var(--color-text-faint)]"
                  >
                    <FileDown size={15} />
                  </button>
                  <button
                    onClick={() => setChartFullscreen(true)}
                    aria-label={t.mediLog.enlargeChart}
                    className="p-1 text-[var(--color-text-faint)]"
                  >
                    <Maximize2 size={15} />
                  </button>
                </div>
              </div>
              <MediLogChart entries={chartEntries} color={activeMedicationColor} />
            </Card>

            <div className="flex flex-col gap-2">{activeMedication.entries.map(renderEntryCard)}</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            {byMedication.map((m) => (
              <button key={m.key} onClick={() => setOpenMedication(m.key)} className="text-left">
                <Card interactive className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                    <Pill size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-[var(--color-text)] truncate">{m.displayName}</p>
                    <p className="text-[12px] text-[var(--color-text-faint)]">
                      {t.mediLog.totalCount.replace('{count}', String(m.entries.length))}
                    </p>
                  </div>
                  <ChevronRight size={15} className="text-[var(--color-text-faint)] flex-shrink-0" />
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={t.mediLog.addNew}>
        {editing && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            {savedMeds.length > 0 && (
              <div>
                <span className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5 block">
                  {t.mediLog.quickPickLabel}
                </span>
                <div className="flex flex-wrap gap-2">
                  {savedMeds.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => applySavedMedication(m)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px]"
                      style={{
                        background: editing.medicationId === m.id ? m.color : 'var(--color-surface-muted)',
                        color: editing.medicationId === m.id ? '#fff' : 'var(--color-text)',
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: editing.medicationId === m.id ? '#fff' : m.color }}
                      />
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.mediLog.nameLabel}</span>
              <input
                autoFocus={savedMeds.length === 0}
                className="input"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value, medicationId: undefined })}
                required
              />
            </label>
            <div className="flex gap-2">
              <label className="flex flex-col gap-1.5 flex-1">
                <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{`${t.mediLog.doseLabel} ${t.common.optional}`}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0}
                  className="input"
                  value={editing.doseValue ?? ''}
                  onChange={(e) =>
                    setEditing({ ...editing, doseValue: e.target.value === '' ? undefined : Number(e.target.value) })
                  }
                  placeholder="2"
                />
              </label>
              <label className="flex flex-col gap-1.5" style={{ width: 110 }}>
                <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.mediLog.unitLabel}</span>
                <input
                  className="input"
                  list="medi-log-units"
                  value={editing.doseUnit ?? ''}
                  onChange={(e) => setEditing({ ...editing, doseUnit: e.target.value })}
                  placeholder="mg"
                />
                <datalist id="medi-log-units">
                  <option value="mg" />
                  <option value="ml" />
                  <option value="Tabletten" />
                  <option value="Tropfen" />
                  <option value="IE" />
                </datalist>
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{`${t.mediLog.amountLabel} ${t.common.optional}`}</span>
              <input
                className="input"
                value={editing.amount ?? ''}
                onChange={(e) => setEditing({ ...editing, amount: e.target.value })}
                placeholder={t.mediLog.amountPlaceholder}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.mediLog.timeLabel}</span>
              <input
                type="datetime-local"
                className="input"
                value={toDateTimeLocal(editing.takenAt)}
                onChange={(e) => setEditing({ ...editing, takenAt: new Date(e.target.value).toISOString() })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{`${t.mediLog.noteLabel} ${t.common.optional}`}</span>
              <textarea
                className="input"
                rows={2}
                value={editing.note ?? ''}
                onChange={(e) => setEditing({ ...editing, note: e.target.value })}
                placeholder={t.mediLog.notePlaceholder}
              />
            </label>
            <Button type="submit" fullWidth>
              {t.common.save}
            </Button>
          </form>
        )}
      </Modal>

      <Modal open={!!diaryDraft} onClose={() => setDiaryDraft(null)} title={t.mediLog.addToDiary}>
        {diaryDraft && (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.mediLog.diaryDraftHint}</span>
              <textarea
                autoFocus
                className="input"
                rows={4}
                value={diaryDraft.text}
                onChange={(e) => setDiaryDraft({ ...diaryDraft, text: e.target.value })}
              />
            </label>
            <Button fullWidth onClick={confirmDiaryDraft}>
              {t.mediLog.confirmAddToDiary}
            </Button>
          </div>
        )}
      </Modal>

      <MedicationManagerModal
        open={managingMedications}
        onClose={() => setManagingMedications(false)}
        onChange={() => setSavedMeds(savedMedicationsRepo.getAll())}
        onAddAsRecurring={(m) => {
          setManagingMedications(false);
          setRecurringPrefill(m);
          setRecurringOpen(true);
        }}
      />

      <RecurringMedicationsModal
        open={recurringOpen}
        onClose={() => {
          setRecurringOpen(false);
          setRecurringPrefill(null);
        }}
        savedMeds={savedMeds}
        prefillFrom={recurringPrefill}
        onChange={() => setRecurring(recurringMedicationsRepo.getAll())}
      />

      <RangeEntryModal
        open={rangeEntryOpen}
        onClose={() => setRangeEntryOpen(false)}
        savedMeds={savedMeds}
        recurringMeds={recurring}
        onSaved={(created) => {
          if (settings.mediLogAutoDiary) {
            created.forEach((entry) => autoTransferToDiary(entry));
          }
          refresh();
        }}
      />

      <Modal open={!!pdfRangeFor} onClose={() => setPdfRangeFor(null)} title={t.mediLog.exportPdf}>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.mediLog.fromLabel}</span>
            <input type="date" className="input" value={pdfFrom} onChange={(e) => setPdfFrom(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.mediLog.toLabel}</span>
            <input type="date" className="input" value={pdfTo} onChange={(e) => setPdfTo(e.target.value)} />
          </label>
          <Button fullWidth onClick={generatePdf} disabled={!pdfFrom || !pdfTo || pdfFrom > pdfTo}>
            {t.mediLog.createPdf}
          </Button>
        </div>
      </Modal>

      {printingPdf && (
        <MediLogPrintView
          medicationName={printingPdf.medicationName}
          entries={printingPdf.entries}
          fromDate={printingPdf.fromDate}
          toDate={printingPdf.toDate}
          color={printingPdf.color}
          labels={{
            title: t.mediLog.pdfTitle,
            period: t.mediLog.pdfPeriod,
            day: t.mediLog.pdfDay,
            amount: t.mediLog.pdfAmount,
            summary: t.mediLog.pdfSummary,
            totalLabel: t.mediLog.statTotal,
            daysWithEntryLabel: t.mediLog.pdfDaysWithEntry,
            averageLabel: t.mediLog.statAverage,
          }}
          formatDate={(iso) => new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' })}
        />
      )}

      <Modal open={overallPdfOpen} onClose={() => setOverallPdfOpen(false)} title={t.mediLog.exportPdf}>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.mediLog.fromLabel}</span>
            <input type="date" className="input" value={overallPdfFrom} onChange={(e) => setOverallPdfFrom(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.mediLog.toLabel}</span>
            <input type="date" className="input" value={overallPdfTo} onChange={(e) => setOverallPdfTo(e.target.value)} />
          </label>
          <Button fullWidth onClick={generateOverallPdf} disabled={!overallPdfFrom || !overallPdfTo || overallPdfFrom > overallPdfTo}>
            {t.mediLog.createPdf}
          </Button>
        </div>
      </Modal>

      {printingOverallPdf && (
        <MediLogOverallPrintView
          medications={printingOverallPdf.medications}
          fromDate={printingOverallPdf.fromDate}
          toDate={printingOverallPdf.toDate}
          labels={{
            title: t.mediLog.overallChartTitle,
            period: t.mediLog.pdfPeriod,
            day: t.mediLog.pdfDay,
            summary: t.mediLog.pdfSummary,
            totalLabel: t.mediLog.statTotal + ':',
            daysWithEntryLabel: t.mediLog.pdfDaysWithEntry + ':',
          }}
          formatDate={(iso) => new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' })}
        />
      )}

      {overallFullscreen &&
        createPortal(
          <div className="fixed inset-0 z-[200] bg-[var(--color-bg)] flex flex-col animate-in no-print" role="dialog" aria-modal="true">
            <div className="flex items-center justify-between p-5" style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
              <button
                onClick={() => setOverallFullscreen(false)}
                aria-label={t.common.close}
                className="w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center"
              >
                <X size={20} />
              </button>
              <p className="text-[14px] text-[var(--color-text-muted)] truncate px-2">{t.mediLog.overallChartTitle}</p>
              <div style={{ width: 40 }} />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4 overflow-auto pb-8">
              {overallMedications.length > 1 && (
                <>
                  <p className="text-[11px] text-[var(--color-text-faint)] text-center max-w-[560px]">{t.mediLog.filterDiscoveryHint}</p>
                  <div className="flex flex-wrap justify-center gap-1.5 max-w-[560px]">
                    {overallMedications.map((m) => (
                      <button
                        key={m.key}
                        onClick={() => toggleMedicationFilter(m.key)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px]"
                        style={{
                          background: isMedicationSelected(m.key) ? `${m.color}22` : 'var(--color-surface-muted)',
                          outline: isMedicationSelected(m.key) ? `1.5px solid ${m.color}` : '1px solid transparent',
                          color: 'var(--color-text)',
                          opacity: isMedicationSelected(m.key) ? 1 : 0.5,
                        }}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                        {m.displayName}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <MediLogOverallChart medications={filteredOverallMedications} width={560} height={340} zoomable />
            </div>
          </div>,
          document.body,
        )}

      {chartFullscreen &&
        activeMedication &&
        createPortal(
          <div className="fixed inset-0 z-[200] bg-[var(--color-bg)] flex flex-col animate-in no-print" role="dialog" aria-modal="true">
            <div className="flex items-center justify-between p-5" style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
              <button
                onClick={() => setChartFullscreen(false)}
                aria-label={t.common.close}
                className="w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center"
              >
                <X size={20} />
              </button>
              <p className="text-[14px] text-[var(--color-text-muted)] truncate px-2">{activeMedication.displayName}</p>
              <div style={{ width: 40 }} />
            </div>
            <div className="flex-1 flex items-center justify-center px-4">
              <MediLogChart entries={chartEntries} color={activeMedicationColor} width={480} height={320} zoomable />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
