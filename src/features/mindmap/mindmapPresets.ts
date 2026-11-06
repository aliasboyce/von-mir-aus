import { useEffect, useState } from 'react';
import { createRepository, createId } from '../../services/storage/repository';
import type { MMNode } from './mindmapModel';

/**
 * "Man soll Voreinstellungen speichern können" — a look (shape, colours, text, border …) kept under a name
 * and applied to anything with one tap.
 */
export const PRESET_KEYS = ['shape', 'round', 'color', 'look', 'size', 'font', 'bold', 'italic', 'fc', 'bc', 'tc', 'nofill', 'fop', 'op', 'border', 'sw', 'tfree', 'tsz'] as const;
export type PresetStyle = Partial<Pick<MMNode, (typeof PRESET_KEYS)[number]>>;
export interface MMPreset {
  id: string;
  name: string;
  style: PresetStyle;
}

const NO_RESHAPE = new Set(['draw', 'doodle', 'image', 'sticker', 'maplink', 'todo', 'table', 'proscons', 'appcard', 'frame', 'note']);

export const presetRepo = createRepository<MMPreset>('mindmap-style-presets');
const EVT = 'mm-presets-changed';

export function styleOfNode(n: MMNode): PresetStyle {
  const out: Record<string, unknown> = {};
  for (const k of PRESET_KEYS) if (n[k] !== undefined) out[k] = n[k];
  return out as PresetStyle;
}
export function savePreset(name: string, n: MMNode): MMPreset {
  const p: MMPreset = { id: createId('mmpre'), name: name.trim().slice(0, 40) || 'Voreinstellung', style: styleOfNode(n) };
  presetRepo.save(p);
  window.dispatchEvent(new Event(EVT));
  return p;
}
export function deletePreset(id: string) {
  presetRepo.remove(id);
  window.dispatchEvent(new Event(EVT));
}
/** what a preset changes on a given element (the shape only where the element may take another shape) */
export function presetPatch(p: MMPreset, n: MMNode): Partial<MMNode> {
  const out: Record<string, unknown> = {};
  for (const k of PRESET_KEYS) {
    if (k === 'shape' || k === 'round') {
      if (NO_RESHAPE.has(n.shape) || (p.style.shape && NO_RESHAPE.has(p.style.shape))) continue;
    }
    out[k] = p.style[k];
  }
  return out as Partial<MMNode>;
}
export function usePresets(): MMPreset[] {
  const [, setV] = useState(0);
  useEffect(() => {
    const on = () => setV((v) => v + 1);
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  return presetRepo.getAll();
}
