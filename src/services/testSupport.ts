import { createKeyValueStore } from './storage/keyValueStore';
const NAMESPACE = 'innerpath';

/**
 * Small helpers that make a longer real-life test safer: all data lives only in this browser, so
 * (1) ask the browser not to clear it, (2) gently remind about a backup, (3) tell people how to install the app,
 * (4) make it easy to send feedback — without any server or account.
 */
export const firstUseStore = createKeyValueStore<string | null>('first-use-at', null);
export const lastBackupStore = createKeyValueStore<string | null>('last-backup-at', null);
export const backupSnoozeStore = createKeyValueStore<string | null>('backup-reminder-snooze', null);

const DAY = 86400000;

export function markFirstUse(): void {
  if (!firstUseStore.get()) firstUseStore.set(new Date().toISOString());
}

export function markBackupDone(): void {
  lastBackupStore.set(new Date().toISOString());
  backupSnoozeStore.set(null);
}

/** Asks the browser to keep this site's data even when storage gets tight (best effort, silent). */
export async function requestPersistentStorage(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted?.()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

function userDataBytes(): number {
  let n = 0;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(`${NAMESPACE}:`)) continue;
      if (/settings|first-use|last-backup|backup-reminder|tour-|about-|splash|version/.test(key)) continue;
      n += (window.localStorage.getItem(key) ?? '').length;
    }
  } catch {
    return 0;
  }
  return n;
}

/** Due when there is real content, the app has been in use for about a week, and no backup was made for two weeks. Can be switched off in the settings. */
export function backupReminderDue(now = Date.now(), enabled = true): boolean {
  try {
    if (!enabled) return false;
    const first = firstUseStore.get();
    if (!first || now - new Date(first).getTime() < 7 * DAY) return false;
    if (userDataBytes() < 1500) return false;
    const snooze = backupSnoozeStore.get();
    if (snooze && now < new Date(snooze).getTime()) return false;
    const last = lastBackupStore.get();
    return !last || now - new Date(last).getTime() > 14 * DAY;
  } catch {
    return false;
  }
}

export function snoozeBackupReminder(days = 7): void {
  backupSnoozeStore.set(new Date(Date.now() + days * DAY).toISOString());
}

export function isStandalone(): boolean {
  try {
    const nav = navigator as Navigator & { standalone?: boolean };
    return !!nav.standalone || window.matchMedia?.('(display-mode: standalone)').matches === true;
  } catch {
    return false;
  }
}

export function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export function buildDate(): string {
  const n = Number(typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 0);
  return n ? new Date(n).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–';
}

/** A short text the tester can paste into a message – contains no personal data, only version and device type. */
export function feedbackTemplate(en: boolean): string {
  const device = isIos() ? 'iPhone/iPad' : /Android/.test(navigator.userAgent) ? 'Android' : 'Computer';
  const installed = isStandalone() ? (en ? 'yes' : 'ja') : en ? 'no (in the browser)' : 'nein (im Browser)';
  const first = firstUseStore.get();
  const days = first ? Math.max(0, Math.round((Date.now() - new Date(first).getTime()) / DAY)) : 0;
  return en
    ? `Feedback on "von mir aus"\nVersion: ${buildDate()} · Device: ${device} · Installed on home screen: ${installed} · In use for: ${days} days\n\nWhat I noticed:\n- \n\nWhat helped me:\n- \n\nWhat was confusing, ugly or broken:\n- \n\nWhat I missed:\n- `
    : `Rückmeldung zu „von mir aus“\nVersion: ${buildDate()} · Gerät: ${device} · Auf dem Startbildschirm installiert: ${installed} · In Benutzung seit: ${days} Tagen\n\nWas mir aufgefallen ist:\n- \n\nWas mir geholfen hat:\n- \n\nWas verwirrend, unschön oder kaputt war:\n- \n\nWas ich vermisst habe:\n- `;
}

export type QuickFeedbackKind = 'helps' | 'weighs' | 'missing' | 'broken';

/** one-tap short feedback: a mood word, an optional line, and only version/device/screen – nothing personal */
export function quickFeedbackText(kind: QuickFeedbackKind | null, note: string, path: string, en: boolean): string {
  const label: Record<QuickFeedbackKind, [string, string]> = {
    helps: ['💛 Das hilft', '💛 This helps'],
    weighs: ['😕 Das drückt / stört', '😕 This weighs on me / bothers me'],
    missing: ['💭 Das fehlt mir', '💭 I miss something'],
    broken: ['🔧 Das geht nicht', '🔧 This does not work'],
  };
  const device = isIos() ? 'iPhone/iPad' : /Android/.test(navigator.userAgent) ? 'Android' : 'Computer';
  const head = en ? 'Quick feedback on "von mir aus"' : 'Kurz-Rückmeldung zu „von mir aus“';
  const what = kind ? label[kind][en ? 1 : 0] : '';
  const ctx = `${en ? 'Screen' : 'Seite'}: ${path || '/'} · ${en ? 'Version' : 'Version'}: ${buildDate()} · ${en ? 'Device' : 'Gerät'}: ${device}`;
  return [head, what, note.trim(), ctx].filter(Boolean).join('\n');
}

// ---- install prompt (Android / desktop Chrome & Edge offer a one-tap install) ----
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
let deferredInstall: InstallPromptEvent | null = null;

/** Call once at startup: the browser fires this event early, so it has to be caught before any screen exists. */
export function initInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e as InstallPromptEvent;
  });
  window.addEventListener('appinstalled', () => {
    deferredInstall = null;
  });
}
export const canPromptInstall = (): boolean => deferredInstall !== null;
export async function promptInstall(): Promise<boolean> {
  if (!deferredInstall) return false;
  const ev = deferredInstall;
  deferredInstall = null;
  try {
    await ev.prompt();
    return (await ev.userChoice).outcome === 'accepted';
  } catch {
    return false;
  }
}
export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

/** Anonymous feedback form for the test phase (Tally). Set TEST_PHASE to false to hide every mention later. */
export const TEST_FEEDBACK_URL = 'https://tally.so/r/YjDWG0';
export const TEST_PHASE = true;
/** The mail address "Kurz was an Boycie melden" goes to – shown in the quick-feedback sheet as soon as it is set (still to do: set the address). */
export const QUICK_FEEDBACK_MAIL = '';
