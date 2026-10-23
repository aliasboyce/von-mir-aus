import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, History, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useSettings } from '../../state/SettingsContext';
import { GardenPage } from '../garden/GardenPage';
import { RoutineCard3D } from './RoutineCard3D';
import { ENERGY_COLORS, energyOptions, formatDuration, routinesRepo, runsFor, type Routine, releaseRoutineFiles } from './routinesRepo';
import { ROUTINE_TEMPLATES, routineFromTemplate } from './routineTemplates';
import { useRoutineTexts } from './routineTexts';

/**
 * "Routinen & mein Garten": on top the routines (cards played one after another), below the garden
 * that used to be a page of its own. A routine card can tick a garden item automatically.
 */
export function RoutinesGardenPage() {
  const rt = useRoutineTexts();
  const { settings } = useSettings();
  const lang = settings.language === 'en' ? 'en' : 'de';
  const navigate = useNavigate();
  const [routines, setRoutines] = useState<Routine[]>(() => routinesRepo.getAll().sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [tplOpen, setTplOpen] = useState(false);
  const [tplAdded, setTplAdded] = useState<string | null>(null);
  const refresh = () => setRoutines(routinesRepo.getAll().sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
  const exampleCount = routines.filter((r) => r.isExample).length;

  function remove(r: Routine) {
    if (!window.confirm(rt.removeConfirm)) return;
    routinesRepo.remove(r.id);
    releaseRoutineFiles(r.cards);
    refresh();
  }
  function addTemplate(key: string) {
    const t = ROUTINE_TEMPLATES.find((x) => x.key === key);
    if (!t) return;
    routinesRepo.save(routineFromTemplate(t, lang));
    setTplAdded(key);
    refresh();
  }
  function removeExamples() {
    routines.filter((r) => r.isExample).forEach((r) => { routinesRepo.remove(r.id); releaseRoutineFiles(r.cards); });
    refresh();
  }

  return (
    <div className="animate-in">
      <TopBar action={<HelpButton helpKey="garten" />} />
      <div className="px-5 pb-6">
        <h1 className="text-[24px] mb-1 text-center">{rt.pageTitle}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-2 text-center">{rt.pageSub}</p>
        <p className="text-[12.5px] text-[var(--color-text-faint)] mb-5 text-center leading-relaxed" data-hint>{rt.intro}</p>

        <Button fullWidth icon={<Plus size={17} />} onClick={() => navigate('/entdecken/routinen/neu')} className="mb-5" data-testid="routine-new">
          {rt.newRoutine}
        </Button>

        <div className="mb-6" data-testid="routine-templates">
          <button type="button" onClick={() => setTplOpen((o) => !o)} aria-expanded={tplOpen} className="w-full flex items-center justify-between text-left rounded-[var(--radius-lg)] px-4 py-3 bg-[var(--color-surface-muted)]" data-testid="routine-templates-toggle">
            <span>
              <span className="block text-[14.5px] text-[var(--color-text)]">{rt.tplTitle}</span>
              <span className="block text-[12px] text-[var(--color-text-faint)]">{rt.tplSub}</span>
            </span>
            {tplOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {tplOpen && (
            <div className="flex flex-col gap-2 mt-2 animate-in">
              {ROUTINE_TEMPLATES.map((t) => (
                <div key={t.key} className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 border border-[var(--color-border)]" data-testid={`tpl-${t.key}`}>
                  <span className="text-[22px] w-8 text-center">{t.emoji}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14px] text-[var(--color-text)]">{lang === 'en' ? t.en : t.de}</span>
                    <span className="block text-[12px] text-[var(--color-text-muted)] leading-snug">{lang === 'en' ? t.deen : t.dede} · {t.cards.length} {rt.cards}</span>
                  </span>
                  <Button size="sm" variant="secondary" onClick={() => addTemplate(t.key)} data-testid={`tpl-add-${t.key}`}>{rt.tplAdd}</Button>
                </div>
              ))}
              {tplAdded && <p className="text-[12.5px] text-[var(--color-primary)]" role="status" data-testid="tpl-added">{rt.tplAdded}</p>}
            </div>
          )}
        </div>

        <h2 className="text-[18px] mb-3">{rt.routinesTitle}</h2>
        {exampleCount > 0 && (
          <div className="rounded-[var(--radius-lg)] px-4 py-3 mb-4 text-[13px] text-[var(--color-text-muted)] leading-relaxed" style={{ border: '1.5px dashed var(--color-border-strong)', background: 'var(--color-surface-muted)' }} data-testid="routine-examples-banner">
            <p data-hint className="mb-2">{rt.exampleNote}</p>
            <button type="button" onClick={removeExamples} className="text-[13px] text-[var(--color-danger)] underline underline-offset-2" data-testid="routine-delete-examples">
              {rt.deleteExamples} ({exampleCount})
            </button>
          </div>
        )}
        {routines.length === 0 ? (
          <p className="text-[13.5px] text-[var(--color-text-muted)] mb-6 leading-relaxed">{rt.empty}</p>
        ) : (
          <div className="flex flex-col gap-3 mb-8">
            {routines.map((r) => {
              const runs = runsFor(r.id);
              const avg = runs.length > 0 ? Math.round(runs.reduce((s, x) => s + x.durationSec, 0) / runs.length) : 0;
              const max = Math.max(1, ...runs.slice(0, 7).map((x) => x.durationSec));
              return (
                <Card key={r.id} padding="md" data-testid={`routine-${r.id}`}>
                  <div className="flex items-center gap-3">
                    <div style={{ width: 70, height: 70 }} className="flex-shrink-0">
                      <RoutineCard3D card={{ text: '', emoji: r.emoji, color: r.color, polaroid: r.polaroid }} noSymbol={r.noSymbol} size="tiny" className="h-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15.5px] font-medium text-[var(--color-text)] leading-snug [overflow-wrap:anywhere]">
                        {r.title}
                        {r.isExample && <span className="ml-2 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full align-middle" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-faint)' }}>{rt.example}</span>}
                      </p>
                      <p className="text-[12.5px] text-[var(--color-text-muted)]">{r.cards.length} {rt.cards}{r.alternativeFor ? ` · ↔ ${r.alternativeFor}` : ''}{r.newStrategy ? ` · 🌿 ${r.newStrategy}` : ''}{r.forObstacle ? ` · 🚧 ${r.forObstacle}` : ''}</p>
                      {(() => {
                        const opts = energyOptions(r.cards);
                        if (opts.length < 2) return null;
                        return (
                          <p className="text-[12px] text-[var(--color-text-muted)] flex items-center gap-1.5 flex-wrap mt-0.5" data-testid={`routine-ampel-${r.id}`}>
                            {opts.map((o, i) => (
                              <span key={o.level} className="inline-flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: ENERGY_COLORS[o.level] }} aria-hidden="true" />
                                {i === 0 ? `${rt.energyHard}: ${rt.energyHardSub.toLowerCase()}` : i === opts.length - 1 ? rt.energyAll : rt.energyMid} ({o.count})
                              </span>
                            ))}
                          </p>
                        );
                      })()}
                      {runs[0] && <p className="text-[12px] text-[var(--color-text-faint)]">{rt.last}: {formatDuration(runs[0].durationSec, lang)}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" icon={<Play size={14} />} onClick={() => navigate(`/entdecken/routinen/${r.id}/start`)} data-testid={`routine-start-${r.id}`}>{rt.start}</Button>
                    <div className="flex-1" />
                    <button type="button" onClick={() => setHistoryId(historyId === r.id ? null : r.id)} aria-label={rt.history} className="p-2 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"><History size={16} /></button>
                    <button type="button" onClick={() => navigate(`/entdecken/routinen/${r.id}/bearbeiten`)} aria-label={rt.edit} className="p-2 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]" data-testid={`routine-edit-${r.id}`}><Pencil size={16} /></button>
                    <button type="button" onClick={() => remove(r)} aria-label={rt.remove} className="p-2 rounded-full text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"><Trash2 size={16} /></button>
                  </div>
                  {historyId === r.id && (
                    <div className="mt-3 pt-3 border-t border-[var(--color-border)] animate-in" data-testid="routine-history">
                      {runs.length === 0 ? (
                        <p className="text-[12.5px] text-[var(--color-text-faint)]">{rt.noRuns}</p>
                      ) : (
                        <>
                          <p className="text-[12.5px] text-[var(--color-text-muted)] mb-2">{rt.avg}: {formatDuration(avg, lang)} · {runs.length}×</p>
                          <div className="flex flex-col gap-1.5">
                            {runs.slice(0, 7).map((x) => (
                              <div key={x.id} className="flex items-center gap-2 text-[12px] text-[var(--color-text-muted)]">
                                <span className="w-[74px] flex-shrink-0">{new Date(x.endedAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'de-DE', { day: '2-digit', month: '2-digit' })} {new Date(x.endedAt).toLocaleTimeString(lang === 'en' ? 'en-US' : 'de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="h-2 rounded-full" style={{ width: `${Math.max(6, (x.durationSec / max) * 100)}%`, maxWidth: '55%', background: r.color }} />
                                <span className="tabular-nums">{formatDuration(x.durationSec, lang)}</span>
                                {x.energy && <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ background: ENERGY_COLORS[x.energy] }} title={rt.energyRan} aria-hidden="true" />}
                              </div>
                            ))}
                          </div>
                          <Link to="/wochenrueckblick" className="text-[12.5px] text-[var(--color-primary)] underline underline-offset-2 inline-block mt-2">{rt.toReview}</Link>
                        </>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <div className="pt-6 border-t border-[var(--color-border)]">
          <GardenPage embedded />
        </div>
      </div>
    </div>
  );
}

