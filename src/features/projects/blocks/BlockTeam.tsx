import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { networkRepo } from '../../safetyNet/networkRepo';
import { newId, type ProjectRole, type TeamBlock } from '../projectModel';
import { AddRow, DelBtn, Empty, SmallLabel, chipCls, chipOn, type BlockProps } from '../ui';

/** Team & Rollen: Personen (frei oder aus dem Netzwerk) und wer welche Rolle übernimmt */
export function BlockTeam({ project, L, onProject }: BlockProps<TeamBlock>) {
  const [pick, setPick] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const setPerson = (id: string, p: Partial<(typeof project.people)[number]>) => onProject((pr) => ({ ...pr, people: pr.people.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  const setRole = (id: string, p: Partial<ProjectRole>) => onProject((pr) => ({ ...pr, roles: pr.roles.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  const net = pick ? networkRepo.getAll().filter((n) => !project.people.some((p) => p.networkId === n.id)) : [];

  return (
    <div>
      <SmallLabel>{L('Wer macht mit?', 'Who takes part?')}</SmallLabel>
      {project.people.length === 0 && <Empty>{L('Noch niemand. Du kannst Namen eintippen oder Menschen aus deinem Netzwerk dazunehmen.', 'Nobody yet. Type names or add people from your network.')}</Empty>}
      <ul className="flex flex-col gap-1.5">
        {project.people.map((p) => {
          const open = openId === p.id;
          return (
            <li key={p.id} className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-2.5 py-1.5" data-testid={`person-${p.id}`}>
              <div className="flex items-center gap-1.5">
                <span aria-hidden="true">🙂</span>
                <input className="flex-1 min-w-0 bg-transparent outline-none text-[14.5px] py-1.5" value={p.name} onChange={(e) => setPerson(p.id, { name: e.target.value })} aria-label={L('Name', 'Name')} data-testid={`person-name-${p.id}`} />
                <button type="button" onClick={() => setOpenId(open ? null : p.id)} aria-expanded={open} className="text-[12px] px-2 py-1 text-[var(--color-text-muted)] underline underline-offset-2" data-testid={`person-more-${p.id}`}>{L('Mehr', 'More')}</button>
                <DelBtn onClick={() => onProject((pr) => ({ ...pr, people: pr.people.filter((x) => x.id !== p.id), roles: pr.roles.map((r) => ({ ...r, personIds: r.personIds.filter((i) => i !== p.id) })) }))} L={L} testId={`person-del-${p.id}`} />
              </div>
              {open && (
                <div className="flex flex-col gap-1.5 pb-1">
                  <input className="input !h-9 text-[13px]" value={p.availability ?? ''} placeholder={L('Wann hat die Person Zeit?', 'When does this person have time?')} onChange={(e) => setPerson(p.id, { availability: e.target.value })} />
                  <input className="input !h-9 text-[13px]" value={p.contact ?? ''} placeholder={L('Kontakt (z. B. WhatsApp)', 'Contact (e.g. WhatsApp)')} onChange={(e) => setPerson(p.id, { contact: e.target.value })} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <AddRow placeholder={L('Name …', 'Name …')} onAdd={(name) => onProject((pr) => ({ ...pr, people: [...pr.people, { id: newId('pp'), name }] }))} testId="person-new" />
      <button type="button" onClick={() => setPick(true)} className="mt-2 inline-flex items-center gap-1.5 text-[13.5px] text-[var(--color-primary)]" data-testid="person-from-network"><UserPlus size={15} />{L('Aus meinem Netzwerk', 'From my network')}</button>

      <div className="mt-5">
        <SmallLabel>{L('Rollen: wer übernimmt was?', 'Roles: who does what?')}</SmallLabel>
        {project.roles.length === 0 && <Empty>{L('z. B. Organisation, Finanzen, Kommunikation, Technik.', 'e.g. organisation, finances, communication, technology.')}</Empty>}
        <ul className="flex flex-col gap-2">
          {project.roles.map((r) => (
            <li key={r.id} className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-2.5 py-2" data-testid={`role-${r.id}`}>
              <div className="flex items-center gap-1.5">
                <input className="flex-1 min-w-0 bg-transparent outline-none text-[14.5px] py-1" style={{ fontWeight: 600 }} value={r.title} placeholder={L('Rolle', 'Role')} onChange={(e) => setRole(r.id, { title: e.target.value })} data-testid={`role-title-${r.id}`} />
                <DelBtn onClick={() => onProject((pr) => ({ ...pr, roles: pr.roles.filter((x) => x.id !== r.id) }))} L={L} />
              </div>
              <input className="input !h-9 text-[13px] mb-1.5" value={r.does ?? ''} placeholder={L('Das übernimmt die Rolle …', 'This role takes care of …')} onChange={(e) => setRole(r.id, { does: e.target.value })} />
              <div className="flex flex-wrap gap-1.5">
                {project.people.length === 0 && <span className="text-[12px] text-[var(--color-text-faint)]">{L('Füge oben erst Personen hinzu.', 'Add people above first.')}</span>}
                {project.people.map((p) => {
                  const on = r.personIds.includes(p.id);
                  return <button key={p.id} type="button" onClick={() => setRole(r.id, { personIds: on ? r.personIds.filter((i) => i !== p.id) : [...r.personIds, p.id] })} aria-pressed={on} className={chipCls(on)} style={on ? chipOn : undefined} data-testid={`role-${r.id}-person-${p.id}`}>{p.name || '…'}</button>;
                })}
              </div>
            </li>
          ))}
        </ul>
        <AddRow placeholder={L('Neue Rolle …', 'New role …')} onAdd={(title) => onProject((pr) => ({ ...pr, roles: [...pr.roles, { id: newId('rl'), title, personIds: [] }] }))} testId="role-new" />
      </div>

      <Modal open={pick} onClose={() => setPick(false)} title={L('Aus meinem Netzwerk', 'From my network')}>
        <div className="flex flex-col gap-2">
          {net.length === 0 && <p className="text-[13.5px] text-[var(--color-text-muted)]">{L('Hier ist niemand mehr zum Hinzufügen.', 'Nobody left to add here.')}</p>}
          {net.map((n) => (
            <button key={n.id} type="button" onClick={() => { onProject((pr) => ({ ...pr, people: [...pr.people, { id: newId('pp'), name: n.name, networkId: n.id, contact: n.phone || n.email || undefined }] })); }} className="text-left rounded-[var(--radius-md)] px-3 py-2.5 border border-[var(--color-border)] text-[14.5px]" data-testid={`net-pick-${n.id}`}>
              {n.name}{n.role ? <span className="text-[12px] text-[var(--color-text-faint)]"> · {n.role}</span> : null}
            </button>
          ))}
          <Button fullWidth onClick={() => setPick(false)}>{L('Fertig', 'Done')}</Button>
        </div>
      </Modal>
    </div>
  );
}
