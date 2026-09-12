import { POLYVAGAL_ZONE_ORDER, POLYVAGAL_ZONE_META } from '../polyvagal/polyvagalMeta';
import { MediLogOverallChart } from '../mediLog/MediLogOverallChart';
import type { TranslationDictionary } from '../../i18n/de';
import type { PolyvagalZone, DiaryEntry, MediLogEntry } from '../../data/types';

interface WeeklyReviewPrintViewProps {
  t: TranslationDictionary;
  zoneCounts: Record<PolyvagalZone, number>;
  checkInsCount: number;
  resourceUses: number;
  bridgeUses: number;
  helpfulYes: number;
  diaryEntries: DiaryEntry[];
  achievements: DiaryEntry[];
  mediLogWeekly: { key: string; displayName: string; color: string; entries: MediLogEntry[] }[];
  labels: { title: string; subtitle: string; exportedOn: string };
  formatDate: (iso: string) => string;
}

/** Print counterpart to WeeklyReviewPage.tsx — same 7-day stats, laid
 * out as a document. The zone-count bars become a simple text summary
 * rather than the on-screen bar chart, since exact figures read more
 * clearly on paper than a small bar graphic would. */
export function WeeklyReviewPrintView({
  t,
  zoneCounts,
  checkInsCount,
  resourceUses,
  bridgeUses,
  helpfulYes,
  diaryEntries,
  achievements,
  mediLogWeekly,
  labels,
  formatDate,
}: WeeklyReviewPrintViewProps) {
  const totalZoneCounts = POLYVAGAL_ZONE_ORDER.reduce((sum, z) => sum + zoneCounts[z], 0);

  return (
    <div className="print-only" style={{ padding: '40px 36px', color: '#1a1a1a', background: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{labels.title}</h1>
      <p style={{ fontSize: 12, color: '#777', marginBottom: 28 }}>
        {labels.subtitle} · {labels.exportedOn} {formatDate(new Date().toISOString())}
      </p>

      {checkInsCount > 0 && (
        <div style={{ marginBottom: 22, breakInside: 'avoid' }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            {t.weeklyReview.checkInsCount.replace('{count}', String(checkInsCount))}
          </p>
          {totalZoneCounts > 0 &&
            POLYVAGAL_ZONE_ORDER.map((z) =>
              zoneCounts[z] > 0 ? (
                <p key={z} style={{ fontSize: 12, color: '#444', marginBottom: 2 }}>
                  <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 999, background: POLYVAGAL_ZONE_META[z].color, marginRight: 6 }} />
                  {POLYVAGAL_ZONE_META[z].label(t)}: {zoneCounts[z]}
                </p>
              ) : null,
            )}
        </div>
      )}

      {(resourceUses > 0 || bridgeUses > 0) && (
        <div style={{ marginBottom: 22, breakInside: 'avoid' }}>
          {resourceUses > 0 && (
            <p style={{ fontSize: 13, color: '#333', marginBottom: 4 }}>
              {t.weeklyReview.resourcesUsed}: {resourceUses}
            </p>
          )}
          {bridgeUses > 0 && (
            <p style={{ fontSize: 13, color: '#333' }}>
              {t.weeklyReview.bridgesUsed}: {bridgeUses}
            </p>
          )}
        </div>
      )}

      {mediLogWeekly.length > 0 && (
        <div style={{ marginBottom: 22, breakInside: 'avoid' }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{t.weeklyReview.mediLogTitle}</p>
          <MediLogOverallChart medications={mediLogWeekly} width={560} height={140} />
        </div>
      )}

      {achievements.length > 0 && (
        <div style={{ marginBottom: 22, breakInside: 'avoid' }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{t.weeklyReview.achievements}</p>
          {achievements.map((a) => (
            <p key={a.id} style={{ fontSize: 13, marginBottom: 3 }}>
              ♡ {a.content}
            </p>
          ))}
        </div>
      )}

      {diaryEntries.length > 0 && (
        <div style={{ marginBottom: 22, breakInside: 'avoid' }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{t.weeklyReview.diaryEntries}</p>
          {diaryEntries.map((entry) => (
            <p key={entry.id} style={{ fontSize: 13, color: '#333', marginBottom: 3 }}>
              {formatDate(entry.createdAt)} — „{entry.content}"
            </p>
          ))}
        </div>
      )}

      {helpfulYes > 0 && (
        <p style={{ fontSize: 13, color: '#555', fontStyle: 'italic' }}>{t.weeklyReview.helpfulNote.replace('{count}', String(helpfulYes))}</p>
      )}
    </div>
  );
}
