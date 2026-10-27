import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, FileDown, RefreshCw } from 'lucide-react';
import { RichText } from '../../components/shared/RichText';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { parkNotesRepo, slipColor } from '../parkbox/parkboxRepo';
import { LOG_ICON, budgetSums, formatDate, money, stamp, votesFor, weightSum} from './projectModel';
import { WESEN_CHEERS, defaultQuestions, nextQuestion } from './retro';
import { ProjectSubShell } from './ProjectSubShell';
import { PartyRain } from './PartyRain';
import { KIND_COLOR } from './tiles';
import { ProjectIcon } from './ui';
import type { ProjectApi } from './projectApi';

const dayMs = 86400000;

function Section({ icon, title, count, color, children, open: openInit = false, testId }: { icon: string; title: string; count?: number; color: string; children: ReactNode; open?: boolean; testId?: string }) {
  const [open, setOpen] = useState(openInit);
  return (
    <section className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]" style={{ borderLeft: `5px solid ${color}` }} data-testid={testId}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="w-full flex items-center gap-2 px-3 py-3 text-left">
        {open ? <ChevronDown size={17} className="text-[var(--color-text-muted)]" /> : <ChevronRight size={17} className="text-[var(--color-text-muted)]" />}
        <span aria-hidden="true" className="text-[18px]">{icon}</span>
        <span className="flex-1 text-[16px]">{title}</span>
        {count !== undefined && <span className="text-[13px] text-[var(--color-text-faint)] tabular-nums">{count}</span>}
      </button>
      {open && <div className="px-3 pb-3 text-[14px]">{children}</div>}
    </section>
  );
}

function Tick({ done }: { done: boolean }) {
  return <span aria-hidden="true" className="inline-block w-5 text-center">{done ? '✓' : '○'}</span>;
}

/**
 * Der Rückblick nach „Projekt abschließen“: Jubel, die ganze Reise (wirklich alles, was im Projekt vorkam),
 * und zum Schluss drei freiwillige Fragen zum Nachspüren.
 */
