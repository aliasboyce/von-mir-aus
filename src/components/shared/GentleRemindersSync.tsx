import { useEffect } from 'react';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { addMail } from '../../services/mailbox';
import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { polyvagalRepo } from '../../features/polyvagal/polyvagalRepo';

type Kind = 'checkin' | 'inward' | 'energy';
interface Slot {
  hour: number;
  minute: number;
  kind: Kind;
}

/** "Mehr Erinnerungen generell: nach innen checken, Energie checken
 * (vom Wesen), Erinnerung an Check-in"-Auftrag. Three a day by default
 * (late morning / afternoon / evening), six in "more". */
const SCHEDULES: Record<'normal' | 'more', Slot[]> = {
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

/**
 * Delivers AT MOST ONE gentle reminder per run: the latest slot of the
 * day whose time has passed and that was not delivered yet — a phone
 * left alone all afternoon does not come back to three stacked
 * messages. A check-in nudge is skipped when the person has just
 * checked in. In-app only (no push), switchable off in Settings.
 */
export function GentleRemindersSync() {
  const t = useT();
  const { settings } = useSettings();
  const mode = settings.gentleReminders ?? 'normal';

  useEffect(() => {
    if (mode === 'off' || settings.nurJetztMode) return;
    function run() {
      const now = new Date();
      const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const slots = SCHEDULES[mode as 'normal' | 'more'];
      const state = stateStore.get();
      const lastIndex = state.day === day ? state.lastIndex : -1;
      let due = -1;
      slots.forEach((s, i) => {
        const at = new Date(now);
        at.setHours(s.hour, s.minute, 0, 0);
        if (now >= at) due = i;
      });
      if (due <= lastIndex) return;
      stateStore.set({ day, lastIndex: due });
      const slot = slots[due];
      if (slot.kind === 'checkin') {
        const recent = polyvagalRepo.getAll().some((c) => now.getTime() - new Date(c.createdAt).getTime() < 90 * 60 * 1000);
        if (recent) return;
      }
      const texts = {
        checkin: { title: t.postfach.gentleCheckinTitle, text: t.postfach.gentleCheckinText, cta: t.postfach.gentleCheckinCta, to: '/inneres-wetter', kind: 'checkin' as const },
        inward: { title: t.postfach.gentleInwardTitle, text: t.postfach.gentleInwardText, cta: t.postfach.gentleInwardCta, to: '/entdecken/koerper', kind: 'info' as const },
        energy: { title: t.postfach.gentleEnergyTitle, text: t.postfach.gentleEnergyText, cta: t.postfach.gentleEnergyCta, to: '/inneres-wetter', kind: 'energy' as const },
      }[slot.kind];
      addMail({ id: `gentle-${day}-${mode}-${due}`, kind: texts.kind, title: texts.title, text: texts.text, prominent: true, actionKind: 'link', actionLabel: texts.cta, actionTo: texts.to });
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
  }, [mode, settings.nurJetztMode, settings.language]);

  return null;
}
