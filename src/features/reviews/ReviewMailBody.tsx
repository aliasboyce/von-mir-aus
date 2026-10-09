import { useNavigate } from 'react-router-dom';
import { FileDown } from 'lucide-react';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { gatherReviewDays } from './reviewData';
import { reviewSummaryLines } from './reviewStats';
import { buildReviewPdf } from './reviewPdf';
import { DayCurveBlock } from './DayCurveBlock';
import { deliverPdf, safeFilename } from '../../services/pdf/pdfShare';
import type { MailItem } from '../../services/mailbox';

export function isReviewMail(m: MailItem): boolean {
  return !!m.payload?.review;
}

/**
 * The body of an automatic review message in the Postfach: the day's
 * review shows its curve right inside the message (with a PDF button);
 * the weekly / monthly ones show their positive summary lines with a PDF
 * button and a link to the full page. It reads the data live when shown,
 * so it is always complete even if more was recorded after delivery.
 */
export function ReviewMailBody({ mail }: { mail: MailItem }) {
  const t = useT();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';
  const p = mail.payload ?? {};
  const kind = (p.review as 'day' | 'week' | 'month') ?? 'day';
  const from = p.from ?? p.day ?? '';
  const to = p.to ?? p.day ?? from;
  const days = gatherReviewDays(from, to);
  const checkIns = days.flatMap((d) => d.checkIns);
  const uses = days.flatMap((d) => d.skillUses);
  const appts = days.flatMap((d) => d.appointments);
  const wishes = days.flatMap((d) => d.wishes);
  const lines = reviewSummaryLines(checkIns, uses, t);
  if (appts.length > 0) lines.push(t.reviewMail.appointments.replace('{n}', String(appts.length)));
  // only "will" things count positively; a "soll" ticked off is just done, not celebrated
  const wanted = wishes.filter((w) => w.intent !== 'soll');
  if (wanted.length > 0) lines.push(t.reviewMail.wishesDone.replace('{done}', String(wanted.filter((w) => w.done).length)).replace('{total}', String(wanted.length)));

  async function pdf() {
    const title = mail.title;
    const bytes = buildReviewPdf({ kind, title, fromDay: from, toDay: to, days, t, locale });
    await deliverPdf(bytes, safeFilename(`${title}-${from}`, 'rueckblick'), title);
  }

  return (
    <div className="mt-1.5">
      {p.softHint === '1' && settings.reviewBodyHint !== false && <p className="text-[13px] italic text-[var(--color-text-muted)] leading-relaxed mb-2">{t.reviewMail.softHint}</p>}
      {kind === 'day' && days[0] && days[0].checkIns.length > 0 ? (
        <DayCurveBlock checkIns={days[0].checkIns} skillUses={days[0].skillUses} onPdf={pdf} />
      ) : (
        <>
          {lines.map((l, i) => (
            <p key={i} className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
              {l}
            </p>
          ))}
          <button onClick={pdf} className="flex items-center gap-1.5 text-[12.5px] text-[var(--color-primary)] mt-2">
            <FileDown size={13} /> {t.reviewSummary.pdf}
          </button>
        </>
      )}
      {kind === 'day' && days[0] && days[0].checkIns.length === 0 && lines.map((l, i) => (
        <p key={i} className="text-[13px] text-[var(--color-text-muted)]">{l}</p>
      ))}
      <button onClick={() => navigate(kind === 'day' ? '/sicherheit/tagebuch' : '/wochenrueckblick')} className="text-[13px] text-[var(--color-primary)] mt-2 block">
        {t.reviewMail.open} →
      </button>
    </div>
  );
}
