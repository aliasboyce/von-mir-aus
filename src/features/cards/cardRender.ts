import { ownMediaUrl } from '../../services/mediaStore';
import { companionPortrait, portraitNow } from './companionPortrait';
import { KIND_META, type CardModel, type FrameStyle, type RatingKind } from './cardTypes';

/**
 * Zeichnet eine Sammelkarte auf ein Canvas. Eine einzige Zeichenroutine für Bildschirm UND Druck –
 * so sieht die Karte im PDF genau so aus wie in der App (und auch auf dem iPhone verlässlich).
 * Logische Größe 635 × 880 (10 Einheiten pro Millimeter bei 63,5 × 88 mm).
 */
export const CARD_W = 635;
export const CARD_H = 880;
export const CARD_MM_W = 63.5;
export const CARD_MM_H = 88;

export const FONT_OPTIONS: { id: string; de: string; en: string; family: string }[] = [
  { id: 'rund', de: 'Rund', en: 'Round', family: '"Nunito","Segoe UI",system-ui,-apple-system,sans-serif' },
  { id: 'serif', de: 'Klassisch', en: 'Classic', family: 'Georgia,"Times New Roman",serif' },
  { id: 'hand', de: 'Handschrift', en: 'Handwriting', family: '"Segoe Print","Bradley Hand","Comic Sans MS","Marker Felt",cursive' },
  { id: 'schreib', de: 'Schreibmaschine', en: 'Typewriter', family: '"Courier New",Courier,monospace' },
  { id: 'fett', de: 'Plakat', en: 'Poster', family: '"Arial Black","Helvetica Neue",Impact,sans-serif' },
];
const familyOf = (id?: string) => (FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0]).family;

// ---------- Farben ----------
function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(f, 16);
  return Number.isNaN(n) ? [150, 150, 150] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toHex([r, g, b]: number[]) {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
}
export function mix(a: string, b: string, t: number): string {
  const x = rgb(a);
  const y = rgb(b);
  return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}
const lighten = (c: string, t: number) => mix(c, '#ffffff', t);
const darken = (c: string, t: number) => mix(c, '#000000', t);
export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** Text-Farbe mit gutem Kontrast auf dieser Fläche */
const inkOn = (bg: string) => (luminance(bg) > 0.42 ? '#2b2a27' : '#ffffff');

// ---------- Zeichenhilfen ----------
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  text.split('\n').forEach((para) => {
    const words = para.split(/\s+/).filter(Boolean);
    let line = '';
    words.forEach((w) => {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width <= maxW) {
        line = test;
        return;
      }
      if (line) out.push(line);
      if (ctx.measureText(w).width > maxW) {
        let cut = w;
        while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxW) cut = cut.slice(0, -1);
        out.push(cut.length < w.length ? `${cut}…` : cut);
        line = '';
      } else line = w;
    });
    if (line) out.push(line);
  });
  return out;
}
function clampLines(ctx: CanvasRenderingContext2D, lines: string[], max: number, maxW: number): string[] {
  if (lines.length <= max) return lines;
  const cut = lines.slice(0, max);
  let last = cut[max - 1];
  while (last.length > 1 && ctx.measureText(`${last}…`).width > maxW) last = last.slice(0, -1);
  cut[max - 1] = `${last}…`;
  return cut;
}

// ---------- Bilder ----------
const imgCache = new Map<string, HTMLImageElement | null>();
export function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (imgCache.has(src)) return Promise.resolve(imgCache.get(src) ?? null);
  return new Promise((resolve) => {
    const img = new Image();
    if (/^https?:/i.test(src)) img.crossOrigin = 'anonymous';
    const done = (v: HTMLImageElement | null) => {
      imgCache.set(src, v);
      resolve(v);
    };
    img.onload = () => done(img);
    img.onerror = () => done(null);
    img.src = src;
    window.setTimeout(() => {
      if (!imgCache.has(src)) done(null);
    }, 6000);
  });
}
/** Muss etwas nachgeladen werden (Foto, Begleiter-Bild, Sticker)? */
export function cardNeedsAsync(card: CardModel): boolean {
  return !!(card.image || card.mediaId || card.portraitOf || card.companionSticker);
}

