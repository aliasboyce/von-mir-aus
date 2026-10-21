import { ResourceTile, BridgeTile } from '../../components/shared/ItemTile';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Check, Play } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { zugangRepo } from './zugangRepo';
import { getFollowUp, markOpened, clearFollowUp } from './zugangFollowUp';
import { resourcesRepo } from '../resources/resourcesRepo';
import { bridgesRepo } from '../bridges/bridgesRepo';
import { RESOURCE_CATEGORY_TO_GROUP } from '../resources/resourceMeta';
import type { Resource } from '../../data/types';

/** Where a chosen Ressource opens: skills start their run, everything else opens its detail. */
export function resourceOpenPath(r: Resource): string {
  if (RESOURCE_CATEGORY_TO_GROUP[r.category] === 'faehigkeiten') return `/entdecken/ressourcen/skill-start/${r.id}`;
  const type = r.category === 'orte' || RESOURCE_CATEGORY_TO_GROUP[r.category] === 'orte_gruppe' ? 'orte' : r.category === 'aktivitaeten' ? 'aktivitaeten' : 'hilfsmittel';
  return `/entdecken/ressourcen/${type}?open=${r.id}`;
}

/**
 * Landing page after "Direkt zu den Ressourcen": the pass is already saved.
 * The chosen Ressourcen are opened one after the other; coming back from the
 * last one leads on to "Wie war es danach?" by itself.
 */
