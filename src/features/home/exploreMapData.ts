/** The areas and add-ons of the app, as shown on the Entdecken map. One source for every place that lists them. */
interface Leaf {
  to: string;
  key: string;
}
interface MainArea {
  id: 'where' | 'regulate' | 'connect' | 'secure' | 'look';
  emoji: string;
  color: string;
  links: Leaf[];
}

/**
 * Entdecken as a mind map. The five main areas are the app's actual goal
 * (same areas, colours and links as "So hängt alles zusammen"); everything
 * else is listed apart as add-ons, so nothing competes with the core.
 */
export const MAIN_AREAS: MainArea[] = [
  { id: 'where', emoji: '📍', color: '#6fbf73', links: [{ to: '/entdecken/tageskurve', key: 'checkin' }, { to: '/zugang', key: 'zugang' }, { to: '/entdecken/zugangskanaele', key: 'zugangskanaele' }, { to: '/entdecken/nervensystem', key: 'nervensystem' }] },
  { id: 'regulate', emoji: '🎚️', color: '#c9522f', links: [{ to: '/entdecken/ressourcen/skills', key: 'skills' }, { to: '/entdecken/ressourcen/skillketten', key: 'skillketten' }, { to: '/entdecken/ressourcen/hilfsmittel', key: 'hilfsmittel' }, { to: '/entdecken/ressourcen', key: 'ressourcen' }] },
  { id: 'connect', emoji: '🌉', color: '#8fae3d', links: [{ to: '/bruecken', key: 'bruecken' }, { to: '/entdecken/wertekompass', key: 'wertekompass' }, { to: '/entdecken/beduerfnis-kompass', key: 'beduerfnis' }, { to: '/entdecken/garten', key: 'garten' }] },
  { id: 'secure', emoji: '🛟', color: '#4a6fa5', links: [{ to: '/sicherheit/netzwerk', key: 'netzwerk' }, { to: '/sicherheit/plan', key: 'sicherheitsplan' }, { to: '/sicherheit/kontakte', key: 'kontakte' }, { to: '/krisenmodus', key: 'krisenmodus' }, { to: '/helfermodus', key: 'helfermodus' }] },
  { id: 'look', emoji: '📖', color: '#e8a83d', links: [{ to: '/sicherheit/tagebuch', key: 'tagesrueckblick' }, { to: '/wochenrueckblick', key: 'wochenrueckblick' }, { to: '/entdecken/tageskurve/entwicklung', key: 'entwicklung' }, { to: '/zugang/rueckblick', key: 'zugangRueckblick' }] },
];

export const ADDON_GROUPS: { labelKey: string; items: { emoji: string; titleKey: string; to: string }[] }[] = [
  { labelKey: 'nachschlagen', items: [{ emoji: '🫀', titleKey: 'koerper', to: '/entdecken/koerper' }, { emoji: '🌊', titleKey: 'nervensystem', to: '/entdecken/nervensystem' }, { emoji: '❤️', titleKey: 'gefuehle', to: '/entdecken/gefuehle' }, { emoji: '📚', titleKey: 'quellen', to: '/quellen' }] },
  { labelKey: 'gedanken', items: [{ emoji: '🧠', titleKey: 'denkmaschine', to: '/entdecken/denkmaschine' }, { emoji: '🛡️', titleKey: 'schutzstrategien', to: '/entdecken/schutzstrategien' }, { emoji: '🍃', titleKey: 'loslassen', to: '/entdecken/loslassen' }] },
  { labelKey: 'schreiben', items: [{ emoji: '📔', titleKey: 'tagebuch', to: '/sicherheit/tagebuch' }, { emoji: '💌', titleKey: 'briefAnMich', to: '/entdecken/brief-an-mich' }, { emoji: '🔖', titleKey: 'lesezeichen', to: '/entdecken/lesezeichen' }] },
  { labelKey: 'alltag', items: [{ emoji: '📅', titleKey: 'kalender', to: '/kalender' }, { emoji: '⏱️', titleKey: 'timer', to: '/entdecken/timer' }, { emoji: '💊', titleKey: 'mediLog', to: '/entdecken/medi-log' }, { emoji: '⭐', titleKey: 'favoriten', to: '/favoriten' }] },
  { labelKey: 'begleitung', items: [{ emoji: '✨', titleKey: 'wesen', to: '/einstellungen/wesen-info' }] },
];