export function ProjectRetro({ api, onShare, onReopen }: { api: ProjectApi; onShare: () => void; onReopen: () => void }) {
  const { p, L, lang, update, go } = api;
  const say = useCompanionSay();
  const [party, setParty] = useState(true);
  const said = useRef(false);

  // Liebe Worte vom Wesen, ruhig nacheinander
  useEffect(() => {
    if (said.current) return;
    said.current = true;
    const lines = WESEN_CHEERS(L, p.title);
    say(lines[0], { joy: true });
    const t1 = window.setTimeout(() => say(lines[1], { joy: true }), 9000);
    const t2 = window.setTimeout(() => say(lines[2], { joy: true }), 19000);
    const t3 = window.setTimeout(() => setParty(false), 5200);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); window.clearTimeout(t3); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = useMemo(() => {
    const tasks = p.blocks.flatMap((b) => (b.kind === 'tasks' ? b.items : []));
    const checks = p.blocks.flatMap((b) => (b.kind === 'checklist' ? b.items : []));
    const milestones = p.blocks.flatMap((b) => (b.kind === 'timeline' ? b.milestones : []));
    const decisions = p.blocks.flatMap((b) => (b.kind === 'decisions' ? b.items : []));
    const risks = p.blocks.flatMap((b) => (b.kind === 'risks' ? b.items : []));
    const images = p.blocks.flatMap((b) => (b.kind === 'images' ? b.items : []));
    const insights = (p.log ?? []).filter((e) => e.kind === 'insight');
    const slips = parkNotesRepo.getAll().filter((n) => n.projectId === p.id);
    const steps = p.steps ?? [];
    const log = [...(p.log ?? [])].sort((a, b) => a.at.localeCompare(b.at));
    const startIso = p.start ? `${p.start}T08:00:00` : p.createdAt;
    const endMs = p.closedAt ? new Date(p.closedAt).getTime() : Date.now();
    const days = Math.max(1, Math.round((endMs - new Date(startIso).getTime()) / dayMs) + 1);
    return { tasks, checks, milestones, decisions, risks, images, insights, slips, steps, log, days };
  }, [p]);

  const [qs, setQs] = useState<string[]>(() => (p.reflections?.length === 3 ? p.reflections.map((r) => r.q) : defaultQuestions(L)));
  const [as, setAs] = useState<string[]>(() => (p.reflections?.length === 3 ? p.reflections.map((r) => r.a) : ['', '', '']));
  const saveTimer = useRef<number | null>(null);
  const persist = (nq: string[], na: string[]) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      update((c) => ({ ...c, reflections: nq.map((q, i) => ({ q, a: na[i] ?? '' })), reflectedAt: na.some((x) => x.trim()) ? new Date().toISOString() : c.reflectedAt }));
    }, 500);
  };
  useEffect(() => () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); }, []);

  const doneTasks = data.tasks.filter((t) => t.status === 'done').length;
  const doneSteps = data.steps.filter((s) => s.done).length;
  const doneMs = data.milestones.filter((m) => m.done).length;
  const doneChecks = data.checks.filter((c) => c.done).length;
  const budgets = p.blocks.flatMap((b) => (b.kind === 'budget' ? [b] : []));
  const c = p.color;
  const people = (ids: string[]) => ids.map((i) => p.people.find((x) => x.id === i)?.name).filter(Boolean).join(', ');

  const stat = (icon: string, value: string, label: string) => (
    <div className="rounded-2xl px-3 py-2.5 text-center" style={{ background: `color-mix(in srgb, ${c} 10%, var(--color-surface))`, border: `1px solid color-mix(in srgb, ${c} 35%, transparent)` }}>
      <div className="text-[18px]" aria-hidden="true">{icon}</div>
      <div className="text-[20px] leading-tight tabular-nums" style={{ color: c }}>{value}</div>
      <div className="text-[11.5px] text-[var(--color-text-muted)]">{label}</div>
    </div>
  );

  return (
    <ProjectSubShell api={api} current="rueckblick" kind="all" icon="🏆" title={L('Rückblick', 'Looking back')} color={c}>
      {party && <PartyRain />}
      <div className="flex flex-col gap-4" data-testid="project-retro">
        <header className="rounded-3xl p-4 text-center" style={{ background: `linear-gradient(160deg, color-mix(in srgb, ${c} 22%, var(--color-surface)), color-mix(in srgb, #e8a83d 14%, var(--color-surface)))`, border: `2px solid ${c}` }} data-testid="retro-hero">
          <div className="flex justify-center mb-1"><InlineCompanionNote joyBurst="dance" /></div>
          <div className="mx-auto w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center mb-1" style={{ background: `${c}26`, border: `2px solid ${c}` }} aria-hidden="true"><ProjectIcon p={p} size={32} /></div>
          <p className="text-[24px] leading-tight break-words">🎉 {L('Geschafft!', 'Done!')}</p>
          <p className="text-[17px] mt-0.5 break-words">{p.title || L('Dein Projekt', 'Your project')}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
            {p.closedAt ? L(`Abgeschlossen am ${new Date(p.closedAt).toLocaleDateString('de-DE')}`, `Completed on ${new Date(p.closedAt).toLocaleDateString('en-US')}`) : ''}
            {p.closedAt ? ' · ' : ''}{L(`${data.days} Tag${data.days === 1 ? '' : 'e'} unterwegs`, `${data.days} day${data.days === 1 ? '' : 's'} on the way`)}
          </p>
          <p className="text-[13.5px] text-[var(--color-text)] mt-2 leading-relaxed">{L('Du musst hier nichts mehr tun. Schau dir an, was du alles gemacht hast – und beantworte unten, wenn du magst, drei Fragen.', 'You don’t have to do anything here. Look at everything you did – and, if you like, answer three questions below.')}</p>
        </header>

        <div className="grid grid-cols-3 gap-2" data-testid="retro-stats">
          {data.steps.length > 0 && stat('➡️', `${doneSteps}/${data.steps.length}`, L('Schritte', 'Steps'))}
          {(data.tasks.length + data.checks.length) > 0 && stat('✅', `${doneTasks + doneChecks}/${data.tasks.length + data.checks.length}`, L('Aufgaben', 'Tasks'))}
          {data.milestones.length > 0 && stat('🏁', `${doneMs}/${data.milestones.length}`, L('Meilensteine', 'Milestones'))}
          {data.decisions.length > 0 && stat('🗣️', String(data.decisions.length), L('Entscheidungen', 'Decisions'))}
          {data.insights.length > 0 && stat('💡', String(data.insights.length), L('Erkenntnisse', 'Insights'))}
          {data.slips.length > 0 && stat('🗒️', String(data.slips.length), L('Zettel', 'Slips'))}
          {p.people.length > 0 && stat('🧑‍🤝‍🧑', String(p.people.length), L('Beteiligte', 'People'))}
          {data.images.length > 0 && stat('🖼️', String(data.images.length), L('Bilder', 'Pictures'))}
          {(p.log ?? []).length > 0 && stat('📖', String((p.log ?? []).length), L('Protokoll-Einträge', 'Log entries'))}
          {stat('📅', String(data.days), L('Tage', 'Days'))}
        </div>

        {p.summary.trim() && (
          <Section icon="🎯" title={L('Worum es ging', 'What it was about')} color={KIND_COLOR.text} open testId="retro-summary"><p className="whitespace-pre-line">{p.summary}</p></Section>
        )}

        {data.milestones.length > 0 && (
          <Section icon="🏁" title={L('Meilensteine', 'Milestones')} count={data.milestones.length} color={KIND_COLOR.timeline} open testId="retro-milestones">
            <ul className="flex flex-col gap-1.5">
              {[...data.milestones].sort((a, b) => (a.date ?? '9').localeCompare(b.date ?? '9')).map((m) => (
                <li key={m.id}>
                  <Tick done={m.done} /> <span className={m.done ? '' : 'text-[var(--color-text-muted)]'}>{m.title || '…'}</span>{m.date && <span className="text-[12px] text-[var(--color-text-faint)]"> · {formatDate(m.date, lang, false)}</span>}
                  {m.steps.length > 0 && <ul className="pl-6 text-[13px] text-[var(--color-text-muted)]">{m.steps.map((s) => <li key={s.id}><Tick done={s.done} /> {s.text}</li>)}</ul>}
                  {m.note?.trim() && <p className="pl-6 text-[12.5px] text-[var(--color-text-faint)]">{m.note}</p>}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {data.steps.length > 0 && (
          <Section icon="➡️" title={L('Nächste Schritte', 'Next steps')} count={data.steps.length} color={KIND_COLOR.steps} testId="retro-steps">
            <ul className="flex flex-col gap-1">{data.steps.map((s) => <li key={s.id}><Tick done={s.done} /> {s.text}{s.done && s.doneAt && <span className="text-[11.5px] text-[var(--color-text-faint)]"> · {stamp(s.doneAt, lang)}</span>}</li>)}</ul>
          </Section>
        )}

        {data.tasks.length > 0 && (
          <Section icon="✅" title={L('Aufgaben', 'Tasks')} count={data.tasks.length} color={KIND_COLOR.tasks} testId="retro-tasks">
            <ul className="flex flex-col gap-1">{data.tasks.map((t) => <li key={t.id}><Tick done={t.status === 'done'} /> {t.text}{t.who && <span className="text-[12px] text-[var(--color-text-faint)]"> · {p.people.find((x) => x.id === t.who)?.name ?? L('Ich', 'Me')}</span>}{t.due && <span className="text-[12px] text-[var(--color-text-faint)]"> · {formatDate(t.due, lang, false)}</span>}</li>)}</ul>
          </Section>
        )}

        {data.checks.length > 0 && (
          <Section icon="🧺" title={L('Checklisten', 'Checklists')} count={data.checks.length} color={KIND_COLOR.checklist} testId="retro-checks">
            <ul className="flex flex-col gap-1">{data.checks.map((t) => <li key={t.id}><Tick done={t.done} /> {t.text}</li>)}</ul>
          </Section>
        )}

        {data.decisions.length > 0 && (
          <Section icon="🗣️" title={L('Entscheidungen & Absprachen', 'Decisions & agreements')} count={data.decisions.length} color={KIND_COLOR.decisions} testId="retro-decisions">
            <ul className="flex flex-col gap-1.5">{data.decisions.map((d) => <li key={d.id}>{d.text}<span className="text-[12px] text-[var(--color-text-faint)]"> · {formatDate(d.date, lang, false)}</span>{d.note && <p className="text-[12.5px] text-[var(--color-text-muted)]">{d.note}</p>}</li>)}</ul>
          </Section>
        )}

        {data.insights.length > 0 && (
          <Section icon="💡" title={L('Erkenntnisse', 'Insights')} count={data.insights.length} color="#e8a83d" open testId="retro-insights">
            <ul className="flex flex-col gap-1.5">{data.insights.map((e) => <li key={e.id}>{e.text}<span className="text-[11.5px] text-[var(--color-text-faint)]"> · {stamp(e.at, lang)}</span></li>)}</ul>
          </Section>
        )}

        {p.blocks.some((b) => b.kind === 'poll' || b.kind === 'proscons') && (
          <Section icon="⚖️" title={L('Abgewogen & abgestimmt', 'Weighed & voted')} color={KIND_COLOR.proscons} testId="retro-weighed">
            <div className="flex flex-col gap-3">
              {p.blocks.map((b) => {
                if (b.kind === 'poll') {
                  const winner = b.options.find((o) => o.id === b.decided);
                  return (
                    <div key={b.id}>
                      <p className="text-[13px] text-[var(--color-text-muted)]">🗳️ {b.question || b.title}</p>
                      <ul>{b.options.map((o) => <li key={o.id}>{o.id === b.decided ? '✓' : '·'} {o.text} <span className="text-[12px] text-[var(--color-text-faint)]">({votesFor(b, o.id).length})</span></li>)}</ul>
                      {winner && <p className="text-[12.5px]" style={{ color: c }}>{L('Entschieden:', 'Decided:')} {winner.text}</p>}
                    </div>
                  );
                }
                if (b.kind === 'proscons') {
                  return (
                    <div key={b.id}>
                      <p className="text-[13px] text-[var(--color-text-muted)]">⚖️ {b.title} · +{weightSum(b.pros)} / −{weightSum(b.cons)}</p>
                      <p className="text-[13px]">+ {b.pros.map((x) => x.text).join(' · ') || '—'}</p>
                      <p className="text-[13px]">− {b.cons.map((x) => x.text).join(' · ') || '—'}</p>
                      {b.verdict?.trim() && <p className="text-[12.5px]" style={{ color: c }}>{b.verdict}</p>}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </Section>
        )}

        {budgets.length > 0 && (
          <Section icon="💰" title={L('Finanzen', 'Money')} color={KIND_COLOR.budget} testId="retro-budget">
            {budgets.map((b) => {
              const s = budgetSums(b);
              return (
                <div key={b.id} className="mb-2">
                  <p>{L('Einnahmen', 'Income')}: {money(s.income, b.currency, lang)} · {L('Kosten', 'Costs')}: {money(s.cost, b.currency, lang)} · {L('Bilanz', 'Balance')}: <strong>{money(s.balance, b.currency, lang)}</strong></p>
                  <ul className="text-[13px] text-[var(--color-text-muted)]">{b.items.map((i) => <li key={i.id}>{i.type === 'cost' ? '−' : '+'} {i.label} {money(i.amount, b.currency, lang)}{i.type === 'cost' && i.paid ? ' ✓' : ''}</li>)}</ul>
                </div>
              );
            })}
          </Section>
        )}

        {data.risks.length > 0 && (
          <Section icon="⚠️" title={L('Risiken & Plan B', 'Risks & plan B')} count={data.risks.length} color={KIND_COLOR.risks} testId="retro-risks">
            <ul className="flex flex-col gap-1">{data.risks.map((r) => <li key={r.id}><Tick done={!!r.solved} /> {r.text}{r.planB && <span className="text-[12.5px] text-[var(--color-text-muted)]"> → {r.planB}</span>}</li>)}</ul>
          </Section>
        )}

        {(p.people.length > 0 || p.roles.length > 0) && (
          <Section icon="🧑‍🤝‍🧑" title={L('Beteiligte & Rollen', 'People & roles')} count={p.people.length} color={KIND_COLOR.team} testId="retro-team">
            <ul className="flex flex-col gap-1">{p.people.map((x) => <li key={x.id}>👤 {x.name}{x.availability && <span className="text-[12px] text-[var(--color-text-faint)]"> · {x.availability}</span>}</li>)}</ul>
            {p.roles.length > 0 && <ul className="mt-2 flex flex-col gap-1">{p.roles.map((r) => <li key={r.id} className="text-[13px]">🎭 <strong>{r.title}</strong>{people(r.personIds) ? ` – ${people(r.personIds)}` : ''}{r.does ? `: ${r.does}` : ''}</li>)}</ul>}
          </Section>
        )}

        {data.slips.length > 0 && (
          <Section icon="🗒️" title={L('Zettel des Projekts', 'Slips of the project')} count={data.slips.length} color={KIND_COLOR.box} testId="retro-slips">
            <ul className="flex flex-col gap-1.5">{data.slips.map((n) => <li key={n.id} className="rounded px-2.5 py-1.5" style={{ background: slipColor(n).bg, color: slipColor(n).ink }}>{n.text}</li>)}</ul>
          </Section>
        )}

        {p.blocks.some((b) => (b.kind === 'text' && b.text.trim()) || b.note?.trim()) && (
          <Section icon="📝" title={L('Texte & Notizen', 'Texts & notes')} color={KIND_COLOR.text} testId="retro-notes">
            <div className="flex flex-col gap-3">
              {p.blocks.map((b) => (
                <div key={b.id}>
                  {((b.kind === 'text' && b.text.trim()) || b.note?.trim()) && <p className="text-[12.5px] text-[var(--color-text-faint)] mb-0.5">{b.title}</p>}
                  {b.kind === 'text' && b.text.trim() && <RichText text={b.text} />}
                  {b.note?.trim() && <div className="rounded-xl bg-[var(--color-surface-muted)] px-3 py-2 text-[13px]"><RichText text={b.note} /></div>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {data.images.length > 0 && (
          <Section icon="🖼️" title={L('Bilder', 'Pictures')} count={data.images.length} color={KIND_COLOR.images} testId="retro-images">
            <div className="grid grid-cols-3 gap-2">{data.images.map((im) => <figure key={im.id}><img src={im.src} alt={im.caption ?? ''} className="w-full aspect-square object-cover rounded-lg" />{im.caption && <figcaption className="text-[11.5px] text-[var(--color-text-faint)]">{im.caption}</figcaption>}</figure>)}</div>
          </Section>
        )}

        {data.log.length > 0 && (
          <Section icon="📖" title={L('Die ganze Reise (Protokoll)', 'The whole journey (log)')} count={data.log.length} color={KIND_COLOR.log} testId="retro-log">
            <ol className="flex flex-col gap-1">{data.log.map((e) => <li key={e.id} className="text-[13.5px]"><span className="text-[11.5px] text-[var(--color-text-faint)] mr-2 tabular-nums">{stamp(e.at, lang)}</span>{LOG_ICON[e.kind]} {e.text}</li>)}</ol>
          </Section>
        )}

        {/* drei Fragen */}
        <section className="rounded-3xl p-4" style={{ background: `color-mix(in srgb, ${c} 8%, var(--color-surface))`, border: `1.5px solid color-mix(in srgb, ${c} 45%, transparent)` }} data-testid="retro-questions">
          <h2 className="text-[19px] mb-1">🌙 {L('Zum Schluss: drei Fragen', 'To finish: three questions')}</h2>
          <p className="text-[13px] text-[var(--color-text-muted)] mb-3 leading-relaxed">{L('Nur für dich. Nichts davon ist Pflicht – schreib, was kommt, oder lass es leer. Wenn eine Frage gerade nicht passt, kannst du sie tauschen.', 'Just for you. None of it is required – write what comes, or leave it empty. If a question doesn’t fit right now, you can swap it.')}</p>
          <div className="flex flex-col gap-4">
            {qs.map((q, i) => (
              <div key={i}>
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-[14.5px] leading-snug" data-testid={`retro-q-${i}`}>{i + 1}. {q}</p>
                  <button type="button" onClick={() => { const nq = qs.map((x, k) => (k === i ? nextQuestion(i, x, L) : x)); setQs(nq); persist(nq, as); }} className="shrink-0 inline-flex items-center gap-1 text-[12px] px-2 py-1 rounded-full border border-[var(--color-border-strong)] text-[var(--color-text-muted)]" data-testid={`retro-swap-${i}`}><RefreshCw size={12} />{L('andere Frage', 'other question')}</button>
                </div>
                <textarea className="input mt-1.5" rows={3} value={as[i] ?? ''} onChange={(e) => { const na = as.map((x, k) => (k === i ? e.target.value : x)); setAs(na); persist(qs, na); }} placeholder={L('Was kommt dir dazu?', 'What comes to mind?')} aria-label={q} data-testid={`retro-a-${i}`} />
              </div>
            ))}
          </div>
          <p className="text-[12px] text-[var(--color-text-faint)] mt-3">{L('Wird automatisch gespeichert und steht im PDF dieses Projekts, wenn du es erzeugst.', 'Saved automatically and included in this project’s PDF if you create one.')}</p>
        </section>

        <div className="flex flex-col gap-2">
          <button type="button" onClick={onShare} className="inline-flex items-center justify-center gap-2 py-3 rounded-full text-white text-[15px]" style={{ background: 'var(--color-primary)' }} data-testid="retro-pdf"><FileDown size={17} />{L('Rückblick als PDF / teilen', 'Looking back as PDF / share')}</button>
          <button type="button" onClick={() => go('alles')} className="py-2.5 rounded-full border border-[var(--color-border-strong)] text-[14px]" data-testid="retro-all">{L('Alles im Detail ansehen', 'See everything in detail')}</button>
          <button type="button" onClick={onReopen} className="py-2 text-[13px] text-[var(--color-text-muted)] underline" data-testid="retro-reopen">{L('Doch noch nicht fertig? Projekt wieder öffnen', 'Not finished after all? Reopen the project')}</button>
        </div>
      </div>
    </ProjectSubShell>
  );
}
