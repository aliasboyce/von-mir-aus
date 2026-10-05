import { useEffect } from 'react';
import { useUpdateAvailable } from '../../services/updateCheck';
import { addMail } from '../../services/mailbox';
import { CHANGELOG } from '../../services/changelog';
import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';

const lastBuildStore = createKeyValueStore<string>('mailbox-last-build', '');

/**
 * "Die Update-Nachricht kam wieder nicht"-Fund — the old notice relied
 * on a hand-written changelog being up to date AND on a floating card
 * the person had to catch. Now two things reliably reach the Postfach
 * without anyone remembering to write anything:
 *  1. a newer deploy detected on the server -> "Neue Version bereit"
 *     with a reload button (one message per build id);
 *  2. the first launch after an update (the running build differs from
 *     the one last seen) -> "Die App wurde aktualisiert", with the
 *     newest changelog entry's bullet points when there are any.
 * Renders nothing; mounted once in AppShell.
 */
export function MailboxSync() {
  const t = useT();
  const { settings } = useSettings();
  const { available, buildId } = useUpdateAvailable();

  useEffect(() => {
    if (!available || !buildId) return;
    addMail({
      id: `update-available-${buildId}`,
      kind: 'update',
      title: t.postfach.updateAvailableTitle,
      text: t.postfach.updateAvailableText,
      prominent: true,
      actionKind: 'reload',
      actionLabel: t.postfach.reloadCta,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available, buildId]);

  useEffect(() => {
    const current = String(__BUILD_ID__);
    const last = lastBuildStore.get();
    if (!last) {
      lastBuildStore.set(current);
      return;
    }
    if (last === current) return;
    const latest = CHANGELOG[0];
    const items = latest ? (settings.language === 'en' ? latest.itemsEn : latest.items) : [];
    addMail({
      id: `updated-${current}`,
      kind: 'update',
      title: t.postfach.updatedTitle,
      text: items.length > 0 ? items.map((i) => `• ${i}`).join('\n') : t.postfach.updatedFallback,
      prominent: true,
    });
    lastBuildStore.set(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
