import { ResourceTile } from '../../components/shared/ItemTile';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, UserRound, BookMarked, X, Plus, Phone, Sparkles, MapPin, Activity } from 'lucide-react';
import { useT } from '../../i18n';
import { resourcesRepo } from './resourcesRepo';
import { RESOURCE_CATEGORY_TO_GROUP } from './resourceMeta';
import { networkRepo } from '../safetyNet/networkRepo';
import { bookmarksRepo } from '../bookmarks/bookmarksRepo';
import type { StepExtras } from '../../data/types';

/** What can be attached to a step: only things that already exist. */
export interface StepExtraOptions {
  skills: { id: string; title: string }[];
  hilfsmittel: { id: string; title: string }[];
  orte: { id: string; title: string }[];
  aktivitaeten: { id: string; title: string }[];
  helpers: { id: string; title: string }[];
  sources: { id: string; title: string }[];
}

export function loadStepExtraOptions(): StepExtraOptions {
  return {
    skills: resourcesRepo
      .getAll()
      .filter((r) => RESOURCE_CATEGORY_TO_GROUP[r.category] === 'faehigkeiten')
      .map((r) => ({ id: r.id, title: r.title })),
    hilfsmittel: resourcesRepo
      .getAll()
      .filter((r) => RESOURCE_CATEGORY_TO_GROUP[r.category] !== 'faehigkeiten' && r.category !== 'orte' && r.category !== 'aktivitaeten')
      .map((r) => ({ id: r.id, title: r.title })),
    orte: resourcesRepo
      .getAll()
      .filter((r) => r.category === 'orte')
      .map((r) => ({ id: r.id, title: r.title })),
    aktivitaeten: resourcesRepo
      .getAll()
      .filter((r) => r.category === 'aktivitaeten')
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
export function StepExtrasEditor({
  value,
  onChange,
  options,
  withSkills = false,
  suggestions = [],
}: {
  value?: StepExtras;
  onChange: (v: StepExtras | undefined) => void;
  options: StepExtraOptions;
  /** Brücken-Schritte can also hold Skills (a Skillkette step already IS a skill). */
  withSkills?: boolean;
  /** Existing resources that fit the need behind this step — one tap adds them. */
  suggestions?: { id: string; title: string; kind: 'skill' | 'hilfsmittel' | 'ort' | 'aktivitaet' }[];
}) {
  const t = useT();
  const f = t.fit;
  const v = value ?? {};
  const [open, setOpen] = useState(() => (v.skillIds?.length ?? 0) + (v.hilfsmittelIds?.length ?? 0) + (v.ortIds?.length ?? 0) + (v.aktivitaetIds?.length ?? 0) + (v.helperIds?.length ?? 0) + (v.bookmarkIds?.length ?? 0) > 0);

  function set(key: keyof StepExtras, ids: string[]) {
    const next: StepExtras = { ...v, [key]: ids.length > 0 ? ids : undefined };
    const empty = !next.skillIds && !next.hilfsmittelIds && !next.ortIds && !next.aktivitaetIds && !next.helperIds && !next.bookmarkIds;
    onChange(empty ? undefined : next);
  }

  const groups: { key: keyof StepExtras; icon: typeof Wrench; label: string; add: string; ids: string[]; all: { id: string; title: string }[] }[] = [
    ...(withSkills ? [{ key: 'skillIds' as const, icon: Sparkles, label: f.stepSkill, add: f.stepAddSkill, ids: v.skillIds ?? [], all: options.skills }] : []),
    { key: 'hilfsmittelIds', icon: Wrench, label: f.stepHilfsmittel, add: f.stepAddHilfsmittel, ids: v.hilfsmittelIds ?? [], all: options.hilfsmittel },
    { key: 'ortIds', icon: MapPin, label: f.stepOrt, add: f.stepAddOrt, ids: v.ortIds ?? [], all: options.orte },
    { key: 'aktivitaetIds', icon: Activity, label: f.stepAktivitaet, add: f.stepAddAktivitaet, ids: v.aktivitaetIds ?? [], all: options.aktivitaeten },
    { key: 'helperIds', icon: UserRound, label: f.stepHelper, add: f.stepAddHelper, ids: v.helperIds ?? [], all: options.helpers },
    { key: 'bookmarkIds', icon: BookMarked, label: f.stepSource, add: f.stepAddSource, ids: v.bookmarkIds ?? [], all: options.sources },
  ];
  const nothingExists = groups.every((g) => g.all.length === 0);
  const keyForKind = (k: 'skill' | 'hilfsmittel' | 'ort' | 'aktivitaet'): 'skillIds' | 'hilfsmittelIds' | 'ortIds' | 'aktivitaetIds' =>
    k === 'skill' ? 'skillIds' : k === 'ort' ? 'ortIds' : k === 'aktivitaet' ? 'aktivitaetIds' : 'hilfsmittelIds';
  const freeSuggestions = suggestions.filter((s) => !v[keyForKind(s.kind)]?.includes(s.id)).slice(0, 5);

  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-1.5 text-[12.5px] text-[var(--color-primary)]">
        <Plus size={14} /> {withSkills ? f.stepAddBridge : f.stepAdd}
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-2 animate-in">
          {nothingExists && <p className="text-[12px] text-[var(--color-text-faint)]">{f.stepNoneYet}</p>}
          {freeSuggestions.length > 0 && (
            <div>
              <p className="text-[11.5px] text-[var(--color-text-faint)] mb-1">{f.stepSuggested}</p>
              <div className="flex flex-wrap gap-1.5">
                {freeSuggestions.map((sg) => (
                  <button
                    key={sg.id}
                    type="button"
                    onClick={() => set(keyForKind(sg.kind), [...(v[keyForKind(sg.kind)] ?? []), sg.id])}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] border border-dashed border-[var(--color-border-strong)] text-[var(--color-text-muted)]"
                  >
                    <Plus size={11} /> {sg.title}
                  </button>
                ))}
              </div>
            </div>
          )}
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
  const skillIds = extras?.skillIds ?? [];
  const hilfsmittelIds = Array.from(new Set([...(skillHilfsmittelIds ?? []), ...(extras?.hilfsmittelIds ?? [])]));
  const ortIds = extras?.ortIds ?? [];
  const aktivitaetIds = extras?.aktivitaetIds ?? [];
  const helperIds = extras?.helperIds ?? [];
  const bookmarkIds = extras?.bookmarkIds ?? [];
  if (skillIds.length + hilfsmittelIds.length + ortIds.length + aktivitaetIds.length + helperIds.length + bookmarkIds.length === 0) return null;

  const chip = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] text-[var(--color-text)]';
  const tileRows: { id: string; path: string }[] = [
    ...skillIds.map((id) => ({ id, path: `/entdecken/ressourcen/skills?open=${id}` })),
    ...hilfsmittelIds.map((id) => ({ id, path: `/entdecken/ressourcen/hilfsmittel?open=${id}` })),
    ...ortIds.map((id) => ({ id, path: `/entdecken/ressourcen/orte?open=${id}` })),
    ...aktivitaetIds.map((id) => ({ id, path: `/entdecken/ressourcen/aktivitaeten?open=${id}` })),
  ];
  return (
    <div className="mt-1.5">
      {/* skills, tools, places and activities: lively tiles with their colour and picture */}
      {tileRows.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-1.5">
          {tileRows.map((row) => {
            const r = resourcesRepo.getById(row.id);
            return r ? (
              <Link key={`${row.path}`} to={row.path} className="block">
                <ResourceTile resource={r} compact />
              </Link>
            ) : null;
          })}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
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
    </div>
  );
}
