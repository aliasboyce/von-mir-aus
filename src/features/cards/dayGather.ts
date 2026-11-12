import { skillUsesRepo } from '../resources/skillUsesRepo';
import { tensionRepo } from '../polyvagal/tensionRepo';
import { zugangRepo } from '../zugang/zugangRepo';
import { routineRunsRepo } from '../routines/routinesRepo';
import { gardenRepo } from '../garden/gardenRepo';
import { diaryRepo } from '../diary/diaryRepo';
import { diaryCategoriesStore } from '../diary/diaryCategories';
import { isBookLocked } from '../diary/bookLock';
import { richToPlain } from '../../services/richText';
import { localDayKey } from '../../services/groupByDay';

export interface DayGather {
  usedResources: string[];
  gardenGrew: boolean;
  feelings: string[];
  needs: string[];
  values: string[];
  achieved: string[];
}

const dayOf = (iso: string) => localDayKey(iso);

/** Was an diesem Tag schon in der App passiert ist – zum Vorbelegen der Tageskarte (nichts wird verändert). */
export function gatherDay(day: string, lang: 'de' | 'en'): DayGather {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const safe = <T,>(fn: () => T, fb: T): T => {
    try {
      return fn();
    } catch {
      return fb;
    }
  };
  const used: string[] = [];
  safe(() => skillUsesRepo.getAll(), []).filter((u) => dayOf(u.endedAt) === day).sort((a, b) => a.endedAt.localeCompare(b.endedAt)).forEach((u) => {
    const tens = typeof u.tensionBefore === 'number' && typeof u.tensionAfter === 'number' ? ` (${L('Anspannung', 'tension')} ${u.tensionBefore} → ${u.tensionAfter})` : '';
    used.push(`${u.skillTitle}${tens}`);
  });
  safe(() => routineRunsRepo.getAll(), []).filter((r) => dayOf(r.endedAt) === day).forEach((r) => used.push(r.title));
  const tensions = safe(() => tensionRepo.getAll(), []).filter((e) => dayOf(e.createdAt) === day).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (tensions.length >= 2) used.push(`${L('Anspannung von', 'Tension from')} ${tensions[0].value} ${L('bis', 'to')} ${tensions[tensions.length - 1].value}`);

  const zug = safe(() => zugangRepo.getAll(), []).filter((z) => dayOf(z.createdAt) === day);
  const uniq = (a: string[]) => [...new Set(a.filter(Boolean))];
  const gardenGrew = safe(() => gardenRepo.getAll(), []).some((g) => dayOf(g.createdAt) === day) || safe(() => routineRunsRepo.getAll(), []).some((r) => dayOf(r.endedAt) === day);

  const achCat = safe(() => diaryCategoriesStore.getAll().find((c) => c.label === 'Erfolge')?.id, undefined);
  const achieved = achCat
    ? safe(() => diaryRepo.getAll(), []).filter((e) => e.categoryId === achCat && !isBookLocked(e.categoryId) && dayOf(e.createdAt) === day).map((e) => richToPlain(e.content).trim().slice(0, 90))
    : [];

  return {
    usedResources: used,
    gardenGrew,
    feelings: uniq(zug.flatMap((z) => z.feelings)).slice(0, 3),
    needs: uniq(zug.flatMap((z) => z.need)).slice(0, 3),
    values: uniq(zug.flatMap((z) => z.connection)).slice(0, 3),
    achieved,
  };
}
