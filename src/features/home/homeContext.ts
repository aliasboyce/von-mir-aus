export type TimeOfDay = 'morgen' | 'tag' | 'abend' | 'nacht';
export type WeatherMood = 'sonnig' | 'regen' | 'bewoelkt' | 'schnee' | null;

export interface HomeContext {
  timeOfDay: TimeOfDay;
  isWeekend: boolean;
  weather: WeatherMood;
}

export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 11) return 'morgen';
  if (h >= 11 && h < 17) return 'tag';
  if (h >= 17 && h < 22) return 'abend';
  return 'nacht';
}

function weatherCodeToMood(code: number): WeatherMood {
  if (code === 0 || code === 1) return 'sonnig';
  if (code === 2 || code === 3) return 'bewoelkt';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'regen';
  if (code >= 71 && code <= 77) return 'schnee';
  return null;
}

let cachedWeather: WeatherMood | undefined;
let weatherFetchStarted = false;

/**
 * Best-effort, privacy-respecting weather lookup: only runs if the browser
 * already has geolocation permission granted (never prompts — this app
 * doesn't ask for location access just for a companion mood), uses the
 * free, key-less Open-Meteo API, and fails silently into `null` on any
 * error, missing permission, or slow response. Cached for the session so
 * it's fetched at most once, not on every Home visit.
 */
export async function getBestEffortWeather(): Promise<WeatherMood> {
  if (cachedWeather !== undefined) return cachedWeather;
  if (weatherFetchStarted) return null;
  weatherFetchStarted = true;

  try {
    if (!navigator.permissions || !navigator.geolocation) return (cachedWeather = null);
    const status = await navigator.permissions.query({ name: 'geolocation' });
    if (status.state !== 'granted') return (cachedWeather = null);

    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('timeout')), 4000);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeout);
          resolve(pos);
        },
        (err) => {
          clearTimeout(timeout);
          reject(err);
        },
        { timeout: 4000, maximumAge: 30 * 60 * 1000 },
      );
    });

    const { latitude, longitude } = position.coords;
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weather_code`,
    );
    if (!res.ok) return (cachedWeather = null);
    const data = await res.json();
    const code = data?.current?.weather_code;
    cachedWeather = typeof code === 'number' ? weatherCodeToMood(code) : null;
    return cachedWeather;
  } catch {
    return (cachedWeather = null);
  }
}

export function getHomeContext(): HomeContext {
  const now = new Date();
  return {
    timeOfDay: getTimeOfDay(now),
    isWeekend: now.getDay() === 0 || now.getDay() === 6,
    weather: cachedWeather ?? null,
  };
}
