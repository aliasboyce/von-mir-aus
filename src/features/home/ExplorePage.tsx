import { SearchButton } from '../../components/navigation/SearchButton';
import { useState } from 'react';
import { ExploreMap } from './ExploreMap';
import { Pin, Archive, Check, Compass, Activity, CalendarDays, Pill, Star, CalendarCheck, Timer, Sprout, History, Zap, HandHeart, PersonStanding, Brain, Smile, Navigation, Feather, Mail, KeyRound, GitBranch, LifeBuoy, Network, Sunrise, Moon, Workflow, FolderKanban, CloudSun, Wrench, Link2, Share2, ClipboardList, Phone, Siren, Settings, BookOpen, Bookmark, TrendingUp, Mailbox, Armchair, Wallet, Gift, Layers, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HelpButton } from '../../components/navigation/HelpButton';
import { PasteSharedButton } from '../../components/shared/PasteSharedModal';
import { ReorderableTiles, type TileCustomization } from '../../components/navigation/ReorderableTiles';
import { getPins, getArchived, togglePin, toggleArchive } from '../../services/exploreCustomization';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { useRoutineTexts } from '../routines/routineTexts';
import { useDayFlowTexts } from '../dayFlow/dayFlowTexts';
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
  const rtx = useRoutineTexts();
  const dfx = useDayFlowTexts();
  const lang = useSettings().settings.language === 'en' ? 'en' : 'de';
  const [customizing, setCustomizing] = useState(false);
  // Karte (the mind map) is the default way in; Liste is the previous tile
  // view with pin/archive. The choice is remembered per device.
  const [view, setViewState] = useState<'map' | 'list'>(() => {
    try {
      return localStorage.getItem('innerpath:explore-view') === 'list' ? 'list' : 'map';
    } catch {
      return 'map';
    }
  });
  function setView(v: 'map' | 'list') {
    setViewState(v);
    try {
      localStorage.setItem('innerpath:explore-view', v);
    } catch {
      // not remembered — fine
    }
  }
  const [pins, setPins] = useState<string[]>(() => getPins());
  const [archived, setArchived] = useState<string[]>(() => getArchived());
  const customization: TileCustomization = {
    customizing,
    pinned: pins,
    archived,
    onTogglePin: (key) => {
      setPins(togglePin(key));
      setArchived(getArchived());
    },
    onToggleArchive: (key) => {
      setArchived(toggleArchive(key));
      setPins(getPins());
    },
  };
  // every group below gets a fresh start when something was pinned/archived
  const versionKey = `${pins.join(',')}|${archived.join(',')}`;

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

  const accessTiles: Tile[] = [
    { key: 'zugangLink', to: '/zugang', icon: KeyRound, title: t.zugang.navLabel, subtitle: t.zugang.homeSubtitle, color: 'var(--color-primary)' },
    { key: 'zugangskanaele', to: '/entdecken/zugangskanaele', icon: Network, title: t.zugangskanaele.page.title, subtitle: t.zugangskanaele.page.subtitle, color: 'var(--color-primary)' },
  ];
  const thoughtActionTiles: Tile[] = [
    { key: 'loslassen', to: '/entdecken/loslassen', icon: Feather, title: t.letGo.title, subtitle: t.letGo.subtitle, color: 'var(--color-accent-sky)' },
  ];
  const sm = t.systemMap;
  const hint = (k: string) => (sm.extraItemHints as Record<string, string>)[k] ?? '';
  const C = 'var(--color-accent-sun)';
  accessTiles.unshift({ key: 'wetter', to: '/inneres-wetter', icon: CloudSun, title: sm.areaLinks.wetter, subtitle: lang === 'en' ? 'How are you inside right now – as a picture.' : 'Wie ist es gerade in dir – als Bild.', color: 'var(--color-primary)' });
  reviewTiles.push({ key: 'entwicklung', to: '/entdecken/tageskurve/entwicklung', icon: TrendingUp, title: sm.areaLinks.entwicklung, subtitle: hint('entwicklung'), color: 'var(--color-accent-sky)' });
  const regulateTiles: Tile[] = [
    { key: 'skills', to: '/entdecken/ressourcen/skills', icon: Wrench, title: sm.areaLinks.skills, subtitle: lang === 'en' ? 'Exercises for tension, numbness and overwhelm.' : 'Übungen bei Anspannung, Taubheit und Überforderung.', color: 'var(--color-accent-clay)' },
    { key: 'skillketten', to: '/entdecken/ressourcen/skillketten', icon: Link2, title: sm.areaLinks.skillketten, subtitle: lang === 'en' ? 'Skills strung together in a fixed order.' : 'Skills in fester Reihenfolge hintereinander.', color: 'var(--color-accent-clay)' },
    { key: 'hilfsmittel', to: '/entdecken/ressourcen/hilfsmittel', icon: Gift, title: sm.areaLinks.hilfsmittel, subtitle: lang === 'en' ? 'Things that help you – your own cards.' : 'Dinge, die dir helfen – deine eigenen Karten.', color: 'var(--color-accent-clay)' },
    { key: 'ressourcen', to: '/entdecken/ressourcen', icon: Layers, title: sm.areaLinks.ressourcen, subtitle: hint('ressourcen'), color: 'var(--color-accent-clay)' },
  ];
  const ordnenTiles: Tile[] = [
    { key: 'parkbox', to: '/parkbox', icon: Mailbox, title: sm.extraItems.parkbox, subtitle: hint('parkbox'), color: C },
    { key: 'wartezimmer', to: '/parkbox?ort=wartezimmer', icon: Armchair, title: sm.extraItems.wartezimmer, subtitle: hint('wartezimmer'), color: C },
    { key: 'projekte', to: '/entdecken/projekte', icon: FolderKanban, title: sm.extraItems.projekte, subtitle: hint('projekte'), color: 'var(--color-accent-sky)' },
    { key: 'mindmap', to: '/entdecken/mindmap', icon: Workflow, title: sm.extraItems.mindmap, subtitle: hint('mindmap'), color: 'var(--color-accent-sky)' },
    { key: 'budget', to: '/budget', icon: Wallet, title: sm.extraItems.budget, subtitle: hint('budget'), color: C },
  ];
  const bridgeTiles: Tile[] = [{ key: 'bruecken', to: '/bruecken', icon: GitBranch, title: t.nav.bridges, subtitle: t.bridges.subtitle, color: 'var(--color-accent-clay)' }];
  const everydayTiles: Tile[] = [
    { key: 'garten', to: '/entdecken/garten', icon: Sprout, title: rtx.pageTitle, subtitle: t.garden.subtitle, color: 'var(--color-accent-sun)' },
    { key: 'tagBeginnen', to: '/tag-beginnen', icon: Sunrise, title: dfx.startTitle, subtitle: dfx.tileStartSub, color: 'var(--color-accent-sun)' },
    { key: 'tagAbschliessen', to: '/tag-abschliessen', icon: Moon, title: dfx.endTitle, subtitle: dfx.tileEndSub, color: 'var(--color-accent-sun)' },
    { key: 'kalender', to: '/kalender', icon: CalendarDays, title: t.calendar.title, subtitle: t.calendar.subtitle, color: 'var(--color-accent-sun)' },
    { key: 'timer', to: '/entdecken/timer', icon: Timer, title: t.simpleTimer.title, subtitle: t.simpleTimer.subtitle, color: 'var(--color-accent-sun)' },
    { key: 'medilog', to: '/entdecken/medi-log', icon: Pill, title: t.mediLog.title, subtitle: t.mediLog.subtitle, color: 'var(--color-accent-sun)' },
  ];
  // "Gespeicherte Quellen soll auch hierher verschoben sein"-Auftrag
  // — the lesezeichen tile that used to live here moved to the new
  // Ressourcen hub (/entdecken/ressourcen) instead of staying
  // duplicated in two places.
  const writingTiles: Tile[] = [
    { key: 'tagebuch', to: '/sicherheit/tagebuch', icon: BookOpen, title: sm.extraItems.tagebuch, subtitle: hint('tagebuch'), color: 'var(--color-accent-sky)' },
    { key: 'briefAnMich', to: '/entdecken/brief-an-mich', icon: Mail, title: t.briefAnMich.title, subtitle: t.briefAnMich.subtitle, color: 'var(--color-accent-sky)' },
    { key: 'lesezeichen', to: '/entdecken/lesezeichen', icon: Bookmark, title: sm.extraItems.lesezeichen, subtitle: hint('lesezeichen'), color: 'var(--color-accent-sky)' },
  ];
  const supportTiles: Tile[] = [
    { key: 'favoriten', to: '/favoriten', icon: Star, title: t.favorites.title, subtitle: t.favorites.subtitle, color: 'var(--color-accent-clay)' },
    { key: 'helfermodusLink', to: '/helfermodus', icon: LifeBuoy, title: t.helperMode.homeCta, subtitle: t.explore.helferSubtitle, color: 'var(--color-accent-clay)' },
    { key: 'netzwerk', to: '/sicherheit/netzwerk', icon: Share2, title: sm.areaLinks.netzwerk, subtitle: lang === 'en' ? 'People, animals, places that carry you.' : 'Menschen, Tiere und Orte, die dich tragen.', color: 'var(--color-accent-clay)' },
    { key: 'sicherheitsplan', to: '/sicherheit/plan', icon: ClipboardList, title: sm.areaLinks.sicherheitsplan, subtitle: hint('sicherheitsplan'), color: 'var(--color-accent-clay)' },
    { key: 'kontakte', to: '/sicherheit/kontakte', icon: Phone, title: sm.areaLinks.kontakte, subtitle: hint('kontakte'), color: 'var(--color-accent-clay)' },
    { key: 'krisenmodus', to: '/krisenmodus', icon: Siren, title: sm.areaLinks.krisenmodus, subtitle: hint('krisenmodus'), color: 'var(--color-accent-clay)' },
    { key: 'wesen', to: '/einstellungen/wesen-info', icon: Sparkles, title: sm.extraItems.wesen, subtitle: hint('wesen'), color: 'var(--color-accent-clay)' },
    { key: 'einstellungen', to: '/einstellungen', icon: Settings, title: sm.extraItems.einstellungen, subtitle: hint('einstellungen'), color: 'var(--color-accent-clay)' },
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
    { label: t.explore.subRegulieren, section: 'entdecken-regulieren', tiles: regulateTiles },
    { label: t.explore.subBrueckenBauen, section: 'entdecken-bruecken-bauen', tiles: bridgeTiles },
    { label: t.explore.subAlltag, section: 'entdecken-alltag', tiles: everydayTiles },
    { label: t.explore.subOrdnen, section: 'entdecken-ordnen', tiles: ordnenTiles },
    { label: t.explore.subSchreiben, section: 'entdecken-schreiben', tiles: writingTiles },
    { label: t.explore.subUnterstuetzen, section: 'entdecken-unterstuetzen', tiles: supportTiles },
  ];

  const allTiles = [...erforschenGroups, ...tunGroups].flatMap((g) => g.tiles);
  const pinnedTiles = pins.map((k) => allTiles.find((tl) => tl.key === k)).filter((tl): tl is Tile => !!tl);
  const archivedTiles = archived.map((k) => allTiles.find((tl) => tl.key === k)).filter((tl): tl is Tile => !!tl);
  const hide = (tiles: Tile[]) => tiles.filter((tl) => !pins.includes(tl.key) && !archived.includes(tl.key));

  return (
    <div className="px-5 pt-8 pb-6 animate-in">
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-[24px]">{t.nav.explore}</h1>
        <div className="flex items-center gap-1">
          <SearchButton />
          <HelpButton helpKey="entdecken" />
        </div>
      </div>
      <p className="text-[14px] text-[var(--color-text-muted)] mb-3">{t.resources.subtitle}</p>
      <PasteSharedButton className="mb-3" />
      <div className="flex gap-1 p-1 rounded-full mb-4" style={{ background: 'var(--color-surface-muted)' }} role="group" aria-label={t.nav.explore}>
        {(['map', 'list'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className="flex-1 rounded-full py-1.5 text-[13px] transition-colors"
            style={{ background: view === v ? 'var(--color-surface)' : 'transparent', color: view === v ? 'var(--color-text)' : 'var(--color-text-faint)', boxShadow: view === v ? 'var(--shadow-sm)' : undefined }}
          >
            {v === 'map' ? t.explore.viewMap : t.explore.viewList}
          </button>
        ))}
      </div>
      {view === 'map' ? (
        <ExploreMap />
      ) : (
      <>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed flex-1">{customizing ? t.explore.customizeHint : ''}</p>
        <button onClick={() => setCustomizing((v) => !v)} className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] flex-shrink-0">
          {customizing ? <Check size={14} /> : <Pin size={14} />}
          {customizing ? t.explore.customizeDone : t.explore.customize}
        </button>
      </div>

      {pinnedTiles.length > 0 && (
        <div className="mb-6">
          <p className="text-[15px] font-medium text-[var(--color-text)] mb-2 flex items-center gap-1.5">
            <Pin size={15} /> {t.explore.pinnedTitle}
          </p>
          <ReorderableTiles key={`pin-${versionKey}`} section="entdecken-angepinnt" tiles={pinnedTiles} customization={customization} />
        </div>
      )}
      <p className="text-[13px] text-[var(--color-text-muted)] mb-8 leading-relaxed rounded-[var(--radius-lg)] px-4 py-3.5" style={{ background: 'var(--color-surface-muted)' }}>{t.explore.groupsIntro}</p>

      <h2 className="text-[20px] text-[var(--color-text)] mb-1.5 mt-2">🔎 {t.explore.groupErforschen}</h2>
      <p data-hint className="text-[13.5px] text-[var(--color-text-muted)] mb-7 leading-relaxed">{t.explore.groupErforschenHint}</p>
      {erforschenGroups.map((g) => (
        <div key={g.section} className="mb-8">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)] mb-3 pl-2.5" style={{ borderLeft: '3px solid var(--color-primary)' }}>{g.label}</p>
          {hide(g.tiles).length > 0 && <ReorderableTiles key={`${g.section}-${versionKey}`} section={g.section} tiles={hide(g.tiles)} customization={customization} />}
        </div>
      ))}
      <Link to="/quellen" className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] mt-1 mb-2">
        📚 {t.explore.sourceLibraryLink} →
      </Link>

      <h2 className="text-[20px] text-[var(--color-text)] mb-1.5 mt-14 pt-8" style={{ borderTop: '1px solid var(--color-border)' }}>👣 {t.explore.groupTun}</h2>
      <p data-hint className="text-[13.5px] text-[var(--color-text-muted)] mb-7 leading-relaxed">{t.explore.groupTunHint}</p>
      {tunGroups.map((g) => (
        <div key={g.section} className="mb-8">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)] mb-3 pl-2.5" style={{ borderLeft: '3px solid var(--color-primary)' }}>{g.label}</p>
          {hide(g.tiles).length > 0 && <ReorderableTiles key={`${g.section}-${versionKey}`} section={g.section} tiles={hide(g.tiles)} customization={customization} />}
        </div>
      ))}

      {archivedTiles.length > 0 && (
        <div className="mt-8 pt-5" style={{ borderTop: '1px solid var(--color-border)' }}>
          <p className="text-[13px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2 flex items-center gap-1.5">
            <Archive size={14} /> {t.explore.archiveTitle}
          </p>
          {/* archived pages: still reachable, but visibly set back — darker and greyed */}
          <div style={{ opacity: 0.6, filter: 'grayscale(0.85)' }}>
            <ReorderableTiles key={`arch-${versionKey}`} section="entdecken-archiv" tiles={archivedTiles} customization={customization} hideReorder />
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
