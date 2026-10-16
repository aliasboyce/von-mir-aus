import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useT } from '../../i18n';
import { useRegisterModalOpen } from '../../state/ModalStackContext';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';
import { OVERVIEW_GROUPS, type OverviewEntry } from './appOverviewData';

interface Intent {
  emoji: string;
  labelKey: 'auffangen' | 'orientieren' | 'handeln' | 'verstehen' | 'fuerMich' | 'erforschen' | 'lernen';
}

const INTENTS: Intent[] = [
  { emoji: '🫂', labelKey: 'auffangen' },
  { emoji: '🧭', labelKey: 'orientieren' },
  { emoji: '🧠', labelKey: 'verstehen' },
  { emoji: '🌿', labelKey: 'fuerMich' },
  { emoji: '👣', labelKey: 'handeln' },
  { emoji: '🔎', labelKey: 'erforschen' },
  { emoji: '📖', labelKey: 'lernen' },
];

/**
 * "ChatGPT-Konzept" brief — "Was möchte ich heute?" as a simple way to
 * structure the app's many functions by intent rather than by feature
 * name. Deliberately routes to existing destinations only — nothing
 * new is built here, this is purely a differently-shaped door into
 * what already exists (Krisenmodus, Grounding, Brücken, Zugang,
 * Garten, Entdecken), matching the brief's own explicit caution
 * against adding more modules.
 */
export function IntentPickerModal({ onClose, onOpenGrounding }: { onClose: () => void; onOpenGrounding: () => void }) {
  const t = useT();
  useRegisterModalOpen(true);
  const navigate = useNavigate();
  const { settings } = useSettings();
  const isEn = settings.language === 'en';
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openEntry, setOpenEntry] = useState<string | null>(null);

  function openOverview(e: OverviewEntry) {
    onClose();
    if (e.action === 'grounding') onOpenGrounding();
    else if (e.to) navigate(e.to);
  }

  function go(labelKey: Intent['labelKey']) {
    onClose();
    switch (labelKey) {
      case 'auffangen':
        navigate('/krisenmodus');
        return;
      case 'orientieren':
        onOpenGrounding();
        return;
      case 'handeln':
        navigate('/bruecken');
        return;
      case 'verstehen':
        navigate('/zugang');
        return;
      case 'fuerMich':
        navigate('/entdecken/ressourcen');
        return;
      case 'erforschen':
        navigate('/entdecken');
        return;
      case 'lernen':
        navigate('/entdecken/nervensystem');
        return;
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[230] bg-[rgba(44,42,34,0.35)] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-[var(--color-surface)] rounded-t-[24px] sm:rounded-[24px] w-full sm:max-w-[420px] max-h-[90vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[20px] text-[var(--color-text)] mb-2">{t.home.intentPickerTitle}</h2>
        <p className="text-[13.5px] text-[var(--color-text-muted)] leading-relaxed mb-5">{t.home.intentPickerIntro}</p>
        <div className="flex flex-col gap-2.5">
          {INTENTS.map((intent) => (
            <button
              key={intent.labelKey}
              onClick={() => go(intent.labelKey)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] text-left"
            >
              <span className="text-[22px] flex-shrink-0">{intent.emoji}</span>
              <span className="min-w-0">
                <span className="block text-[15px] text-[var(--color-text)]">{t.home.intentLabels[intent.labelKey]}</span>
                <span className="block text-[12.5px] leading-snug text-[var(--color-text-muted)] mt-0.5">{t.home.intentHints[intent.labelKey]}</span>
              </span>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full text-center text-[13px] text-[var(--color-text-muted)] py-2">
          {t.home.intentPickerNone}
        </button>

        {/* the complete overview: every page / function, by need, each expandable */}
        <div className="mt-5 pt-5 border-t border-[var(--color-border)]" data-testid="app-overview">
          <h3 className="text-[17px] text-[var(--color-text)] mb-1">{t.home.overviewTitle}</h3>
          <p data-hint className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed mb-4">{t.home.overviewIntro}</p>
          <div className="flex flex-col gap-2.5">
            {OVERVIEW_GROUPS.map((g) => {
              const open = openGroup === g.id;
              const gt = isEn ? g.en : g.de;
              return (
                <div key={g.id} className="rounded-[var(--radius-lg)] overflow-hidden" style={{ border: `1px solid ${g.color}55`, background: `color-mix(in srgb, var(--color-surface) 90%, ${g.color} 8%)` }}>
                  <button
                    type="button"
                    onClick={() => setOpenGroup(open ? null : g.id)}
                    aria-expanded={open}
                    className="w-full flex items-center gap-3 px-3.5 py-3 text-left"
                  >
                    <span className="w-9 h-9 rounded-full flex items-center justify-center text-[18px] flex-shrink-0" style={{ background: `${g.color}2e` }} aria-hidden="true">{g.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14.5px] text-[var(--color-text)]">{gt.title}</span>
                      <span className="block text-[11.5px] text-[var(--color-text-faint)]">{gt.hint} · {g.entries.length}</span>
                    </span>
                    <ChevronDown size={16} className="flex-shrink-0 text-[var(--color-text-faint)]" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
                  </button>
                  {open && (
                    <ul className="px-2.5 pb-2.5 flex flex-col gap-1.5">
                      {g.entries.map((e) => {
                        const eOpen = openEntry === `${g.id}:${e.id}`;
                        const et = isEn ? e.en : e.de;
                        return (
                          <li key={e.id} className="rounded-[var(--radius-md)] bg-[var(--color-surface)]" style={{ border: `1px solid ${g.color}33` }}>
                            <button
                              type="button"
                              onClick={() => setOpenEntry(eOpen ? null : `${g.id}:${e.id}`)}
                              aria-expanded={eOpen}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
                            >
                              <span className="text-[18px] flex-shrink-0" aria-hidden="true">{e.emoji}</span>
                              <span className="flex-1 min-w-0 text-[14px] text-[var(--color-text)]">{et.title}</span>
                              <ChevronDown size={14} className="flex-shrink-0 text-[var(--color-text-faint)]" style={{ transform: eOpen ? 'rotate(180deg)' : 'none' }} />
                            </button>
                            {eOpen && (
                              <div className="px-3 pb-3">
                                <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed">{et.text}</p>
                                <button type="button" onClick={() => openOverview(e)} className="mt-2 text-[13px] text-[var(--color-primary)]">
                                  {t.home.overviewOpen} →
                                </button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
