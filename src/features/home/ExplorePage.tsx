import { Compass, Activity, Bookmark, Pill, Star, CalendarCheck, Timer, Sprout, History, Zap, HandHeart, PersonStanding, Brain, Smile, Navigation, Feather, Mail, KeyRound, GitBranch, LifeBuoy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HelpButton } from '../../components/navigation/HelpButton';
import { ReorderableTiles } from '../../components/navigation/ReorderableTiles';
import { useT } from '../../i18n';
import type { OrderableSection } from '../../services/sectionOrder';

interface Tile {
  key: string;
  to: string;
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  subtitle: string;
  color?: string;
}

/**
 * "Materialien"-Auftrag, Section 6 — the Entdecken page needed further
 * sub-grouping WITHIN Erforschen/Tun, not just the two top-level
 * headers on their own ("das wäre nur dieselbe Unordnung unter zwei
 * Überschriften"). Every tile keeps its exact destination — this only
 * adds a layer of grouping headers above the existing
 * ReorderableTiles blocks. A few small cross-reference tiles (Zugang,
 * Brücken, Helfermodus) are added so the brief's own suggested "Tun"
 * sub-categories (Zugang finden, Brücken bauen, Unterstützen) aren't
 * left empty — these don't duplicate the features themselves, just
 * offer another doorway to what's already reachable via the bottom
 * nav, matching the app's existing "multiple valid paths" philosophy.
 */
