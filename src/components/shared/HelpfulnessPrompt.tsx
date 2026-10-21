import { useState } from 'react';
import { setActivityHelpfulness } from '../../services/activityLog';
import { useT } from '../../i18n';
import type { ActivityEvent } from '../../data/types';

interface HelpfulnessPromptProps {
  activityId: string;
}

/**
 * Deliberately tiny and low-pressure: three taps, no required response, no
 * follow-up questions. Feeds into activityRepo so a later Wochenrückblick
 * or similar view can draw on real, self-reported signal instead of
 * guessing what helped.
 */
export function HelpfulnessPrompt({ activityId }: HelpfulnessPromptProps) {
  const t = useT();
  const [answered, setAnswered] = useState<ActivityEvent['helpfulness'] | null>(null);

  function answer(value: NonNullable<ActivityEvent['helpfulness']>) {
    setActivityHelpfulness(activityId, value);
    setAnswered(value);
  }

  if (answered) {
    return <p className="text-[12px] text-[var(--color-text-faint)] mt-1.5">{t.common.helpfulnessThanks}</p>;
  }

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <span className="text-[12px] text-[var(--color-text-faint)]">{t.common.helpfulnessQuestion}</span>
      <button onClick={() => answer('ja')} className="text-[12px] text-[var(--color-primary)]">
        {t.common.helpfulnessYes}
      </button>
      <button onClick={() => answer('einBisschen')} className="text-[12px] text-[var(--color-primary)]">
        {t.common.helpfulnessSomewhat}
      </button>
      <button onClick={() => answer('nein')} className="text-[12px] text-[var(--color-primary)]">
        {t.common.helpfulnessNo}
      </button>
    </div>
  );
}
