import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, UserRound, BookMarked, X, Plus, Phone } from 'lucide-react';
import { useT } from '../../i18n';
import { resourcesRepo } from './resourcesRepo';
import { RESOURCE_CATEGORY_TO_GROUP } from './resourceMeta';
import { networkRepo } from '../safetyNet/networkRepo';
import { bookmarksRepo } from '../bookmarks/bookmarksRepo';
import type { StepExtras } from '../../data/types';

/** What can be attached to a step: only things that already exist. */
export interface StepExtraOptions {
  hilfsmittel: { id: string; title: string }[];
  helpers: { id: string; title: string }[];
  sources: { id: string; title: string }[];
}

export function loadStepExtraOptions(): StepExtraOptions {
  return {
    hilfsmittel: resourcesRepo
      .getAll()
      .filter((r) => RESOURCE_CATEGORY_TO_GROUP[r.category] !== 'faehigkeiten')
      .map((r) => ({ id: r.id, title: r.title })),
    helpers: networkRepo
      .getAll()
      .filter((e) => e.category === 'person')
      .map((e) => ({ id: e.id, title: e.name })),
    sources: bookmarksRepo.getAll().map((b) => ({ id: b.id, title: b.title })),
  };
}

const chipStyle = { background: 'var(--color-surface)', border: '1px solid var(--color-border)' } as const;

/** Form part: pick existing Hilfsmittel, Helfer and Quellen for ONE step of a chain. */
export function StepExtrasEditor({ value, onChange, options }: { value?: StepExtras; onChange: (v: StepExtras | undefined) => void; options: StepExtraOptions }) {
  const t = useT();
  const f = t.fit;
  const v = value ?? {};
  const [open, setOpen] = useState(() => (v.hilfsmittelIds?.length ?? 0) + (v.helperIds?.length ?? 0) + (v.bookmarkIds?.length ?? 0) > 0);

  function set(key: keyof StepExtras, ids: string[]) {
    const next: StepExtras = { ...v, [key]: ids.length > 0 ? ids : undefined };
    const empty = !next.hilfsmittelIds && !next.helperIds && !next.bookmarkIds;
    onChange(empty ? undefined : next);
  }

  const groups: { key: keyof StepExtras; icon: typeof Wrench; label: string; add: string; ids: string[]; all: { id: string; title: string }[] }[] = [
    { key: 'hilfsmittelIds', icon: Wrench, label: f.stepHilfsmittel, add: f.stepAddHilfsmittel, ids: v.hilfsmittelIds ?? [], all: options.hilfsmittel },
    { key: 'helperIds', icon: UserRound, label: f.stepHelper, add: f.stepAddHelper, ids: v.helperIds ?? [], all: options.helpers },
    { key: 'bookmarkIds', icon: BookMarked, label: f.stepSource, add: f.stepAddSource, ids: v.bookmarkIds ?? [], all: options.sources },
  ];
  const nothingExists = groups.every((g) => g.all.length === 0);

  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-1.5 text-[12.5px] text-[var(--color-primary)]">
        <Plus size={14} /> {f.stepAdd}
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-2 animate-in">
          {nothingExists && <p className="text-[12px] text-[var(--color-text-faint)]">{f.stepNoneYet}</p>}
          {groups.map((g) => {
            const available = g.all.filter((o) => !g.ids.includes(o.id));
            return (
              <div key={g.key}>
                {g.ids.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {g.ids.map((id) => {
                      const item = g.all.find((o) => o.id === id);
                      return (
                        <span key={id} className="inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-1.5 py-1 text-[12.5px] text-[var(--color-text)]" style={chipStyle}>
                          <g.icon size={12} className="text-[var(--color-text-faint)]" />
                          {item?.title ?? '…'}
                          <button type="button" onClick={() => set(g.key, g.ids.filter((x) => x !== id))} aria-label={`${f.stepRemove}: ${item?.title ?? ''}`} className="p-0.5">
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                {available.length > 0 && (
                  <select className="input" value="" onChange={(e) => e.target.value && set(g.key, [...g.ids, e.target.value])} aria-label={g.label}>
                    <option value="">{g.add}</option>
                    {available.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Display part (chain detail and chain run): the attached things as tappable chips. */
export function StepExtrasView({ extras, skillHilfsmittelIds = [] }: { extras?: StepExtras; skillHilfsmittelIds?: string[] }) {
  const t = useT();
  const f = t.fit;
  const hilfsmittelIds = Array.from(new Set([...(skillHilfsmittelIds ?? []), ...(extras?.hilfsmittelIds ?? [])]));
  const helperIds = extras?.helperIds ?? [];
  const bookmarkIds = extras?.bookmarkIds ?? [];
  if (hilfsmittelIds.length + helperIds.length + bookmarkIds.length === 0) return null;

  const chip = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] text-[var(--color-text)]';
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {hilfsmittelIds.map((id) => {
        const r = resourcesRepo.getById(id);
        return r ? (
          <Link key={`h-${id}`} to={`/entdecken/ressourcen/hilfsmittel?open=${id}`} className={chip} style={chipStyle} title={f.stepHilfsmittel}>
            <Wrench size={12} className="text-[var(--color-text-faint)]" /> {r.title}
          </Link>
        ) : null;
      })}
      {helperIds.map((id) => {
        const e = networkRepo.getById(id);
        return e ? (
          <span key={`p-${id}`} className={chip} style={chipStyle} title={f.stepHelper}>
            <Link to={`/sicherheit/netzwerk?open=${id}`} className="inline-flex items-center gap-1.5">
              <UserRound size={12} className="text-[var(--color-text-faint)]" /> {e.name}
            </Link>
            {e.phone && (
              <a href={`tel:${e.phone.replace(/\s+/g, '')}`} aria-label={`${e.name} · ${e.phone}`} className="p-0.5">
                <Phone size={12} />
              </a>
            )}
          </span>
        ) : null;
      })}
      {bookmarkIds.map((id) => {
        const b = bookmarksRepo.getById(id);
        if (!b) return null;
        const safe = /^https?:\/\//i.test(b.url);
        return safe ? (
          <a key={`b-${id}`} href={b.url} target="_blank" rel="noopener noreferrer" className={chip} style={chipStyle} title={f.stepSource}>
            <BookMarked size={12} className="text-[var(--color-text-faint)]" /> {b.title}
          </a>
        ) : (
          <span key={`b-${id}`} className={chip} style={chipStyle}>
            <BookMarked size={12} className="text-[var(--color-text-faint)]" /> {b.title}
          </span>
        );
      })}
    </div>
  );
}
