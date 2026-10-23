/** The areas and add-ons of the app, as shown on the Entdecken map. One source for every place that lists them. */
interface Leaf {
  to: string;
  key: string;
  emoji: string;
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
  { id: 'where', emoji: '📍', color: '#6fbf73', links: [{ to: '/inneres-wetter', key: 'wetter', emoji: '⛅' }, { to: '/entdecken/tageskurve', key: 'checkin', emoji: '📈' }, { to: '/zugang', key: 'zugang', emoji: '🔑' }, { to: '/entdecken/zugangskanaele', key: 'zugangskanaele', emoji: '🕸️' }, { to: '/entdecken/nervensystem', key: 'nervensystem', emoji: '🌊' }] },
  { id: 'regulate', emoji: '🎚️', color: '#c9522f', links: [{ to: '/entdecken/ressourcen/skills', key: 'skills', emoji: '🧰' }, { to: '/entdecken/ressourcen/skillketten', key: 'skillketten', emoji: '⛓️' }, { to: '/entdecken/ressourcen/hilfsmittel', key: 'hilfsmittel', emoji: '🪴' }, { to: '/entdecken/ressourcen', key: 'ressourcen', emoji: '🎁' }] },
  { id: 'connect', emoji: '🌉', color: '#8fae3d', links: [{ to: '/bruecken', key: 'bruecken', emoji: '🌉' }, { to: '/entdecken/wertekompass', key: 'wertekompass', emoji: '🧭' }, { to: '/entdecken/beduerfnis-kompass', key: 'beduerfnis', emoji: '💛' }, { to: '/entdecken/garten', key: 'garten', emoji: '🌱' }] },
  { id: 'secure', emoji: '🛟', color: '#4a6fa5', links: [{ to: '/sicherheit/netzwerk', key: 'netzwerk', emoji: '🤝' }, { to: '/sicherheit/plan', key: 'sicherheitsplan', emoji: '📋' }, { to: '/sicherheit/kontakte', key: 'kontakte', emoji: '📞' }, { to: '/krisenmodus', key: 'krisenmodus', emoji: '🛟' }, { to: '/helfermodus', key: 'helfermodus', emoji: '🫶' }] },
  { id: 'look', emoji: '📖', color: '#e8a83d', links: [{ to: '/sicherheit/tagebuch', key: 'tagesrueckblick', emoji: '🌙' }, { to: '/wochenrueckblick', key: 'wochenrueckblick', emoji: '🗓️' }, { to: '/entdecken/tageskurve/entwicklung', key: 'entwicklung', emoji: '📉' }, { to: '/zugang/rueckblick', key: 'zugangRueckblick', emoji: '🔁' }] },
];

export const ADDON_GROUPS: { labelKey: string; items: { emoji: string; titleKey: string; to: string }[] }[] = [
  { labelKey: 'nachschlagen', items: [{ emoji: '🫀', titleKey: 'koerper', to: '/entdecken/koerper' }, { emoji: '❤️', titleKey: 'gefuehle', to: '/entdecken/gefuehle' }, { emoji: '📚', titleKey: 'quellen', to: '/quellen' }] },
  { labelKey: 'gedanken', items: [{ emoji: '🧠', titleKey: 'denkmaschine', to: '/entdecken/denkmaschine' }, { emoji: '🛡️', titleKey: 'schutzstrategien', to: '/entdecken/schutzstrategien' }, { emoji: '🍃', titleKey: 'loslassen', to: '/entdecken/loslassen' }] },
  { labelKey: 'schreiben', items: [{ emoji: '📔', titleKey: 'tagebuch', to: '/sicherheit/tagebuch' }, { emoji: '💌', titleKey: 'briefAnMich', to: '/entdecken/brief-an-mich' }, { emoji: '🔖', titleKey: 'lesezeichen', to: '/entdecken/lesezeichen' }] },
  { labelKey: 'alltag', items: [{ emoji: '📮', titleKey: 'parkbox', to: '/parkbox' }, { emoji: '📅', titleKey: 'kalender', to: '/kalender' }, { emoji: '⏱️', titleKey: 'timer', to: '/entdecken/timer' }, { emoji: '💊', titleKey: 'mediLog', to: '/entdecken/medi-log' }, { emoji: '⭐', titleKey: 'favoriten', to: '/favoriten' }] },
  { labelKey: 'begleitung', items: [{ emoji: '✨', titleKey: 'wesen', to: '/einstellungen/wesen-info' }, { emoji: '⚙️', titleKey: 'einstellungen', to: '/einstellungen' }] },
];

