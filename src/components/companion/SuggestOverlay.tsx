import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X, RefreshCw, ArrowRight } from 'lucide-react';
import { InlineCompanionNote } from './InlineCompanionNote';
import { WesenInfoButton } from './WesenInfoButton';
import { INFO_SUGGEST } from './wesenFunctions';
import { SUGGEST_IDEAS, SKILL_TEMPLATES, RESOURCE_TEMPLATES, BRIDGE_TEMPLATES, CONTACT_TEMPLATES, ROUTINE_TEMPLATES, NEW_SKILL_TEMPLATES, NEW_RESOURCE_TEMPLATES, NEW_BRIDGE_TEMPLATES, NEW_CONTACT_TEMPLATES, NEW_ROUTINE_TEMPLATES, type SuggestIdea } from './suggestIdeas';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { useRegisterModalOpen } from '../../state/ModalStackContext';
import { triggerHaptic } from '../../services/haptics';
import { resourcesRepo } from '../../features/resources/resourcesRepo';
import { bridgesRepo } from '../../features/bridges/bridgesRepo';
import { networkRepo } from '../../features/safetyNet/networkRepo';
import { routinesRepo } from '../../features/routines/routinesRepo';
import { RESOURCE_CATEGORY_TO_GROUP } from '../../features/resources/resourceMeta';
import { cautionFor } from '../../services/skillCaution';

const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];

