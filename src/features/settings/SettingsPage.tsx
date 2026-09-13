import { useEffect, useState } from 'react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Link } from 'react-router-dom';
import { Globe, Moon, Sun, Laptop, Sparkles, Plus, RotateCcw, PlayCircle, AlertTriangle, Pencil, MessageSquareText, Info, Compass, Trash2, Bell } from 'lucide-react';
import { getAllLichtwesen } from '../../components/companion/customLichtwesen';
import { customLichtwesenRepo } from '../../components/companion/customLichtwesen';
import type { LichtwesenConfig } from '../../components/companion/lichtwesen';
import { LichtwesenEyes } from '../../components/companion/LichtwesenEyes';
import { CreateCompanionModal } from '../../components/companion/CreateCompanionModal';
import { getCompanionScale, setCompanionScale, COMPANION_SCALE_MIN, COMPANION_SCALE_MAX } from '../../services/companionScale';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { resetAllAppData } from '../../services/resetAppData';
import { customPalettesRepo, deleteCustomPalette } from '../../services/customPalettes';
import { CreatePaletteModal } from '../../components/settings/CreatePaletteModal';
import type { SupportedLanguage, ThemeMode } from '../../data/types';
import { customRemindersRepo, type CustomReminder } from '../../services/customReminders';
import { createId } from '../../services/storage/repository';
import { BUILT_IN_PALETTE_IDS } from '../../data/types';
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

const SECTION_KEYS: { key: string; labelKey: 'home' | 'explore' | 'bridges' | 'safety' }[] = [
  { key: '/', labelKey: 'home' },
  { key: '/entdecken', labelKey: 'explore' },
  { key: '/bruecken', labelKey: 'bridges' },
  { key: '/sicherheit', labelKey: 'safety' },
];