/** Das Bild der Karte als geladenes Bild (eigenes Foto, Bildadresse oder Begleiter-Porträt) – oder null → Symbol. */
export async function prepareCardImage(card: CardModel): Promise<HTMLImageElement | null> {
  if (card.companionSticker) await companionPortrait(card.companionSticker);
  if (card.portraitOf && !card.mediaId && !card.image) {
    const p = await companionPortrait(card.portraitOf);
    return p ? composePortrait(p, card.color) : null;
  }
  let src = card.image;
  if (card.mediaId) {
    try {
      src = (await ownMediaUrl(card.mediaId)) ?? src;
    } catch {
      // Foto nicht lesbar – Symbol
    }
  }
  return src ? loadImage(src) : null;
}

const composed = new Map<string, HTMLImageElement>();
/** Begleiter groß vor einem weichen Farbhintergrund (für das Kunstfenster). */
async function composePortrait(p: HTMLImageElement, color: string): Promise<HTMLImageElement | null> {
  const key = `${p.src.length}-${color}-${p.src.slice(-40)}`;
  const hit = composed.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = 1000;
  c.height = 700;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createRadialGradient(500, 320, 40, 500, 350, 620);
  g.addColorStop(0, lighten(color, 0.8));
  g.addColorStop(1, lighten(color, 0.35));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1000, 700);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  const rnd = rng(hash(color));
  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    ctx.arc(rnd() * 1000, rnd() * 700, 12 + rnd() * 40, 0, Math.PI * 2);
    ctx.fill();
  }
  const h = 640;
  const w = (p.width / p.height) * h;
  ctx.drawImage(p, 500 - w / 2, 30, w, h);
  const out = new Image();
  const ok = new Promise<boolean>((res) => {
    out.onload = () => res(true);
    out.onerror = () => res(false);
  });
  out.src = c.toDataURL('image/png');
  if (!(await ok)) return null;
  composed.set(key, out);
  return out;
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const k = Math.max(w / img.width, h / img.height);
  const dw = img.width * k;
  const dh = img.height * k;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, spikes = 4) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.28;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  ctx.closePath();
}

const RAINBOW = ['#ff5f6d', '#ffc371', '#fff27a', '#7be495', '#5ed3ff', '#9d7bff', '#ff7bd5', '#ff5f6d'];
function rainbowGradient(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  RAINBOW.forEach((c, i) => g.addColorStop(i / (RAINBOW.length - 1), c));
  return g;
}

export interface DrawOpts {
  side: 'front' | 'back';
  lang: 'de' | 'en';
  /** ohne Glanz-Effekte (z. B. für ein ruhiges Bild) */
  flat?: boolean;
}

/** Rarity: Rahmen und Kunstfenster */
function drawRarityFrame(ctx: CanvasRenderingContext2D, card: CardModel, color: string) {
  if (card.rarity === 'normal') {
    const g = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
    g.addColorStop(0, lighten(color, 0.25));
    g.addColorStop(0.5, color);
    g.addColorStop(1, darken(color, 0.22));
    return g;
  }
  if (card.rarity === 'holo') return rainbowGradient(ctx, 0, 0, CARD_W, CARD_H);
  const g = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  ['#fff3c4', '#e8c35c', '#b88a1e', '#f6e08a', '#c99a2e', '#fff3c4'].forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
  return g;
}

