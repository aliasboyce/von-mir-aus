import { useT } from '../../i18n';
import { useL } from '../projects/useL';
import { useFitFilter } from '../../state/fitFilterStore';
import { FitSummary } from '../../components/shared/FitSummary';
import { ACCESS_CHANNEL_META } from '../zugangskanaele/accessChannels';
import { channelStatus, isFitFilterActive, stepClashes, type FitSubject } from '../../content/fitCriteria';

/**
 * "Welche Zugangskanäle braucht dieser Schritt?"-Auftrag — what one Brücke step
 * asks for (time, energy, channels, effort) and, if the person has said what is
 * missing right now, which of the step's channels are there and which are not.
 * Never blocks anything: a step that does not fit is only said so, gently.
 */
export function BridgeStepNeeds({ subject }: { subject: FitSubject }) {
  const t = useT();
  const { L } = useL();
  const { filter } = useFitFilter();
  const status = channelStatus(subject.channels, filter.levels);
  const clash = isFitFilterActive(filter) && stepClashes(subject, filter);
  const hasChannels = (subject.channels?.length ?? 0) > 0;
  const hasAny = hasChannels || subject.fit;
  if (!hasAny) return null;
  return (
    <div className="mt-1.5 flex flex-col gap-1.5" data-testid="step-needs">
      <FitSummary subject={{ ...subject, energy: undefined }} />
      {hasChannels && filter.levels !== null && (
        <p className="text-[11.5px] leading-snug" style={{ color: 'var(--color-text-muted)' }} data-testid="step-channel-status">
          {status.there.length > 0 && (
            <span>{L('Gerade da', 'There now')}: {status.there.map((c) => t.zugangskanaele.short[c]).join(', ')}. </span>
          )}
          {status.missing.length > 0 && (
            <span style={{ opacity: 0.75 }}>
              {L('Gerade grau', 'Greyed right now')}: {status.missing.map((c) => ACCESS_CHANNEL_META[c].label(t)).join(', ')}.
            </span>
          )}
        </p>
      )}
      {clash && (
        <p className="text-[11.5px] italic text-[var(--color-text-faint)]" data-testid="step-clash">
          {status.there.length === 0 && hasChannels && filter.levels !== null
            ? L('Gerade eher schwer – dafür fehlt gerade der Zugang. Du darfst trotzdem schauen oder einen anderen Schritt nehmen.', 'Hard right now – the access it needs is missing. You may still look, or take another step.')
            : L('Passt gerade nicht ganz zu dem, was du angegeben hast. Du darfst trotzdem schauen.', 'Does not quite match what you said right now. You may still look.')}
        </p>
      )}
    </div>
  );
}
