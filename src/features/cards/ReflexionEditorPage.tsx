import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Button } from '../../components/ui/Button';
import { PALETTE_COLORS } from '../../content/emojiGroups';
import { FEELING_GROUPS, NEED_CATEGORY_GROUPS, CONNECTION_ITEMS_DE } from '../zugang/zugangContent';
import { localDayKey } from '../../services/groupByDay';
import { deleteOwnMedia } from '../../services/mediaStore';
import { createId } from '../../services/storage/repository';
import { useL } from '../projects/useL';
import { CardFace } from './CardFace';
import { gatherDay } from './dayGather';
import { reflexionSections, spelledDate } from './autoCards';
import { CompanionStickerToggle, DateEditor, FitHint } from './cardEditorParts';
import { colorForKind, numberFor, peekNextNumber, reflexionCardsRepo, savePhotoForCard, setRarity } from './cardStore';
import type { CardModel, Rarity, ReflexionCard } from './cardTypes';

const BACKGROUNDS = ['#fffaf0', '#fdecef', '#eaf4ee', '#e8f0fb', '#f3ecfa', '#fff1d6', '#2f3e46', '#4a3a5e'];
const RARITIES: { id: Rarity; de: string }[] = [
  { id: 'normal', de: 'Normal' },
  { id: 'foil', de: '🥇 Folie' },
  { id: 'holo', de: '🌈 Holo' },
  { id: 'glitter', de: '✨ Glitzer' },
];

