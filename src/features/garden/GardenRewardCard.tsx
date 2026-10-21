import { useMemo, useState } from 'react';
import { Gift } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { useSettings } from '../../state/SettingsContext';
import { gardenRepo } from './gardenRepo';
import { progressFor } from './gardenGrowth';

const TXT = {
  de: { title: 'Deine Belohnung wartet', ok: 'Danke, das nehme ich mir', after: 'Du hast {n} Tage mit „{name}“ geschafft.' },
  en: { title: 'Your reward is waiting', ok: 'Thanks, I will take it', after: 'You counted {n} days with “{name}”.' },
};

/** The reward a person wrote for themselves when planting ("nach 21 Tagen: ein Eis essen"). Shows up once the days are counted. */
export function pendingGardenRewards() {
  return gardenRepo
    .getAll()
    .filter((e) => e.status !== 'ended' && e.reward && !e.rewardShownAt && progressFor(e) >= e.reward.afterDays);
}

export function GardenRewardCard({ onChange }: { onChange?: () => void }) {
  const { settings } = useSettings();
  const T = settings.language === 'en' ? TXT.en : TXT.de;
  const [version, setVersion] = useState(0);
  const pending = useMemo(() => pendingGardenRewards(), [version]); // eslint-disable-line react-hooks/exhaustive-deps
  if (pending.length === 0) return null;
  return (
    <div className="flex flex-col gap-3 mb-5" data-testid="garden-reward">
      {pending.map((e) => (
        <Card key={e.id} className="animate-in" style={{ background: 'var(--color-primary-soft)' }}>
          <div className="flex items-start gap-3">
            <InlineCompanionNote joyBurst="dance" />
            <div className="flex-1">
              <p className="text-[12px] uppercase tracking-wide text-[var(--color-primary)] mb-1 flex items-center gap-1.5"><Gift size={13} /> {T.title}</p>
              <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{T.after.replace('{n}', String(progressFor(e))).replace('{name}', e.name)}</p>
              <p className="text-[16px] text-[var(--color-text)] leading-snug mb-3">🎁 {e.reward!.message}</p>
              <Button
                size="sm"
                onClick={() => {
                  gardenRepo.save({ ...e, rewardShownAt: new Date().toISOString() });
                  setVersion((v) => v + 1);
                  onChange?.();
                }}
                data-testid="garden-reward-ok"
              >
                {T.ok}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
