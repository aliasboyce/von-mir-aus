import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { diaryRepo } from '../diary/diaryRepo';
import { diaryCategoriesStore } from '../diary/diaryCategories';
import { logActivity } from '../../services/activityLog';
import { createId } from '../../services/storage/repository';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { useSettings } from '../../state/SettingsContext';
import { pickLine } from '../../components/companion/companionRegistry';
import { useT } from '../../i18n';

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
  const { settings, updateSettings } = useSettings();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [recent, setRecent] = useState<string[]>(() => {
    const catId = diaryCategoriesStore.getAll().find((c) => c.label === ACHIEVEMENT_CATEGORY_LABEL)?.id;
    if (!catId) return [];
    return diaryRepo
      .getAll()
      .filter((e) => e.categoryId === catId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 3)
      .map((e) => e.content);
  });

  function save() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    const categoryId = getOrCreateAchievementCategoryId();
    diaryRepo.save({ id: createId('diary'), createdAt: now, updatedAt: now, categoryId, content: trimmed });
    logActivity('checkin', trimmed);
    setRecent((prev) => [trimmed, ...prev].slice(0, 3));
    setText('');
    say(pickLine({ page: '*', trigger: 'speichern' }), { joy: true });
  }

  return (
    <div className="mb-6">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 text-[13px] text-[var(--color-text-muted)]">
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        <Sparkles size={14} />
        {t.home.achievementTitle}
      </button>

      {open && (
        <div className="mt-3 animate-in">
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
              {recent.map((r, i) => (
                <p key={i} className="text-[13px] text-[var(--color-text-muted)] flex items-start gap-1.5">
                  <span className="text-[var(--color-accent-clay)] flex-shrink-0" aria-hidden="true">
                    ♡
                  </span>
                  {r}
                </p>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[var(--color-text-faint)]">{t.settings.dailyReviewAchievements}</span>
            <button
              role="switch"
              aria-checked={settings.dailyReviewShowAchievements !== false}
              onClick={() => updateSettings({ dailyReviewShowAchievements: !(settings.dailyReviewShowAchievements !== false) })}
              className="w-9 h-5 rounded-full relative flex-shrink-0"
              style={{ background: settings.dailyReviewShowAchievements !== false ? 'var(--color-primary)' : 'var(--color-border)' }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: settings.dailyReviewShowAchievements !== false ? 17 : 2 }}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
