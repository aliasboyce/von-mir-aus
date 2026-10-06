import { polyvagalRepo } from '../polyvagal/polyvagalRepo';
import { skillUsesRepo } from '../resources/skillUsesRepo';
import { weatherRepo } from '../innerWeather/weatherRepo';
import { diaryRepo } from '../diary/diaryRepo';
import { diaryCategoriesStore } from '../diary/diaryCategories';
import { mediLogRepo } from '../mediLog/mediLogRepo';
import { appointmentsRepo, wishesRepo, type Appointment, type Wish } from '../calendar/calendarRepo';
import { activityRepo } from '../../services/activityLog';
import { zugangRepo } from '../zugang/zugangRepo';
import { gardenRepo } from '../garden/gardenRepo';
import { distinctCheckInDays } from '../garden/gardenGrowth';
import { lettersRepo, type LetterToSelf } from '../briefAnMich/lettersRepo';
import { groupByDay } from '../../services/groupByDay';
import type { PolyvagalCheckIn, SkillUse, DiaryEntry, WeatherCheckIn, MediLogEntry } from '../../data/types';

export interface ReviewDay {
  day: string; // local 'YYYY-MM-DD'
  checkIns: PolyvagalCheckIn[];
  skillUses: SkillUse[];
  weather: WeatherCheckIn[];
  diary: DiaryEntry[];
  achievements: DiaryEntry[];
  mediLog: MediLogEntry[];
  /** "Termine mit den Notizen der Reflexion im Tages-/Wochenrueckblick" */
  appointments: Appointment[];
  wishes: Wish[];
  /** resources / bridges / contacts the person used (activity log) */
  activities: { label: string; type: string }[];
  /** number of Zugang passes */
  zugangCount: number;
  /** letters to self the person chose to include */
  letters: LetterToSelf[];
  /** names of garden items checked in that day */
  garden: string[];
}

export function dayKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Everything the reviews and their PDFs show, gathered for the local
 * days from..to (both inclusive, 'YYYY-MM-DD'), oldest day first. Days
 * with nothing recorded are left out. Reads only — never writes. */
export function gatherReviewDays(fromDay: string, toDay: string): ReviewDay[] {
  const inRange = (key: string) => key >= fromDay && key <= toDay;
  const achievementCategoryId = diaryCategoriesStore.getAll().find((c) => c.label === 'Erfolge')?.id;
  const allDiary = diaryRepo.getAll();
  // only entries the person chose to include (switch on the entry)
  const general = allDiary.filter((d) => d.inReview === true);
  const achievements = achievementCategoryId ? allDiary.filter((d) => d.categoryId === achievementCategoryId) : [];

  const cByDay = groupByDay(polyvagalRepo.getAll(), (c) => c.createdAt);
  const sByDay = groupByDay(skillUsesRepo.getAll(), (u) => u.endedAt);
  const wByDay = groupByDay(weatherRepo.getAll(), (w) => w.createdAt);
  const dByDay = groupByDay(general, (d) => d.createdAt);
  const aByDay = groupByDay(achievements, (a) => a.createdAt);
  const mByDay = groupByDay(mediLogRepo.getAll().filter((m) => m.status !== 'skipped'), (m) => m.takenAt);
  // Appointments/wishes already carry a LOCAL 'YYYY-MM-DD' day, so they are
  // grouped by that string directly (not parsed through Date).
  const apByDay = new Map<string, Appointment[]>();
  appointmentsRepo.getAll().forEach((a) => apByDay.set(a.date, [...(apByDay.get(a.date) ?? []), a]));
  const actByDay = groupByDay(activityRepo.getAll().filter((e) => e.type !== 'checkin'), (e) => e.createdAt);
  const zugByDay = groupByDay(zugangRepo.getAll(), (z) => z.createdAt);
  const letByDay = groupByDay(lettersRepo.getAll().filter((l) => l.inReview === true), (l) => l.createdAt);
  const gardenByDay = new Map<string, string[]>();
  gardenRepo.getAll().forEach((g) => distinctCheckInDays(g).forEach((d) => gardenByDay.set(d, [...(gardenByDay.get(d) ?? []), g.name])));
  const wiByDay = new Map<string, Wish[]>();
  wishesRepo.getAll().forEach((w) => wiByDay.set(w.day, [...(wiByDay.get(w.day) ?? []), w]));

  const keys = new Set<string>();
  [cByDay, sByDay, wByDay, dByDay, aByDay, mByDay, apByDay, wiByDay, actByDay, zugByDay, letByDay, gardenByDay].forEach((m) => m.forEach((_, k) => inRange(k) && keys.add(k)));

  return Array.from(keys)
    .sort((a, b) => a.localeCompare(b))
    .map((day) => ({
      day,
      checkIns: (cByDay.get(day) ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      skillUses: (sByDay.get(day) ?? []).sort((a, b) => a.endedAt.localeCompare(b.endedAt)),
      weather: wByDay.get(day) ?? [],
      diary: dByDay.get(day) ?? [],
      achievements: aByDay.get(day) ?? [],
      mediLog: mByDay.get(day) ?? [],
      appointments: (apByDay.get(day) ?? []).sort((a, b) => a.time.localeCompare(b.time)),
      wishes: wiByDay.get(day) ?? [],
      activities: (actByDay.get(day) ?? []).map((e) => ({ label: e.label, type: e.type })),
      zugangCount: (zugByDay.get(day) ?? []).length,
      letters: letByDay.get(day) ?? [],
      garden: gardenByDay.get(day) ?? [],
    }));
}

export function lastNDaysRange(n: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (n - 1));
  return { from: dayKeyOf(from), to: dayKeyOf(to) };
}
