import { useEffect } from 'react';
import { useSettings } from '../../state/SettingsContext';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { useT } from '../../i18n';
import { addMail } from '../../services/mailbox';
import { notifyHint } from '../../services/hintFeedback';
import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { polyvagalRepo } from '../../features/polyvagal/polyvagalRepo';
import { bestSkillForPractice } from '../../features/resources/zoneRoadmap';
import { GENTLE_HINTS, type GentleForm, type GentleKind } from '../../content/gentleHints';

interface Slot {
  hour: number;
  minute: number;
  kind: GentleKind;
}

/** "Mehr Erinnerungen generell: nach innen checken, Energie checken
 * (vom Wesen), Erinnerung an Check-in". Three a day by default (late
 * morning / afternoon / evening), six in "more". */
export const GENTLE_SCHEDULES: Record<'normal' | 'more', Slot[]> = {
  normal: [
    { hour: 10, minute: 0, kind: 'checkin' },
    { hour: 15, minute: 0, kind: 'inward' },
    { hour: 19, minute: 0, kind: 'energy' },
  ],
  more: [
    { hour: 9, minute: 30, kind: 'checkin' },
    { hour: 11, minute: 30, kind: 'inward' },
    { hour: 14, minute: 0, kind: 'energy' },
    { hour: 16, minute: 30, kind: 'checkin' },
    { hour: 19, minute: 0, kind: 'inward' },
    { hour: 20, minute: 30, kind: 'energy' },
  ],
};

const stateStore = createKeyValueStore<{ day: string; lastIndex: number }>('gentle-reminders-state', { day: '', lastIndex: -1 });
const variantStore = createKeyValueStore<{ checkin: number; inward: number; energy: number; form: string }>('gentle-last-variants', { checkin: -1, inward: -1, energy: -1, form: '' });

/** "Anker, die wandern": the time moves a little every day (+-20 min, but
 * stable within the day), so a reminder never becomes a fixed landmark
 * that gets filtered out. */
function jitterMinutes(day: string, index: number): number {
  let h = 0;
  for (const c of `${day}-${index}`) h = (h * 31 + c.charCodeAt(0)) | 0;
  return (Math.abs(h) % 41) - 20;
}

function pickAvoiding<T>(items: T[], lastIndex: number): number {
  if (items.length <= 1) return 0;
  let i = Math.floor(Math.random() * items.length);
  if (i === lastIndex) i = (i + 1) % items.length;
  return i;
}

/** The latest check-in value from the last three hours, if any. */
function recentValue(nowMs: number): number | null {
  const latest = polyvagalRepo
    .getAll()
    .filter((c) => c.tensionValue != null && nowMs - new Date(c.createdAt).getTime() < 3 * 3600 * 1000)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return latest?.tensionValue ?? null;
}

/**
 * Delivers AT MOST ONE gentle reminder per run: the latest slot of the day
 * whose (slightly shifted) time has passed and that was not delivered yet.
 * Each comes in a changing FORM — short text, bare question, or the
 * companion speaking and moving — and in changing wording, never the same
 * as last time. A check-in nudge is skipped right after a check-in. When
 * the last check-in was only lightly tense (zones 3-4), the body/energy
 * slots offer a one-minute PRACTICE of the skill that has helped most.
 * In-app only (no push), switchable off in Settings; how a new one
 * announces itself (still / sound / vibration) follows the hint mode.
 */
export function GentleRemindersSync() {
  const t = useT();
  const say = useCompanionSay();
  const { settings } = useSettings();
  const mode = settings.gentleReminders ?? 'normal';
  const en = settings.language === 'en';

  useEffect(() => {
    if (mode === 'off' || settings.nurJetztMode) return;
    function run() {
      const now = new Date();
      const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const slots = GENTLE_SCHEDULES[mode as 'normal' | 'more'];
      const state = stateStore.get();
      const lastIndex = state.day === day ? state.lastIndex : -1;
      let due = -1;
      slots.forEach((s, i) => {
        const at = new Date(now);
        at.setHours(s.hour, s.minute + jitterMinutes(day, i), 0, 0);
        if (now >= at) due = i;
      });
      if (due <= lastIndex) return;
      stateStore.set({ day, lastIndex: due });
      const slot = slots[due];
      if (slot.kind === 'checkin') {
        // no check-in nudge right after a check-in
        const recent = polyvagalRepo.getAll().some((c) => now.getTime() - new Date(c.createdAt).getTime() < 90 * 60 * 1000);
        if (recent) return;
      }

      const content = GENTLE_HINTS[slot.kind];
      const cta = { checkin: t.postfach.gentleCheckinCta, inward: t.postfach.gentleInwardCta, energy: t.postfach.gentleEnergyCta }[slot.kind];
      const to = slot.kind === 'inward' ? '/entdecken/koerper' : '/inneres-wetter';
      const mailKind = slot.kind === 'checkin' ? ('checkin' as const) : slot.kind === 'energy' ? ('energy' as const) : ('info' as const);
      const id = `gentle-${day}-${mode}-${due}`;
      const last = variantStore.get();

      // light unrest (zones 3-4): offer a one-minute practice instead
      const value = recentValue(now.getTime());
      if ((slot.kind === 'inward' || slot.kind === 'energy') && value !== null && value >= 40 && value < 70) {
        const best = bestSkillForPractice();
        if (best) {
          const added = addMail({
            id,
            kind: 'info',
            title: t.postfach.practiceTitle,
            text: t.postfach.practiceText.replace('{skill}', best.title),
            prominent: true,
            actionKind: 'link',
            actionLabel: t.postfach.practiceCta,
            actionTo: best.to,
          });
          if (added) notifyHint(settings.hintMode);
          return;
        }
      }

      const forms: GentleForm[] = (['text', 'frage', 'wesen'] as GentleForm[]).filter((f) => f !== last.form);
      const form = forms[Math.floor(Math.random() * forms.length)];
      const vi = pickAvoiding(content.variants, last[slot.kind]);
      variantStore.set({ ...last, [slot.kind]: vi, form });
      const v = content.variants[vi][en ? 'en' : 'de'];

      if (form === 'wesen') {
        // the companion speaks and hops; a quiet (non-prominent) copy stays in the Postfach
        say(content.wesen[en ? 'en' : 'de'], { joy: true });
        addMail({ id, kind: mailKind, title: v.title, text: v.text, prominent: false, actionKind: 'link', actionLabel: cta, actionTo: to });
        return;
      }
      const added = addMail({
        id,
        kind: mailKind,
        title: form === 'frage' ? content.question[en ? 'en' : 'de'] : v.title,
        text: form === 'frage' ? '' : v.text,
        prominent: true,
        actionKind: 'link',
        actionLabel: cta,
        actionTo: to,
      });
      if (added) notifyHint(settings.hintMode);
    }
    run();
    const iv = window.setInterval(run, 60 * 1000);
    const onVisible = () => document.visibilityState === 'visible' && run();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(iv);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, settings.nurJetztMode, settings.language, settings.hintMode]);

  return null;
}
