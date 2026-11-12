import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, Trash2, Plus } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Button } from '../../components/ui/Button';
import { PALETTE_COLORS, EMOJI_GROUPS } from '../../content/emojiGroups';
import { useL } from '../projects/useL';
import { CardFace } from './CardFace';
import { FONT_OPTIONS } from './cardRender';
import { cardCategoriesRepo, colorForKind, newOwnCardId, numberFor, ownCardsRepo, peekNextNumber, savePhotoForCard, setRarity } from './cardStore';
import { formatCardDate } from './cardDate';
import { CompanionStickerToggle, DateEditor, FitHint, RatingsEditor, type Rating } from './cardEditorParts';
import { deleteOwnMedia } from '../../services/mediaStore';
import { createId } from '../../services/storage/repository';
import { KIND_META, type CardKind, type FrameStyle, type OwnCard, type Rarity } from './cardTypes';

const FRAMES: { id: FrameStyle; de: string; en: string; emoji: string }[] = [
  { id: 'standard', de: 'Klassisch', en: 'Classic', emoji: '🃏' },
  { id: 'polaroid', de: 'Polaroid', en: 'Polaroid', emoji: '📷' },
  { id: 'scrapbook', de: 'Scrapbook', en: 'Scrapbook', emoji: '🗒️' },
  { id: 'sticker', de: 'Sticker', en: 'Sticker', emoji: '🏷️' },
];
const RARITIES: { id: Rarity; de: string; en: string }[] = [
  { id: 'normal', de: 'Normal', en: 'Normal' },
  { id: 'foil', de: '🥇 Folie', en: '🥇 Foil' },
  { id: 'holo', de: '🌈 Holo', en: '🌈 Holo' },
  { id: 'glitter', de: '✨ Glitzer', en: '✨ Glitter' },
];
const STICKERS = ['⭐', '💖', '🌈', '🦋', '🌸', '🍀', '🔥', '🎈', '🎀', '🌙', '☀️', '🐾', '🍓', '💎', '🎵', '🕊️'];
const PICKABLE: CardKind[] = ['person', 'faehigkeit', 'aktion', 'ausruestung', 'ort', 'training', 'wissen', 'ereignis', 'begleiter'];

