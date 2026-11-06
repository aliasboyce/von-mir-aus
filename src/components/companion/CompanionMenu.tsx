import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, Shuffle, X, MessageCircle, Sparkles, Compass, Feather, Footprints, Radio, Zap, Wind, Hand, Info } from 'lucide-react';

export interface CompanionMenuProps {
  en: boolean;
  scale: number;
  isSleeping: boolean;
  showFeedback: boolean;
  t: { companion: { moveHint: string; helpMeOrientSubtext: string; whatCanIDoLink: string; wake: string; sleep: string; changeCompanion: string; requestTip: string; distractMe: string; helpMeOrient: string; tooMuchCta: string }; dinoGame: { title: string }; common: { close: string } };
  onClose: () => void;
  onTip: () => void;
  onDistraction: () => void;
  onDino: () => void;
  onGrounding: () => void;
  onTooMuch: () => void;
  onStoer: () => void;
  onSchmuggel: () => void;
  onBreathe: () => void;
  onSleep: () => void;
  onAway: () => void;
  onChange: () => void;
  onFeedback: () => void;
}

interface Row { id: string; icon: ReactNode; label: string; info: string; run: () => void; testId?: string; accent?: boolean }

/**
 * Das aufklappende Wesen-Menü: groß genug zum Tippen, in drei ruhigen Gruppen, und zu jedem Punkt gibt es einen
 * kleinen Info-Knopf, der in einem Satz sagt, was dahintersteckt.
 */
export function CompanionMenu(p: CompanionMenuProps) {
  const { en, t } = p;
  const [info, setInfo] = useState<string | null>(null);
  const L = (de: string, e: string) => (en ? e : de);
  const groups: { title: string; rows: Row[] }[] = [
    {
      title: L('Mir helfen', 'Help me'),
      rows: [
        { id: 'tip', icon: <MessageCircle size={20} />, label: t.companion.requestTip, info: L('Ich sage dir einen kleinen Gedanken zu dem, was du gerade auf dem Bildschirm hast.', 'I tell you a small thought about what you are looking at right now.'), run: p.onTip, testId: 'companion-request-tip', accent: true },
        { id: 'orient', icon: <Compass size={20} />, label: t.companion.helpMeOrient, info: t.companion.helpMeOrientSubtext, run: p.onGrounding, testId: 'companion-grounding' },
        { id: 'breathe', icon: <Wind size={20} />, label: L('Gemeinsam atmen', 'Breathe together'), info: L('Eine ruhige Atemübung zum Mitatmen – du wählst, welche.', 'A calm breathing exercise to breathe along with – you choose which.'), run: p.onBreathe, testId: 'companion-breathe' },
        { id: 'toomuch', icon: <Feather size={20} />, label: t.companion.tooMuchCta, info: L('Wenn alles zu viel ist: Ich zeige dir ganz wenig und ein paar Wege hinaus.', 'When everything is too much: I show you very little and a few ways out.'), run: p.onTooMuch },
      ],
    },
    {
      title: L('Ablenken', 'Distract'),
      rows: [
        { id: 'distract', icon: <Sparkles size={20} />, label: t.companion.distractMe, info: L('Eine kleine Ablenkung, wenn dein Kopf gerade kreist.', 'A small distraction when your mind is going around in circles.'), run: p.onDistraction },
        { id: 'dino', icon: <Footprints size={20} />, label: t.dinoGame.title, info: L('Ein einfaches Hüpfspiel für zwischendurch.', 'A simple jumping game for in between.'), run: p.onDino },
        { id: 'stoer', icon: <Radio size={20} />, label: L('Liebevoller Störsender', 'Loving interrupter'), info: L('Unterbricht Gedankenschleifen liebevoll mit etwas Überraschendem.', 'Lovingly interrupts thought loops with something unexpected.'), run: p.onStoer },
        { id: 'schmuggel', icon: <Zap size={20} />, label: L('10 Sekunden Schmuggel', '10-second smuggle'), info: L('Zehn Sekunden: Ich schmuggle dir eine winzige gute Sache in den Moment.', 'Ten seconds: I smuggle a tiny good thing into the moment.'), run: p.onSchmuggel },
      ],
    },
    {
      title: L('Das Wesen', 'The Wesen'),
      rows: [
        { id: 'sleep', icon: p.isSleeping ? <Sun size={20} /> : <Moon size={20} />, label: p.isSleeping ? t.companion.wake : t.companion.sleep, info: L('Schlafend bin ich still, bis du mich weckst.', 'While asleep I am quiet until you wake me.'), run: p.onSleep },
        { id: 'away', icon: <Hand size={20} />, label: L('Wegschicken', 'Send away'), info: L('Ich gehe und bleibe weg, bis du mich auf der Startseite zurückholst.', 'I go and stay away until you call me back on the start page.'), run: p.onAway, testId: 'companion-send-away', accent: true },
        { id: 'change', icon: <Shuffle size={20} />, label: t.companion.changeCompanion, info: L('Ein anderes Wesen oder Aussehen wählen (Einstellungen).', 'Choose another companion or look (settings).'), run: p.onChange },
        ...(p.showFeedback ? [{ id: 'fb', icon: <MessageCircle size={20} />, label: L('Kurz was an Boycie melden', 'Quick note to Boycie'), info: L('Eine kurze Rückmeldung zur App schicken.', 'Send a short note about the app.'), run: p.onFeedback, testId: 'companion-quick-feedback' }] : []),
      ],
    },
  ];
  return (
    <div className="companion-menu companion-menu--big animate-in" style={{ transform: `scale(${1 / p.scale})`, transformOrigin: 'bottom right', maxWidth: `calc(${p.scale} * min(360px, 100vw - 24px))` }} data-testid="companion-menu">
      <div className="companion-menu__head">
        <span className="companion-menu__title">{L('Was brauchst du?', 'What do you need?')}</span>
        <button type="button" onClick={() => setInfo(info === 'move' ? null : 'move')} aria-label={L('Info zum Verschieben', 'Info about moving')} className="companion-menu__i" aria-expanded={info === 'move'} data-testid="companion-menu-move-info"><Info size={17} /></button>
        <button onClick={p.onClose} aria-label={t.common.close} className="companion-menu__close"><X size={18} /></button>
      </div>
      {info === 'move' && <p className="companion-menu__info" data-testid="companion-menu-info">{t.companion.moveHint}</p>}
      <div className="companion-menu__scroll">
        {groups.map((g) => (
          <div key={g.title} className="companion-menu__group">
            <p className="companion-menu__group-title">{g.title}</p>
            {g.rows.map((r) => (
              <div key={r.id} className="companion-menu__row" style={r.accent ? { color: '#d4568b' } : undefined}>
                <div className="flex items-stretch">
                  <button type="button" onClick={r.run} className="companion-menu__item companion-menu__item--big flex-1" data-testid={r.testId} style={r.accent ? { color: '#d4568b' } : undefined}>
                    {r.icon}
                    <span>{r.label}</span>
                  </button>
                  <button type="button" onClick={() => setInfo(info === r.id ? null : r.id)} aria-label={L('Was ist das?', 'What is this?')} aria-expanded={info === r.id} className="companion-menu__i" data-testid={`companion-info-${r.id}`}><Info size={17} /></button>
                </div>
                {info === r.id && <p className="companion-menu__info" data-testid="companion-menu-info">{r.info}</p>}
              </div>
            ))}
          </div>
        ))}
      </div>
      <Link to="/einstellungen/wesen-info" onClick={p.onClose} className="companion-menu__more">{t.companion.whatCanIDoLink}</Link>
    </div>
  );
}