/** Baut den Vorschlags-Pool: feste Ideen aus allen Funktionen + Ideen, die deine eigenen Einträge aufgreifen. */
function buildPool(): SuggestIdea[] {
  const pool: SuggestIdea[] = [...SUGGEST_IDEAS];
  const clean = (s: string) => s.replace(/[„“”"]/g, '').replace(/\s*\([^)]*\)\s*$/, '').trim();
  const fill = (tpl: { de: string; en: string }, raw: string) => {
    const x = clean(raw) || raw;
    return { de: tpl.de.replace('{x}', x), en: tpl.en.replace('{x}', x) };
  };
  try {
    const res = resourcesRepo.getAll().filter((r) => r.title?.trim());
    // Skills: nur ohne „Vorsicht“-Hinweis, damit nichts Körperlich-Intensives beiläufig vorgeschlagen wird
    const skills = res.filter((r) => RESOURCE_CATEGORY_TO_GROUP[r.category as keyof typeof RESOURCE_CATEGORY_TO_GROUP] === 'faehigkeiten' && !cautionFor(r, 'de'));
    const others = res.filter((r) => RESOURCE_CATEGORY_TO_GROUP[r.category as keyof typeof RESOURCE_CATEGORY_TO_GROUP] !== 'faehigkeiten');
    // Selbst angelegte Einträge (nicht aus den Beispielen) kommen öfter dran: je zwei Ideen pro Eintrag, die neuesten zuerst.
    const madeByUser = (id: string) => /^[a-z]+_[0-9a-z]{7,9}_[0-9a-z]{6}$/.test(id);
    const newestFirst = <T extends { createdAt?: string }>(a: T[]) => [...a].sort((x, y) => (y.createdAt ?? '').localeCompare(x.createdAt ?? ''));
    const preferred = <T extends { id: string; favorite?: boolean }>(a: T[]) => (a.some((x) => x.favorite) ? a.filter((x) => x.favorite || madeByUser(x.id)) : a);
    const add = (area: string, to: string, title: string, std: { de: string; en: string }[], mine: { de: string; en: string }[], own: boolean) => {
      pool.push({ area, to, ...fill(pick(std), title) } as SuggestIdea);
      if (own) {
        pool.push({ area, to, ...fill(pick(mine), title) } as SuggestIdea);
        pool.push({ area, to, ...fill(pick(mine), title) } as SuggestIdea);
      }
    };
    const mineFirst = <T extends { id: string; createdAt?: string }>(a: T[]) => [...newestFirst(a.filter((x) => madeByUser(x.id))), ...a.filter((x) => !madeByUser(x.id))];
    mineFirst(preferred(skills)).slice(0, 40).forEach((r) => add('skill', `/entdecken/ressourcen/skill-start/${r.id}`, r.title, SKILL_TEMPLATES, NEW_SKILL_TEMPLATES, madeByUser(r.id)));
    mineFirst(preferred(others)).slice(0, 40).forEach((r) => add('ressource', `/entdecken/ressourcen?open=${r.id}`, r.title, RESOURCE_TEMPLATES, NEW_RESOURCE_TEMPLATES, madeByUser(r.id)));
    bridgesRepo.getAll().slice(0, 30).forEach((b) => add('bruecke', `/bruecken/${b.id}`, b.title, BRIDGE_TEMPLATES, NEW_BRIDGE_TEMPLATES, !!b.isCustom));
    networkRepo.getAll().filter((e) => !e.isExample && e.category === 'person').slice(0, 20).forEach((e) => add('netz', `/sicherheit/netzwerk?open=${e.id}`, e.name, CONTACT_TEMPLATES, NEW_CONTACT_TEMPLATES, true));
    routinesRepo.getAll().filter((r) => !r.isExample).slice(0, 10).forEach((r) => add('routine', `/entdecken/routinen/${r.id}/start`, r.title, ROUTINE_TEMPLATES, NEW_ROUTINE_TEMPLATES, true));
  } catch {
    // eigene Einträge nicht lesbar – dann bleiben die festen Ideen
  }
  return pool;
}

/**
 * „Schlag mir was vor“: das Wesen macht einen kleinen, zufälligen Vorschlag aus allen Funktionen der App.
 * „Direkt tun“ führt dorthin, „Noch eine Idee“ würfelt neu, „Das passt gerade nicht“ ist immer möglich.
 * Nichts wird gespeichert oder mitgezählt.
 */
export function SuggestOverlay({ onClose }: { onClose: () => void }) {
  const t = useT();
  useRegisterModalOpen(true);
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const pool = useMemo(buildPool, []);
  const seen = useRef<Set<number>>(new Set());
  const [declined, setDeclined] = useState(false);

  function next(): number {
    if (seen.current.size >= pool.length) seen.current.clear();
    let idx = 0;
    for (let n = 0; n < 40; n++) {
      idx = Math.floor(Math.random() * pool.length);
      if (!seen.current.has(idx)) break;
    }
    seen.current.add(idx);
    return idx;
  }
  const [idx, setIdx] = useState(next);
  const idea = pool[idx];
  const text = en ? idea.en : idea.de;
  const long = text.length > 110;
  const veryLong = text.length > 260;

  return createPortal(
    <div className="fixed inset-0 z-[240] bg-[var(--color-bg)] flex flex-col items-center px-6 py-14 overflow-y-auto animate-in no-print" role="dialog" aria-modal="true" aria-label={en ? INFO_SUGGEST.title.en : INFO_SUGGEST.title.de} data-testid="suggest-overlay">
      <div className="absolute flex gap-2" style={{ top: 'max(20px, env(safe-area-inset-top))', right: 20 }}>
        <WesenInfoButton info={INFO_SUGGEST} />
        <button onClick={onClose} aria-label={t.common.close} className="w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center">
          <X size={20} />
        </button>
      </div>

      <InlineCompanionNote />
      <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mt-5 mb-3">{en ? INFO_SUGGEST.title.en : INFO_SUGGEST.title.de}</p>

      {declined ? (
        <div className="text-center animate-in" data-testid="suggest-declined">
          <p className="text-[19px] text-[var(--color-text)] leading-relaxed max-w-[290px] mb-6">{en ? 'That is okay. Nothing has to fit right now. I am still here.' : 'Das ist in Ordnung. Es muss gerade nichts passen. Ich bin trotzdem da.'}</p>
          <button onClick={onClose} className="px-5 py-2.5 rounded-full text-[14px] bg-[var(--color-primary)] text-[var(--color-surface)]">{t.common.close}</button>
        </div>
      ) : (
        <>
          <p data-testid="suggest-line" data-area={idea.area} className={`${veryLong ? 'text-[15.5px] text-left whitespace-pre-line' : long ? 'text-[18px] text-center' : 'text-[22px] text-center'} text-[var(--color-text)] max-w-[320px] leading-snug mt-2 mb-8`} style={{ fontFamily: 'var(--font-companion)', fontWeight: 600 }}>
            {text}
          </p>
          <div className="flex flex-col items-center gap-3 w-full max-w-[290px]">
            {(idea.choices ?? [{ de: 'Direkt tun', en: 'Do it now', to: idea.to }]).map((c, n) => (
              <Link
                key={c.to}
                to={c.to}
                onClick={() => {
                  triggerHaptic('settle', settings);
                  onClose();
                }}
                className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full text-[15px] bg-[var(--color-primary)] text-[var(--color-surface)]"
                data-testid={n === 0 ? 'suggest-go' : `suggest-go-${n}`}
              >
                {en ? c.en : c.de} <ArrowRight size={16} />
              </Link>
            ))}
            <button onClick={() => setIdx(next())} className="flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-full text-[14px] bg-[var(--color-surface-muted)] text-[var(--color-text)]" data-testid="suggest-next">
              <RefreshCw size={14} /> {en ? 'Another idea' : 'Noch eine Idee'}
            </button>
            <button onClick={() => setDeclined(true)} className="text-[13px] text-[var(--color-text-faint)] underline mt-1" data-testid="suggest-decline">
              {en ? 'That does not fit right now' : 'Das passt gerade nicht'}
            </button>
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