/** Eigene Karte gestalten – oder eine vorhandene bearbeiten. Alles ist freiwillig; leer gelassen wird nichts angezeigt. */
export function CardEditorPage() {
  const { L, lang } = useL();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('bearbeiten');
  const existing = useMemo(() => (editId ? ownCardsRepo.getById(editId) : undefined), [editId]);
  const [id] = useState(existing?.id ?? newOwnCardId());
  const [cats, setCats] = useState(() => cardCategoriesRepo.getAll());

  const [kind, setKind] = useState<CardKind>(existing?.kind ?? 'eigen');
  const [categoryId, setCategoryId] = useState<string | undefined>(existing?.categoryId);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [text, setText] = useState(existing?.text ?? '');
  const [date, setDate] = useState(existing?.date ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? '🃏');
  const [emojiGroup, setEmojiGroup] = useState(EMOJI_GROUPS[0].id);
  const [mediaId, setMediaId] = useState<string | undefined>(existing?.mediaId);
  const [color, setColor] = useState<string | undefined>(existing?.color);
  const [frame, setFrame] = useState<FrameStyle>(existing?.frame ?? 'standard');
  const [font, setFont] = useState<string | undefined>(existing?.font);
  const [stickers, setStickers] = useState<string[]>(existing?.stickers ?? []);
  const [rating1, setRating1] = useState<Rating>(existing?.rating);
  const [rating2, setRating2] = useState<Rating>(existing?.rating2);
  const [companionSticker, setCompanionSticker] = useState<string | undefined>(existing?.companionSticker);
  const [dateFormat, setDateFormat] = useState<string>(existing?.dateFormat ?? 'long');
  const [rarity, setRar] = useState<Rarity>(existing?.rarity ?? 'normal');
  const [newCat, setNewCat] = useState<{ label: string; emoji: string; color: string } | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  const cat = cats.find((c) => c.id === categoryId);
  const effectiveColor = color ?? cat?.color ?? colorForKind(kind);
  const key = `own:${id}`;

  const preview = useMemo(
    () => ({
      key,
      kind,
      categoryId,
      categoryLabel: kind === 'eigen' ? cat?.label : undefined,
      title: title.trim() || L('Mein Titel', 'My title'),
      text: text.trim() || undefined,
      dateText: date ? formatCardDate(date, lang, dateFormat) : undefined,
      mediaId,
      emoji: emoji || cat?.emoji || KIND_META[kind].emoji,
      color: effectiveColor,
      number: numberFor(key) ?? peekNextNumber(),
      rarity,
      frame,
      font,
      stickers,
      rating: rating1 && rating1.value > 0 ? rating1 : undefined,
      rating2: rating1 && rating1.value > 0 && rating2 && rating2.value > 0 ? rating2 : undefined,
      companionSticker,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      own: true,
    }),
    [key, kind, categoryId, cat, title, text, date, dateFormat, mediaId, emoji, effectiveColor, rarity, frame, font, stickers, rating1, rating2, companionSticker, existing, lang], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (kind === 'ereignis' && !date) setDate(new Date().toISOString().slice(0, 10));
  }, [kind]); // eslint-disable-line react-hooks/exhaustive-deps

  async function pickPhoto(file?: File | null) {
    if (!file) return;
    setPhotoBusy(true);
    const ref = await savePhotoForCard(file);
    setPhotoBusy(false);
    if (ref) {
      if (mediaId && mediaId !== existing?.mediaId) void deleteOwnMedia(mediaId);
      setMediaId(ref);
    }
  }

  function save() {
    if (!title.trim()) return;
    const card: OwnCard = {
      id,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      kind,
      categoryId: kind === 'eigen' ? categoryId : undefined,
      title: title.trim(),
      text: text.trim() || undefined,
      date: date || undefined,
      emoji,
      mediaId,
      color,
      frame,
      font,
      stickers: stickers.length ? stickers : undefined,
      rating: rating1 && rating1.value > 0 ? rating1 : undefined,
      rating2: rating1 && rating1.value > 0 && rating2 && rating2.value > 0 ? rating2 : undefined,
      companionSticker,
      dateFormat: date ? dateFormat : undefined,
      rarity,
      fromName: existing?.fromName,
      externalId: existing?.externalId,
    };
    ownCardsRepo.save(card);
    setRarity(key, rarity);
    navigate('/sammelalbum', { replace: true });
  }

  function remove() {
    if (!existing) return;
    if (!window.confirm(L('Diese Karte löschen?', 'Delete this card?'))) return;
    if (existing.mediaId) void deleteOwnMedia(existing.mediaId);
    ownCardsRepo.remove(existing.id);
    navigate('/sammelalbum', { replace: true });
  }

  function addCategory() {
    if (!newCat || !newCat.label.trim()) return;
    const c = { id: createId('ccat'), label: newCat.label.trim(), emoji: newCat.emoji, color: newCat.color, createdAt: new Date().toISOString() };
    cardCategoriesRepo.save(c);
    setCats(cardCategoriesRepo.getAll());
    setKind('eigen');
    setCategoryId(c.id);
    setNewCat(null);
  }

  const chip = (active: boolean): React.CSSProperties => ({
    background: active ? 'var(--color-primary)' : 'var(--color-surface-muted)',
    color: active ? 'var(--color-surface)' : 'var(--color-text)',
  });

  return (
    <div className="min-h-dvh pb-28">
      <TopBar />
      <div className="px-5 animate-in">
        <h1 className="text-[22px] mb-3">{existing ? L('Karte bearbeiten', 'Edit card') : L('Neue Karte', 'New card')}</h1>

        <div className="flex justify-center mb-5 sticky top-1 z-10 py-1 rounded-[var(--radius-lg)]" style={{ background: 'color-mix(in srgb, var(--color-bg) 88%, transparent)', backdropFilter: 'blur(4px)' }} data-testid="card-editor-preview">
          <div style={{ filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.28))' }}>
            <CardFace card={preview} width={128} />
          </div>
        </div>

        <Section title={L('Art der Karte', 'Kind of card')}>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className="px-3 py-1.5 rounded-full text-[13px]" style={chip(kind === 'eigen' && !categoryId)} onClick={() => { setKind('eigen'); setCategoryId(undefined); }}>
              🃏 {L('Frei', 'Free')}
            </button>
            {PICKABLE.map((k) => (
              <button key={k} type="button" className="px-3 py-1.5 rounded-full text-[13px]" style={chip(kind === k)} onClick={() => { setKind(k); setCategoryId(undefined); }}>
                {KIND_META[k].emoji} {lang === 'en' ? KIND_META[k].en : KIND_META[k].de}
              </button>
            ))}
            {cats.map((c) => (
              <button key={c.id} type="button" className="px-3 py-1.5 rounded-full text-[13px]" style={chip(kind === 'eigen' && categoryId === c.id)} onClick={() => { setKind('eigen'); setCategoryId(c.id); }} data-testid="card-own-category">
                {c.emoji} {c.label}
              </button>
            ))}
            <button type="button" className="px-3 py-1.5 rounded-full text-[13px] flex items-center gap-1 border border-dashed border-[var(--color-border-strong)] text-[var(--color-primary)]" onClick={() => setNewCat({ label: '', emoji: '💌', color: PALETTE_COLORS[2] })} data-testid="card-new-category">
              <Plus size={13} /> {L('Eigene Kategorie', 'Own category')}
            </button>
          </div>
          {newCat && (
            <div className="mt-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] flex flex-col gap-2 animate-in">
              <input className="input" placeholder={L('z. B. Wunschkarte, Fragekarte, Ereigniskarte …', 'e.g. wish card, question card …')} value={newCat.label} onChange={(e) => setNewCat({ ...newCat, label: e.target.value })} data-testid="card-category-name" />
              <div className="flex flex-wrap gap-1.5">
                {['💌', '🌠', '❓', '🎉', '📌', '🧸', '🎁', '🔮'].map((e) => (
                  <button key={e} type="button" onClick={() => setNewCat({ ...newCat, emoji: e })} className="w-9 h-9 rounded-full text-[18px]" style={{ background: newCat.emoji === e ? 'var(--color-primary-soft)' : 'var(--color-surface)' }}>{e}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PALETTE_COLORS.slice(0, 18).map((c) => (
                  <button key={c} type="button" onClick={() => setNewCat({ ...newCat, color: c })} className="w-7 h-7 rounded-full" style={{ background: c, outline: newCat.color === c ? '3px solid var(--color-text)' : 'none', outlineOffset: 1 }} aria-label={c} />
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={addCategory} disabled={!newCat.label.trim()} data-testid="card-category-save">{L('Anlegen', 'Create')}</Button>
                <Button variant="ghost" onClick={() => setNewCat(null)}>{L('Abbrechen', 'Cancel')}</Button>
              </div>
            </div>
          )}
        </Section>

        <Section title={L('Titel & Text', 'Title & text')}>
          <input className="input mb-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={L('Titel', 'Title')} maxLength={60} data-testid="card-title" />
          <textarea className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={L('Ein paar Worte zur Karte (freiwillig)', 'A few words about the card (optional)')} maxLength={600} data-testid="card-text" />
          <FitHint card={preview} />
          <DateEditor date={date} format={dateFormat} onDate={setDate} onFormat={setDateFormat} />
        </Section>

        <Section title={L('Bild', 'Picture')}>
          <div className="flex gap-2 items-center flex-wrap mb-3">
            <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13.5px] bg-[var(--color-surface-muted)] cursor-pointer">
              <Camera size={15} /> {photoBusy ? L('Moment …', 'One moment …') : mediaId ? L('Anderes Foto', 'Other photo') : L('Foto wählen', 'Choose photo')}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => void pickPhoto(e.target.files?.[0])} data-testid="card-photo-input" />
            </label>
            {mediaId && (
              <button type="button" className="text-[13px] text-[var(--color-primary)]" onClick={() => { if (mediaId !== existing?.mediaId) void deleteOwnMedia(mediaId); setMediaId(undefined); }}>
                {L('Foto entfernen', 'Remove photo')}
              </button>
            )}
          </div>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-2">{L('Ohne Foto zeigt die Karte dieses Symbol:', 'Without a photo the card shows this symbol:')}</p>
          <div className="chip-row no-scrollbar -mx-1 px-1 mb-2">
            {EMOJI_GROUPS.map((g) => (
              <button key={g.id} type="button" onClick={() => setEmojiGroup(g.id)} className="px-2.5 py-1 rounded-full text-[12.5px] flex-shrink-0" style={chip(emojiGroup === g.id)}>
                {g.icon} {lang === 'en' ? g.labelEn : g.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {(EMOJI_GROUPS.find((g) => g.id === emojiGroup)?.items ?? []).map((e) => (
              <button key={e} type="button" onClick={() => setEmoji(e)} className="w-10 h-10 rounded-[var(--radius-md)] text-[22px]" style={{ background: emoji === e ? 'var(--color-primary-soft)' : 'transparent', outline: emoji === e ? '2px solid var(--color-primary)' : 'none' }} aria-label={e}>
                {e}
              </button>
            ))}
          </div>
        </Section>

        <Section title={L('Stil', 'Style')}>
          <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{L('Rahmen', 'Frame')}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {FRAMES.map((f) => (
              <button key={f.id} type="button" className="px-3 py-1.5 rounded-full text-[13px]" style={chip(frame === f.id)} onClick={() => setFrame(f.id)} data-testid={`card-frame-${f.id}`}>
                {f.emoji} {lang === 'en' ? f.en : f.de}
              </button>
            ))}
          </div>
          <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{L('Schrift', 'Font')}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {FONT_OPTIONS.map((f) => (
              <button key={f.id} type="button" className="px-3 py-1.5 rounded-full text-[13px]" style={{ ...chip((font ?? 'rund') === f.id), fontFamily: f.family }} onClick={() => setFont(f.id)}>
                {lang === 'en' ? f.en : f.de}
              </button>
            ))}
          </div>
          <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{L('Farbe', 'Colour')}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button type="button" className="px-3 py-1.5 rounded-full text-[12.5px]" style={chip(!color)} onClick={() => setColor(undefined)}>{L('Standard', 'Default')}</button>
            {PALETTE_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} className="w-8 h-8 rounded-full" style={{ background: c, outline: color === c ? '3px solid var(--color-text)' : 'none', outlineOffset: 1 }} aria-label={c} />
            ))}
          </div>
          <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{L('Sticker (bis zu 3)', 'Stickers (up to 3)')}</p>
          <div className="flex flex-wrap gap-1 mb-3">
            {STICKERS.map((s) => (
              <button key={s} type="button" onClick={() => setStickers(stickers.includes(s) ? stickers.filter((x) => x !== s) : [...stickers, s].slice(-3))} className="w-10 h-10 rounded-[var(--radius-md)] text-[22px]" style={{ background: stickers.includes(s) ? 'var(--color-primary-soft)' : 'transparent', outline: stickers.includes(s) ? '2px solid var(--color-primary)' : 'none' }} aria-label={s}>
                {s}
              </button>
            ))}
          </div>
          <CompanionStickerToggle value={companionSticker} onChange={setCompanionSticker} />
          <RatingsEditor first={rating1} second={rating2} onFirst={setRating1} onSecond={setRating2} />
        </Section>

        <Section title={L('Limitiert?', 'Limited?')}>
          <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{L('Glanz, Glitzer oder Holo – und ein leises Funkeln beim Ansehen.', 'Shine, glitter or holo – and a soft sparkle when you look at it.')}</p>
          <div className="flex flex-wrap gap-1.5">
            {RARITIES.map((r) => (
              <button key={r.id} type="button" className="px-3 py-1.5 rounded-full text-[13px]" style={chip(rarity === r.id)} onClick={() => setRar(r.id)} data-testid={`card-rarity-${r.id}`}>
                {lang === 'en' ? r.en : r.de}
              </button>
            ))}
          </div>
        </Section>

        <div className="flex gap-2 mt-6 flex-wrap">
          <Button onClick={save} disabled={!title.trim()} data-testid="card-save">{L('Karte speichern', 'Save card')}</Button>
          <Button variant="ghost" onClick={() => navigate('/sammelalbum')}>{L('Abbrechen', 'Cancel')}</Button>
          {existing && (
            <button type="button" onClick={remove} className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-[var(--color-danger,#b44)]">
              <Trash2 size={14} /> {L('Löschen', 'Delete')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-[15px] font-medium mb-2">{title}</h2>
      {children}
    </section>
  );
}