export function SettingsPage() {
  const t = useT();
  const { settings, updateSettings } = useSettings();
  const [createCompanionOpen, setCreateCompanionOpen] = useState(false);
  const [customReminders, setCustomReminders] = useState<CustomReminder[]>(() => customRemindersRepo.getAll());
  const [addingReminder, setAddingReminder] = useState(false);
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
        <h1 className="text-[24px] mb-6">{t.settings.title}</h1>

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
        <Card className="mb-3" padding="md">
          <p className="text-[13px] text-[var(--color-text-muted)] mb-2">{t.settings.theme}</p>
          <div className="flex gap-2">
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
            {SECTION_KEYS.map(({ key, labelKey }) => {
              const current = settings.pagePalettes?.[key];
              return (
                <div key={key}>
                  <p className="text-[13px] text-[var(--color-text)] mb-2">{t.nav[labelKey]}</p>
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

        <Card className="mb-6" padding="md">
          <ToggleRow
            label={t.settings.reduceMotion}
            checked={settings.reduceMotion}
            onChange={(v) => updateSettings({ reduceMotion: v })}
          />
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
        </Card>

        {/* ================= Mein Wesen ================= */}
        <div id="begleiter-einstellungen" />
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
                          <svg viewBox="0 0 100 100" width="34" height="34" aria-hidden="true">
                            <circle cx="50" cy="52" r="30" fill={being.color} />
                            <circle cx="50" cy="52" r="17" fill="#fff" />
                            <LichtwesenEyes style={being.eyeStyle} color={being.color} blinking={false} />
                          </svg>
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)] truncate max-w-full" style={{ fontFamily: 'var(--font-companion)', fontWeight: 600 }}>
                          {being.name}
                        </span>
                      </button>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => setEditingBeing(being)}
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
        <Card className="mb-6" padding="md">
          <ToggleRow
            label={t.settings.reminders}
            checked={settings.remindersEnabled}
            onChange={(v) => updateSettings({ remindersEnabled: v, weatherReminderTime: v ? (settings.weatherReminderTime ?? '09:00') : undefined })}
          />
          <p className="text-[12px] text-[var(--color-text-faint)] mt-1">{t.settings.remindersHint}</p>
          {settings.remindersEnabled && (
            <label className="flex items-center justify-between py-2 mt-2 border-t border-[var(--color-border)] pt-3">
              <span className="text-[14px] text-[var(--color-text)]">{t.settings.reminderTimeLabel}</span>
              <input
                type="time"
                value={settings.weatherReminderTime ?? '09:00'}
                onChange={(e) => updateSettings({ weatherReminderTime: e.target.value })}
                className="input"
                style={{ width: 110 }}
              />
            </label>
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

        {/* ================= Tagebuch & automatische Übernahmen ================= */}
        <SectionLabel>📝 {t.settings.diarySection}</SectionLabel>
        <Card className="mb-3" padding="md">
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">{t.settings.dailyReviewSection}</p>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-3">{t.settings.dailyReviewHint}</p>

          <div className="flex flex-col gap-4">
            <div>
              <ToggleRow
                label={t.settings.dailyReviewPolyvagal}
                checked={settings.dailyReviewShowPolyvagal !== false}
                onChange={(v) => updateSettings({ dailyReviewShowPolyvagal: v })}
              />
              <p className="text-[11px] text-[var(--color-text-faint)] mt-0.5">{t.settings.dailyReviewPolyvagalHint}</p>
            </div>
            <div>
              <ToggleRow
                label={t.settings.dailyReviewMediLog}
                checked={settings.dailyReviewShowMediLog !== false}
                onChange={(v) => updateSettings({ dailyReviewShowMediLog: v })}
              />
              <p className="text-[11px] text-[var(--color-text-faint)] mt-0.5">{t.settings.dailyReviewMediLogHint}</p>
            </div>
            <div>
              <ToggleRow
                label={t.settings.dailyReviewWeather}
                checked={settings.dailyReviewShowWeather !== false}
                onChange={(v) => updateSettings({ dailyReviewShowWeather: v })}
              />
              <p className="text-[11px] text-[var(--color-text-faint)] mt-0.5">{t.settings.dailyReviewWeatherHint}</p>
            </div>
            <div>
              <ToggleRow
                label={t.settings.dailyReviewAchievements}
                checked={settings.dailyReviewShowAchievements !== false}
                onChange={(v) => updateSettings({ dailyReviewShowAchievements: v })}
              />
              <p className="text-[11px] text-[var(--color-text-faint)] mt-0.5">{t.settings.dailyReviewAchievementsHint}</p>
            </div>
            <div>
              <ToggleRow
                label={t.settings.dailyReviewTension}
                checked={settings.dailyReviewShowTension !== false}
                onChange={(v) => updateSettings({ dailyReviewShowTension: v })}
              />
              <p className="text-[11px] text-[var(--color-text-faint)] mt-0.5">{t.settings.dailyReviewTensionHint}</p>
            </div>
          </div>
        </Card>

        <Card className="mb-6" padding="md">
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">{t.settings.autoEntriesSection}</p>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-3">{t.settings.autoEntriesSectionHint}</p>

          <div className="flex flex-col gap-4">
            <div>
              <ToggleRow
                label={t.polyvagal.autoAddSetting}
                checked={!!settings.autoAddCurveToDiary}
                onChange={(v) => updateSettings({ autoAddCurveToDiary: v })}
              />
              <p className="text-[11px] text-[var(--color-text-faint)] mt-0.5">{t.settings.autoAddCurveHint}</p>
            </div>
            <div>
              <ToggleRow
                label={t.mediLog.autoDiaryLabel}
                checked={!!settings.mediLogAutoDiary}
                onChange={(v) => updateSettings({ mediLogAutoDiary: v })}
              />
              <p className="text-[11px] text-[var(--color-text-faint)] mt-0.5">{t.mediLog.autoDiaryHint}</p>
            </div>
            <div>
              <ToggleRow
                label={t.tension.autoAddSetting}
                checked={!!settings.autoAddTensionToDiary}
                onChange={(v) => updateSettings({ autoAddTensionToDiary: v })}
              />
              <p className="text-[11px] text-[var(--color-text-faint)] mt-0.5">{t.tension.autoAddHint}</p>
            </div>
          </div>
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
        </Card>

        <Link to="/system-karte" className="block mb-6">
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
        <SectionLabel>📦 {t.settings.myDataSection}</SectionLabel>
        <StorageOverviewCard />
        <Card padding="md" className="mb-3">
          <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-2">{t.settings.myDataWhere}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.settings.myDataBackupNote}</p>
        </Card>
        <Card padding="md" className="mb-6">
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.settings.myDataExportTitle}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.settings.myDataExportHint}</p>
        </Card>
        <p className="text-[12px] text-[var(--color-text-faint)] mb-6 -mt-3 leading-relaxed">{t.settings.myDataDeleteAllPointer}</p>

        {/* ================= privacy note + danger zone ================= */}
        <Card padding="md" className="mb-3">
          <p className="text-[13px] text-[var(--color-text-muted)]">{t.settings.privacyHint}</p>
        </Card>

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
