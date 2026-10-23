import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../../components/navigation/TopBar';
import { ResourceTile, BridgeTile } from '../../components/shared/ItemTile';
import { Button } from '../../components/ui/Button';
import { useSettings } from '../../state/SettingsContext';
import { resourcesRepo } from '../resources/resourcesRepo';
import { RESOURCE_CATEGORY_TO_GROUP } from '../resources/resourceMeta';
import { bridgesRepo } from '../bridges/bridgesRepo';
import { logActivity } from '../../services/activityLog';
import type { Bridge, Resource } from '../../data/types';

const SHOW = 3;

function rank<T extends { favorite?: boolean; energyLevel?: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || (a.energyLevel ?? 9) - (b.energyLevel ?? 9));
}

/**
 * "Nur jetzt": Skills, Ressourcen and Brücken in the smallest possible form — at most three
 * suggestions, favourites and low-energy ones first, "Andere zeigen" for the next three. A skill
 * opens its real run page; a resource shows its description; a bridge shows only its smallest step.
 */
export function NurJetztListPage() {
  const { kind } = useParams<{ kind: string }>();
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const navigate = useNavigate();
  const [offset, setOffset] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  const items = useMemo(() => {
    if (kind === 'bruecken') return rank(bridgesRepo.getAll()) as Bridge[];
    const all = resourcesRepo.getAll();
    const isSkill = (r: Resource) => RESOURCE_CATEGORY_TO_GROUP[r.category] === 'faehigkeiten';
    return rank(all.filter((r) => (kind === 'skills' ? isSkill(r) : !isSkill(r)))) as Resource[];
  }, [kind]);

  if (kind !== 'skills' && kind !== 'ressourcen' && kind !== 'bruecken') return <Navigate to="/" replace />;

  const title = kind === 'skills' ? (en ? 'One small skill' : 'Ein kleiner Skill') : kind === 'ressourcen' ? (en ? 'Something of mine' : 'Etwas von mir') : en ? 'One small bridge' : 'Eine kleine Brücke';
  const start = items.length === 0 ? 0 : offset % items.length;
  const shown = items.length <= SHOW ? items : Array.from({ length: SHOW }, (_, i) => items[(start + i) % items.length]);

  return (
    <div className="animate-in" data-testid="nur-jetzt-list">
      <TopBar onBack={() => navigate('/')} />
      <div className="px-5 pb-10">
        <h1 className="text-[24px] mb-1">{title}</h1>
        <p className="text-[13.5px] text-[var(--color-text-muted)] mb-5">{en ? 'Pick one. Or none.' : 'Such dir eins aus. Oder keins.'}</p>
        {items.length === 0 && <p className="text-[14px] text-[var(--color-text-muted)]">{en ? 'Nothing here yet. That is fine – it can wait.' : 'Hier ist noch nichts. Das ist in Ordnung – es kann warten.'}</p>}
        <div className="flex flex-col gap-3">
          {shown.map((it) => {
            const open = openId === it.id;
            if (kind === 'bruecken') {
              const b = it as Bridge;
              const small = [...b.levels].sort((x, y) => x.level - y.level)[0];
              return (
                <div key={b.id}>
                  <BridgeTile bridge={b} onClick={() => setOpenId(open ? null : b.id)} selected={open} />
                  {open && small && (
                    <div className="mt-2 rounded-[var(--radius-lg)] p-4" style={{ background: 'var(--color-primary-soft)' }}>
                      <p className="text-[12px] uppercase tracking-wide text-[var(--color-primary)] mb-1">{en ? 'The smallest step' : 'Der kleinste Schritt'}</p>
                      <p className="text-[16px] text-[var(--color-text)] mb-1">{small.title}</p>
                      <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed mb-3">{small.description}</p>
                      {doneId === b.id ? (
                        <p className="text-[14px] text-[var(--color-primary)]">{en ? 'Good. That counts.' : 'Gut. Das zählt.'}</p>
                      ) : (
                        <Button
                          fullWidth
                          onClick={() => {
                            logActivity('bridge', b.title, b.id);
                            setDoneId(b.id);
                          }}
                        >
                          {en ? 'I am doing this' : 'Das mache ich'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            }
            const r = it as Resource;
            return (
              <div key={r.id}>
                {kind === 'skills' ? (
                  <Link to={`/entdecken/ressourcen/skill-start/${r.id}`} className="block">
                    <ResourceTile resource={r} subtitle={r.description || undefined} />
                  </Link>
                ) : (
                  <>
                    <ResourceTile resource={r} onClick={() => setOpenId(open ? null : r.id)} selected={open} />
                    {open && (
                      <div className="mt-2 rounded-[var(--radius-lg)] p-4" style={{ background: 'var(--color-primary-soft)' }}>
                        <p className="text-[15px] text-[var(--color-text)] leading-relaxed mb-3">{r.description || (en ? 'You have this. That is enough for now.' : 'Du hast das. Das reicht gerade.')}</p>
                        {doneId === r.id ? (
                          <p className="text-[14px] text-[var(--color-primary)]">{en ? 'Good. That counts.' : 'Gut. Das zählt.'}</p>
                        ) : (
                          <Button
                            fullWidth
                            onClick={() => {
                              logActivity('resource', r.title, r.id);
                              setDoneId(r.id);
                            }}
                          >
                            {en ? 'I am using this' : 'Ich nutze das'}
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
        {items.length > SHOW && (
          <button type="button" onClick={() => { setOffset((o) => o + SHOW); setOpenId(null); }} className="mt-5 text-[14px] text-[var(--color-primary)] underline underline-offset-2">
            {en ? 'Show others' : 'Andere zeigen'}
          </button>
        )}
      </div>
    </div>
  );
}
