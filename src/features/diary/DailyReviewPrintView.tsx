import { WEATHER_META, NEED_META } from '../innerWeather/weatherMeta';
import { describeDay } from '../polyvagal/describeDay';
import type { TranslationDictionary } from '../../i18n/de';
import type { WeatherCheckIn, PolyvagalCheckIn, MediLogEntry, DiaryEntry } from '../../data/types';

interface DayData {
  day: string;
  weather: WeatherCheckIn[];
  polyvagal: PolyvagalCheckIn[];
  diary: DiaryEntry[];
  mediLog: MediLogEntry[];
  achievements: DiaryEntry[];
}

interface DailyReviewPrintViewProps {
  days: DayData[];
  t: TranslationDictionary;
  labels: { title: string; period: string; noContent: string };
  formatDay: (day: string) => string;
  fromDate: string;
  toDate: string;
  formatDate: (iso: string) => string;
}

/**
 * Print counterpart to DailyReview.tsx — same underlying data shape
 * (built by the caller using the identical aggregation the live daily
 * review uses, just without its 30-day cap, so a chosen date range
 * exports completely), rendered as an actual document rather than a
 * curve/chart-heavy screen. The polyvagal curve becomes a short written
 * description instead of a MiniCurve SVG, since a tiny sparkline reads
 * poorly on paper compared to on a backlit screen — everything else
 * mirrors what the live Tagesrückblick shows for that day.
 */
export function DailyReviewPrintView({ days, t, labels, formatDay, fromDate, toDate, formatDate }: DailyReviewPrintViewProps) {
  return (
    <div className="print-only" style={{ padding: '40px 36px', color: '#1a1a1a', background: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{labels.title}</h1>
      <p style={{ fontSize: 12, color: '#777', marginBottom: 24 }}>
        {labels.period}: {formatDate(fromDate)} – {formatDate(toDate)}
      </p>

      {days.length === 0 && <p style={{ fontSize: 14, color: '#777' }}>{labels.noContent}</p>}

      {days.map(({ day, weather, polyvagal, diary, mediLog, achievements }) => {
        const empty = weather.length === 0 && polyvagal.length === 0 && diary.length === 0 && mediLog.length === 0 && achievements.length === 0;
        return (
          <div key={day} style={{ marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid #eee', breakInside: 'avoid' }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{formatDay(day)}</p>

            {weather.length > 0 && (
              <p style={{ fontSize: 12, color: '#444', marginBottom: 6 }}>
                {weather
                  .map((w) => `${WEATHER_META[w.condition].emoji} ${WEATHER_META[w.condition].label(t)}${w.need ? ` (${NEED_META[w.need].label(t)})` : ''}`)
                  .join(' · ')}
              </p>
            )}

            {polyvagal.length > 0 && <p style={{ fontSize: 12, color: '#444', marginBottom: 6 }}>{describeDay(polyvagal, t)}</p>}

            {mediLog.length > 0 && (
              <p style={{ fontSize: 12, color: '#444', marginBottom: 6 }}>
                {mediLog.map((m) => `${m.name}${m.doseValue != null ? ` · ${m.doseValue} ${m.doseUnit ?? ''}` : ''}`).join(', ')}
              </p>
            )}

            {achievements.map((a) => (
              <p key={a.id} style={{ fontSize: 13, marginBottom: 2 }}>
                ♡ {a.content}
              </p>
            ))}

            {diary.map((entry) => (
              <p key={entry.id} style={{ fontSize: 13, marginBottom: 2, color: '#2a2a2a' }}>
                „{entry.content}"
              </p>
            ))}

            {empty && <p style={{ fontSize: 12, color: '#999' }}>—</p>}
          </div>
        );
      })}
    </div>
  );
}
