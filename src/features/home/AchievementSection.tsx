import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { diaryRepo } from '../diary/diaryRepo';
import { diaryCategoriesStore } from '../diary/diaryCategories';
import { logActivity } from '../../services/activityLog';
import { createId } from '../../services/storage/repository';
import { localDayKey } from '../../services/groupByDay';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { pickLine } from '../../components/companion/companionRegistry';
import { useT } from '../../i18n';
import { isBookLocked } from '../diary/bookLock';

const ACHIEVEMENT_CATEGORY_LABEL = 'Erfolge';

function getOrCreateAchievementCategoryId(): string {
  const existing = diaryCategoriesStore.getAll().find((c) => c.label === ACHIEVEMENT_CATEGORY_LABEL);
  if (existing) return existing.id;
  return diaryCategoriesStore.add(ACHIEVEMENT_CATEGORY_LABEL).id;
}

/**
 * A small, low-friction way to note something that felt like an
 * accomplishment - however small. Saves into the diary under its own
 * "Erfolge" category (auto-created on first use) rather than a separate
 * data store, so it naturally shows up in the diary and Tagesrueckblick
 * too instead of living in a disconnected silo.
 */
export function AchievementSection() {
  const t = useT();
  const say = useCompanionSay();
  const [text, setText] = useState('');
  // Only ever TODAY's entries are shown: the list starts empty every new day.
  // Earlier days are not gone — they live on in the diary and in the Rück-
  // blick (Tages-/Wochenrückblick), which read the same entries by date.
  const [entries, setEntries] = useState<{ id: string; content: string; createdAt: string }[]>(() => {
    const catId = diaryCategoriesStore.getAll().find((c) => c.label === ACHIEVEMENT_CATEGORY_LABEL)?.id;
    if (!catId) return [];
    return diaryRepo
      .getAll()
      .filter((e) => e.categoryId === catId && !isBookLocked(e.categoryId))
      .map((e) => ({ id: e.id, content: e.content, createdAt: e.createdAt }));
  });
  const today = localDayKey(new Date().toISOString());
  const recent = entries
    .filter((e) => localDayKey(e.createdAt) === today)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function save() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    const categoryId = getOrCreateAchievementCategoryId();
    const id = createId('diary');
    diaryRepo.save({ id, createdAt: now, updatedAt: now, categoryId, content: trimmed });
    logActivity('checkin', trimmed);
    setEntries((prev) => [{ id, content: trimmed, createdAt: now }, ...prev]);
    setText('');
    say(pickLine({ page: '*', trigger: 'speichern' }), { joy: true });
  }

  return (
    // "Das habe ich geschafft, Startseite deutlicher, nicht mehr nur
    // ausklappbar, soll angezeigt werden"-Auftrag — was a collapsed
    // toggle link; now an always-visible card with the input and the
    // latest entries right there.
    <div className="mb-6 rounded-[var(--radius-lg)] p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <p className="flex items-center gap-1.5 text-[14px] font-medium text-[var(--color-text)] mb-3">
        <Sparkles size={15} className="text-[var(--color-accent-clay)]" />
        {t.home.achievementTitle}
      </p>

      <div className="flex gap-2 mb-3">
        <input
          className="input flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.home.achievementPlaceholder}
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
        <Button size="sm" onClick={save} disabled={!text.trim()}>
          {t.common.save}
        </Button>
      </div>
      {recent.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-3">
          {recent.map((r) => (
            <p key={r.id} className="text-[13px] text-[var(--color-text-muted)] flex items-start gap-1.5">
              <span className="text-[var(--color-accent-clay)] flex-shrink-0" aria-hidden="true">
                ♡
              </span>
              {r.content}
            </p>
          ))}
        </div>
      )}
      <p className="text-[12px] text-[var(--color-text-faint)] mb-3 leading-relaxed">
        {t.home.achievementDayHint}{' '}
        <Link to="/sicherheit/tagebuch" className="underline text-[var(--color-primary)]">
          {t.home.achievementReviewLink}
        </Link>
      </p>
    </div>
  );
}