export function ExplorePage() {
  const t = useT();

  const bodyTiles: Tile[] = [
    { key: 'koerper', to: '/entdecken/koerper', icon: PersonStanding, title: t.bodyAwarenessRef.title, subtitle: t.bodyAwarenessRef.subtitle, color: 'var(--color-accent-clay)' },
    { key: 'nervensystem', to: '/entdecken/nervensystem', icon: Zap, title: t.nervousSystemRef.title, subtitle: t.nervousSystemRef.subtitle, color: 'var(--color-accent-clay)' },
    { key: 'tageskurve', to: '/entdecken/tageskurve', icon: Activity, title: t.polyvagal.title, subtitle: t.polyvagal.subtitle, color: 'var(--color-accent-clay)' },
  ];
  const feelingsNeedsTiles: Tile[] = [
    { key: 'gefuehle', to: '/entdecken/gefuehle', icon: Smile, title: t.feelingsRef.title, subtitle: t.feelingsRef.subtitle, color: 'var(--color-accent-sun)' },
    {
      key: 'beduerfnisse',
      to: '/entdecken/beduerfnis-kompass',
      icon: Compass,
      title: t.weather.needsPageTitle,
      subtitle: t.accessWheel.compassSubtitle,
      color: 'var(--color-accent-sun)',
    },
  ];
  const thoughtsTiles: Tile[] = [
    { key: 'glaubenssaetze', to: '/entdecken/denkmaschine', icon: Brain, title: t.glaubenssaetze.title, subtitle: t.glaubenssaetze.subtitle, color: 'var(--color-accent-sky)' },
    { key: 'schutzstrategien', to: '/entdecken/schutzstrategien', icon: HandHeart, title: t.protectionRef.title, subtitle: t.protectionRef.subtitle, color: 'var(--color-accent-sky)' },
  ];
  const valuesTiles: Tile[] = [
    { key: 'wertekompass', to: '/entdecken/wertekompass', icon: Navigation, title: t.wertekompass.title, subtitle: t.wertekompass.subtitle, color: 'var(--color-primary)' },
  ];
  const reviewTiles: Tile[] = [
    { key: 'zugangRueckblick', to: '/zugang/rueckblick', icon: History, title: t.zugang.reviewTitle, subtitle: t.zugang.reviewSubtitle, color: 'var(--color-accent-sky)' },
    { key: 'wochenrueckblick', to: '/wochenrueckblick', icon: CalendarCheck, title: t.weeklyReview.title, subtitle: t.weeklyReview.subtitle, color: 'var(--color-accent-sky)' },
  ];

  const accessTiles: Tile[] = [{ key: 'zugangLink', to: '/zugang', icon: KeyRound, title: t.zugang.navLabel, subtitle: t.zugang.homeSubtitle, color: 'var(--color-primary)' }];
  const thoughtActionTiles: Tile[] = [
    { key: 'loslassen', to: '/entdecken/loslassen', icon: Feather, title: t.letGo.title, subtitle: t.letGo.subtitle, color: 'var(--color-accent-sky)' },
  ];
  const bridgeTiles: Tile[] = [{ key: 'bruecken', to: '/bruecken', icon: GitBranch, title: t.nav.bridges, subtitle: t.bridges.subtitle, color: 'var(--color-accent-clay)' }];
  const everydayTiles: Tile[] = [
    { key: 'garten', to: '/entdecken/garten', icon: Sprout, title: t.garden.title, subtitle: t.garden.subtitle, color: 'var(--color-accent-sun)' },
    { key: 'timer', to: '/entdecken/timer', icon: Timer, title: t.simpleTimer.title, subtitle: t.simpleTimer.subtitle, color: 'var(--color-accent-sun)' },
    { key: 'medilog', to: '/entdecken/medi-log', icon: Pill, title: t.mediLog.title, subtitle: t.mediLog.subtitle, color: 'var(--color-accent-sun)' },
  ];
  const writingTiles: Tile[] = [
    { key: 'briefAnMich', to: '/entdecken/brief-an-mich', icon: Mail, title: t.briefAnMich.title, subtitle: t.briefAnMich.subtitle, color: 'var(--color-accent-sky)' },
    { key: 'lesezeichen', to: '/entdecken/lesezeichen', icon: Bookmark, title: t.bookmarks.title, subtitle: t.bookmarks.subtitle, color: 'var(--color-accent-sky)' },
  ];
  const supportTiles: Tile[] = [
    { key: 'favoriten', to: '/favoriten', icon: Star, title: t.favorites.title, subtitle: t.favorites.subtitle, color: 'var(--color-accent-clay)' },
    { key: 'helfermodusLink', to: '/helfermodus', icon: LifeBuoy, title: t.helperMode.homeCta, subtitle: t.explore.helferSubtitle, color: 'var(--color-accent-clay)' },
  ];

  const erforschenGroups: { label: string; section: OrderableSection; tiles: Tile[] }[] = [
    { label: t.explore.subKoerper, section: 'entdecken-koerper', tiles: bodyTiles },
    { label: t.explore.subGefuehleBeduerfnisse, section: 'entdecken-gefuehle-bed', tiles: feelingsNeedsTiles },
    { label: t.explore.subGedanken, section: 'entdecken-gedanken', tiles: thoughtsTiles },
    { label: t.explore.subWerte, section: 'entdecken-werte', tiles: valuesTiles },
    { label: t.explore.subRueckblicke, section: 'entdecken-rueckblicke', tiles: reviewTiles },
  ];

  const tunGroups: { label: string; section: OrderableSection; tiles: Tile[] }[] = [
    { label: t.explore.subZugangFinden, section: 'entdecken-zugang-finden', tiles: accessTiles },
    { label: t.explore.subGedankenAusprobieren, section: 'entdecken-gedanken-aus', tiles: thoughtActionTiles },
    { label: t.explore.subBrueckenBauen, section: 'entdecken-bruecken-bauen', tiles: bridgeTiles },
    { label: t.explore.subAlltag, section: 'entdecken-alltag', tiles: everydayTiles },
    { label: t.explore.subSchreiben, section: 'entdecken-schreiben', tiles: writingTiles },
    { label: t.explore.subUnterstuetzen, section: 'entdecken-unterstuetzen', tiles: supportTiles },
  ];

  return (
    <div className="px-5 pt-8 pb-6 animate-in">
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-[24px]">{t.nav.explore}</h1>
        <HelpButton helpKey="entdecken" />
      </div>
      <p className="text-[14px] text-[var(--color-text-muted)] mb-2">{t.resources.subtitle}</p>
      <p className="text-[13px] text-[var(--color-text-faint)] mb-3 leading-relaxed">{t.explore.groupsIntro}</p>
      <Link
        to="/system-karte"
        className="flex items-center gap-3 mb-6 p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)]"
        style={{ background: 'var(--color-primary-soft)' }}
      >
        <span className="text-[32px] flex-shrink-0">🗺️</span>
        <span className="flex-1">
          <span className="block text-[16px] font-medium text-[var(--color-text)]">{t.explore.systemMapLink}</span>
          <span className="block text-[12px] text-[var(--color-text-faint)]">{t.explore.systemMapHint}</span>
        </span>
        <span className="text-[18px] text-[var(--color-primary)]">→</span>
      </Link>

      <p className="text-[15px] font-medium text-[var(--color-text)] mb-0.5 mt-1">🔎 {t.explore.groupErforschen}</p>
      <p className="text-[12px] text-[var(--color-text-faint)] mb-5 leading-relaxed">{t.explore.groupErforschenHint}</p>
      {erforschenGroups.map((g) => (
        <div key={g.section} className="mb-5">
          <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{g.label}</p>
          <ReorderableTiles section={g.section} tiles={g.tiles} />
        </div>
      ))}
      <Link to="/quellen" className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] mt-1 mb-1">
        📚 {t.explore.sourceLibraryLink} →
      </Link>

      <p className="text-[15px] font-medium text-[var(--color-text)] mb-0.5 mt-8">👣 {t.explore.groupTun}</p>
      <p className="text-[12px] text-[var(--color-text-faint)] mb-5 leading-relaxed">{t.explore.groupTunHint}</p>
      {tunGroups.map((g) => (
        <div key={g.section} className="mb-5">
          <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{g.label}</p>
          <ReorderableTiles section={g.section} tiles={g.tiles} />
        </div>
      ))}
    </div>
  );
}
