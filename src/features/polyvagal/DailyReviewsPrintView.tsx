import { useT } from '../../i18n';
import { POLYVAGAL_ZONE_META, POLYVAGAL_ZONE_ORDER } from './polyvagalMeta';
import { getDailyNote } from './dailyNotesRepo';
import { describeDay } from './describeDay';
import type { PolyvagalCheckIn } from '../../data/types';

interface DailyReviewsPrintViewProps {
  sortedDays: string[];
  grouped: Map<string, PolyvagalCheckIn[]>;
  locale: string;
  /** Forces a re-render after a note is edited — not read directly,
   * getDailyNote() is called fresh at print time either way. */
  notesVersion: number;
}

/**
 * "Alles auf die eine Seite 'Meine Entwicklung' ... alles mit PDF"-
 * Auftrag — same print-only mechanism as ChartPrintView and
 * WindowProgressPrintView: the day-by-day written review (zone
 * counts, the auto description, and the person's own note) taken
 * into a therapy session or kept on paper, separate from the curve's
 * own print view above it since they're two different kinds of
 * record on the same page.
 */
export function DailyReviewsPrintView({ sortedDays, grouped, locale, notesVersion }: DailyReviewsPrintViewProps) {
  const t = useT();
  void notesVersion;

  return (
    <div className="print-only" data-print-id="daily-reviews" style={{ padding: '40px 36px', color: '#1a1a1a', background: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{t.polyvagal.dailyReviewsTitle}</h1>
      <p style={{ fontSize: 12, color: '#777', marginBottom: 24 }}>
        {t.network.exportedOn} {new Date().toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })}
      </p>

      {sortedDays.map((day) => {
        const entries = (grouped.get(day) ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        const counts = POLYVAGAL_ZONE_ORDER.map((zone) => ({ zone, count: entries.filter((e) => e.zone === zone).length })).filter((c) => c.count > 0);
        const dateLabel = new Date(day).toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
        const note = getDailyNote(day);

        return (
          <div key={day} style={{ marginBottom: 20, pageBreakInside: 'avoid' }}>
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{dateLabel}</p>
            <p style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>
              {counts.map((c) => `${POLYVAGAL_ZONE_META[c.zone].label(t)} × ${c.count}`).join(' · ')}
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.5, marginBottom: note ? 4 : 0 }}>{describeDay(entries, t)}</p>
            {note && <p style={{ fontSize: 13, lineHeight: 1.5, fontStyle: 'italic', color: '#333' }}>{note}</p>}
          </div>
        );
      })}
    </div>
  );
}