function PickMax({ options, selected, max, onChange, label }: { options: string[]; selected: string[]; max: number; onChange: (v: string[]) => void; label: string }) {
  const all = [...new Set([...selected, ...options])];
  return (
    <div className="mb-4">
      <p className="text-[13px] font-medium mb-1">
        {label} <span className="text-[var(--color-text-faint)] font-normal">(1–{max})</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {all.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(on ? selected.filter((x) => x !== o) : [...selected, o].slice(-max))}
              aria-pressed={on}
              className="px-3 py-1.5 rounded-full text-[13px]"
              style={{ background: on ? 'var(--color-primary)' : 'var(--color-surface-muted)', color: on ? 'var(--color-surface)' : 'var(--color-text)' }}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Die Tageskarte (Reflexionskarte): was heute war – aus dem Tag vorbelegt, alles änderbar.
 * Leere Felder erscheinen nicht auf der Karte.
 */
export function ReflexionEditorPage() {
  const { L, lang } = useL();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('bearbeiten');
  const existing = useMemo(() => (editId ? reflexionCardsRepo.getById(editId) : undefined), [editId]);
  const [id] = useState(existing?.id ?? createId('refl'));
  const [date, setDate] = useState(existing?.date ?? localDayKey(new Date().toISOString()));
  const gathered = useMemo(() => gatherDay(date, lang), [date, lang]);

  const [title, setTitle] = useState(existing?.title ?? L('Mein Tag', 'My day'));
  const [used, setUsed] = useState<string[]>(existing?.usedResources ?? gathered.usedResources);
  const [usedNew, setUsedNew] = useState('');
  const [garden, setGarden] = useState(existing?.gardenGrew ?? gathered.gardenGrew);
  const [feelings, setFeelings] = useState<string[]>(existing?.feelings ?? gathered.feelings);
  const [needs, setNeeds] = useState<string[]>(existing?.needs ?? gathered.needs);
  const [values, setValues] = useState<string[]>(existing?.values ?? gathered.values);
  const [achieved, setAchieved] = useState<string>((existing?.achieved ?? gathered.achieved).join('\n'));
  const [grateful, setGrateful] = useState(existing?.grateful ?? '');
  const [highlight, setHighlight] = useState(existing?.highlight ?? '');
  const [learned, setLearned] = useState(existing?.learned ?? '');
  const [saying, setSaying] = useState(existing?.saying ?? '');
  const [energy, setEnergy] = useState(existing?.energy ?? 0);
  const [comfort, setComfort] = useState(existing?.comfort ?? 0);
  const [background, setBackground] = useState(existing?.background ?? BACKGROUNDS[0]);
  const [mediaId, setMediaId] = useState<string | undefined>(existing?.mediaId);
  const [rarity, setRar] = useState<Rarity>(existing?.rarity ?? 'normal');
  const [dateFormat, setDateFormat] = useState<string>(existing?.dateFormat ?? 'long');
  const [companionSticker, setCompanionSticker] = useState<string | undefined>(existing?.companionSticker);
  const [busy, setBusy] = useState(false);

  const feelingOptions = FEELING_GROUPS.flatMap((g) => g.sub.slice(0, 3).map((w, i) => (lang === 'en' ? g.subEn[i] ?? w : w)));
  const needOptions = NEED_CATEGORY_GROUPS.flatMap((g) => g.items.slice(0, 2).map((w, i) => (lang === 'en' ? g.itemsEn[i] ?? w : w)));
  const key = `reflexion:${id}`;

  const draft: ReflexionCard = {
    id,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    date,
    title: title.trim() || L('Mein Tag', 'My day'),
    usedResources: used,
    gardenGrew: garden,
    feelings,
    needs,
    values,
    achieved: achieved.split('\n').map((s) => s.trim()).filter(Boolean),
    grateful,
    highlight,
    learned,
    saying,
    energy: energy || undefined,
    comfort: comfort || undefined,
    background,
    mediaId,
    dateFormat,
    companionSticker,
    rarity,
  };

  const preview: CardModel = {
    key,
    kind: 'reflexion',
    title: draft.title,
    dateText: spelledDate(date, lang, dateFormat),
    mediaId,
    companionSticker,
    emoji: '🌙',
    color: colorForKind('reflexion'),
    background,
    number: numberFor(key) ?? peekNextNumber(),
    rarity,
    createdAt: draft.createdAt,
    own: true,
    sections: reflexionSections(draft, lang),
    stats: [
      ...(draft.energy ? [{ label: L('Energie', 'Energy'), value: '⚡'.repeat(draft.energy) }] : []),
      ...(draft.comfort ? [{ label: L('Wohlgefühl', 'Comfort'), value: '★'.repeat(draft.comfort) }] : []),
    ],
  };

  async function pickPhoto(f?: File | null) {
    if (!f) return;
    setBusy(true);
    const ref = await savePhotoForCard(f);
    setBusy(false);
    if (ref) {
      if (mediaId && mediaId !== existing?.mediaId) void deleteOwnMedia(mediaId);
      setMediaId(ref);
    }
  }

  function save() {
    reflexionCardsRepo.save(draft);
    setRarity(key, rarity);
    navigate('/sammelalbum', { replace: true });
  }
  function remove() {
    if (!existing || !window.confirm(L('Diese Tageskarte löschen?', 'Delete this day card?'))) return;
    if (existing.mediaId) void deleteOwnMedia(existing.mediaId);
    reflexionCardsRepo.remove(existing.id);
    navigate('/sammelalbum', { replace: true });
  }

  const stepper = (val: number, set: (n: number) => void, max: number, glyph: string) => (
    <div className="flex gap-1.5">
      {Array.from({ length: max }).map((_, i) => (
        <button key={i} type="button" onClick={() => set(val === i + 1 ? 0 : i + 1)} className="w-10 h-10 rounded-full text-[18px]" style={{ background: i < val ? 'var(--color-primary-soft)' : 'var(--color-surface-muted)' }} aria-label={`${i + 1}`}>
          {glyph}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-dvh pb-28">
      <TopBar />
      <div className="px-5 animate-in">
        <h1 className="text-[22px] mb-1">{existing ? L('Tageskarte bearbeiten', 'Edit day card') : L('Tageskarte', 'Day card')}</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-3">{L('Ein Blick auf deinen Tag als Sammelkarte. Vorbelegt aus dem, was heute war – du kannst alles ändern oder weglassen.', 'A look at your day as a collection card. Pre-filled from what happened today – change or leave out anything.')}</p>

        <div className="flex justify-center mb-5 sticky top-1 z-10 py-1 rounded-[var(--radius-lg)]" style={{ background: 'color-mix(in srgb, var(--color-bg) 88%, transparent)', backdropFilter: 'blur(4px)' }} data-testid="reflexion-preview">
          <div style={{ filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.28))' }}>
            <CardFace card={preview} width={128} />
          </div>
        </div>

        <label className="block text-[13px] font-medium mb-1">{L('Titel', 'Title')}</label>
        <input className="input mb-3" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={50} data-testid="reflexion-title" />
        <label className="block text-[13px] font-medium mb-1">{L('Tag', 'Day')}</label>
        <input type="date" className="input mb-2" value={date} onChange={(e) => setDate(e.target.value)} />
        <DateEditor formatOnly date={date} format={dateFormat} onDate={() => undefined} onFormat={setDateFormat} />
        <div className="mb-4" />

        <div className="mb-4">
          <p className="text-[13px] font-medium mb-1">{L('Das habe ich genutzt', 'What I used')}</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {used.map((u) => (
              <button key={u} type="button" onClick={() => setUsed(used.filter((x) => x !== u))} className="px-3 py-1.5 rounded-full text-[13px] bg-[var(--color-primary-soft)] text-[var(--color-text)]" aria-label={`${L('Entfernen', 'Remove')}: ${u}`}>
                {u} ✕
              </button>
            ))}
            {used.length === 0 && <span className="text-[12.5px] text-[var(--color-text-faint)]">{L('Heute wurde noch nichts festgehalten.', 'Nothing recorded today yet.')}</span>}
          </div>
          <div className="flex gap-2">
            <input className="input" placeholder={L('Etwas ergänzen …', 'Add something …')} value={usedNew} onChange={(e) => setUsedNew(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && usedNew.trim()) { setUsed([...used, usedNew.trim()]); setUsedNew(''); } }} />
            <Button variant="secondary" onClick={() => { if (usedNew.trim()) { setUsed([...used, usedNew.trim()]); setUsedNew(''); } }}>+</Button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-[14px] mb-4">
          <input type="checkbox" checked={garden} onChange={(e) => setGarden(e.target.checked)} />
          🌱 {L('Mein Garten ist gewachsen', 'My garden has grown')}
        </label>

        <PickMax label={L('Gefühle', 'Feelings')} options={feelingOptions} selected={feelings} max={3} onChange={setFeelings} />
        <PickMax label={L('Bedürfnisse', 'Needs')} options={needOptions} selected={needs} max={3} onChange={setNeeds} />
        <PickMax label={L('Werte', 'Values')} options={CONNECTION_ITEMS_DE} selected={values} max={3} onChange={setValues} />

        <label className="block text-[13px] font-medium mb-1">{L('Heute geschafft (eine Zeile pro Sache)', 'Managed today (one line each)')}</label>
        <textarea className="input mb-4" rows={3} value={achieved} onChange={(e) => setAchieved(e.target.value)} />

        <details className="mb-4">
          <summary className="text-[13.5px] text-[var(--color-primary)] cursor-pointer">{L('Mehr (freiwillig)', 'More (optional)')}</summary>
          <div className="flex flex-col gap-2 mt-2">
            <input className="input" placeholder={L('Dankbar für …', 'Grateful for …')} value={grateful} onChange={(e) => setGrateful(e.target.value)} />
            <input className="input" placeholder={L('Highlight', 'Highlight')} value={highlight} onChange={(e) => setHighlight(e.target.value)} />
            <input className="input" placeholder={L('Das hab ich gelernt', 'What I learned')} value={learned} onChange={(e) => setLearned(e.target.value)} />
            <input className="input" placeholder={L('Ein Satz / Spruch für heute', 'A sentence / saying for today')} value={saying} onChange={(e) => setSaying(e.target.value)} />
          </div>
        </details>

        <div className="mb-4">
          <p className="text-[13px] font-medium mb-1">⚡ {L('Energie', 'Energy')}</p>
          {stepper(energy, setEnergy, 4, '⚡')}
        </div>
        <div className="mb-4">
          <p className="text-[13px] font-medium mb-1">★ {L('Wohlgefühl', 'Comfort')}</p>
          {stepper(comfort, setComfort, 5, '★')}
        </div>

        <p className="text-[13px] font-medium mb-1">{L('Gestaltung', 'Design')}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {BACKGROUNDS.map((c) => (
            <button key={c} type="button" onClick={() => setBackground(c)} className="w-9 h-9 rounded-full" style={{ background: c, border: '2px solid rgba(0,0,0,0.15)', outline: background === c ? '3px solid var(--color-text)' : 'none', outlineOffset: 1 }} aria-label={c} />
          ))}
          {PALETTE_COLORS.slice(0, 10).map((c) => (
            <button key={c} type="button" onClick={() => setBackground(c)} className="w-9 h-9 rounded-full" style={{ background: c, outline: background === c ? '3px solid var(--color-text)' : 'none', outlineOffset: 1 }} aria-label={c} />
          ))}
        </div>
        <div className="flex gap-2 items-center mb-3 flex-wrap">
          <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13.5px] bg-[var(--color-surface-muted)] cursor-pointer">
            <Camera size={15} /> {busy ? L('Moment …', 'One moment …') : mediaId ? L('Anderes Foto', 'Other photo') : L('Foto dazu', 'Add photo')}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => void pickPhoto(e.target.files?.[0])} />
          </label>
          {mediaId && <button type="button" className="text-[13px] text-[var(--color-primary)]" onClick={() => { if (mediaId !== existing?.mediaId) void deleteOwnMedia(mediaId); setMediaId(undefined); }}>{L('Foto entfernen', 'Remove photo')}</button>}
        </div>
        <FitHint card={preview} />
        <div className="mt-3"><CompanionStickerToggle value={companionSticker} onChange={setCompanionSticker} /></div>
        <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{L('Limitiert (Folie / Holo / Glitzer) – wandert zu den Specialcards', 'Limited (foil / holo / glitter) – goes to the special cards')}</p>
        <div className="flex flex-wrap gap-1.5 mb-6">
          {RARITIES.map((r) => (
            <button key={r.id} type="button" className="px-3 py-1.5 rounded-full text-[13px]" style={{ background: rarity === r.id ? 'var(--color-primary)' : 'var(--color-surface-muted)', color: rarity === r.id ? 'var(--color-surface)' : 'var(--color-text)' }} onClick={() => setRar(r.id)}>
              {r.de}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={save} data-testid="reflexion-save">{L('Tageskarte speichern', 'Save day card')}</Button>
          <Button variant="ghost" onClick={() => navigate('/sammelalbum')}>{L('Abbrechen', 'Cancel')}</Button>
          {existing && <button type="button" onClick={remove} className="px-3 py-2 text-[13px] text-[var(--color-danger,#b44)]">{L('Löschen', 'Delete')}</button>}
        </div>
      </div>
    </div>
  );
}
