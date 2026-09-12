import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Plus, Pause, Play, X, RotateCcw, Trash2, Check, Eye } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { pickLine } from '../../components/companion/companionRegistry';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { gardenRepo, migrateLegacyGardenData, createId } from './gardenRepo';
import { GardenScene, ALL_PLANT_STYLES } from './GardenScene';
import { progressFor, stageForProgress, MILESTONE_PROGRESS, distinctCheckInDays } from './gardenGrowth';
import { detectAndRecordGrowth } from './gardenGrowthAnimation';
import { GardenSunriseAnimation } from './GardenSunriseAnimation';
import type { GardenEntry, GardenEntryKind, GardenPlantStyle, HabitFrequency, GardenWeekday, GardenCountingMode } from '../../data/types';

migrateLegacyGardenData();

const GARDEN_WEEKDAYS: GardenWeekday[] = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'];
const GARDEN_COUNTING_MODES: GardenCountingMode[] = ['days', 'hours', 'sunrises'];
// JS Date.getDay(): 0=Sunday..6=Saturday — mapped to our Monday-first order.
const JS_DAY_TO_WEEKDAY: GardenWeekday[] = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Only used to render a mature-looking preview in the plant-style
 * picker (see openCreate's grid below) — distinctCheckInDays() counts
 * *unique* calendar days, so 65 copies of today's date collapse to a
 * single distinct day and produce a barely-grown, mostly-invisible
 * plant (just a trunk line for trees). 65 genuinely different past
 * dates instead reliably lands the preview at the fullest growth stage
 * so every plant style shows its complete, developed form for
 * comparison while choosing. */
function last65DistinctDays(): string[] {
  return Array.from({ length: 65 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });
}

function startOfWeekStr(): string {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export function GardenPage() {
  const t = useT();
  const say = useCompanionSay();
  const { settings } = useSettings();
  const [entries, setEntries] = useState<GardenEntry[]>(() => gardenRepo.getAll());
  const [creating, setCreating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [newKind, setNewKind] = useState<GardenEntryKind>('aufbau');
  const [newName, setNewName] = useState('');
  const [newFrequency, setNewFrequency] = useState<HabitFrequency>('daily');
  const [newWeekday, setNewWeekday] = useState<GardenWeekday>('mo');
  const [newReminderEnabled, setNewReminderEnabled] = useState(false);
  const [newCountingMode, setNewCountingMode] = useState<GardenCountingMode>('days');
  const [newMultipleTimesPerDay, setNewMultipleTimesPerDay] = useState(false);
  const [newMultiVariant, setNewMultiVariant] = useState<'count' | 'times'>('count');
  const [newDailyTargetCount, setNewDailyTargetCount] = useState(3);
  const [newDailyTargetTimes, setNewDailyTargetTimes] = useState<string[]>(['09:00', '14:00', '20:00']);
  const [newPlantStyle, setNewPlantStyle] = useState<GardenPlantStyle>('bluete_rose');
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);
  const [justGrewIds, setJustGrewIds] = useState<Set<string>>(new Set());
  const [wateringId, setWateringId] = useState<string | null>(null);
  const [sunriseActive, setSunriseActive] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // countingMode only reframes the plain daily total display — "Wie
  // möchtest du zählen?" was previously saved on the entry but never
  // actually read anywhere, so picking "Stunden" or "Sonnenaufgänge"
  // had zero visible effect. Hours is a genuinely different number
  // (elapsed real time since creation, not tied to check-in count at
  // all); sunrises reuses the same day-count as the default but with
  // different wording, since one sunrise is one day.
  function formatDailyProgress(e: GardenEntry, progress: number): string {
    if (e.countingMode === 'hours') {
      const hours = Math.max(0, Math.floor((Date.now() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60)));
      return t.garden.hoursCount.replace('{n}', String(hours));
    }
    if (e.countingMode === 'sunrises') {
      return t.garden.sunriseCount.replace('{n}', String(progress));
    }
    return t.homeTracker.totalCount.replace('{n}', String(progress));
  }

  function last14DaysFor(e: GardenEntry): { day: string; done: boolean; times: string[] }[] {
    const days = distinctCheckInDays(e);
    const timesByDay = new Map<string, string[]>();
    (e.checkInTimestamps ?? []).forEach((ts) => {
      const day = ts.slice(0, 10);
      const time = new Date(ts).toLocaleTimeString(settings.language === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' });
      if (!timesByDay.has(day)) timesByDay.set(day, []);
      timesByDay.get(day)!.push(time);
    });
    const result: { day: string; done: boolean; times: string[] }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({ day: key, done: days.has(key), times: timesByDay.get(key) ?? [] });
    }
    return result;
  }

  // Detected once per visit, not on every re-render — otherwise saving
  // an unrelated field (e.g. renaming) would keep re-triggering the
  // growth animation for entries that haven't actually grown further.
  useEffect(() => {
    if (settings.reduceMotion) return;
    const active = entries.filter((e) => e.status !== 'ended');
    const grown = detectAndRecordGrowth(active.map((e) => ({ id: e.id, stage: stageForProgress(progressFor(e)) })));
    if (grown.size > 0) {
      setJustGrewIds(grown);
      setSunriseActive(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A gentle, in-app nudge from the companion for entries opted into
  // "Mich daran erinnern" that are due and not yet checked in today —
  // reuses the existing say()/pickLine() companion mechanism rather than
  // any push-notification system (none exists yet, see final report).
  // Only ever says one reminder per visit, picked from a varied pool, so
  // several due entries don't stack into a barrage of messages.
  useEffect(() => {
    const today = todayStr();
    const todayWeekday = JS_DAY_TO_WEEKDAY[new Date().getDay()];
    const weekStart = startOfWeekStr();
    const dueEntry = entries.find((e) => {
      if (e.status !== 'active' || e.kind !== 'aufbau' || !e.reminderEnabled) return false;
      if (e.checkIns?.includes(today)) return false;
      if (e.frequency === 'weekday') return e.weekday === todayWeekday;
      if (e.frequency === 'weekly') return !(e.checkIns ?? []).some((d) => d >= weekStart);
      return true;
    });
    if (dueEntry) {
      say(pickLine({ page: '/entdecken/garten', trigger: 'garden_erinnerung' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function refresh() {
    setEntries(gardenRepo.getAll());
  }

  function openCreate() {
    setNewPlantStyle(ALL_PLANT_STYLES[Math.floor(Math.random() * ALL_PLANT_STYLES.length)]);
    setCreating(true);
  }

  function create() {
    const name = newName.trim();
    if (!name) return;
    const now = new Date().toISOString();
    if (newKind === 'veraenderung') {
      gardenRepo.save({
        id: createId('garden'),
        name,
        kind: 'veraenderung',
        createdAt: now,
        status: 'active',
        plantStyle: newPlantStyle,
        startedAt: now,
        history: [{ id: createId('gev'), type: 'started', at: now }],
      });
    } else {
      gardenRepo.save({
        id: createId('garden'),
        name,
        kind: 'aufbau',
        createdAt: now,
        status: 'active',
        plantStyle: newPlantStyle,
        frequency: newFrequency,
        targetPerWeek: newFrequency === 'weekly' ? 3 : newFrequency === 'weekday' ? 1 : undefined,
        weekday: newFrequency === 'weekday' ? newWeekday : undefined,
        reminderEnabled: newReminderEnabled,
        countingMode: newCountingMode,
        multipleTimesPerDay: newMultipleTimesPerDay,
        dailyTargetCount: newMultipleTimesPerDay && newMultiVariant === 'count' ? newDailyTargetCount : undefined,
        dailyTargetTimes: newMultipleTimesPerDay && newMultiVariant === 'times' ? newDailyTargetTimes : undefined,
        checkIns: [],
        checkInTimestamps: [],
      });
    }
    setNewName('');
    setNewFrequency('daily');
    setNewWeekday('mo');
    setNewReminderEnabled(false);
    setNewCountingMode('days');
    setNewMultipleTimesPerDay(false);
    setNewMultiVariant('count');
    setNewDailyTargetCount(3);
    setNewDailyTargetTimes(['09:00', '14:00', '20:00']);
    setCreating(false);
    refresh();
    say(pickLine({ page: '/entdecken/garten', trigger: 'garden_neu' }), { joy: true });
  }

  function togglePause(e: GardenEntry) {
    const now = new Date().toISOString();
    if (e.status === 'active') {
      gardenRepo.save({ ...e, status: 'paused', pausedAt: now, history: [...(e.history ?? []), { id: createId('gev'), type: 'paused', at: now }] });
      say(pickLine({ page: '/entdecken/garten', trigger: 'garden_pause' }));
    } else if (e.status === 'paused') {
      gardenRepo.save({ ...e, status: 'active', pausedAt: undefined, history: [...(e.history ?? []), { id: createId('gev'), type: 'resumed', at: now }] });
    }
    refresh();
  }

  function confirmReset(e: GardenEntry) {
    const now = new Date().toISOString();
    gardenRepo.save({
      ...e,
      startedAt: now,
      status: 'active',
      pausedAt: undefined,
      history: [...(e.history ?? []), { id: createId('gev'), type: 'reset', at: now }],
    });
    setConfirmResetId(null);
    refresh();
    say(pickLine({ page: '/entdecken/garten', trigger: 'garden_reset' }));
  }

  function endEntry(e: GardenEntry) {
    gardenRepo.save({ ...e, status: 'ended', history: [...(e.history ?? []), { id: createId('gev'), type: 'ended', at: new Date().toISOString() }] });
    refresh();
  }

  function checkIn(e: GardenEntry) {
    const today = todayStr();
    if (e.checkIns?.includes(today)) return;
    const stageBefore = stageForProgress(progressFor(e));
    const updated = { ...e, checkIns: [...(e.checkIns ?? []), today] };
    gardenRepo.save(updated);
    refresh();
    const stageAfter = stageForProgress(progressFor(updated));
    // Point 2 — watering plays immediately on this exact click, not
    // only detected retroactively on a later visit (the mount-effect
    // detection above still covers "something grew while you were
    // away"). The grow bounce only follows when a stage boundary was
    // actually crossed today; watering itself always plays, since
    // tending to it is the act that happened here, independent of
    // whether it was enough to cross into a new visible stage yet.
    setWateringId(e.id);
    window.setTimeout(() => {
      setWateringId(null);
      if (stageAfter > stageBefore) {
        setJustGrewIds(new Set([e.id]));
        setSunriseActive(true);
      }
    }, 1300);
    const isMilestone = MILESTONE_PROGRESS.includes(distinctCheckInDays(updated).size);
    say(pickLine({ page: '/entdecken/garten', trigger: isMilestone ? 'garden_meilenstein' : 'garden_tag' }), { joy: isMilestone });
  }

  // For "mehrmals am Tag" entries — records the exact moment, and can
  // fire any number of times per day. Growth itself is still governed
  // by distinctCheckInDays (see gardenGrowth.ts), so tapping this
  // several times today never grows the plant more than once.
  function checkInNow(e: GardenEntry) {
    const stageBefore = stageForProgress(progressFor(e));
    const now = new Date().toISOString();
    const updated = { ...e, checkInTimestamps: [...(e.checkInTimestamps ?? []), now] };
    gardenRepo.save(updated);
    refresh();
    const stageAfter = stageForProgress(progressFor(updated));
    setWateringId(e.id);
    window.setTimeout(() => {
      setWateringId(null);
      if (stageAfter > stageBefore) {
        setJustGrewIds(new Set([e.id]));
        setSunriseActive(true);
      }
    }, 1300);
    const wasNewDay = !distinctCheckInDays(e).has(todayStr());
    const isMilestone = wasNewDay && MILESTONE_PROGRESS.includes(distinctCheckInDays(updated).size);
    say(pickLine({ page: '/entdecken/garten', trigger: isMilestone ? 'garden_meilenstein' : 'garden_tag' }), { joy: isMilestone });
  }

  function remove(id: string) {
    if (!window.confirm(t.garden.confirmDelete)) return;
    gardenRepo.remove(id);
    refresh();
  }

  const activeEntries = entries.filter((e) => e.status !== 'ended');

  return (
    <div className="animate-in">
      <TopBar action={<HelpButton helpKey="garten" />} />
      <div className="px-5 pb-6">
        <h1 className="text-[24px] mb-1 text-center">{t.garden.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-1 text-center">{t.garden.subtitle}</p>
        <Link to="/entdecken/schutzstrategien" className="text-[12px] text-[var(--color-primary)] block text-center mb-1">
          {t.garden.patternExplainerLink}
        </Link>
        <p className="text-[12px] text-[var(--color-text-faint)] mb-5 text-center">{t.garden.growsOncePerDayNote}</p>

        <Button fullWidth icon={<Plus size={17} />} onClick={openCreate} className="mb-5">
          {t.garden.addNew}
        </Button>

        <Card padding="lg" className="mb-3">
          <div className="flex justify-center">
            <GardenScene entries={activeEntries} justGrewIds={justGrewIds} wateringId={wateringId} />
          </div>
        </Card>

        <button onClick={() => setPreviewOpen(true)} className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] mb-6">
          <Eye size={14} /> {t.garden.previewCta}
        </button>

        {entries.length === 0 && !creating ? (
          <EmptyState title={t.garden.empty} />
        ) : (
          <div className="flex flex-col gap-4 mb-6">
            {entries
              .filter((e) => e.status !== 'ended')
              .map((e) => {
                const progress = progressFor(e);
                const doneToday = e.kind === 'aufbau' && e.checkIns?.includes(todayStr());
                const weekCount = e.kind === 'aufbau' ? (e.checkIns ?? []).filter((d) => d >= startOfWeekStr()).length : 0;
                const isMilestone = MILESTONE_PROGRESS.includes(progress) && e.status === 'active';

                return (
                  <Card key={e.id} padding="lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                            style={{
                              background: e.kind === 'aufbau' ? 'var(--color-primary-soft)' : 'var(--color-accent-clay)',
                              color: e.kind === 'aufbau' ? 'var(--color-primary)' : '#fff',
                              opacity: e.kind === 'aufbau' ? 1 : 0.85,
                            }}
                          >
                            {e.kind === 'aufbau' ? t.garden.kindAufbau : t.garden.kindVeraenderung}
                          </span>
                        </div>
                        <p className="text-[15px] text-[var(--color-text)] font-medium">{e.name}</p>
                        <p className="text-[13px] text-[var(--color-text-muted)]">
                          {e.status === 'paused'
                            ? t.garden.statusPaused
                            : e.kind === 'veraenderung'
                              ? t.garden.dayCount.replace('{n}', String(progress))
                              : e.frequency === 'weekday'
                                ? t.garden.weekdayProgress
                                    .replace('{day}', e.weekday ? t.garden.weekdayFull[e.weekday] : '')
                                    .replace('{status}', weekCount > 0 ? t.garden.weekdayDoneThisWeek : t.garden.weekdayNotYetThisWeek)
                                : e.frequency === 'weekly'
                                  ? t.homeTracker.thisWeek.replace('{n}', String(weekCount)).replace('{target}', String(e.targetPerWeek ?? 3))
                                  : formatDailyProgress(e, progress)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {e.kind === 'veraenderung' && (
                          <button
                            onClick={() => togglePause(e)}
                            aria-label={e.status === 'paused' ? t.garden.resume : t.garden.pause}
                            className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
                          >
                            {e.status === 'paused' ? <Play size={15} /> : <Pause size={15} />}
                          </button>
                        )}
                        <button onClick={() => remove(e.id)} aria-label={t.common.delete} className="p-1.5 rounded-full text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-center my-1">
                      <GardenScene entries={[e]} width={160} height={100} wateringId={wateringId === e.id ? e.id : null} justGrewIds={justGrewIds} />
                    </div>

                    {isMilestone && (
                      <div className="flex items-center gap-2 mb-3">
                        <InlineCompanionNote joyBurst="hop" />
                        <p className="text-[13px] text-[var(--color-text)]">
                          {pickLine({ page: '/entdecken/garten', trigger: 'garden_meilenstein' })}
                        </p>
                      </div>
                    )}

                    {e.kind === 'veraenderung' ? (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setConfirmResetId(e.id)} className="flex items-center gap-1.5 text-[13px] text-[var(--color-text-muted)]">
                          <RotateCcw size={13} /> {t.garden.reset}
                        </button>
                        <button onClick={() => endEntry(e)} className="flex items-center gap-1.5 text-[13px] text-[var(--color-text-faint)]">
                          <X size={13} /> {t.garden.end}
                        </button>
                      </div>
                    ) : e.multipleTimesPerDay ? (
                      <div>
                        <Button fullWidth icon={<Check size={15} />} onClick={() => checkInNow(e)}>
                          {t.garden.doneNowCta}
                        </Button>
                        {(() => {
                          const todaysTimes = (e.checkInTimestamps ?? []).filter((ts) => ts.slice(0, 10) === todayStr());
                          const last = todaysTimes[todaysTimes.length - 1];
                          return last ? (
                            <p className="text-[12px] text-[var(--color-text-faint)] text-center mt-1.5">
                              {t.garden.doneAt.replace('{time}', new Date(last).toLocaleTimeString(settings.language === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' }))}
                              {todaysTimes.length > 1 ? ` (${todaysTimes.length}×)` : ''}
                            </p>
                          ) : null;
                        })()}
                      </div>
                    ) : (
                      <Button fullWidth variant={doneToday ? 'ghost' : 'primary'} icon={<Check size={15} />} onClick={() => checkIn(e)} disabled={doneToday}>
                        {doneToday ? t.homeTracker.doneToday : t.homeTracker.checkInToday}
                      </Button>
                    )}

                    {e.kind === 'aufbau' && distinctCheckInDays(e).size > 0 && (
                      <button
                        onClick={() => setExpandedHistoryId(expandedHistoryId === e.id ? null : e.id)}
                        className="text-[12px] text-[var(--color-text-faint)] mt-2 underline underline-offset-2"
                      >
                        {t.garden.dayHistoryTitle}
                      </button>
                    )}
                    {expandedHistoryId === e.id && (
                      <div className="flex flex-wrap gap-1 mt-2 animate-in">
                        {last14DaysFor(e).map(({ day, done, times }) => (
                          <span
                            key={day}
                            title={`${new Date(day).toLocaleDateString(settings.language === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit' })}${times.length > 0 ? ' · ' + times.join(', ') : ''}`}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] flex-shrink-0"
                            style={{
                              background: done ? 'var(--color-primary-soft)' : 'var(--color-surface-muted)',
                              color: done ? 'var(--color-primary)' : 'var(--color-text-faint)',
                            }}
                          >
                            {new Date(day).getDate()}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
          </div>
        )}

        <Modal open={creating} onClose={() => setCreating(false)} title={t.garden.addNew}>
            <div className="flex gap-2 mb-3">
              <Chip selected={newKind === 'aufbau'} onClick={() => setNewKind('aufbau')}>
                {t.garden.kindAufbau}
              </Chip>
              <Chip selected={newKind === 'veraenderung'} onClick={() => setNewKind('veraenderung')}>
                {t.garden.kindVeraenderung}
              </Chip>
            </div>
            <p className="text-[13px] text-[var(--color-text-muted)] mb-2">
              {newKind === 'aufbau' ? t.homeTracker.newPrompt : t.garden.newPrompt}
            </p>
            <input
              autoFocus
              className="input mb-3"
              placeholder={newKind === 'aufbau' ? t.homeTracker.newPlaceholder : t.garden.newPlaceholder}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && create()}
            />
            {newKind === 'aufbau' && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  <Chip selected={newFrequency === 'daily'} onClick={() => setNewFrequency('daily')}>
                    {t.homeTracker.frequencyDaily}
                  </Chip>
                  <Chip selected={newFrequency === 'weekly'} onClick={() => setNewFrequency('weekly')}>
                    {t.homeTracker.frequencyWeekly}
                  </Chip>
                  <Chip selected={newFrequency === 'weekday'} onClick={() => setNewFrequency('weekday')}>
                    {t.garden.frequencyWeekday}
                  </Chip>
                </div>
                {newFrequency === 'weekday' && (
                  <div className="flex flex-wrap gap-1.5">
                    {GARDEN_WEEKDAYS.map((day) => (
                      <button
                        key={day}
                        onClick={() => setNewWeekday(day)}
                        className="px-3 py-1.5 rounded-full text-[13px]"
                        style={{
                          background: newWeekday === day ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                          color: newWeekday === day ? 'var(--color-surface)' : 'var(--color-text)',
                        }}
                      >
                        {t.garden.weekdayShort[day]}
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-[13px] font-medium text-[var(--color-text-muted)] mt-3 mb-1.5">{t.garden.countingModeLabel}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {GARDEN_COUNTING_MODES.map((mode) => (
                    <Chip key={mode} selected={newCountingMode === mode} onClick={() => setNewCountingMode(mode)}>
                      {t.garden.countingModes[mode]}
                    </Chip>
                  ))}
                </div>

                <label className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    checked={newMultipleTimesPerDay}
                    onChange={(e) => setNewMultipleTimesPerDay(e.target.checked)}
                    className="w-5 h-5 accent-[var(--color-primary)]"
                  />
                  <span className="text-[13px] text-[var(--color-text)]">{t.garden.multipleTimesLabel}</span>
                </label>

                {newMultipleTimesPerDay && (
                  <div className="mt-2 pl-1">
                    <div className="flex gap-2 mb-2">
                      <Chip selected={newMultiVariant === 'count'} onClick={() => setNewMultiVariant('count')}>
                        {t.garden.multiVariantCount}
                      </Chip>
                      <Chip selected={newMultiVariant === 'times'} onClick={() => setNewMultiVariant('times')}>
                        {t.garden.multiVariantTimes}
                      </Chip>
                    </div>
                    {newMultiVariant === 'count' ? (
                      <input
                        type="number"
                        min={1}
                        max={20}
                        className="input"
                        style={{ width: 90 }}
                        value={newDailyTargetCount}
                        onChange={(e) => setNewDailyTargetCount(Number(e.target.value))}
                      />
                    ) : (
                      <div className="flex flex-col gap-2">
                        {newDailyTargetTimes.map((time, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              type="time"
                              className="input"
                              value={time}
                              onChange={(e) => {
                                const next = [...newDailyTargetTimes];
                                next[i] = e.target.value;
                                setNewDailyTargetTimes(next);
                              }}
                            />
                            {newDailyTargetTimes.length > 1 && (
                              <button
                                onClick={() => setNewDailyTargetTimes(newDailyTargetTimes.filter((_, idx) => idx !== i))}
                                aria-label={t.common.delete}
                                className="p-1.5 text-[var(--color-danger)]"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => setNewDailyTargetTimes([...newDailyTargetTimes, '12:00'])}
                          className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] w-fit"
                        >
                          <Plus size={13} /> {t.garden.addTime}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <label className="flex items-center gap-2 mt-3">
                  <input
                    type="checkbox"
                    checked={newReminderEnabled}
                    onChange={(e) => setNewReminderEnabled(e.target.checked)}
                    className="w-5 h-5 accent-[var(--color-primary)]"
                  />
                  <span className="text-[13px] text-[var(--color-text)]">{t.garden.reminderLabel}</span>
                </label>
              </div>
            )}
            <p className="text-[13px] text-[var(--color-text-muted)] mb-2">{t.garden.plantStyleLabel}</p>
            <div
              className="flex flex-wrap justify-center gap-3 mb-4 p-1 overflow-y-auto"
              style={{ maxHeight: 480 }}
            >
              {ALL_PLANT_STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => setNewPlantStyle(style)}
                  className="rounded-[var(--radius-lg)] flex flex-col items-center justify-center flex-shrink-0 pb-2 pt-2"
                  style={{
                    width: 156,
                    minHeight: 148,
                    background: newPlantStyle === style ? 'var(--color-primary-soft)' : 'var(--color-surface-muted)',
                    outline: newPlantStyle === style ? '2.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                  }}
                  aria-label={t.garden.plantStyles[style]}
                >
                  <GardenScene
                    entries={[{ id: 'p', name: '', kind: 'aufbau', createdAt: '', status: 'active', plantStyle: style, checkIns: last65DistinctDays() }]}
                    width={148}
                    height={88}
                  />
                  <span className="text-[12px] text-[var(--color-text)] mt-1 text-center px-1.5">{t.garden.plantStyles[style]}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button fullWidth onClick={create} disabled={!newName.trim()}>
                {t.common.save}
              </Button>
              <Button variant="ghost" onClick={() => setCreating(false)}>
                {t.common.cancel}
              </Button>
            </div>
        </Modal>
      </div>

      <Modal open={!!confirmResetId} onClose={() => setConfirmResetId(null)} title={t.garden.resetConfirmTitle}>
        <div className="flex flex-col gap-3">
          <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed">{t.garden.resetConfirmText}</p>
          <Button
            fullWidth
            onClick={() => {
              const e = entries.find((x) => x.id === confirmResetId);
              if (e) confirmReset(e);
            }}
          >
            {t.garden.resetConfirmCta}
          </Button>
          <button onClick={() => setConfirmResetId(null)} className="text-[13px] text-[var(--color-text-faint)]">
            {t.common.cancel}
          </button>
        </div>
      </Modal>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title={t.garden.previewTitle}>
        <div className="flex flex-col gap-3 items-center">
          <p className="text-[13px] text-[var(--color-text-muted)] text-center">{t.garden.previewText}</p>
          <GardenScene
            entries={[
              { id: 'p1', name: '', kind: 'aufbau', createdAt: '', status: 'active', plantStyle: 'bluete_rose', checkIns: [] },
              { id: 'p2', name: '', kind: 'veraenderung', createdAt: '', status: 'active', plantStyle: 'strauch', checkIns: [] },
              { id: 'p3', name: '', kind: 'aufbau', createdAt: '', status: 'active', plantStyle: 'ranke', checkIns: [] },
              { id: 'p4', name: '', kind: 'veraenderung', createdAt: '', status: 'active', plantStyle: 'sukkulente', checkIns: [] },
              { id: 'p5', name: '', kind: 'aufbau', createdAt: '', status: 'active', plantStyle: 'baum_rund', checkIns: [] },
              { id: 'p6', name: '', kind: 'veraenderung', createdAt: '', status: 'active', plantStyle: 'bluete_gaensebluemchen', checkIns: [] },
              { id: 'p7', name: '', kind: 'aufbau', createdAt: '', status: 'active', plantStyle: 'baum_schlank', checkIns: [] },
            ]}
            previewMode
          />
        </div>
      </Modal>

      <GardenSunriseAnimation active={sunriseActive && !settings.reduceMotion} onDone={() => setSunriseActive(false)} />
    </div>
  );
}