function rarityOverlay(ctx: CanvasRenderingContext2D, card: CardModel, x: number, y: number, w: number, h: number, r: number, flat: boolean) {
  if (card.rarity === 'normal' || flat) return;
  ctx.save();
  rr(ctx, x, y, w, h, r);
  ctx.clip();
  if (card.rarity === 'holo') {
    ctx.globalAlpha = 0.34;
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = rainbowGradient(ctx, x - 40, y, w + 80, h);
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.5;
    const band = ctx.createLinearGradient(x, y + h, x + w, y);
    band.addColorStop(0.3, 'rgba(255,255,255,0)');
    band.addColorStop(0.5, 'rgba(255,255,255,0.65)');
    band.addColorStop(0.7, 'rgba(255,255,255,0)');
    ctx.fillStyle = band;
    ctx.fillRect(x, y, w, h);
  } else if (card.rarity === 'foil') {
    ctx.globalAlpha = 0.55;
    const band = ctx.createLinearGradient(x, y, x + w, y + h);
    band.addColorStop(0.2, 'rgba(255,255,255,0)');
    band.addColorStop(0.45, 'rgba(255,248,214,0.85)');
    band.addColorStop(0.55, 'rgba(255,255,255,0.1)');
    band.addColorStop(0.8, 'rgba(255,236,170,0.5)');
    ctx.fillStyle = band;
    ctx.fillRect(x, y, w, h);
  } else {
    const rnd = rng(hash(card.key));
    ctx.globalAlpha = 1;
    for (let i = 0; i < 70; i++) {
      const px = x + rnd() * w;
      const py = y + rnd() * h;
      const s = 4 + rnd() * 12;
      ctx.fillStyle = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#fff2a8' : '#ffd3f0';
      ctx.globalAlpha = 0.45 + rnd() * 0.5;
      star(ctx, px, py, s, 4);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Das Symbol (oder Foto) im Kunstfenster */
function drawArt(ctx: CanvasRenderingContext2D, card: CardModel, img: HTMLImageElement | null, x: number, y: number, w: number, h: number, r: number, color: string, opts: DrawOpts) {
  ctx.save();
  rr(ctx, x, y, w, h, r);
  ctx.clip();
  if (img) {
    drawCover(ctx, img, x, y, w, h);
  } else {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, lighten(color, 0.62));
    g.addColorStop(1, lighten(color, 0.25));
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    const rnd = rng(hash(`${card.key}-bg`));
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.arc(x + rnd() * w, y + rnd() * h, 8 + rnd() * 26, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(Math.min(w, h) * 0.52)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    ctx.fillStyle = '#000';
    ctx.fillText(card.emoji, x + w / 2, y + h / 2 + Math.min(w, h) * 0.04);
  }
  ctx.restore();
  rarityOverlay(ctx, card, x, y, w, h, r, !!opts.flat);
  // feiner Rand ums Fenster
  rr(ctx, x, y, w, h, r);
  ctx.lineWidth = 5;
  ctx.strokeStyle = darken(color, 0.2);
  ctx.stroke();
}

export function ratingsOf(card: CardModel): { kind: RatingKind; value: number }[] {
  return [card.rating, card.rating2].filter((r): r is { kind: RatingKind; value: number } => !!r && r.value > 0);
}

function drawOneRating(ctx: CanvasRenderingContext2D, r: { kind: RatingKind; value: number }, cx: number, y: number, size: number, gap: number) {
  const glyph = r.kind === 'star' ? '★' : r.kind === 'bolt' ? '⚡' : '♥';
  const max = r.kind === 'bolt' ? 4 : 5;
  const total = max * size + (max - 1) * gap;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  for (let i = 0; i < max; i++) {
    ctx.globalAlpha = i < r.value ? 1 : 0.22;
    ctx.fillStyle = r.kind === 'heart' ? '#d9576f' : '#e0a526';
    ctx.fillText(glyph, cx - total / 2 + size / 2 + i * (size + gap), y);
  }
  ctx.globalAlpha = 1;
}

function drawRating(ctx: CanvasRenderingContext2D, card: CardModel, cx: number, y: number) {
  const rs = ratingsOf(card);
  if (rs.length === 1) drawOneRating(ctx, rs[0], cx, y, 44, 8);
  else if (rs.length === 2) {
    drawOneRating(ctx, rs[0], cx - 132, y, 34, 5);
    drawOneRating(ctx, rs[1], cx + 132, y, 34, 5);
  }
}

function drawStickers(ctx: CanvasRenderingContext2D, card: CardModel, x: number, y: number, w: number, h: number) {
  if (card.stickers?.length) {
    const pos = [
      [x + 6, y + 6, -0.25],
      [x + w - 6, y + 10, 0.22],
      [x + w - 18, y + h - 10, -0.12],
    ];
    card.stickers.slice(0, 3).forEach((s, i) => {
      const [px, py, rot] = pos[i];
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rot);
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '58px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      ctx.fillStyle = '#000';
      ctx.fillText(s, 0, 4);
      ctx.restore();
    });
  }
  // der aktive Begleiter als Sticker (unten links im Kunstfenster)
  const pic = portraitNow(card.companionSticker);
  if (pic) {
    ctx.save();
    ctx.translate(x + 62, y + h - 40);
    ctx.rotate(-0.1);
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 66, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    const ph = 104;
    const pw = (pic.width / pic.height) * ph;
    ctx.beginPath();
    ctx.arc(0, 0, 62, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(pic, -pw / 2, -ph / 2 + 2, pw, ph);
    ctx.restore();
  }
}

function washi(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, rot: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -20, w, 40);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#ffffff';
  for (let i = -w / 2; i < w / 2; i += 18) ctx.fillRect(i, -20, 7, 40);
  ctx.restore();
}

function drawFooter(ctx: CanvasRenderingContext2D, ink: string, y: number, lang: 'de' | 'en', card: CardModel) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'italic 600 21px "Nunito","Segoe UI",system-ui,sans-serif';
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = ink;
  ctx.fillText('von mir aus', CARD_W / 2, y);
  if (card.rarity !== 'normal') {
    ctx.globalAlpha = 0.75;
    ctx.font = '700 17px "Nunito","Segoe UI",system-ui,sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`✦ ${lang === 'en' ? 'LIMITED' : 'LIMITIERT'}`, 64, y);
  }
  ctx.globalAlpha = 0.5;
  ctx.textAlign = 'right';
  ctx.font = '700 17px "Nunito","Segoe UI",system-ui,sans-serif';
  ctx.fillText(`Nr. ${card.number}`, CARD_W - 64, y);
  ctx.globalAlpha = 1;
}

/** Höhe des Bildfensters: bei viel Text wird das Bild kleiner, damit mehr Text auf die Karte passt. */
function artHeightFor(card: CardModel): number {
  if (card.kind === 'reflexion') return 190;
  const hasDate = !!card.dateText;
  const base = hasDate ? 330 : 360;
  const src = card.sections?.length ? card.sections : card.details?.length ? card.details : null;
  const len = src ? src.reduce((n, d) => n + d.text.length + d.label.length, 0) : card.lines?.length ? card.lines.join(' ').length : (card.text?.length ?? 0);
  if (len > 320) return hasDate ? 190 : 200;
  if (len > 150) return hasDate ? 250 : 270;
  return base;
}

/** Kleinste Schriftgröße auf der Karte (≈ 6 pt im Druck) – darunter wird gekürzt. */
const MIN_BODY = 21;

type BodyRow = { kind: 'label' | 'line'; text: string; bullet?: boolean; h: number };

/** Ordnet den Kartentext an: größte passende Schrift, bei Platzmangel gekürzt („…“). */
function layoutBody(ctx: CanvasRenderingContext2D, card: CardModel, innerW: number, availH: number, family: string) {
  const blocks = (s: number): { rows: BodyRow[]; total: number } => {
    const rows: BodyRow[] = [];
    let total = 0;
    ctx.font = `500 ${s}px ${family}`;
    const sections = card.sections?.length ? card.sections : card.details?.length ? card.details : null;
    if (sections) {
      sections.forEach((sec) => {
        if (sec.label) {
          rows.push({ kind: 'label', text: sec.label, h: s * 0.78 + 4 });
          total += s * 0.78 + 4;
        }
        ctx.font = `500 ${s}px ${family}`;
        wrap(ctx, sec.text, innerW).forEach((l) => {
          rows.push({ kind: 'line', text: l, h: s * 1.22 });
          total += s * 1.22;
        });
        total += 8;
        rows[rows.length - 1].h += 8;
      });
    } else if (card.lines?.length) {
      card.lines.forEach((l) => {
        wrap(ctx, l, innerW - 30).forEach((x, i) => {
          rows.push({ kind: 'line', text: x, bullet: i === 0, h: s * 1.22 });
          total += s * 1.22;
        });
        rows[rows.length - 1].h += 6;
        total += 6;
      });
    } else if (card.text) {
      wrap(ctx, card.text, innerW).forEach((l) => {
        rows.push({ kind: 'line', text: l, h: s * 1.28 });
        total += s * 1.28;
      });
    }
    return { rows, total };
  };
  let size = 30;
  let res = blocks(size);
  while (size > MIN_BODY && res.total > availH) {
    size -= 1;
    res = blocks(size);
  }
  let truncated = false;
  let shown: BodyRow[] = res.rows;
  if (res.total > availH) {
    truncated = true;
    shown = [];
    let used = 0;
    for (const r of res.rows) {
      if (used + r.h > availH + 2) break;
      shown.push(r);
      used += r.h;
    }
    // Beschriftung ohne Text darunter weglassen, letzte Zeile mit „…“ beenden
    while (shown.length && shown[shown.length - 1].kind === 'label') shown.pop();
    const last = shown[shown.length - 1];
    if (last) {
      ctx.font = `500 ${size}px ${family}`;
      const w = innerW - (last.bullet ? 30 : 0);
      let t = last.text.replace(/[\s.,;:–-]+$/, '');
      while (t.length > 1 && ctx.measureText(`${t}…`).width > w) t = t.slice(0, -1);
      shown[shown.length - 1] = { ...last, text: `${t}…` };
    }
  }
  const shownChars = shown.filter((r) => r.kind === 'line').reduce((n, r) => n + r.text.length + 1, 0);
  const totalChars = res.rows.filter((r) => r.kind === 'line').reduce((n, r) => n + r.text.length + 1, 0);
  return { size, rows: shown, truncated, shownChars, totalChars };
}

/** Texte unten: Fließtext, Aufzählung oder Abschnitte – mit automatisch passender Schriftgröße. */
function drawBody(ctx: CanvasRenderingContext2D, card: CardModel, x: number, y: number, w: number, h: number, color: string, ink: string, family: string) {
  const body = ctx.createLinearGradient(x, y, x, y + h);
  body.addColorStop(0, mix('#ffffff', color, 0.12));
  body.addColorStop(1, mix('#ffffff', color, 0.2));
  ctx.fillStyle = body;
  rr(ctx, x, y, w, h, 18);
  ctx.fill();
  const pad = 22;
  const innerW = w - pad * 2;
  const stats = card.stats?.length ? card.stats : [];
  const statsH = stats.length ? 50 : 0;
  const availH = h - pad * 2 - statsH;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = ink;
  const lay = layoutBody(ctx, card, innerW, availH, family);
  const size = lay.size;
  let cy = y + pad;
  for (const r of lay.rows) {
    if (r.kind === 'label') {
      ctx.font = `800 ${Math.round(size * 0.78)}px ${family}`;
      ctx.fillStyle = darken(color, 0.3);
      ctx.fillText(r.text.toUpperCase(), x + pad, cy);
    } else {
      ctx.font = `500 ${size}px ${family}`;
      ctx.fillStyle = ink;
      if (r.bullet) {
        ctx.fillStyle = darken(color, 0.15);
        ctx.beginPath();
        ctx.arc(x + pad + 8, cy + size * 0.55, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = ink;
        ctx.fillText(r.text, x + pad + 30, cy);
      } else ctx.fillText(r.text, x + pad + (card.lines?.length && !card.sections?.length && !card.details?.length ? 30 : 0), cy);
    }
    cy += r.h;
  }
  if (stats.length) {
    ctx.textBaseline = 'middle';
    ctx.font = `700 24px ${family}`;
    let sx = x + pad;
    stats.forEach((s) => {
      ctx.fillStyle = darken(color, 0.3);
      ctx.fillText(`${s.label}`, sx, y + h - 30);
      const lw = ctx.measureText(s.label).width;
      ctx.font = '26px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      ctx.fillStyle = '#d99a1a';
      ctx.fillText(s.value, sx + lw + 10, y + h - 30);
      sx += lw + 10 + ctx.measureText(s.value).width + 30;
      ctx.font = `700 24px ${family}`;
    });
  }
}

/**
 * Wie viel vom Text passt auf die Karte? (gleiches Layout wie beim Zeichnen)
 * Auf der Karte – auch im Druck – ist nur dieser Teil sichtbar; in der App lässt sich alles ausklappen.
 */
export function bodyFit(card: CardModel): { truncated: boolean; shownChars: number; totalChars: number } {
  const c = document.createElement('canvas').getContext('2d');
  if (!c) return { truncated: false, shownChars: 0, totalChars: 0 };
  const hasDate = !!card.dateText;
  const isRefl = card.kind === 'reflexion';
  const artH = artHeightFor(card);
  let y = 156 + artH + ((card.frame ?? 'standard') === 'polaroid' ? 40 : 22) + 56;
  if (hasDate) y += isRefl ? 50 : 54;
  const ratingH = ratingsOf(card).length ? 58 : 0;
  const h = 786 - y - ratingH;
  const innerW = CARD_W - 112 - 44;
  const stats = card.stats?.length ? 50 : 0;
  const r = layoutBody(c, card, innerW, h - 44 - stats, familyOf(card.font));
  return { truncated: r.truncated, shownChars: r.shownChars, totalChars: r.totalChars };
}

function drawFront(ctx: CanvasRenderingContext2D, card: CardModel, img: HTMLImageElement | null, opts: DrawOpts) {
  const color = card.color;
  const family = familyOf(card.font);
  const frame: FrameStyle = card.frame ?? 'standard';
  const lang = opts.lang;
  const paper = card.background ?? (frame === 'scrapbook' ? '#f3e7cf' : '#fffaf0');
  const ink = inkOn(paper);
  const kindLabel = (card.categoryLabel ?? (lang === 'en' ? KIND_META[card.kind].en : KIND_META[card.kind].de)).toUpperCase();

  // Karte (außen)
  ctx.clearRect(0, 0, CARD_W, CARD_H);
  ctx.save();
  rr(ctx, 0, 0, CARD_W, CARD_H, 46);
  ctx.fillStyle = drawRarityFrame(ctx, card, color);
  ctx.fill();
  if (frame === 'sticker') {
    // Sticker: weißer Rand wie ausgestanzt
    ctx.fillStyle = '#ffffff';
    rr(ctx, 14, 14, CARD_W - 28, CARD_H - 28, 38);
    ctx.fill();
  }
  ctx.restore();

  const px = 28;
  const py = 28;
  const pw = CARD_W - 56;
  const ph = CARD_H - 56;
  // Papier
  ctx.save();
  rr(ctx, px, py, pw, ph, 30);
  ctx.fillStyle = paper;
  ctx.fill();
  if (frame === 'scrapbook') {
    ctx.strokeStyle = 'rgba(120,90,50,0.08)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.moveTo(px, py + 40 + i * 52);
      ctx.lineTo(px + pw, py + 40 + i * 52);
      ctx.stroke();
    }
  }
  ctx.restore();

  const isRefl = card.kind === 'reflexion';
  const hasDate = !!card.dateText;

  // Kopf: Nummer, Titel, Symbol
  ctx.save();
  ctx.fillStyle = darken(color, 0.25);
  ctx.beginPath();
  ctx.arc(104, 94, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const numStr = String(card.number);
  ctx.font = `800 ${numStr.length > 3 ? 24 : numStr.length > 2 ? 30 : 38}px "Nunito","Segoe UI",system-ui,sans-serif`;
  ctx.fillText(numStr, 104, 96);
  ctx.fillStyle = lighten(color, 0.55);
  ctx.beginPath();
  ctx.arc(CARD_W - 104, 94, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '46px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  ctx.fillStyle = '#000';
  ctx.fillText(KIND_META[card.kind].emoji, CARD_W - 104, 98);
  ctx.restore();

  // Titel (bis zu 2 Zeilen, passt sich an)
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let ts = 50;
  let tl: string[] = [];
  const maxTitleW = 330;
  while (ts > 26) {
    ctx.font = `800 ${ts}px ${family}`;
    tl = wrap(ctx, card.title, maxTitleW);
    if (tl.length <= 2) break;
    ts -= 2;
  }
  ctx.font = `800 ${ts}px ${family}`;
  tl = clampLines(ctx, tl, 2, maxTitleW);
  tl.forEach((l, i) => ctx.fillText(l, CARD_W / 2, 94 + (i - (tl.length - 1) / 2) * ts * 1.1));

  // Kunstfenster
  const artY = 156;
  const artH = artHeightFor(card);
  const artX = 60;
  const artW = CARD_W - 120;
  if (frame === 'polaroid') {
    // Polaroid: weißer Rahmen mit breitem unteren Rand, leicht gedreht
    ctx.save();
    ctx.translate(CARD_W / 2, artY + artH / 2 + 8);
    ctx.rotate(-0.025);
    ctx.shadowColor = 'rgba(0,0,0,0.28)';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-artW / 2 + 6, -artH / 2 - 8, artW - 12, artH + 30);
    ctx.shadowBlur = 0;
    drawArt(ctx, card, img, -artW / 2 + 24, -artH / 2 + 10, artW - 48, artH - 36, 4, color, opts);
    ctx.restore();
    // Klebestreifen
    washi(ctx, CARD_W / 2 + 6, artY + 18, 150, -0.06, lighten(color, 0.3));
  } else if (frame === 'scrapbook') {
    ctx.save();
    ctx.translate(CARD_W / 2, artY + artH / 2);
    ctx.rotate(0.02);
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#fff';
    ctx.fillRect(-artW / 2 + 4, -artH / 2 - 4, artW - 8, artH + 8);
    ctx.shadowBlur = 0;
    drawArt(ctx, card, img, -artW / 2 + 16, -artH / 2 + 8, artW - 32, artH - 16, 6, color, opts);
    ctx.restore();
    washi(ctx, 120, artY + 2, 130, -0.5, lighten(color, 0.2));
    washi(ctx, CARD_W - 120, artY + artH + 4, 130, -0.5, mix(color, '#ff9ec2', 0.5));
  } else {
    drawArt(ctx, card, img, artX, artY, artW, artH, 26, color, opts);
  }
  drawStickers(ctx, card, artX, artY, artW, artH);

  let y = artY + artH + (frame === 'polaroid' ? 40 : 22);

  // Art-Schild + Untertitel
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `800 23px ${family}`;
  const kw = ctx.measureText(kindLabel).width + 34;
  ctx.fillStyle = darken(color, 0.12);
  rr(ctx, 64, y, kw, 40, 20);
  ctx.fill();
  ctx.fillStyle = inkOn(darken(color, 0.12));
  ctx.fillText(kindLabel, 64 + 17, y + 21);
  if (card.subtitle && !isRefl) {
    ctx.font = `600 24px ${family}`;
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.75;
    const sub = clampLines(ctx, wrap(ctx, card.subtitle, CARD_W - 64 - (64 + kw + 14) - 48), 1, CARD_W - 64 - (64 + kw + 14) - 48)[0] ?? '';
    ctx.fillText(sub, 64 + kw + 14, y + 21);
    ctx.globalAlpha = 1;
  }
  y += 56;

  if (hasDate) {
    ctx.textAlign = 'center';
    ctx.fillStyle = darken(color, 0.3);
    ctx.font = `800 ${isRefl ? 34 : 38}px ${family}`;
    ctx.fillText(`📅 ${card.dateText}`, CARD_W / 2, y + 22);
    y += isRefl ? 50 : 54;
  }

  const bodyBottom = 786;
  const ratingH = ratingsOf(card).length ? 58 : 0;
  if (card.text || card.lines?.length || card.sections?.length || card.details?.length || card.stats?.length) {
    drawBody(ctx, card, 56, y, CARD_W - 112, bodyBottom - y - ratingH, color, ink, family);
  }
  drawRating(ctx, card, CARD_W / 2, bodyBottom - ratingH / 2 + 8);
  drawFooter(ctx, ink, 820, lang, card);

  // Rahmen-Glanz bei limitierten Karten
  if (card.rarity !== 'normal' && !opts.flat) {
    ctx.save();
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    rr(ctx, 6, 6, CARD_W - 12, CARD_H - 12, 42);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBack(ctx: CanvasRenderingContext2D, card: CardModel, opts: DrawOpts) {
  const color = card.color;
  ctx.clearRect(0, 0, CARD_W, CARD_H);
  ctx.save();
  rr(ctx, 0, 0, CARD_W, CARD_H, 46);
  ctx.clip();
  const g = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  g.addColorStop(0, darken(color, 0.25));
  g.addColorStop(0.5, color);
  g.addColorStop(1, darken(color, 0.4));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  // Muster: kleine Ringe
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 3;
  for (let yy = 30; yy < CARD_H + 60; yy += 70) {
    for (let xx = (Math.round(yy / 70) % 2) * 35; xx < CARD_W + 70; xx += 70) {
      ctx.beginPath();
      ctx.arc(xx, yy, 22, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  if (card.rarity !== 'normal' && !opts.flat) {
    ctx.globalAlpha = card.rarity === 'holo' ? 0.4 : 0.3;
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = card.rarity === 'holo' ? rainbowGradient(ctx, 0, 0, CARD_W, CARD_H) : drawRarityFrame(ctx, card, color);
    ctx.fillRect(0, 0, CARD_W, CARD_H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  // Rahmenlinien
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 6;
  rr(ctx, 26, 26, CARD_W - 52, CARD_H - 52, 28);
  ctx.stroke();
  ctx.lineWidth = 2;
  rr(ctx, 40, 40, CARD_W - 80, CARD_H - 80, 20);
  ctx.stroke();
  // Wappen
  const cx = CARD_W / 2;
  const cy = CARD_H / 2 - 30;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.arc(cx, cy, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = darken(color, 0.25);
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, 134, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';
  ctx.font = '150px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  ctx.fillText(KIND_META[card.kind].emoji, cx, cy + 8);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 54px "Nunito","Segoe UI",system-ui,sans-serif';
  ctx.fillText('von mir aus', cx, cy + 230);
  ctx.font = '700 24px "Nunito","Segoe UI",system-ui,sans-serif';
  ctx.globalAlpha = 0.85;
  ctx.fillText((card.categoryLabel ?? (opts.lang === 'en' ? KIND_META[card.kind].en : KIND_META[card.kind].de)).toUpperCase(), cx, cy + 285);
  ctx.globalAlpha = 1;
}

export function drawCard(ctx: CanvasRenderingContext2D, card: CardModel, img: HTMLImageElement | null, opts: DrawOpts) {
  if (opts.side === 'back') drawBack(ctx, card, opts);
  else drawFront(ctx, card, img, opts);
}

/** Rendert in ein neues Canvas mit der gewünschten Auflösung (scale 1 = 635 × 880 Pixel). */
export async function renderCardCanvas(card: CardModel, opts: DrawOpts & { scale?: number }): Promise<HTMLCanvasElement> {
  const scale = opts.scale ?? 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(CARD_W * scale);
  canvas.height = Math.round(CARD_H * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(scale, scale);
  const img = opts.side === 'front' ? await prepareCardImage(card) : null;
  drawCard(ctx, card, img, opts);
  return canvas;
}