export function ZugangUsePage() {
  const t = useT();
  const u = t.zugang.use;
  const navigate = useNavigate();
  const { entryId } = useParams<{ entryId: string }>();
  const entry = useMemo(() => (entryId ? zugangRepo.getById(entryId) : undefined), [entryId]);
  const [opened, setOpened] = useState<string[]>(() => {
    const f = getFollowUp();
    return f && f.entryId === entryId ? f.opened : [];
  });
  const chosen = entry?.usedResources ?? [];

  // Automatic steps: one single Ressource opens right away; once everything
  // chosen was opened and the person is back here, "Wie war es danach?" follows.
  useEffect(() => {
    if (!entry || !entryId || chosen.length === 0) return;
    if (opened.length >= chosen.length) {
      navigate(`/zugang/danach/${entryId}`, { replace: true });
      return;
    }
    if (chosen.length === 1 && opened.length === 0) openOne(chosen[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openOne(id: string) {
    if (!entryId) return;
    markOpened(entryId, id);
    setOpened((o) => (o.includes(id) ? o : [...o, id]));
    const r = resourcesRepo.getById(id);
    if (r) navigate(resourceOpenPath(r));
  }

  if (!entry) {
    return (
      <div className="animate-in">
        <TopBar onBack={() => navigate('/')} />
        <p className="px-5 text-[14px] text-[var(--color-text-muted)]">{u.notFound}</p>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <TopBar onBack={() => navigate(`/zugang/danach/${entry.id}`)} />
      <div className="px-5 pb-8">
        <h1 className="text-[22px] mb-2">{u.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed mb-6">{u.intro}</p>
        <div className="flex flex-col gap-2.5 mb-6">
          {chosen.map((c) => {
            const done = opened.includes(c.id);
            const res = resourcesRepo.getById(c.id);
            const exists = !!res;
            return (
              <div key={c.id} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  {res ? (
                    <ResourceTile
                      resource={res}
                      onClick={exists ? () => openOne(c.id) : undefined}
                      extra={
                        done ? (
                          <span className="inline-flex items-center gap-1 text-[12px] text-[var(--color-primary)]">
                            <Check size={12} /> {u.opened}
                          </span>
                        ) : undefined
                      }
                    />
                  ) : (
                    <Card>
                      <span className="block text-[15px] text-[var(--color-text)]">{c.title}</span>
                    </Card>
                  )}
                </div>
                {exists && (
                  <Button size="sm" variant={done ? 'secondary' : 'primary'} onClick={() => openOne(c.id)}>
                    <Play size={14} /> {u.open}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        {opened.length >= chosen.length && chosen.length > 0 && <p className="text-[13px] text-[var(--color-text-muted)] mb-3">{u.allOpened}</p>}
        <Button fullWidth onClick={() => navigate(`/zugang/danach/${entry.id}`)}>
          {u.doneCta}
        </Button>
      </div>
    </div>
  );
}

/**
 * "Wie war es danach? (optional)" — shown only after the chosen Ressourcen or
 * Brücke were used (or later from the Rückblick). Completes the already saved
 * pass with the reflection; "hat gerade nicht gepasst" is a full answer too.
 */
export function ZugangAfterPage() {
  const t = useT();
  const a = t.zugang.after;
  const navigate = useNavigate();
  const { entryId } = useParams<{ entryId: string }>();
  const entry = useMemo(() => (entryId ? zugangRepo.getById(entryId) : undefined), [entryId]);
  const [outcome, setOutcome] = useState<'passte' | 'teils' | 'nicht' | null>(entry?.afterOutcome ?? null);
  const [note, setNote] = useState(entry?.reflection ?? '');
  const [harder, setHarder] = useState<string[]>(entry?.harderFactors ?? []);
  const [helped, setHelped] = useState(entry?.whatMightHaveHelped ?? '');
  const [saved, setSaved] = useState(false);
  const bridge = entry?.bridgeId ? bridgesRepo.getById(entry.bridgeId) : undefined;

  if (!entry) {
    return (
      <div className="animate-in">
        <TopBar onBack={() => navigate('/')} />
        <p className="px-5 text-[14px] text-[var(--color-text-muted)]">{a.notFound}</p>
      </div>
    );
  }

  function save() {
    if (!entry) return;
    zugangRepo.save({
      ...entry,
      reflection: note.trim() || undefined,
      afterOutcome: outcome ?? undefined,
      harderFactors: outcome === 'nicht' && harder.length > 0 ? harder : entry.harderFactors,
      whatMightHaveHelped: outcome === 'nicht' && helped.trim() ? helped.trim() : entry.whatMightHaveHelped,
      reflectedAt: new Date().toISOString(),
    });
    clearFollowUp();
    setSaved(true);
  }

  function skip() {
    clearFollowUp();
    navigate('/');
  }

  const outcomes: { key: 'passte' | 'teils' | 'nicht'; label: string }[] = [
    { key: 'passte', label: t.zugang.outcomeGood },
    { key: 'teils', label: t.zugang.outcomePartly },
    { key: 'nicht', label: t.zugang.outcomeNotFit },
  ];

  if (saved) {
    return (
      <div className="animate-in px-6 py-14 flex flex-col items-center text-center gap-5">
        <span className="text-[48px]">🌱</span>
        <div>
          <h1 className="text-[20px] mb-2">{a.saved}</h1>
          <p className="text-[14px] text-[var(--color-text-muted)] max-w-[280px] mx-auto">{a.savedText}</p>
        </div>
        <div className="w-full flex flex-col gap-2.5">
          <Link to="/zugang/rueckblick" className="w-full">
            <Button fullWidth variant="secondary">{t.zugang.reviewCta}</Button>
          </Link>
          <Button fullWidth onClick={() => navigate('/')}>{t.weather.backHome}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <TopBar onBack={skip} />
      <div className="px-5 pb-8">
        <h1 className="text-[22px] mb-2">{a.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed mb-5">{a.intro}</p>

        {((entry.usedResources?.length ?? 0) > 0 || bridge) && (
          <Card className="mb-5">
            <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5">{a.used}</p>
            <div className="flex flex-col gap-2">
              {bridge && <BridgeTile bridge={bridge} compact />}
              {entry.usedResources?.map((r) => {
                const res = resourcesRepo.getById(r.id);
                return res ? <ResourceTile key={r.id} resource={res} compact /> : <p key={r.id} className="text-[14px] text-[var(--color-text)]">• {r.title}</p>;
              })}
            </div>
          </Card>
        )}

        <div className="flex flex-col gap-2 mb-4">
          {outcomes.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setOutcome(outcome === o.key ? null : o.key)}
              aria-pressed={outcome === o.key}
              className="text-left px-4 py-3 rounded-[var(--radius-lg)] border text-[14.5px]"
              style={{
                borderColor: outcome === o.key ? 'var(--color-primary)' : 'var(--color-border)',
                background: outcome === o.key ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                color: 'var(--color-text)',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>

        {outcome === 'nicht' && (
          <Card className="mb-4 animate-in">
            <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed mb-3">{a.notFitNote}</p>
            <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">{t.zugang.harderTitle}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {t.zugang.harderOptions.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setHarder(harder.includes(o) ? harder.filter((x) => x !== o) : [...harder, o])}
                  className="px-3 py-1.5 rounded-full text-[13px]"
                  style={{ background: harder.includes(o) ? 'var(--color-primary)' : 'var(--color-surface-muted)', color: harder.includes(o) ? 'var(--color-surface)' : 'var(--color-text)' }}
                >
                  {o}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] text-[var(--color-text-muted)]">{t.zugang.helpedLabel}</span>
              <textarea className="input" rows={2} placeholder={t.zugang.helpedPlaceholder} value={helped} onChange={(e) => setHelped(e.target.value)} />
            </label>
          </Card>
        )}

        <label className="flex flex-col gap-1.5 mb-5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{a.noteLabel}</span>
          <textarea className="input" rows={3} placeholder={t.zugang.reflectionPlaceholder} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>

        <Button fullWidth onClick={save} data-sound="complete">{a.save}</Button>
        <button type="button" onClick={skip} className="w-full text-center text-[13px] text-[var(--color-text-faint)] underline underline-offset-2 mt-4">
          {a.later}
        </button>
      </div>
    </div>
  );
}
