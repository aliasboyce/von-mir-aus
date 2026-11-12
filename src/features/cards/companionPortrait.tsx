import { createElement } from 'react';
import { getAnyLichtwesen } from '../../components/companion/customLichtwesen';
import { getAnimal } from '../../components/companion/animals/animalRegistry';
import { AnimalFigure } from '../../components/companion/animals/AnimalFigure';
import { lookOf } from '../../components/companion/animals/AnimalCompanion';
import { LichtwesenEyes } from '../../components/companion/LichtwesenEyes';
import type { LichtwesenConfig } from '../../components/companion/lichtwesen';

/** Das Lichtwesen still gezeichnet (ohne Bewegung) – nur für Karten-Bilder. */
function OrbPicture({ being }: { being: LichtwesenConfig }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110" width="220" height="242">
      <path d="M42 20C40 12 44 6 50 3" stroke={being.color} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.75" />
      <circle cx="50" cy="3" r="2.4" fill={being.glow} />
      <g opacity="0.9">
        <circle cx="30" cy="35" r="10" fill={being.color} opacity="0.55" />
        <circle cx="70" cy="34" r="10" fill={being.color} opacity="0.55" />
        <circle cx="22" cy="55" r="9" fill={being.color} opacity="0.5" />
        <circle cx="78" cy="55" r="9" fill={being.color} opacity="0.5" />
        <circle cx="26" cy="75" r="8" fill={being.color} opacity="0.45" />
        <circle cx="74" cy="75" r="8" fill={being.color} opacity="0.45" />
      </g>
      <circle cx="50" cy="56" r="34" fill={being.color} />
      <circle cx="50" cy="56" r="34" fill="#fff" opacity="0.1" />
      {being.bodyDots && (
        <g opacity="0.5">
          <circle cx="27" cy="42" r="2.6" fill="#fff" />
          <circle cx="74" cy="45" r="2" fill="#fff" />
          <circle cx="68" cy="72" r="2.3" fill="#fff" />
          <circle cx="30" cy="75" r="1.8" fill="#fff" />
          <circle cx="50" cy="82" r="2" fill="#fff" />
        </g>
      )}
      <circle cx="50" cy="54" r="19" fill="#fff" />
      <circle cx="50" cy="54" r="19" fill="none" stroke={being.color} strokeWidth="3" opacity="0.35" />
      <LichtwesenEyes style={being.eyeStyle} color={being.color} blinking={false} bigEye />
      <path d="M45 78q5 4 10 0" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.85" />
      <circle cx="14" cy="24" r="2" fill={being.glow} opacity="0.9" />
      <circle cx="88" cy="30" r="1.4" fill={being.glow} opacity="0.8" />
      <circle cx="82" cy="16" r="1.7" fill={being.glow} opacity="0.7" />
    </svg>
  );
}

const portraits = new Map<string, HTMLImageElement | null>();
const pending = new Map<string, Promise<HTMLImageElement | null>>();

/** Bereits geladene Bilder (für das synchrone Zeichnen von Stickern). */
export function portraitNow(id: string | undefined): HTMLImageElement | null {
  return id ? portraits.get(id) ?? null : null;
}

/** Das Bild des Begleiters (Wesen oder Tier) mit durchsichtigem Hintergrund. */
export function companionPortrait(id: string | undefined): Promise<HTMLImageElement | null> {
  if (!id) return Promise.resolve(null);
  if (portraits.has(id)) return Promise.resolve(portraits.get(id) ?? null);
  const hit = pending.get(id);
  if (hit) return hit;
  const job = (async () => {
    try {
      const being = getAnyLichtwesen(id);
      const { renderToStaticMarkup } = await import('react-dom/server');
      let html: string;
      const animal = being.animal ? getAnimal(being.animal.species) : null;
      if (animal) html = renderToStaticMarkup(createElement(AnimalFigure, { animal, look: lookOf(being), age: 1, state: 'awake', size: 240, inert: true }));
      else html = renderToStaticMarkup(createElement(OrbPicture, { being }));
      const m = /<svg\b[\s\S]*<\/svg>/.exec(html);
      if (!m) return null;
      let svg = m[0];
      if (!/xmlns=/.test(svg.slice(0, 200))) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      // Tiere: die Figur hat im Markup feste Pixelgröße – wir brauchen nur das Seitenverhältnis (viewBox)
      const img = new Image();
      const ok = new Promise<boolean>((res) => {
        img.onload = () => res(true);
        img.onerror = () => res(false);
      });
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      if (!(await ok)) return null;
      // in ein Canvas übernehmen, damit es sicher (ohne Größenprobleme) gezeichnet werden kann
      const c = document.createElement('canvas');
      c.width = 440;
      c.height = 484;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const out = new Image();
      const ok2 = new Promise<boolean>((res) => {
        out.onload = () => res(true);
        out.onerror = () => res(false);
      });
      out.src = c.toDataURL('image/png');
      return (await ok2) ? out : null;
    } catch {
      return null;
    }
  })().then((v) => {
    portraits.set(id, v);
    pending.delete(id);
    return v;
  });
  pending.set(id, job);
  return job;
}
