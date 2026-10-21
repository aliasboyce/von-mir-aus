import { buildReviewPdf } from './reviewPdf';
import { gatherReviewDays, lastNDaysRange } from './reviewData';
import { deliverPdf, safeFilename } from '../../services/pdf/pdfShare';
import type { TranslationDictionary } from '../../i18n/de';

/** The tension curve as a real PDF file for the chart's own period
 * (today / last 7 / last 30 days) — the "Kurve drucken" buttons on the
 * check-in page and on Meine Entwicklung. Same chart, table and
 * positive summary as the review PDFs; works on every device,
 * including the iOS home-screen app. */
export async function exportCurvePdf(period: 'day' | 'week' | 'month', t: TranslationDictionary, locale: string) {
  const { from, to } = lastNDaysRange(period === 'day' ? 1 : period === 'week' ? 7 : 30);
  const title = period === 'day' ? t.polyvagal.todayChart : period === 'week' ? t.polyvagal.weekChart : t.polyvagal.monthChart;
  const bytes = buildReviewPdf({ kind: period, title, fromDay: from, toDay: to, days: gatherReviewDays(from, to), t, locale });
  await deliverPdf(bytes, safeFilename(`${title}-${from}`, 'kurve'), title);
}
