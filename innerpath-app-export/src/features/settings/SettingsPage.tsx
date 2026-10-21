import { InstallGuide } from '../../components/shared/InstallGuide';
import { buildDate, feedbackTemplate, isIos, isStandalone } from '../../services/testSupport';
import { TesterThanks } from '../../components/shared/TesterThanks';
import { QuickFeedbackSheet } from '../../components/shared/QuickFeedbackSheet';
import { StartGuideModal, startGuideLabel } from '../../components/shared/StartGuide';
import { CORE_COUNT, TOUR_STOPS, tourExtrasModeStore, tourIndexStore, tourStyleStore } from '../../components/companion/tourData';
import { useEffect, useRef, useState } from 'react';
import { buildDailyRemindersIcs } from '../../services/icsExport';
import { deliverTextFile } from '../../services/fileShare';
import { GENTLE_SCHEDULES } from '../../components/shared/GentleRemindersSync';
import { GENTLE_HINTS } from '../../content/gentleHints';
import { notifyHint, vibrationSupported, hintFlags, hintModeFrom } from '../../services/hintFeedback';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Link } from 'react-router-dom';
import { Globe, Moon, Sun, Laptop, Sparkles, Plus, RotateCcw, PlayCircle, AlertTriangle, Pencil, MessageSquareText, Info, Compass, Trash2, Bell, X, CalendarPlus, ShieldCheck, ChevronRight } from 'lucide-react';
import { getAllLichtwesen, getAnyLichtwesen } from '../../components/companion/customLichtwesen';
import { customLichtwesenRepo } from '../../components/companion/customLichtwesen';
import type { LichtwesenConfig } from '../../components/companion/lichtwesen';
import { LichtwesenEyes } from '../../components/companion/LichtwesenEyes';
import { CreateCompanionModal } from '../../components/companion/CreateCompanionModal';
import { AnimalPicker } from '../../components/companion/animals/AnimalPicker';
import { AnimalSetupModal } from '../../components/companion/animals/AnimalSetupModal';
import { AnimalFigure } from '../../components/companion/animals/AnimalFigure';
import { getAnimal } from '../../components/companion/animals/animalRegistry';
import { lookOf } from '../../components/companion/animals/AnimalCompanion';
import { useCompanionAge } from '../../components/companion/useCompanionAge';
import { GROW_UP_DAYS, stageLabel } from '../../services/companionGrowth';
import { getCompanionScale, setCompanionScale, COMPANION_SCALE_MIN, COMPANION_SCALE_MAX } from '../../services/companionScale';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { useDayFlowTexts } from '../dayFlow/dayFlowTexts';
import { useSettings } from '../../state/SettingsContext';
import { resetAllAppData } from '../../services/resetAppData';
import { customPalettesRepo, deleteCustomPalette } from '../../services/customPalettes';
import { CreatePaletteModal } from '../../components/settings/CreatePaletteModal';
import type { SupportedLanguage, ThemeMode } from '../../data/types';
import { customRemindersRepo, type CustomReminder } from '../../services/customReminders';
import { downloadBackup, importBackup } from '../../services/backup';
import { createId } from '../../services/storage/repository';
import { BUILT_IN_PALETTE_IDS } from '../../data/types';
import { WorldPicker } from '../worlds/WorldPicker';
import { ScopePicker } from '../scope/ScopePicker';
import { WesenInfoButton } from '../../components/companion/WesenInfoButton';
import { INFO_NUDGE, INFO_SCHMUGGEL } from '../../components/companion/wesenFunctions';
import { AppLockCard } from '../lock/AppLockCard';
import { StorageOverviewCard } from './StorageOverviewCard';

type BuiltInPalette = 'neutral' | 'wald' | 'meer' | 'abend' | 'sonnenaufgang' | 'lavendel' | 'rose' | 'beige' | 'creme' | 'puder' | 'salbei';

