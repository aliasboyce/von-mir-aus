/** Wie das Datum auf einer Karte stehen soll – alles freiwillig, „kein Datum“ gibt es auch. */
export interface DateFormatOption {
  id: string;
  de: string;
  en: string;
}

export const DATE_FORMATS: DateFormatOption[] = [
  { id: 'long', de: 'Ausgeschrieben', en: 'Spelled out' },
  { id: 'weekday-long', de: 'Mit Wochentag', en: 'With weekday' },
  { id: 'weekday-day', de: 'Wochentag + Tag', en: 'Weekday + day' },
  { id: 'weekday-numbers', de: 'Wochentag + Zahlen', en: 'Weekday + numbers' },
  { id: 'numbers', de: 'Nur Zahlen', en: 'Numbers only' },
  { id: 'numbers-short', de: 'Kurze Zahlen', en: 'Short numbers' },
  { id: 'day-month', de: 'Tag + Monat', en: 'Day + month' },
  { id: 'month-year', de: 'Monat + Jahr', en: 'Month + year' },
  { id: 'year', de: 'Nur Jahr', en: 'Year only' },
  { id: 'weekday', de: 'Nur Wochentag', en: 'Weekday only' },
];

export function formatCardDate(day: string, lang: 'de' | 'en', fmt: string = 'long'): string {
  const d = new Date(`${day.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return day;
  const loc = lang === 'en' ? 'en-GB' : 'de-DE';
  const f = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString(loc, o);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dot = lang === 'en' ? '/' : '.';
  switch (fmt) {
    case 'weekday-long':
      return f({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    case 'weekday-day':
      return f({ weekday: 'long' }) + (lang === 'en' ? ` ${d.getDate()}` : ` ${d.getDate()}.`);
    case 'weekday-numbers':
      return `${f({ weekday: 'short' }).replace(/\.$/, '')} ${lang === 'en' ? `${dd}/${mm}` : `${dd}.${mm}.`}`;
    case 'numbers':
      return lang === 'en' ? `${dd}/${mm}/${d.getFullYear()}` : `${dd}.${mm}.${d.getFullYear()}`;
    case 'numbers-short':
      return `${dd}${dot}${mm}${dot}${String(d.getFullYear()).slice(2)}`;
    case 'day-month':
      return f({ day: 'numeric', month: 'long' });
    case 'month-year':
      return f({ month: 'long', year: 'numeric' });
    case 'year':
      return String(d.getFullYear());
    case 'weekday':
      return f({ weekday: 'long' });
    default:
      return f({ day: 'numeric', month: 'long', year: 'numeric' });
  }
}
