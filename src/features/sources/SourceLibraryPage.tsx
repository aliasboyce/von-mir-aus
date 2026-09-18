import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Download } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { APP_SOURCES } from '../../data/sourcesLibrary';
import { triggerPrint } from '../../services/printSupport';
import { SourceLibraryPrintView } from './SourceLibraryPrintView';

/**
 * "Materialien"-Auftrag, Sections 17-21 — the global sources library.
 * Grouped by approach/model rather than shown as a flat list, so
 * someone can see at a glance "this is everything the app draws from
 * GFK" vs. "this is from ACT" etc. Each entry states what it's
 * actually used for in the app, not just a bare link — matching the
 * brief's explicit "nicht einfach rohe URLs überall hinschreiben".
 */
export function SourceLibraryPage() {
  const t = useT();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const clear = () => setPrinting(false);
    window.addEventListener('afterprint', clear);
    return () => window.removeEventListener('afterprint', clear);
  }, []);

  const grouped = APP_SOURCES.reduce<Record<string, typeof APP_SOURCES>>((acc, s) => {
    (acc[s.approach] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="animate-in">
      <TopBar onBack={() => navigate(-1)} />
      <div className="px-5 pb-8">
        <h1 className="text-[24px] mb-1">{t.sourceLibrary.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-1 leading-relaxed">{t.sourceLibrary.subtitle}</p>
        <p className="text-[12px] text-[var(--color-text-faint)] mb-3">
          {t.sourceLibrary.totalCountLabel.replace('{count}', String(APP_SOURCES.length))}
        </p>
        <button
          onClick={() => {
            setPrinting(true);
            window.setTimeout(() => triggerPrint(t.common.printStandaloneExplanation), 50);
          }}
          className="flex items-center gap-1.5 text-[12.5px] text-[var(--color-primary)] mb-6"
        >
          <Download size={14} />
          {t.sourceLibrary.exportCta}
        </button>

        {Object.entries(grouped).map(([approach, sources]) => (
          <div key={approach} className="mb-6">
            <p className="text-[13px] font-medium text-[var(--color-primary)] mb-2">{approach}</p>
            <div className="flex flex-col gap-2.5">
              {sources.map((s) => (
                <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer">
                  <Card interactive>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-[14px] text-[var(--color-text)] leading-snug">{s.title}</p>
                      <ExternalLink size={14} className="text-[var(--color-text-faint)] flex-shrink-0 mt-0.5" />
                    </div>
                    <p className="text-[12px] text-[var(--color-text-faint)] mb-1.5">{s.author}</p>
                    <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed mb-1.5">{s.description}</p>
                    <p className="text-[11px] text-[var(--color-text-faint)]">
                      {t.sourceLibrary.usedForLabel}: {s.usedFor}
                    </p>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        ))}

        <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mt-4">{t.sourceLibrary.disclaimer}</p>
      </div>

      {printing && (
        <SourceLibraryPrintView
          grouped={grouped}
          labels={{
            title: t.sourceLibrary.title,
            subtitle: t.sourceLibrary.subtitle,
            usedForLabel: t.sourceLibrary.usedForLabel,
            exportedOn: t.network.exportedOn,
          }}
          formatDate={(iso) => new Date(iso).toLocaleDateString(settings.language === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        />
      )}
    </div>
  );
}
