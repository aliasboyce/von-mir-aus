import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Card } from '../../components/ui/Card';
import { useT } from '../../i18n';
import { BODY_SENSATIONS_DE } from '../zugang/zugangContent';
import { colorForSensation } from '../zugang/sensationZones';
import { BodySilhouette } from './BodySilhouette';
import { SourceNoteCard } from '../../components/shared/SourceNoteCard';

/**
 * Priority 3 + Priority 15 of the "Verbinden, glätten" brief — Zugang's
 * body-sensation step, browsable on its own, extended into a fuller
 * explainer page. Still uses the exact same list (BODY_SENSATIONS_DE)
 * rather than a second, separately maintained one.
 */
export function BodyAwarenessReferencePage() {
  const t = useT();
  const navigate = useNavigate();

  return (
    <div className="animate-in">
      <TopBar onBack={() => navigate(-1)} action={<HelpButton helpKey="koerperwahrnehmung" />} />
      <div className="px-5 pb-8">
        <h1 className="text-[24px] mb-1">{t.bodyAwarenessRef.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-5 leading-relaxed">{t.bodyAwarenessRef.subtitle}</p>

        <Card className="mb-4">
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.bodyAwarenessRef.whatTitle}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.bodyAwarenessRef.whatText}</p>
        </Card>

        <Card className="mb-4">
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.bodyAwarenessRef.whyNoticeTitle}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.bodyAwarenessRef.whyNoticeText}</p>
        </Card>

        <Card className="mb-4">
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.bodyAwarenessRef.connectionTitle}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.bodyAwarenessRef.connectionText}</p>
        </Card>

        <Card className="mb-6" style={{ background: 'var(--color-primary-soft)' }}>
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.bodyAwarenessRef.tryTitle}</p>
          <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{t.bodyAwarenessRef.tryText}</p>
        </Card>

        <Card className="mb-6">
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-1 text-center">{t.bodyAwarenessRef.silhouetteTitle}</p>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-4 text-center">{t.bodyAwarenessRef.silhouetteHint}</p>
          <BodySilhouette />
        </Card>

        <p className="text-[12px] text-[var(--color-text-faint)] mb-3">{t.bodyAwarenessRef.listLabel}</p>
        <div className="flex flex-wrap gap-2">
          {BODY_SENSATIONS_DE.map((s) => {
            const color = colorForSensation(s);
            return (
              <span
                key={s}
                className="px-3 py-2 rounded-full text-[13px]"
                style={color ? { background: `${color}18`, color, border: `1.5px solid ${color}` } : { background: 'var(--color-surface-muted)', color: 'var(--color-text)' }}
              >
                {s}
              </span>
            );
          })}
        </div>

        <p className="text-[12px] text-[var(--color-text-faint)] mt-6 leading-relaxed">{t.bodyAwarenessRef.footerNote}</p>
        <SourceNoteCard text={t.bodyAwarenessRef.sourceNote} />
      </div>
    </div>
  );
}
