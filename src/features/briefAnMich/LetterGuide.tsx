import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { useT } from '../../i18n';

/** Step-by-step explanation of sending / receiving letters — for both sides. */
export function LetterGuide({ startOpen = false }: { startOpen?: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(startOpen);
  const b = t.briefAnMich;
  return (
    <div className="mb-5" data-testid="letter-guide">
      <button onClick={() => setOpen((v) => !v)} className="text-[13px] text-[var(--color-primary)]">
        {open ? b.guideHide : b.guideShow}
      </button>
      {open && (
        <Card className="mt-3 animate-in">
          <p className="text-[15px] text-[var(--color-text)] mb-2">{b.guideTitle}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-4">{b.guideIntro}</p>

          <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{b.guideSenderTitle}</p>
          <ol className="flex flex-col gap-1.5 mb-4 pl-5 list-decimal">
            {b.guideSenderSteps.map((s, i) => (
              <li key={i} className="text-[13px] text-[var(--color-text)] leading-relaxed">{s}</li>
            ))}
          </ol>

          <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{b.guideReceiverTitle}</p>
          <ol className="flex flex-col gap-1.5 mb-4 pl-5 list-decimal">
            {b.guideReceiverSteps.map((s, i) => (
              <li key={i} className="text-[13px] text-[var(--color-text)] leading-relaxed">{s}</li>
            ))}
          </ol>

          <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{b.guideGoodToKnowTitle}</p>
          <ul className="flex flex-col gap-1.5 pl-5 list-disc">
            {b.guideGoodToKnow.map((s, i) => (
              <li key={i} className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed">{s}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
