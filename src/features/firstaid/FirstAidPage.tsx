import { useState } from 'react';
import { ChevronLeft, ChevronDown, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../state/SettingsContext';
import { goBack } from '../../services/navigation';
import { FA_NODES, FA_START, FA_RULE, FA_PRINCIPLE, FA_SOURCES, type Bi } from './firstAidData';

/**
 * „Erste-Hilfe-Maßnahmen“: Schritt für Schritt, immer nur der nächste Schritt – groß, ruhig, gut lesbar.
 * Die Auswahl führt zum passenden nächsten Schritt (z. B. bewusstlos + atmet normal → stabile Seitenlage).
 * Oben bleibt dauerhaft sichtbar: Prüfen – Rufen – Handeln · Eigenschutz geht vor · 112.
 */
export function FirstAidPage() {
  const en = useSettings().settings.language === 'en';
  const reduce = !!useSettings().settings.reduceMotion;
  const navigate = useNavigate();
  const [trail, setTrail] = useState<string[]>([FA_START]);
  const [showSources, setShowSources] = useState(false);
  const id = trail[trail.length - 1];
  const node = FA_NODES[id];
  const tx = (b: Bi) => (en ? b.en : b.de);

  function go(to: string) {
    setTrail((t) => [...t, to]);
    window.scrollTo({ top: 0 });
  }
  function back() {
    if (trail.length > 1) { setTrail((t) => t.slice(0, -1)); window.scrollTo({ top: 0 }); } else goBack(navigate);
  }

  return (
    <div className="min-h-dvh flex flex-col px-5 pt-5 pb-10" data-testid="firstaid-page" data-node={id}>
      <div className="flex items-center justify-between mb-3">
        <button onClick={back} aria-label={en ? 'Back' : 'Zurück'} data-testid="firstaid-back" className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]">
          <ChevronLeft size={24} />
        </button>
        <a href="tel:112" data-testid="firstaid-112" className="flex items-center gap-2 rounded-full px-4 py-2.5 text-[15px] font-semibold" style={{ background: 'var(--color-accent-clay)', color: '#fff' }}>
          <Phone size={17} /> 112
        </a>
      </div>

      <div className="rounded-[var(--radius-lg)] px-4 py-3 mb-5 text-center" style={{ background: 'var(--color-primary-soft)', border: '1px solid var(--color-border)' }} data-testid="firstaid-rule">
        <p className="text-[15px] font-semibold text-[var(--color-text)]">{tx(FA_RULE)}</p>
        <p className="text-[13px] text-[var(--color-text-muted)]">{tx(FA_PRINCIPLE)}</p>
      </div>

      <div key={id} className="flex-1 flex flex-col animate-in">
        <p className="text-[52px] leading-none text-center mb-3" aria-hidden="true">{node.emoji}</p>
        <h1 className="text-[28px] leading-tight font-semibold text-center mb-5" data-testid="firstaid-title">{tx(node.title)}</h1>

        {node.calm && <p className="text-[16px] leading-relaxed text-center text-[var(--color-text-muted)] mb-4">{tx(node.calm)}</p>}

        {node.lines && (
          <ul className="flex flex-col gap-3 mb-4">
            {node.lines.map((l, i) => (
              <li key={i} className="rounded-[var(--radius-lg)] px-4 py-3.5 text-[19px] leading-snug text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)]">
                {tx(l)}
              </li>
            ))}
          </ul>
        )}

        {node.pulse && (
          <div className="flex flex-col items-center my-3" data-testid="firstaid-pulse">
            <span aria-hidden="true" className="w-16 h-16 rounded-full" style={{ background: 'var(--color-accent-clay)', animation: reduce ? undefined : 'fa-beat 0.545s ease-in-out infinite' }} />
            <style>{'@keyframes fa-beat{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.18);opacity:1}}'}</style>
            <p className="text-[13px] text-[var(--color-text-faint)] mt-2">{en ? 'about 110 per minute' : 'ca. 110 pro Minute'}</p>
          </div>
        )}

        {node.warn && (
          <p className="rounded-[var(--radius-lg)] px-4 py-3.5 text-[17px] leading-snug font-semibold mb-4" style={{ background: 'color-mix(in srgb, var(--color-accent-clay) 16%, var(--color-surface))', border: '1.5px solid var(--color-accent-clay)', color: 'var(--color-text)' }}>
            {tx(node.warn)}
          </p>
        )}

        {node.call && (
          <a href="tel:112" data-testid="firstaid-call" className="flex items-center justify-center gap-3 rounded-[var(--radius-lg)] py-4 mb-4 text-[20px] font-semibold" style={{ background: 'var(--color-accent-clay)', color: '#fff' }}>
            <Phone size={22} /> {en ? 'Call 112' : '112 anrufen'}
          </a>
        )}

        <div className="mt-auto flex flex-col gap-3 pt-2">
          {node.choices?.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(c.to)}
              data-testid={`firstaid-choice-${i}`}
              className="w-full min-h-[64px] rounded-[var(--radius-lg)] px-4 py-3 text-[19px] font-semibold leading-snug text-center"
              style={c.tone === 'danger'
                ? { background: 'var(--color-primary)', color: 'var(--color-surface)' }
                : { background: 'var(--color-surface)', color: 'var(--color-text)', border: '2px solid var(--color-primary)' }}
            >
              {tx(c.label)}
            </button>
          ))}
          {node.next && (
            <button type="button" onClick={() => go(node.next!)} data-testid="firstaid-next" className="w-full min-h-[64px] rounded-[var(--radius-lg)] px-4 py-3 text-[20px] font-semibold" style={{ background: 'var(--color-primary)', color: 'var(--color-surface)' }}>
              {tx(node.nextLabel ?? { de: 'Weiter', en: 'Next' })}
            </button>
          )}
          {node.end && (
            <button type="button" onClick={() => setTrail([FA_START])} data-testid="firstaid-restart" className="w-full min-h-[56px] rounded-[var(--radius-lg)] px-4 py-3 text-[17px] font-semibold" style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '2px solid var(--color-primary)' }}>
              {en ? 'Back to the start' : 'Zurück zum Anfang'}
            </button>
          )}
        </div>
      </div>

      {(id === FA_START || node.end) && (
        <div className="mt-6">
          <button type="button" onClick={() => setShowSources((v) => !v)} aria-expanded={showSources} data-testid="firstaid-sources-toggle" className="flex items-center gap-1.5 mx-auto text-[13px] text-[var(--color-text-faint)] underline underline-offset-2 py-2">
            <ChevronDown size={14} style={{ transform: showSources ? 'rotate(180deg)' : undefined }} /> {en ? 'Sources' : 'Quellen'}
          </button>
          {showSources && (
            <div className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mt-1" data-testid="firstaid-sources">
              <p className="mb-2">{en ? 'Based on the recommendations of:' : 'Nach den Empfehlungen von:'}</p>
              <ul className="flex flex-col gap-2">
                {FA_SOURCES.map((s) => (
                  <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-[var(--color-primary)]">{s.name}</a></li>
                ))}
              </ul>
              <p className="mt-3 text-[12px] text-[var(--color-text-faint)]">{en ? 'This does not replace a first-aid course or an emergency call.' : 'Das ersetzt keinen Erste-Hilfe-Kurs und keinen Notruf.'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