const PALETTES: BuiltInPalette[] = [
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
const PALETTE_SWATCH: Record<BuiltInPalette, string> = {
  neutral: '#33502E',
  wald: '#2E4A2A',
  meer: '#2A5A63',
  abend: '#5B4262',
  sonnenaufgang: '#C4622E',
  lavendel: '#6C5E9E',
  rose: '#A65D5D',
  beige: '#7A5C3E',
  creme: '#9C7A3F',
  puder: '#5C6B7A',
  salbei: '#6B7F5E',
};

/** Every top-level part of the app that can have its own color world. Everything below a part follows it. */
const SECTION_KEYS: { key: string; de: string; en: string; deHint: string; enHint: string }[] = [
  { key: '/', de: 'Jetzt', en: 'Now', deHint: 'Startseite, Check-in', enHint: 'Start page, check-in' },
  { key: '/zugang', de: 'Zugang', en: 'Access', deHint: 'Hinschauen, Bedürfnis, Weg', enHint: 'Looking, need, path' },
  { key: '/entdecken', de: 'Entdecken', en: 'Explore', deHint: 'Ressourcen, Skills, Wertekompass, Brief an mich, Timer, Garten …', enHint: 'Resources, skills, values compass, letters, timer, garden …' },
  { key: '/bruecken', de: 'Brücken', en: 'Bridges', deHint: 'Brücken und ihre Schritte', enHint: 'Bridges and their steps' },
  { key: '/sicherheit', de: 'Sicherheit', en: 'Safety', deHint: 'Sicheres Netz, Sicherheitsplan, Kontakte, Tagebuch', enHint: 'Safe network, safety plan, contacts, diary' },
  { key: '/kalender', de: 'Kalender', en: 'Calendar', deHint: 'Termine und Übersicht', enHint: 'Appointments and overview' },
  { key: '/parkbox', de: 'Parkbox & Wartezimmer', en: 'Parking box & waiting room', deHint: 'Zettel und Wartezimmer', enHint: 'Notes and waiting room' },
  { key: '/inneres-wetter', de: 'Inneres Wetter', en: 'Inner weather', deHint: 'Check-in-Verlauf', enHint: 'Check-in history' },
  { key: '/einstellungen', de: 'Einstellungen', en: 'Settings', deHint: 'Diese Seite und ihre Unterseiten', enHint: 'This page and its sub-pages' },
];

export function SettingsPage() {
  const t = useT();
  const dayFx = useDayFlowTexts();
  const { settings, updateSettings } = useSettings();

  /** The daily check-in reminders as recurring events with an alarm, for the phone's own calendar. */
  async function exportDailyIcs() {
    const mode = (settings.gentleReminders ?? 'normal') as 'normal' | 'more';
    if (mode !== 'normal' && mode !== 'more') return;
    const lang = settings.language === 'en' ? 'en' : 'de';
    const slots = GENTLE_SCHEDULES[mode].map((s) => ({ hour: s.hour, minute: s.minute, title: `${GENTLE_HINTS[s.kind].variants[0][lang].title} · ${t.common.appName}` }));
    await deliverTextFile(buildDailyRemindersIcs(slots, t.common.appName), 'von-mir-aus-erinnerungen.ics', 'text/calendar', t.settings.gentleRemindersTitle);
  }
  const [createCompanionOpen, setCreateCompanionOpen] = useState(false);
  const [customReminders, setCustomReminders] = useState<CustomReminder[]>(() => customRemindersRepo.getAll());
  const [addingReminder, setAddingReminder] = useState(false);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const [backupNote, setBackupNote] = useState('');
  const [feedbackCopied, setFeedbackCopied] = useState(false);
  const [quickFbOpen, setQuickFbOpen] = useState(false);
  const [startGuideOpen, setStartGuideOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [newReminderLabel, setNewReminderLabel] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('18:00');

  function addCustomReminder() {
    if (!newReminderLabel.trim()) return;
    const now = new Date().toISOString();
    customRemindersRepo.save({
      id: createId('reminder'),
      label: newReminderLabel.trim(),
      time: newReminderTime,
      enabled: true,
      createdAt: now,
    });
    setCustomReminders(customRemindersRepo.getAll());
    setNewReminderLabel('');
    setNewReminderTime('18:00');
    setAddingReminder(false);
  }

  function toggleCustomReminder(r: CustomReminder) {
    customRemindersRepo.save({ ...r, enabled: !r.enabled });
    setCustomReminders(customRemindersRepo.getAll());
  }

  function removeCustomReminder(id: string) {
    customRemindersRepo.remove(id);
    setCustomReminders(customRemindersRepo.getAll());
  }
  const [companionScale, setCompanionScaleState] = useState(() => getCompanionScale());
  const [editingBeing, setEditingBeing] = useState<LichtwesenConfig | null>(null);
  // animals: a new one is being set up (species id) or an existing one is changed
  const [setupSpecies, setSetupSpecies] = useState<string | null>(null);
  const [editingAnimal, setEditingAnimal] = useState<LichtwesenConfig | null>(null);
  const [allBeings, setAllBeings] = useState(() => getAllLichtwesen());

  // "Wesen wechseln" from the companion menu links straight here instead
  // of a generic Settings link — scrolls (and briefly highlights) the
  // companion section so the person doesn't have to hunt for it.
  useEffect(() => {
    if (window.location.hash !== '#begleiter-einstellungen') return;
    const el = document.getElementById('begleiter-einstellungen');
    el?.scrollIntoView({ behavior: settings.reduceMotion ? 'auto' : 'smooth', block: 'start' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [resetConfirming, setResetConfirming] = useState(false);
  const [createPaletteOpen, setCreatePaletteOpen] = useState(false);
  const [customPalettes, setCustomPalettes] = useState(() => customPalettesRepo.getAll());

  function handleDeletePalette(id: string, name: string) {
    if (!window.confirm(t.settings.confirmDeletePalette.replace('{name}', name))) return;
    deleteCustomPalette(id);
    setCustomPalettes(customPalettesRepo.getAll());
    if (settings.palette === id) updateSettings({ palette: BUILT_IN_PALETTE_IDS[0] });
    const nextPagePalettes = { ...settings.pagePalettes };
    let pagePalettesChanged = false;
    for (const key of Object.keys(nextPagePalettes)) {
      if (nextPagePalettes[key] === id) {
        delete nextPagePalettes[key];
        pagePalettesChanged = true;
      }
    }
    if (pagePalettesChanged) updateSettings({ pagePalettes: nextPagePalettes });
  }

  function confirmReset() {
    if (!resetConfirming) {
      setResetConfirming(true);
      return;
    }
    resetAllAppData();
    window.location.reload();
  }

  return (
    <div className="animate-in">
      <TopBar action={<HelpButton helpKey="einstellungen" />} />
      <div className="px-5 pb-6">
        <h1 className="text-[24px] mb-4">{t.settings.title}</h1>
        <button type="button" onClick={() => setStartGuideOpen(true)} className="mb-6 w-full text-left rounded-[var(--radius-md)] px-4 py-3 border border-[var(--color-border-strong)] text-[14px] text-[var(--color-text)] bg-[var(--color-surface)]" data-testid="start-guide-open">
          🧭 {startGuideLabel(settings.language === 'en')}
        </button>
        {startGuideOpen && <StartGuideModal open onClose={() => setStartGuideOpen(false)} />}

        {/* ================= Sprache ================= */}
        <SectionLabel>🌐 {t.settings.language}</SectionLabel>
        <Card className="mb-6 flex gap-2" padding="md">
          {(['de', 'en'] as SupportedLanguage[]).map((lang) => (
            <Chip
              key={lang}
              selected={settings.language === lang}
              onClick={() => updateSettings({ language: lang })}
              icon={<Globe size={14} />}
            >
              {lang === 'de' ? 'Deutsch' : 'English'}
            </Chip>
          ))}
        </Card>

        {/* ================= Darstellung ================= */}
        <SectionLabel>🎨 {t.settings.appearance}</SectionLabel>
        <WorldPicker />
        <Card className="mb-3" padding="md">
          <p className="text-[13px] text-[var(--color-text-muted)] mb-2">{t.settings.theme}</p>
          <div className="flex flex-wrap gap-2">
            <Chip
              selected={settings.themeMode === 'light'}
              onClick={() => updateSettings({ themeMode: 'light' as ThemeMode })}
              icon={<Sun size={14} />}
            >
              {t.settings.themeLight}
            </Chip>
            <Chip
              selected={settings.themeMode === 'dark'}
              onClick={() => updateSettings({ themeMode: 'dark' as ThemeMode })}
              icon={<Moon size={14} />}
            >
              {t.settings.themeDark}
            </Chip>
            <Chip
              selected={settings.themeMode === 'system'}
              onClick={() => updateSettings({ themeMode: 'system' as ThemeMode })}
              icon={<Laptop size={14} />}
            >
              {t.settings.themeSystem}
            </Chip>
          </div>
        
          {/* Fotos aus dem Internet (picsum.photos): one switch, off = nothing leaves the device */}
          <label className="flex items-start gap-2.5 mt-4 cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={settings.onlineImages !== false} onChange={(e) => updateSettings({ onlineImages: e.target.checked })} />
            <span>
              <span className="block text-[13px] text-[var(--color-text)]">{t.settings.onlineImagesTitle}</span>
              <span className="block text-[11.5px] text-[var(--color-text-faint)] leading-relaxed">{t.settings.onlineImagesHint}</span>
            </span>
          </label>
        </Card>

        <Card className="mb-3" padding="md">
          <p className="text-[13px] text-[var(--color-text-muted)] mb-2">{t.settings.palette}</p>
          <div className="flex gap-3 flex-wrap">
            {PALETTES.map((p) => (
              <button
                key={p}
                onClick={() => updateSettings({ palette: p })}
                aria-label={t.settings.palettes[p]}
                aria-pressed={settings.palette === p}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className="w-9 h-9 rounded-full border-2 transition-transform"
                  style={{
                    background: PALETTE_SWATCH[p],
                    borderColor: settings.palette === p ? 'var(--color-text)' : 'transparent',
                    transform: settings.palette === p ? 'scale(1.08)' : 'scale(1)',
                  }}
                />
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  {t.settings.palettes[p]}
                </span>
              </button>
            ))}
            {customPalettes.map((cp) => (
              <div key={cp.id} className="relative flex flex-col items-center gap-1.5">
                <button
                  onClick={() => updateSettings({ palette: cp.id })}
                  aria-label={cp.name}
                  aria-pressed={settings.palette === cp.id}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className="w-9 h-9 rounded-full border-2 transition-transform"
                    style={{
                      background: cp.primary,
                      borderColor: settings.palette === cp.id ? 'var(--color-text)' : 'transparent',
                      transform: settings.palette === cp.id ? 'scale(1.08)' : 'scale(1)',
                    }}
                  />
                  <span className="text-[11px] text-[var(--color-text-muted)] max-w-[48px] truncate">{cp.name}</span>
                </button>
                <button
                  onClick={() => handleDeletePalette(cp.id, cp.name)}
                  aria-label={`${t.common.delete}: ${cp.name}`}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-danger)] text-white flex items-center justify-center text-[9px] leading-none"
                >
                  ×
                </button>
              </div>
            ))}
            <button onClick={() => setCreatePaletteOpen(true)} className="flex flex-col items-center gap-1.5">
              <span className="w-9 h-9 rounded-full border-2 border-dashed border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-text-faint)]">
                <Plus size={16} />
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)]">{t.settings.newPalette}</span>
            </button>
          </div>
        </Card>

        <Card className="mb-3" padding="md">
          <p className="text-[12px] text-[var(--color-text-faint)] mb-3">{t.settings.pagePalettesHint}</p>
          <div className="flex flex-col gap-4">
            {SECTION_KEYS.map((sec) => {
              const key = sec.key;
              const current = settings.pagePalettes?.[key];
              const en = settings.language === 'en';
              return (
                <div key={key}>
                  <p className="text-[13px] text-[var(--color-text)]">{en ? sec.en : sec.de}</p>
                  <p className="text-[11.5px] text-[var(--color-text-faint)] mb-2">{en ? sec.enHint : sec.deHint}</p>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() =>
                        updateSettings({
                          pagePalettes: { ...settings.pagePalettes, [key]: undefined },
                        })
                      }
                      aria-pressed={!current}
                      className="flex flex-col items-center gap-1"
                    >
                      <span
                        className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[9px] text-[var(--color-text-faint)]"
                        style={{ borderColor: !current ? 'var(--color-text)' : 'var(--color-border)' }}
                      >
                        —
                      </span>
                    </button>
                    {PALETTES.map((p) => (
                      <button
                        key={p}
                        onClick={() =>
                          updateSettings({
                            pagePalettes: { ...settings.pagePalettes, [key]: p },
                          })
                        }
                        aria-label={t.settings.palettes[p]}
                        aria-pressed={current === p}
                        className="flex flex-col items-center gap-1"
                      >
                        <span
                          className="w-7 h-7 rounded-full border-2"
                          style={{
                            background: PALETTE_SWATCH[p],
                            borderColor: current === p ? 'var(--color-text)' : 'transparent',
                          }}
                        />
                      </button>
                    ))}
                    {customPalettes.map((cp) => (
                      <button
                        key={cp.id}
                        onClick={() =>
                          updateSettings({
                            pagePalettes: { ...settings.pagePalettes, [key]: cp.id },
                          })
                        }
                        aria-label={cp.name}
                        aria-pressed={current === cp.id}
                        className="flex flex-col items-center gap-1"
                      >
                        <span
                          className="w-7 h-7 rounded-full border-2"
                          style={{
                            background: cp.primary,
                            borderColor: current === cp.id ? 'var(--color-text)' : 'transparent',
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="mb-6" padding="md" data-testid="settings-dayflow">
          <p className="text-[14px] font-medium text-[var(--color-text)] mb-1">{dayFx.settingsTitle}</p>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-3" data-hint>{dayFx.settingsHint}</p>
          <ToggleRow label={dayFx.settingsStartOn} checked={settings.dayStartEnabled !== false} onChange={(v) => updateSettings({ dayStartEnabled: v })} />
          {settings.dayStartEnabled !== false && (
            <label className="flex items-center gap-2 mt-2 mb-3 text-[13px] text-[var(--color-text-muted)]">
              {dayFx.settingsStartTime}
              <input type="time" className="input" style={{ width: 120 }} value={settings.dayStartTime ?? '05:00'} onChange={(e) => e.target.value && updateSettings({ dayStartTime: e.target.value })} data-testid="settings-day-start-time" />
            </label>
          )}
          <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
            <ToggleRow label={dayFx.settingsEndOn} checked={settings.dayEndEnabled !== false} onChange={(v) => updateSettings({ dayEndEnabled: v })} />
            {settings.dayEndEnabled !== false && (
              <label className="flex items-center gap-2 mt-2 text-[13px] text-[var(--color-text-muted)]">
                {dayFx.settingsEndTime}
                <input type="time" className="input" style={{ width: 120 }} value={settings.dayEndTime ?? '19:00'} onChange={(e) => e.target.value && updateSettings({ dayEndTime: e.target.value })} data-testid="settings-day-end-time" />
              </label>
            )}
          </div>
        </Card>

        <Card className="mb-6" padding="md">
          <ToggleRow
            label={t.settings.reduceMotion}
            checked={settings.reduceMotion}
            onChange={(v) => updateSettings({ reduceMotion: v })}
          />
          <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
            <ToggleRow
              label={t.settings.minimalHints}
              checked={!!settings.minimalHints}
              onChange={(v) => updateSettings({ minimalHints: v })}
            />
            <p className="text-[12px] text-[var(--color-text-faint)] mt-1.5">{t.settings.minimalHintsHint}</p>
          </div>
        </Card>

        <Card className="mb-6" padding="md">
          <ToggleRow
            label={t.settings.hapticsEnabled}
            checked={settings.hapticsEnabled}
            onChange={(v) => updateSettings({ hapticsEnabled: v })}
          />
          <p className="text-[12px] text-[var(--color-text-faint)] mt-1.5">{t.settings.hapticsHint}</p>
        </Card>

        <Card className="mb-6" padding="md">
          <ToggleRow
            label={t.settings.soundsEnabled}
            checked={settings.soundsEnabled}
            onChange={(v) => updateSettings({ soundsEnabled: v })}
          />
          <p className="text-[12px] text-[var(--color-text-faint)] mt-1.5">{t.settings.soundsHint}</p>
          {getAnyLichtwesen(settings.selectedBrainId).animal && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border)]" data-testid="animal-sounds-row">
              <ToggleRow
                label={settings.language === 'en' ? 'Quiet animal sounds' : 'Leise Tierlaute'}
                checked={settings.animalSoundsEnabled !== false}
                onChange={(v) => updateSettings({ animalSoundsEnabled: v })}
              />
              <p className="text-[12px] text-[var(--color-text-faint)] mt-1.5">
                {settings.language === 'en' ? 'Your animal makes a very soft little sound of its own when you tap it. Switch off and it stays silent (the other sounds stay as they are).' : 'Dein Tier macht beim Antippen einen ganz leisen, eigenen Laut. Ausgeschaltet bleibt es still (die anderen Töne bleiben wie sie sind).'}
              </p>
            </div>
          )}
        </Card>

        {/* ================= Mein Wesen ================= */}
        <div id="begleiter-einstellungen" />
        {/* ================= Umfang & Schutz ================= */}
        <SectionLabel>🔒 {settings.language === 'en' ? 'Scope and protection' : 'Umfang und Schutz'}</SectionLabel>
        <Card padding="md" className="mb-3" data-testid="scope-card">
          <p className="text-[14px] font-medium text-[var(--color-text)] mb-0.5">{settings.language === 'en' ? 'How much of the app is shown' : 'Wie viel von der App zu sehen ist'}</p>
          <p className="text-[12.5px] text-[var(--color-text-faint)] leading-relaxed mb-3" data-hint>{settings.language === 'en' ? 'Start small and show more whenever you like.' : 'Fang klein an und zeig später mehr, wann immer du magst.'}</p>
          <ScopePicker simple={!!settings.simple} onChange={(sc) => updateSettings({ scope: sc, scopeChosen: true })} onSimple={(v) => updateSettings({ simple: v })} />
        </Card>
        <AppLockCard />

        <SectionLabel>🧸 {t.settings.brain}</SectionLabel>
        <Card className="mb-6" padding="md">
          <label className="flex flex-col gap-1.5 mb-3 pb-3 border-b border-[var(--color-border)]">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.settings.yourName}</span>
            <input
              className="input"
              value={settings.userName ?? ''}
              onChange={(e) => updateSettings({ userName: e.target.value.trim() || undefined })}
              placeholder={t.companion.askNamePlaceholder}
              maxLength={30}
            />
            <span className="text-[11px] text-[var(--color-text-faint)]">{t.settings.yourNameHint}</span>
          </label>
          <ToggleRow
            icon={<Sparkles size={16} />}
            label={t.settings.brainEnabled}
            checked={settings.brainEnabled}
            onChange={(v) => updateSettings({ brainEnabled: v })}
          />
          <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mt-1.5 mb-1">{t.companionAbout.sleepInlineReassurance}</p>
          {settings.brainEnabled && (
            <div className="pt-3 mt-1 border-t border-[var(--color-border)]">
              <ToggleRow
                icon={<Sparkles size={16} />}
                label={t.settings.resourceNudge}
                checked={settings.resourceNudgeEnabled !== false}
                onChange={(v) => updateSettings({ resourceNudgeEnabled: v })}
              />
              <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mt-1.5 mb-1.5">{t.settings.resourceNudgeHint}</p>
              <div className="flex items-center gap-2 mb-3">
                <WesenInfoButton info={INFO_NUDGE} className="w-8 h-8 rounded-full border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-text-muted)]" />
                <span className="text-[12px] text-[var(--color-text-muted)]">{settings.language === 'en' ? 'Professional background (psychology, occupational therapy, neurobiology)' : 'Fachlicher Hintergrund (Psychologie, Ergotherapie, Neurobiologie)'}</span>
              </div>
              <ToggleRow
                icon={<Sparkles size={16} />}
                label={t.settings.schmuggelPopup}
                checked={settings.schmuggelPopupEnabled !== false}
                onChange={(v) => updateSettings({ schmuggelPopupEnabled: v })}
              />
              <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mt-1.5 mb-1.5">{t.settings.schmuggelPopupHint}</p>
              {settings.schmuggelPopupEnabled !== false && (
                <div className="mb-2" data-testid="schmuggel-perday">
                  <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{settings.language === 'en' ? 'How often a day should your companion offer it?' : 'Wie oft am Tag soll dein Wesen es anbieten?'}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((n) => {
                      const on = (settings.schmuggelPerDay ?? 3) === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => updateSettings({ schmuggelPerDay: n })}
                          aria-pressed={on}
                          data-testid={`schmuggel-perday-${n}`}
                          className={`min-w-[40px] px-2.5 py-1.5 rounded-full text-[13px] border ${on ? 'text-white border-transparent' : 'text-[var(--color-text-muted)] border-[var(--color-border-strong)]'}`}
                          style={on ? { background: 'var(--color-primary)' } : undefined}
                        >
                          {n}×
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11.5px] text-[var(--color-text-faint)] mt-1.5">{settings.language === 'en' ? 'Spread over the day between 9 am and 8 pm, only while the app is open – “Not now” is always enough.' : 'Verteilt über den Tag zwischen 9 und 20 Uhr, nur wenn die App offen ist – „Gerade nicht“ reicht immer.'}</p>
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <WesenInfoButton info={INFO_SCHMUGGEL} className="w-8 h-8 rounded-full border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-text-muted)]" />
                <span className="text-[12px] text-[var(--color-text-muted)]">{settings.language === 'en' ? 'Professional background (psychology, occupational therapy, neurobiology)' : 'Fachlicher Hintergrund (Psychologie, Ergotherapie, Neurobiologie)'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-[var(--color-border)]" data-testid="settings-away-row">
                <p className="text-[13px] text-[var(--color-text-muted)]">{settings.companionAway ? (settings.language === 'en' ? 'Your companion is out and about.' : 'Dein Wesen ist gerade unterwegs.') : (settings.language === 'en' ? 'Send your companion away for a while – it hops off happily.' : 'Schick dein Wesen für eine Weile weg – es hüpft fröhlich davon.')}</p>
                <button
                  type="button"
                  onClick={() => updateSettings({ companionAway: !settings.companionAway })}
                  className="flex-shrink-0 px-3.5 py-2 rounded-full text-[13px] border border-[var(--color-primary)] text-[var(--color-primary)]"
                  data-testid="settings-away-toggle"
                >
                  {settings.companionAway ? (settings.language === 'en' ? 'Call back' : 'Herbeirufen') : (settings.language === 'en' ? 'Send away' : 'Wegschicken')}
                </button>
              </div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] text-[var(--color-text-muted)]">{t.companion.changeCompanion}</p>
                <button
                  onClick={() => setCreateCompanionOpen(true)}
                  className="flex items-center gap-1 text-[12px] text-[var(--color-primary)]"
                >
                  <Plus size={13} /> {t.companion.createOwn}
                </button>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {allBeings.map((being) => {
                  const selected = settings.selectedBrainId === being.id;
                  const isCustom = !!customLichtwesenRepo.getById(being.id);
                  return (
                    <div key={being.id} className="relative flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateSettings({ selectedBrainId: being.id })}
                        aria-pressed={selected}
                        className="flex flex-col items-center gap-1"
                      >
                        <span
                          className="rounded-full p-1"
                          style={{ border: selected ? `2px solid ${being.color}` : '2px solid transparent' }}
                        >
                          {being.animal && getAnimal(being.animal.species) ? (
                            <AnimalFigure animal={getAnimal(being.animal.species)!} look={lookOf(being)} age={1} size={36} inert />
                          ) : (
                            <svg viewBox="0 0 100 100" width="34" height="34" aria-hidden="true">
                              <circle cx="50" cy="52" r="30" fill={being.color} />
                              <circle cx="50" cy="52" r="17" fill="#fff" />
                              <LichtwesenEyes style={being.eyeStyle} color={being.color} blinking={false} />
                            </svg>
                          )}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)] truncate max-w-full" style={{ fontFamily: 'var(--font-companion)', fontWeight: 600 }}>
                          {being.name}
                        </span>
                      </button>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => (being.animal ? setEditingAnimal(being) : setEditingBeing(being))}
                          aria-label={`${t.common.edit}: ${being.name}`}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center"
                        >
                          <Pencil size={9} className="text-[var(--color-text-muted)]" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 mt-3 border-t border-[var(--color-border)]" data-testid="animal-section">
                <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">{settings.language === 'en' ? 'Animal companions' : 'Begleittiere'}</p>
                <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mb-3">
                  {settings.language === 'en'
                    ? 'Tap an animal to set it up – name, colours, little extras. It moves in as a baby and grows with the days you use the app.'
                    : 'Tippe ein Tier an, um es einzurichten – Name, Farben, kleine Extras. Es zieht als Baby ein und wächst mit den Tagen, an denen du die App nutzt.'}
                </p>
                <AnimalPicker en={settings.language === 'en'} onPick={(a) => setSetupSpecies(a.id)} />
                <GrowthSetting />
              </div>

              <div className="pt-3 mt-3 border-t border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13px] text-[var(--color-text-muted)]">{t.companion.sizeLabel}</p>
                  <span className="text-[12px] text-[var(--color-text-faint)]">{Math.round(companionScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={COMPANION_SCALE_MIN}
                  max={COMPANION_SCALE_MAX}
                  step={0.05}
                  value={companionScale}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setCompanionScaleState(next);
                    setCompanionScale(next);
                    window.dispatchEvent(new Event('companion-scale-change'));
                  }}
                  className="w-full"
                  aria-label={t.companion.sizeLabel}
                />
              </div>
            </div>
          )}
          <Link
            to="/einstellungen/wesen-inhalte"
            className="flex items-center gap-1 text-[13px] text-[var(--color-primary)] mt-3"
          >
            <MessageSquareText size={13} /> {t.companionContent.settingsLinkCta}
          </Link>
          <Link
            to="/einstellungen/wesen-info"
            className="flex items-center gap-1 text-[13px] text-[var(--color-primary)] mt-2"
          >
            <Info size={13} /> {t.companionAbout.settingsLinkCta}
          </Link>
        </Card>

        {/* ================= Erinnerungen ================= */}
        <SectionLabel>🔔 {t.settings.reminders}</SectionLabel>
        <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.settings.remindersIntro}</p>
        <Card className="mb-6" padding="md">
          <p className="text-[14px] text-[var(--color-text)] mb-1">{t.settings.reminderTimeLabel}</p>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-3">{t.settings.remindersHint}</p>
          <div className="flex flex-col gap-2">
            {(settings.weatherReminderTimes ?? (settings.weatherReminderTime ? [settings.weatherReminderTime] : ['09:00'])).map((time, i) => {
              const times = settings.weatherReminderTimes ?? (settings.weatherReminderTime ? [settings.weatherReminderTime] : ['09:00']);
              return (
                <div key={i} className="flex items-center justify-between py-2 border-t border-[var(--color-border)] pt-3 first:border-t-0 first:pt-0">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => {
                      const next = [...times];
                      next[i] = e.target.value;
                      updateSettings({ weatherReminderTimes: next, weatherReminderTime: undefined });
                    }}
                    className="input"
                    style={{ width: 110 }}
                  />
                  {times.length > 1 && (
                    <button
                      onClick={() => updateSettings({ weatherReminderTimes: times.filter((_, idx) => idx !== i), weatherReminderTime: undefined })}
                      className="text-[13px] text-[var(--color-text-faint)] px-2"
                      aria-label={t.settings.reminderRemoveCta}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={() => {
              const times = settings.weatherReminderTimes ?? (settings.weatherReminderTime ? [settings.weatherReminderTime] : ['09:00']);
              updateSettings({ weatherReminderTimes: [...times, '15:00'], weatherReminderTime: undefined });
            }}
            className="text-[13px] text-[var(--color-primary)] mt-3"
          >
            + {t.settings.reminderAddCta}
          </button>
        </Card>

        <Card className="mb-6" padding="md">
          <p className="text-[14px] text-[var(--color-text)] mb-1">{t.settings.hintModeTitle}</p>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-3">{t.settings.hintModeHint}</p>
          <div className="flex flex-wrap gap-2">
            {(() => {
              const flags = hintFlags(settings.hintMode);
              const chip = (active: boolean) => (active ? { background: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: 'var(--color-surface)' } : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' });
              const choose = (sound: boolean, vibration: boolean) => {
                const mode = hintModeFrom(sound, vibration);
                updateSettings({ hintMode: mode });
                notifyHint(mode);
              };
              return (
                <>
                  <button onClick={() => updateSettings({ hintMode: 'still' })} aria-pressed={!flags.sound && !flags.vibration} className="rounded-full px-4 py-2 text-[13px] border" style={chip(!flags.sound && !flags.vibration)}>
                    {t.settings.hintModeStill}
                  </button>
                  <button onClick={() => choose(!flags.sound, flags.vibration)} aria-pressed={flags.sound} className="rounded-full px-4 py-2 text-[13px] border" style={chip(flags.sound)} data-testid="hint-sound">
                    {t.settings.hintModeSound}
                  </button>
                  <button disabled={!vibrationSupported()} onClick={() => choose(flags.sound, !flags.vibration)} aria-pressed={flags.vibration} className="rounded-full px-4 py-2 text-[13px] border disabled:opacity-40" style={chip(flags.vibration)} data-testid="hint-vibration">
                    {t.settings.hintModeVibration}
                  </button>
                </>
              );
            })()}
          </div>
          {!vibrationSupported() && <p className="text-[11.5px] text-[var(--color-text-faint)] mt-2">{t.settings.hintModeNoVibration}</p>}
        </Card>

        <Card className="mb-6" padding="md">
          <p className="text-[14px] text-[var(--color-text)] mb-1">{t.settings.reviewTimeTitle}</p>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-3">{t.settings.reviewTimeHint}</p>
          <label className="flex items-center gap-3">
            <span className="text-[13px] text-[var(--color-text-muted)]">{t.settings.reviewTimeLabel}</span>
            <input type="time" className="input" style={{ width: 'auto' }} value={settings.reviewTime ?? '20:00'} onChange={(e) => e.target.value && updateSettings({ reviewTime: e.target.value })} />
          </label>
          <label className="flex items-start gap-2.5 mt-4 cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={settings.reviewBodyHint !== false} onChange={(e) => updateSettings({ reviewBodyHint: e.target.checked })} />
            <span>
              <span className="block text-[13px] text-[var(--color-text)]">{t.reviewMail.softHintSetting}</span>
              <span className="block text-[11.5px] text-[var(--color-text-faint)]">{t.reviewMail.softHintSettingHint}</span>
            </span>
          </label>
        </Card>

        <Card className="mb-6" padding="md">
          <p className="text-[14px] text-[var(--color-text)] mb-1">{t.settings.gentleRemindersTitle}</p>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-3">{t.settings.gentleRemindersHint}</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['off', t.settings.gentleRemindersOff],
                ['normal', t.settings.gentleRemindersNormal],
                ['more', t.settings.gentleRemindersMore],
              ] as const
            ).map(([key, label]) => {
              const active = (settings.gentleReminders ?? 'normal') === key;
              return (
                <button
                  key={key}
                  onClick={() => updateSettings({ gentleReminders: key })}
                  aria-pressed={active}
                  className="rounded-full px-4 py-2 text-[13px] border"
                  style={active ? { background: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: 'var(--color-surface)' } : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {(settings.gentleReminders ?? 'normal') !== 'off' && (
            <div className="mt-4">
              <button onClick={exportDailyIcs} className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)]">
                <CalendarPlus size={14} /> {t.settings.icsRemindersButton}
              </button>
              <p className="text-[11.5px] leading-relaxed text-[var(--color-text-faint)] mt-1.5">{t.calendar.icsNotice}</p>
            </div>
          )}
        </Card>

        <Card className="mb-6" padding="md">
          <p className="text-[14px] text-[var(--color-text)] mb-1">{t.settings.customRemindersTitle}</p>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-3">{t.settings.customRemindersHint}</p>
          {customReminders.map((r) => (
            <div key={r.id} className="flex items-center gap-2 py-2 border-t border-[var(--color-border)]">
              <Bell size={15} className="text-[var(--color-text-faint)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] text-[var(--color-text)] truncate">{r.label}</p>
                <p className="text-[12px] text-[var(--color-text-faint)]">{r.time}</p>
              </div>
              <input
                type="checkbox"
                checked={r.enabled}
                onChange={() => toggleCustomReminder(r)}
                className="w-5 h-5 accent-[var(--color-primary)] flex-shrink-0"
                aria-label={r.label}
              />
              <button onClick={() => removeCustomReminder(r.id)} aria-label={t.common.delete} className="p-1 text-[var(--color-danger)] flex-shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {addingReminder ? (
            <div className="flex flex-col gap-2 pt-3 border-t border-[var(--color-border)] mt-1">
              <input
                autoFocus
                className="input"
                placeholder={t.settings.customReminderLabelPlaceholder}
                value={newReminderLabel}
                onChange={(e) => setNewReminderLabel(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={newReminderTime}
                  onChange={(e) => setNewReminderTime(e.target.value)}
                  className="input"
                  style={{ width: 110 }}
                />
                <button onClick={addCustomReminder} className="flex-1 py-2 rounded-[var(--radius-md)] text-[14px] bg-[var(--color-primary)] text-[var(--color-surface)]">
                  {t.common.save}
                </button>
                <button onClick={() => setAddingReminder(false)} className="px-3 py-2 text-[13px] text-[var(--color-text-faint)]">
                  {t.common.cancel}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingReminder(true)} className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] pt-3 border-t border-[var(--color-border)] mt-1 w-full">
              <Plus size={14} /> {t.settings.addCustomReminderCta}
            </button>
          )}
        </Card>

        {/* ================= Test-Version: Installieren & Rückmeldung ================= */}
        <SectionLabel>🧪 {settings.language === 'en' ? 'Test version' : 'Test-Version'}</SectionLabel>
        <Card padding="md" className="mb-3" data-testid="test-card">
          <div className="mb-3">
            <TesterThanks compact />
          </div>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
            {settings.language === 'en' ? 'Version' : 'Version'}: {buildDate()}
          </p>
          {!isStandalone() && (
            <p className="text-[13px] text-[var(--color-text)] leading-relaxed mt-2" data-testid="install-hint">
              {settings.language === 'en'
                ? isIos()
                  ? 'Tip: tap the share symbol in Safari → "Add to Home Screen". Then the app opens like a normal app, and your data is kept more reliably. Without this, iPhones may clear data of rarely used websites.'
                  : 'Tip: install the app via the browser menu ("Install app" / "Add to home screen"). Then it opens like a normal app and your data is kept more reliably.'
                : isIos()
                  ? 'Tipp: Tippe in Safari auf das Teilen-Symbol → „Zum Home-Bildschirm“. Dann öffnet sich die App wie eine normale App und deine Daten bleiben verlässlicher erhalten. Ohne das löscht das iPhone manchmal Daten von selten genutzten Webseiten.'
                  : 'Tipp: Installiere die App über das Browser-Menü („App installieren“ / „Zum Startbildschirm hinzufügen“). Dann öffnet sie sich wie eine normale App und deine Daten bleiben verlässlicher erhalten.'}
            </p>
          )}
          {!isStandalone() && (
            <div className="mt-2">
              <button type="button" onClick={() => setInstallOpen((v) => !v)} className="text-[13px] text-[var(--color-primary)] underline underline-offset-2" data-testid="install-toggle">
                {settings.language === 'en' ? (installOpen ? 'Hide install guide' : 'Show install guide (iPhone, Android, computer)') : installOpen ? 'Installationsanleitung ausblenden' : 'Installationsanleitung zeigen (iPhone, Android, Computer)'}
              </button>
              {installOpen && <div className="mt-3"><InstallGuide /></div>}
            </div>
          )}
          <button type="button" className="mt-3 mr-2 py-2.5 px-4 rounded-[var(--radius-md)] text-[14px] border border-[var(--color-border-strong)] text-[var(--color-text)]" onClick={() => setQuickFbOpen(true)} data-testid="quick-feedback-open">
            💬 {settings.language === 'en' ? 'Quick feedback (one tap)' : 'Kurz-Rückmeldung (ein Tipp)'}
          </button>
          {quickFbOpen && <QuickFeedbackSheet open onClose={() => setQuickFbOpen(false)} />}
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mt-2">
            {settings.language === 'en'
              ? 'Prefer to write a message instead? This button prepares a short template (version and device type only, nothing personal). On a phone you can send it straight on; otherwise it is copied.'
              : 'Lieber eine Nachricht schreiben? Der Knopf bereitet eine kurze Vorlage vor (nur Version und Gerätetyp, nichts Persönliches). Auf dem Handy kannst du sie direkt weiterschicken, sonst wird sie kopiert.'}
          </p>
          <button
            type="button"
            className="mt-3 py-2.5 px-4 rounded-[var(--radius-md)] text-[14px] bg-[var(--color-primary)] text-[var(--color-surface)]"
            data-testid="feedback-copy"
            onClick={async () => {
              const text = feedbackTemplate(settings.language === 'en');
              // on phones: straight into the share sheet (WhatsApp, Signal, Mail …)
              if (typeof navigator.share === 'function') {
                try {
                  await navigator.share({ title: settings.language === 'en' ? 'Feedback' : 'Rückmeldung', text });
                  return;
                } catch (err) {
                  if ((err as Error)?.name === 'AbortError') return;
                }
              }
              try {
                await navigator.clipboard.writeText(text);
                setFeedbackCopied(true);
                setTimeout(() => setFeedbackCopied(false), 3000);
              } catch {
                window.prompt(settings.language === 'en' ? 'Copy this text:' : 'Diesen Text kopieren:', text);
              }
            }}
          >
            {feedbackCopied ? (settings.language === 'en' ? 'Copied ✓' : 'Kopiert ✓') : settings.language === 'en' ? 'Send message template' : 'Nachrichten-Vorlage senden'}
          </button>
        </Card>

        {/* ================= Hilfe & Anleitung ================= */}
        <SectionLabel>💡 {t.settings.about}</SectionLabel>
        <Card padding="md" className="mb-3">
          <button
            onClick={() => updateSettings({ introSeen: false })}
            className="flex items-center gap-2.5 text-[14px] text-[var(--color-text)] w-full"
          >
            <PlayCircle size={17} className="text-[var(--color-primary)]" />
            {t.settings.showIntroAgain}
          </button>
          <p className="text-[12px] text-[var(--color-text-faint)] mt-1.5">{t.settings.showIntroAgainHint}</p>
          <button
            onClick={() => {
              const i = tourIndexStore.get() ?? 0;
              if (i < CORE_COUNT || i >= TOUR_STOPS.length) tourIndexStore.set(CORE_COUNT);
              tourExtrasModeStore.set('try');
              tourStyleStore.set('interactive');
              updateSettings({ tourActive: true });
            }}
            className="flex items-center gap-2.5 text-[14px] text-[var(--color-text)] w-full mt-4 pt-3 border-t border-[var(--color-border)]"
            data-testid="tour-extras-start"
          >
            <Compass size={17} className="text-[var(--color-primary)]" />
            {t.settings.tourExtrasCta}
          </button>
          <p className="text-[12px] text-[var(--color-text-faint)] mt-1.5">{t.settings.tourExtrasHint}</p>
          <button
            onClick={() => {
              tourStyleStore.set('watch');
              tourIndexStore.set(0);
              tourExtrasModeStore.set(null);
              updateSettings({ tourActive: true });
            }}
            className="flex items-center gap-2.5 text-[14px] text-[var(--color-text)] w-full mt-4 pt-3 border-t border-[var(--color-border)]"
            data-testid="tour-watch-start"
          >
            <PlayCircle size={17} className="text-[var(--color-primary)]" />
            {settings.language === 'en' ? 'Watch the tour (just press play)' : 'Rundgang zum Zuschauen (nur Play drücken)'}
          </button>
          <p className="text-[12px] text-[var(--color-text-faint)] mt-1.5">{settings.language === 'en' ? 'The app goes through its functions on its own and shows them. You do not have to do anything.' : 'Die App geht ihre Funktionen von allein durch und zeigt sie. Du musst nichts tun.'}</p>
        </Card>

        <Link to="/entdecken" className="block mb-6">
          <Card padding="md">
            <div className="flex items-center gap-2.5">
              <Compass size={17} className="text-[var(--color-primary)]" />
              <p className="text-[14px] text-[var(--color-text)]">{t.settings.systemMapCta}</p>
            </div>
            <p className="text-[12px] text-[var(--color-text-faint)] mt-1.5">{t.settings.systemMapHint}</p>
          </Card>
        </Link>

        <Card padding="md" className="mb-6">
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.settings.nameExplanationTitle}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed whitespace-pre-line">{t.settings.nameExplanationText}</p>
        </Card>

        <Card padding="md" className="mb-6">
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.settings.approachesTitle}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.settings.approachesText}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {t.settings.approachesList.map((a) => (
              <span key={a} className="px-2.5 py-1 rounded-full text-[12px] bg-[var(--color-surface-muted)] text-[var(--color-text)]">
                {a}
              </span>
            ))}
          </div>
          <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed font-medium">{t.settings.notTherapyDisclaimer}</p>
        </Card>

        {/* ================= Meine Daten ================= */}
        <SectionLabel>📦 {t.settings.privacySection}</SectionLabel>
        <Card padding="md" className="mb-3" data-testid="privacy-card">
          <div className="flex items-center gap-2.5 mb-2">
            <ShieldCheck size={17} className="text-[var(--color-primary)]" />
            <p className="text-[14px] font-medium text-[var(--color-text)]">{t.settings.privacy}</p>
          </div>
          <ul className="flex flex-col gap-1.5 list-disc pl-5 mb-3">
            {t.settings.privacyPoints.map((pt) => (
              <li key={pt} className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{pt}</li>
            ))}
          </ul>
          <Link to="/einstellungen/datenschutz" className="flex items-center gap-1 text-[13px] text-[var(--color-primary)]" data-testid="privacy-link">
            {t.settings.privacyOpenCta} <ChevronRight size={14} />
          </Link>
        </Card>
        <StorageOverviewCard />
        <Card padding="md" className="mb-3">
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.settings.myDataBackupNote}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mt-2">{t.settings.myDataMultiDeviceNote}</p>
        </Card>
        <Card padding="md" className="mb-6">
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.settings.myDataExportTitle}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.settings.myDataExportHint}</p>
        </Card>

        <Card padding="md" className="mb-6">
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.settings.fullBackupTitle}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.settings.fullBackupHint}</p>
          <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mb-3" data-testid="backup-scope-note">
            {settings.language === 'en'
              ? 'Included: all your entries, settings, routines and your own photos, videos and sounds (up to about 60 MB). Not included on purpose: the app lock (PIN and security question) – it stays with the device, so the file contains nothing that could help guess it.'
              : 'Dabei sind: alle deine Einträge, Einstellungen, Routinen und deine eigenen Fotos, Videos und Töne (zusammen bis etwa 60 MB). Bewusst nicht dabei: die App-Sperre (PIN und Sicherheitsfrage) – sie bleibt am Gerät, damit in der Datei nichts steckt, das beim Erraten helfen könnte.'}
          </p>
          <label className="flex items-start gap-2.5 mb-3 cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={settings.backupReminder !== false} onChange={(e) => updateSettings({ backupReminder: e.target.checked })} data-testid="backup-reminder-toggle" />
            <span className="text-[13px] text-[var(--color-text)]">{settings.language === 'en' ? 'Remind me gently to make a backup (after about a week)' : 'Sanft an eine Sicherung erinnern (nach etwa einer Woche)'}</span>
          </label>
          <div className="flex flex-col gap-2">
            {backupNote && <p className="text-[13px] text-[var(--color-primary)]" role="status" data-testid="backup-note">{backupNote}</p>}
            <button
              onClick={async () => {
                const sum = await downloadBackup();
                setBackupNote(
                  settings.language === 'en'
                    ? `Backup created: ${sum.keyCount} areas${sum.mediaCount ? `, ${sum.mediaCount} own photos/videos/sounds` : ''}.${sum.mediaSkipped ? ` ${sum.mediaSkipped} large file(s) did not fit and are not included.` : ''}`
                    : `Sicherung erstellt: ${sum.keyCount} Bereiche${sum.mediaCount ? `, ${sum.mediaCount} eigene Fotos/Videos/Töne` : ''}.${sum.mediaSkipped ? ` ${sum.mediaSkipped} große Datei(en) passten nicht mehr hinein und sind nicht dabei.` : ''}`,
                );
              }}
              data-testid="backup-create"
              className="py-2.5 rounded-[var(--radius-md)] text-[14px] bg-[var(--color-primary)] text-[var(--color-surface)]"
            >
              {t.settings.fullBackupCreateCta}
            </button>
            <button
              onClick={() => backupFileInputRef.current?.click()}
              data-testid="backup-restore"
              className="py-2.5 rounded-[var(--radius-md)] text-[14px] border border-[var(--color-border)] text-[var(--color-text)]"
            >
              {t.settings.fullBackupRestoreCta}
            </button>
            <input
              ref={backupFileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                if (!window.confirm(t.settings.fullBackupConfirmOverwrite)) return;
                const text = await file.text();
                const result = await importBackup(text);
                if (result.ok) {
                  window.alert(
                    t.settings.fullBackupRestoreSuccess +
                      (result.skipped ? (settings.language === 'en' ? ` (${result.skipped} item(s) could not be restored.)` : ` (${result.skipped} Eintrag/Einträge konnten nicht eingespielt werden.)`) : ''),
                  );
                  window.location.reload();
                } else if (result.error === 'storage-full') {
                  window.alert(settings.language === 'en' ? 'Not enough storage space on this device. Nothing was changed.' : 'Auf diesem Gerät ist nicht genug Speicherplatz. Es wurde nichts verändert.');
                } else {
                  window.alert(t.settings.fullBackupRestoreError);
                }
              }}
            />
          </div>
        </Card>
        <p className="text-[12px] text-[var(--color-text-faint)] mb-6 -mt-3 leading-relaxed">{t.settings.myDataDeleteAllPointer}</p>

        {/* ================= danger zone ================= */}
        <SectionLabel>⚠️ {t.settings.dangerZone}</SectionLabel>
        <Card padding="md" className="mb-6" style={{ borderColor: 'var(--color-danger)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle size={16} className="text-[var(--color-danger)] flex-shrink-0" />
            <p className="text-[13px] font-medium text-[var(--color-danger)]">{t.settings.dangerWarning}</p>
          </div>
          <p className="text-[12px] text-[var(--color-text-muted)] mb-3">{t.settings.dangerHint}</p>
          {!resetConfirming ? (
            <Button variant="danger" fullWidth icon={<RotateCcw size={15} />} onClick={confirmReset}>
              {t.settings.startOver}
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[13px] text-[var(--color-danger)] font-medium">{t.settings.confirmReset}</p>
              <div className="flex gap-2">
                <Button variant="danger" fullWidth onClick={confirmReset}>
                  {t.settings.confirmResetYes}
                </Button>
                <Button variant="ghost" onClick={() => setResetConfirming(false)}>
                  {t.common.cancel}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <CreatePaletteModal
        open={createPaletteOpen}
        onClose={() => setCreatePaletteOpen(false)}
        onCreated={(palette) => {
          setCustomPalettes(customPalettesRepo.getAll());
          updateSettings({ palette: palette.id });
        }}
      />

      <AnimalSetupModal
        open={!!setupSpecies || !!editingAnimal}
        speciesId={setupSpecies}
        editing={editingAnimal}
        onClose={() => {
          setSetupSpecies(null);
          setEditingAnimal(null);
        }}
        onSaved={(being) => {
          setAllBeings(getAllLichtwesen());
          updateSettings({ selectedBrainId: being.id, companionChosen: true });
        }}
        onDeleted={(id) => {
          const refreshed = getAllLichtwesen();
          setAllBeings(refreshed);
          if (settings.selectedBrainId === id) {
            updateSettings({ selectedBrainId: refreshed[0]?.id });
          }
        }}
      />

      <CreateCompanionModal
        open={createCompanionOpen || !!editingBeing}
        editing={editingBeing}
        onClose={() => {
          setCreateCompanionOpen(false);
          setEditingBeing(null);
        }}
        onCreated={(being) => {
          setAllBeings(getAllLichtwesen());
          updateSettings({ selectedBrainId: being.id });
        }}
        onDeleted={(id) => {
          const refreshed = getAllLichtwesen();
          setAllBeings(refreshed);
          if (settings.selectedBrainId === id) {
            updateSettings({ selectedBrainId: refreshed[0]?.id });
          }
        }}
      />
    </div>
  );
}

/** Growth of the animal companion: where it is, and the freedom to keep it a baby / make it grown right away. */
function GrowthSetting() {
  const { settings, updateSettings } = useSettings();
  const en = settings.language === 'en';
  const being = getAnyLichtwesen(settings.selectedBrainId);
  const { days, mode } = useCompanionAge(being.adoptedAt);
  if (!being.animal) return null;
  const modes: { id: 'grow' | 'adult' | 'baby'; de: string; en: string }[] = [
    { id: 'grow', de: 'Wächst mit', en: 'Grows with me' },
    { id: 'adult', de: 'Gleich erwachsen', en: 'Grown right away' },
    { id: 'baby', de: 'Bleibt Baby', en: 'Stays a baby' },
  ];
  return (
    <div className="mt-4 pt-3 border-t border-[var(--color-border)]" data-testid="growth-setting">
      <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">{en ? 'Growing up' : 'Wachsen'}</p>
      <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed mb-2" data-testid="growth-info">
        {mode === 'grow'
          ? en
            ? `${being.name}: day ${Math.min(days, GROW_UP_DAYS)} of ${GROW_UP_DAYS} (${stageLabel(days)}). Every day you do anything in the app counts – no streak, pauses are fine, it never shrinks.`
            : `${being.name}: Tag ${Math.min(days, GROW_UP_DAYS)} von ${GROW_UP_DAYS} (${stageLabel(days)}). Jeder Tag, an dem du irgendetwas in der App machst, zählt – keine Serie, Pausen sind in Ordnung, es schrumpft nie.`
          : en
            ? 'Growing is switched off for your animals.'
            : 'Das Wachsen ist für deine Tiere ausgeschaltet.'}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {modes.map((m) => {
          const on = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={on}
              data-testid={`age-mode-${m.id}`}
              onClick={() => updateSettings({ companionAgeMode: m.id })}
              className={`px-3 py-1.5 rounded-full text-[13px] border ${on ? 'text-white border-transparent' : 'text-[var(--color-text-muted)] border-[var(--color-border-strong)]'}`}
              style={on ? { background: 'var(--color-primary)' } : undefined}
            >
              {en ? m.en : m.de}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] font-semibold tracking-wide text-[var(--color-text)] mb-2 mt-5 first:mt-1">
      {children}
    </p>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
  disabled,
}: {
  icon?: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between py-2 gap-3">
      <span className="flex items-center gap-2 text-[14px] text-[var(--color-text)]">
        {icon}
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 flex-shrink-0 accent-[var(--color-primary)] disabled:opacity-40"
      />
    </label>
  );
}
