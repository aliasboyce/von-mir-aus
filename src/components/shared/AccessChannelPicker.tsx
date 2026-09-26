import { ACCESS_CHANNEL_META, ACCESS_CHANNEL_ORDER } from '../../features/zugangskanaele/accessChannels';
import { useT } from '../../i18n';
import type { AccessChannel } from '../../data/types';

/**
 * "Zugangskanäle & Zugänglichkeit, Schritt 2"-Auftrag — replaces the
 * narrower SensoryModalityPicker (7 senses) with the full ten-channel
 * taxonomy. Same shape, same call sites, richer vocabulary — see
 * FACHLICHE_GRUNDLAGEN.md §1 for what each channel means.
 *
 * "Persönliche Antwort entscheidet, nie eine Zone"-Fund — hideLabel is
 * for the Zugang Handlung question, which supplies its own framing
 * text ("Welche Kanäle fühlen sich gerade offen an?") instead of the
 * generic tagging label this component normally shows. Existing
 * callers (Ressourcen-/Brücken-Formular) are unaffected — the prop
 * defaults to false, same label as before.
 */
export function AccessChannelPicker({
  selected,
  onChange,
  hideLabel = false,
}: {
  selected: AccessChannel[];
  onChange: (ids: AccessChannel[]) => void;
  hideLabel?: boolean;
}) {
  const t = useT();
  return (
    <label className="flex flex-col gap-1.5">
      {!hideLabel && (
        <>
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.common.accessChannelsLabel}</span>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{t.common.accessChannelsHint}</p>
        </>
      )}
      <div className="flex flex-wrap gap-1.5">
        {ACCESS_CHANNEL_ORDER.map((c) => {
          const meta = ACCESS_CHANNEL_META[c];
          const isSel = selected.includes(c);
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(isSel ? selected.filter((id) => id !== c) : [...selected, c])}
              title={meta.hint(t)}
              className="px-2.5 py-1.5 rounded-full text-[12px] flex items-center gap-1"
              style={{
                background: isSel ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                color: isSel ? 'var(--color-surface)' : 'var(--color-text)',
              }}
            >
              <meta.icon size={12} />
              {meta.label(t)}
            </button>
          );
        })}
      </div>
    </label>
  );
}
