import { Share2 } from 'lucide-react';
import { shareOrCopy } from '../../../services/shareOrCopy';
import { dayKey } from '../../calendar/calendarRepo';
import { ME, newBlock, newId, votesFor, type DecisionsBlock, type PollBlock } from '../projectModel';
import { AddRow, DelBtn, Empty, SmallLabel, chipCls, chipOn, type BlockProps } from '../ui';

/** Umfrage: für Absprachen mit anderen – oder nur für dich selbst */
export function BlockPoll({ block, project, L, onChange, onProject }: BlockProps<PollBlock>) {
  const voters = block.solo ? [{ id: ME, name: L('Ich', 'Me') }] : [{ id: ME, name: L('Ich', 'Me') }, ...project.people.map((p) => ({ id: p.id, name: p.name || '…' }))];
  const total = Math.max(1, Object.values(block.votes).filter((v) => v.length > 0).length);
  const setVote = (voter: string, optionId: string) => {
    const has = (block.votes[voter] ?? []).includes(optionId);
    onChange({ ...block, votes: { ...block.votes, [voter]: has ? [] : [optionId] } });
  };
  const patchOpt = (id: string, text: string) => onChange({ ...block, options: block.options.map((o) => (o.id === id ? { ...o, text } : o)) });
  const decided = block.options.find((o) => o.id === block.decided);

  function toDecisions() {
    if (!decided) return;
    const text = `${block.question ? `${block.question}: ` : ''}${decided.text}`;
    onProject((pr) => {
      const blocks = [...pr.blocks];
      let idx = blocks.findIndex((b) => b.kind === 'decisions');
      if (idx < 0) {
        blocks.push(newBlock('decisions', L('Entscheidungen & Absprachen', 'Decisions & agreements')));
        idx = blocks.length - 1;
      }
      const d = blocks[idx] as DecisionsBlock;
      if (!d.items.some((x) => x.text === text)) blocks[idx] = { ...d, items: [...d.items, { id: newId('d'), text, date: dayKey(new Date()) }] };
      return { ...pr, blocks };
    });
  }
  async function share() {
    const lines = [block.question || L('Umfrage', 'Poll'), ...block.options.filter((o) => o.text.trim()).map((o, i) => `${i + 1}) ${o.text}`), '', L('Antworte einfach mit der Nummer.', 'Just answer with the number.')];
    await shareOrCopy({ title: block.question || L('Umfrage', 'Poll'), text: lines.join('\n') }, L('Die Umfrage ist kopiert. Du kannst sie jetzt einfügen.', 'The poll is copied. You can paste it now.'));
  }

  return (
    <div data-testid="poll">
      <input className="input mb-2" value={block.question} placeholder={L('Die Frage, z. B. „Wann treffen wir uns?“', 'The question, e.g. "When do we meet?"')} onChange={(e) => onChange({ ...block, question: e.target.value })} data-testid="poll-question" />
      <div className="flex gap-1.5 mb-3">
        <button type="button" onClick={() => onChange({ ...block, solo: true })} aria-pressed={block.solo} className={chipCls(block.solo)} style={block.solo ? chipOn : undefined} data-testid="poll-solo">{L('Nur für mich', 'Just for me')}</button>
        <button type="button" onClick={() => onChange({ ...block, solo: false })} aria-pressed={!block.solo} className={chipCls(!block.solo)} style={!block.solo ? chipOn : undefined} data-testid="poll-group">{L('Mit anderen', 'With others')}</button>
      </div>
      {!block.solo && project.people.length === 0 && <p className="text-[12.5px] text-[var(--color-text-muted)] mb-2">{L('Füge im Baustein „Team & Rollen“ Personen hinzu, dann kannst du ihre Antworten festhalten.', 'Add people in the "Team & roles" block, then you can record their answers.')}</p>}
      {block.options.length === 0 && <Empty>{L('Noch keine Antwortmöglichkeit.', 'No answer option yet.')}</Empty>}
      <ul className="flex flex-col gap-2">
        {block.options.map((o, i) => {
          const vs = votesFor(block, o.id);
          const isDecided = block.decided === o.id;
          return (
            <li key={o.id} className="rounded-[var(--radius-md)] px-2.5 py-2" style={{ background: isDecided ? 'var(--color-primary-soft)' : 'var(--color-surface-muted)' }} data-testid={`poll-opt-${o.id}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] text-[var(--color-text-faint)] w-4">{i + 1}</span>
                <input className="flex-1 min-w-0 bg-transparent outline-none text-[14.5px] py-1" value={o.text} placeholder={L('Antwortmöglichkeit', 'Answer option')} onChange={(e) => patchOpt(o.id, e.target.value)} data-testid={`poll-opt-text-${i}`} />
                <span className="text-[12px] text-[var(--color-text-muted)] shrink-0" data-testid={`poll-count-${i}`}>{vs.length}</span>
                {block.options.length > 2 && <DelBtn onClick={() => onChange({ ...block, options: block.options.filter((x) => x.id !== o.id), votes: Object.fromEntries(Object.entries(block.votes).map(([k, v]) => [k, v.filter((x) => x !== o.id)])), decided: block.decided === o.id ? undefined : block.decided })} L={L} />}
              </div>
              <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden my-1"><div className="h-full" style={{ width: `${(vs.length / total) * 100}%`, background: 'var(--color-primary)' }} /></div>
              <div className="flex flex-wrap gap-1.5 items-center">
                {voters.map((v) => {
                  const on = (block.votes[v.id] ?? []).includes(o.id);
                  return <button key={v.id} type="button" onClick={() => setVote(v.id, o.id)} aria-pressed={on} className={chipCls(on)} style={on ? chipOn : undefined} data-testid={`poll-vote-${i}-${v.id}`}>{block.solo ? (on ? L('Meine Wahl ✓', 'My choice ✓') : L('Das wähle ich', 'I choose this')) : v.name}</button>;
                })}
                <button type="button" onClick={() => onChange({ ...block, decided: isDecided ? undefined : o.id })} aria-pressed={isDecided} className="ml-auto text-[12.5px] underline underline-offset-2 text-[var(--color-primary)]" data-testid={`poll-decide-${i}`}>{isDecided ? L('Entscheidung ✓', 'Decided ✓') : L('Das nehmen wir', 'We take this')}</button>
              </div>
            </li>
          );
        })}
      </ul>
      <AddRow placeholder={L('Weitere Antwortmöglichkeit …', 'Another answer option …')} onAdd={(text) => onChange({ ...block, options: [...block.options, { id: newId('o'), text }] })} testId="poll-new" />
      <div className="flex gap-2 mt-3 flex-wrap">
        {decided && <button type="button" onClick={toDecisions} className={chipCls(false)} data-testid="poll-to-decisions">📌 {L('In „Entscheidungen“ festhalten', 'Record in "Decisions"')}</button>}
        {!block.solo && <button type="button" onClick={() => void share()} className={`${chipCls(false)} inline-flex items-center gap-1`} data-testid="poll-share"><Share2 size={13} />{L('Frage an andere schicken', 'Send the question to others')}</button>}
      </div>
      {!block.solo && <p className="text-[11.5px] text-[var(--color-text-faint)] mt-1.5"><SmallLabel>{L('Die App hat keinen Server: Die Antworten der anderen trägst du selbst ein.', 'The app has no server: you enter the others’ answers yourself.')}</SmallLabel></p>}
    </div>
  );
}
