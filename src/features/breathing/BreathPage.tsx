import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Sparkles } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Card } from '../../components/ui/Card';
import { useSettings } from '../../state/SettingsContext';
import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { BREATH_PATTERNS, hasHolds, type BreathPattern, type BreathVisual, type Evidence } from './breathPatterns';
import { BreathGuide, type BreathOptions } from './BreathGuide';

const TXT = {
  de: {
    title: 'Atmen',
    sub: 'Ein Kreis, eine Welle oder ein Quadrat zeigt dir den Atem – und das Wesen atmet mit.',
    intro: 'Such dir etwas aus, das sich gerade okay anfühlt. Alles ist ein Angebot: Du kannst jederzeit aufhören, die Augen offen lassen und die Halte-Pausen weglassen. Wenn Atmen sich gerade unangenehm anfühlt, ist das ein ernstzunehmendes Signal – dann gibt es unten andere Wege.',
    start: 'Starten',
    options: 'Einstellungen',
    minutes: 'Dauer',
    min: 'Min.',
    visual: 'Anzeige',
    circle: 'Kreis',
    wave: 'Welle',
    box: 'Quadrat',
    vibration: 'Mitvibrieren',
    vibrationNote: 'Kleine Impulse: schneller beim Einatmen, langsamer beim Ausatmen. Auf dem iPhone gibt es oft keine – dort hilft Bild und Ton.',
    tone: 'Sanfter Ton',
    skipHolds: 'Halte-Pausen weglassen',
    evidence: { good: 'Gut untersucht', some: 'Teilweise belegt', little: 'Wenig belegt' } as Record<Evidence, string>,
    how: 'So geht es',
    alt: 'Wenn Atmen gerade nicht passt',
    altText: 'Atmen ist nur ein Weg. Manchmal hilft etwas anderes mehr:',
    altBody: 'Den Körper bewegen oder spüren',
    altSkills: 'Alle Skills ansehen',
    saved: 'Wird nach dem Üben als Skill im Rückblick vermerkt.',
  },
  en: {
    title: 'Breathing',
    sub: 'A circle, a wave or a square shows you the breath – and the Wesen breathes along.',
    intro: 'Pick something that feels okay right now. Everything is an offer: you can stop any time, keep your eyes open and leave out the holds. If breathing feels unpleasant right now, take that seriously – there are other ways below.',
    start: 'Start',
    options: 'Settings',
    minutes: 'Length',
    min: 'min',
    visual: 'Display',
    circle: 'Circle',
    wave: 'Wave',
    box: 'Square',
    vibration: 'Vibrate along',
    vibrationNote: 'Small pulses: faster while breathing in, slower while breathing out. iPhones often have none – picture and tone help there.',
    tone: 'Soft tone',
    skipHolds: 'Leave out the holds',
    evidence: { good: 'Well studied', some: 'Partly supported', little: 'Little evidence' } as Record<Evidence, string>,
    how: 'How it goes',
    alt: 'If breathing does not fit right now',
    altText: 'Breathing is only one way. Sometimes something else helps more:',
    altBody: 'Move or feel the body',
    altSkills: 'See all skills',
    saved: 'After practising it is noted as a skill in the review.',
  },
};

const prefs = createKeyValueStore<Partial<Record<string, Partial<BreathOptions>>>>('breath-prefs', {});

const EVIDENCE_COLOR: Record<Evidence, string> = {
  good: 'var(--color-primary)',
  some: 'var(--color-accent-sun)',
  little: 'var(--color-text-faint)',
};

function optionsFor(p: BreathPattern): BreathOptions {
  const saved = prefs.get()[p.id] ?? {};
  return {
    minutes: saved.minutes ?? p.defaultMinutes,
    visual: saved.visual ?? p.defaultVisual,
    vibration: saved.vibration ?? false,
    tone: saved.tone ?? false,
    skipHolds: saved.skipHolds ?? false,
  };
}

