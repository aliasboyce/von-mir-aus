import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useT } from '../../i18n';
import { SourceNoteCard } from '../../components/shared/SourceNoteCard';
import { AROUSAL_BANDS } from './arousalBands';

/**
 * "Uebersichtlicher strukturieren, nicht doppelt"-Auftrag — renders
 * each of the six zones as a small colored card (range + label +
 * description) pulled from the SAME AROUSAL_BANDS/arousalZones data
 * the slider itself uses, instead of a second, separately-worded
 * list. One structured source of truth, two presentations.
 *
 * "Erklaer's mir als..."-Auftrag — three depth levels on top of that
 * same standard content: a child-friendly story and a clinical/
 * technical version, both kept close to the person's own original
 * wording (only reformatted into paragraphs, with **bold** lead-ins
 * rendered properly), for anyone who wants either a gentler or a more
 * precise read than the standard explanation.
 */
function renderBold(text: string, keyPrefix: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold text-[var(--color-text)]">
        {part}
      </strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    ),
  );
}

export function ArousalModelExplainer() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<'simple' | 'standard' | 'clinical'>('standard');

  const levelContent = level === 'simple' ? t.polyvagal.arousalLevelSimple : level === 'clinical' ? t.polyvagal.arousalLevelClinical : null;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] mb-4">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left">
        <span className="text-[13px] font-medium text-[var(--color-text)]">{t.polyvagal.arousalExplainerTitle}</span>
        <ChevronDown size={16} className="text-[var(--color-text-faint)] flex-shrink-0" style={{ transform: open ? 'rotate(180deg)' : undefined }} />
      </button>
      {open && (
        <div className="px-4 pb-4 animate-in">
          <div className="flex gap-1.5 mb-4">
            {(['simple', 'standard', 'clinical'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className="px-3 py-1.5 rounded-full text-[12px]"
                style={{
                  background: level === l ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                  color: level === l ? 'var(--color-surface)' : 'var(--color-text-muted)',
                }}
              >
                {t.polyvagal.arousalLevelTabs[l]}
              </button>
            ))}
          </div>

          {levelContent ? (
            <>
              {levelContent.title && <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{levelContent.title}</p>}
              {levelContent.paragraphs.map((para, i) => (
                <p key={i} className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3" style={{ whiteSpace: 'pre-line' }}>
                  {renderBold(para, `p${i}`)}
                </p>
              ))}
            </>
          ) : (
            <>
              {t.polyvagal.arousalExplainerIntro.split('\n\n').map((para, i) => (
                <p key={i} className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">
                  {para}
                </p>
              ))}

              <p className="text-[12px] font-medium text-[var(--color-text-faint)] uppercase tracking-wide mt-4 mb-2">
                {t.polyvagal.arousalExplainerWindowTitle}
              </p>
              <div className="flex flex-col gap-2 mb-4">
                {AROUSAL_BANDS.filter((b) => b.inWindow).map((b) => {
                  const zoneT = t.polyvagal.arousalZones[b.labelKey as keyof typeof t.polyvagal.arousalZones];
                  return (
                    <div key={b.id} className="flex gap-3 p-2.5 rounded-[var(--radius-md)]" style={{ background: `${b.color}14` }}>
                      <span className="flex-shrink-0 text-[11px] font-medium px-2 py-1 rounded-full h-fit" style={{ background: b.color, color: '#fff' }}>
                        {b.min}–{b.max}%
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[var(--color-text)]">{zoneT.label}</p>
                        <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed">{zoneT.hint}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[12px] font-medium text-[var(--color-text-faint)] uppercase tracking-wide mt-4 mb-2">
                {t.polyvagal.arousalExplainerDysregTitle}
              </p>
              <div className="flex flex-col gap-2">
                {AROUSAL_BANDS.filter((b) => !b.inWindow).map((b) => {
                  const zoneT = t.polyvagal.arousalZones[b.labelKey as keyof typeof t.polyvagal.arousalZones];
                  return (
                    <div key={b.id} className="flex gap-3 p-2.5 rounded-[var(--radius-md)]" style={{ background: `${b.color}14` }}>
                      <span className="flex-shrink-0 text-[11px] font-medium px-2 py-1 rounded-full h-fit" style={{ background: b.color, color: '#fff' }}>
                        {b.min}–{b.max}%
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[var(--color-text)]">{zoneT.label}</p>
                        <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed">{zoneT.hint}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-4">
            <SourceNoteCard
              text={t.polyvagal.arousalSourcesTitle}
              sourceIds={[
                'welltory-window-of-tolerance',
                'durhamtherapy-window-of-tolerance',
                'treehouse-polyvagal-window',
                'boon-arousal-worksheet',
                'praxis-psychologie-berlin-window',
                'positivepsychology-toleranzfenster',
                'siegel-window-of-tolerance',
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