/** `/entdecken/atmen` – breathing patterns as guided, visual (and optionally tactile) exercises. */
export function BreathPage({ initialId, embedded }: { initialId?: string; embedded?: boolean }) {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const L = en ? TXT.en : TXT.de;
  const [openId, setOpenId] = useState<string | null>(initialId ?? null);
  const [running, setRunning] = useState<{ pattern: BreathPattern; options: BreathOptions } | null>(null);
  const [opts, setOpts] = useState<Record<string, BreathOptions>>(() => Object.fromEntries(BREATH_PATTERNS.map((p) => [p.id, optionsFor(p)])));

  function patch(id: string, change: Partial<BreathOptions>) {
    setOpts((o) => {
      const next = { ...o, [id]: { ...o[id], ...change } };
      prefs.set({ ...prefs.get(), [id]: next[id] });
      return next;
    });
  }

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-[13px] border transition-colors ${active ? 'text-white border-transparent' : 'text-[var(--color-text-muted)] border-[var(--color-border-strong)]'}`;

  return (
    <div className="animate-in">
      {!embedded && <TopBar action={<HelpButton helpKey="atmen" />} />}
      <div className={embedded ? '' : 'px-5 pb-10'}>
      {!embedded && (
        <>
          <h1 className="text-[22px] font-light mb-1" data-testid="breath-title">{L.title}</h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mb-3">{L.sub}</p>
        </>
      )}
      <p className="text-[13.5px] text-[var(--color-text-muted)] leading-relaxed mb-4" data-hint>{L.intro}</p>

      <div className="flex flex-col gap-3">
        {BREATH_PATTERNS.map((p) => {
          const o = opts[p.id];
          const open = openId === p.id;
          return (
            <Card key={p.id} className="!p-0 overflow-hidden" data-testid={`breath-card-${p.id}`}>
              <button type="button" onClick={() => setOpenId(open ? null : p.id)} aria-expanded={open} className="w-full text-left p-4 flex items-start gap-3">
                <span className="text-[26px] leading-none mt-0.5" aria-hidden="true">{p.emoji}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] text-[var(--color-text)]">{en ? p.titleEn : p.title}</span>
                  <span className="block text-[13px] text-[var(--color-text-muted)]">{en ? p.shortEn : p.short}</span>
                </span>
                <span className="text-[11px] mt-1 px-2 py-0.5 rounded-full border whitespace-nowrap" style={{ color: EVIDENCE_COLOR[p.evidence], borderColor: EVIDENCE_COLOR[p.evidence] }}>
                  {L.evidence[p.evidence]}
                </span>
              </button>
              {open && (
                <div className="px-4 pb-4 pt-0 flex flex-col gap-3 animate-in">
                  <div>
                    <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-0.5">{L.how}</p>
                    <p className="text-[13.5px] text-[var(--color-text)] leading-relaxed">{en ? p.howEn : p.how}</p>
                    <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed mt-1.5">{en ? p.evidenceNoteEn : p.evidenceNote}</p>
                  </div>

                  <div>
                    <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{L.minutes}</p>
                    <div className="flex gap-2 flex-wrap">
                      {[1, 2, 3, 5].map((m) => (
                        <button key={m} type="button" onClick={() => patch(p.id, { minutes: m })} className={chip(o.minutes === m)} style={o.minutes === m ? { background: 'var(--color-primary)' } : undefined} data-testid={`breath-min-${p.id}-${m}`}>
                          {m} {L.min}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{L.visual}</p>
                    <div className="flex gap-2 flex-wrap">
                      {(['circle', 'wave', ...(hasHolds(p) && !o.skipHolds ? ['box'] : [])] as BreathVisual[]).map((v) => (
                        <button key={v} type="button" onClick={() => patch(p.id, { visual: v })} className={chip(o.visual === v)} style={o.visual === v ? { background: 'var(--color-primary)' } : undefined} data-testid={`breath-visual-${p.id}-${v}`}>
                          {L[v]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-2 text-[13.5px] text-[var(--color-text)]">
                      <input type="checkbox" checked={o.vibration} onChange={(e) => patch(p.id, { vibration: e.target.checked })} data-testid={`breath-vib-${p.id}`} />
                      {L.vibration}
                    </label>
                    {o.vibration && <p className="text-[12px] text-[var(--color-text-faint)] pl-6">{L.vibrationNote}</p>}
                    <label className="flex items-center gap-2 text-[13.5px] text-[var(--color-text)]">
                      <input type="checkbox" checked={o.tone} onChange={(e) => patch(p.id, { tone: e.target.checked })} />
                      {L.tone}
                    </label>
                    {hasHolds(p) && (
                      <label className="flex items-center gap-2 text-[13.5px] text-[var(--color-text)]">
                        <input type="checkbox" checked={o.skipHolds} onChange={(e) => patch(p.id, { skipHolds: e.target.checked, visual: e.target.checked && o.visual === 'box' ? 'circle' : o.visual })} data-testid={`breath-skip-${p.id}`} />
                        {L.skipHolds}
                      </label>
                    )}
                  </div>

                  <button type="button" onClick={() => setRunning({ pattern: p, options: o })} className="self-start px-6 py-2.5 rounded-full text-[14px] text-white" style={{ background: 'var(--color-primary)' }} data-testid={`breath-start-${p.id}`}>
                    {L.start}
                  </button>
                  <p className="text-[11.5px] text-[var(--color-text-faint)]">{L.saved}</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-6">
        <p className="text-[14px] text-[var(--color-text)] mb-1">{L.alt}</p>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-2">{L.altText}</p>
        <div className="flex flex-col gap-2">
          <Link to="/entdecken/koerper" className="flex items-center gap-2 text-[13.5px] text-[var(--color-primary)]"><Activity size={15} />{L.altBody}</Link>
          <Link to="/entdecken/ressourcen/skills" className="flex items-center gap-2 text-[13.5px] text-[var(--color-primary)]"><Sparkles size={15} />{L.altSkills}</Link>
        </div>
      </div>

      </div>
      {running && <BreathGuide pattern={running.pattern} options={running.options} onClose={() => setRunning(null)} />}
    </div>
  );
}

