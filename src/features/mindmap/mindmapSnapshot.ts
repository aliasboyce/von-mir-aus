import { createElement } from 'react';
import { MindmapDrawing } from './MindmapScene';
import { mapBounds, type Bounds, type MindMap } from './mindmapModel';
import { planMindmapPrint } from './MindmapPrintView';
import { blobToDataUrl, svgToPngBlob } from '../../services/snapshot';

async function drawing(map: MindMap, opts: { paper: boolean; bounds?: Bounds; pad: number }): Promise<Blob | null> {
  try {
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(createElement(MindmapDrawing, { map, paper: opts.paper, bounds: opts.bounds ?? mapBounds(map), pad: opts.pad }));
    const m = /<svg\b[\s\S]*<\/svg>/.exec(html);
    if (!m) return null;
    return await svgToPngBlob(m[0], { maxSide: 2200, background: opts.paper ? '#ffffff' : '#fbf8f1' });
  } catch {
    return null;
  }
}

/** The map exactly as it looks (own colour, pattern or photo): the picture of the photo button. */
export const mindmapSnapshotPng = (map: MindMap) => drawing(map, { paper: false, pad: 40 });

/** Pictures for the PDF: whole map plus detail sections, all on white paper. */
export async function mindmapPrintImages(map: MindMap): Promise<{ overview?: string; tiles: (string | undefined)[] }> {
  const plan = planMindmapPrint(map);
  const toUrl = async (p: Promise<Blob | null>) => {
    const b = await p;
    return b ? blobToDataUrl(b) : undefined;
  };
  const overview = await toUrl(drawing(map, { paper: true, bounds: plan.b, pad: plan.pad }));
  const tiles: (string | undefined)[] = [];
  for (const t of plan.tiles) tiles.push(await toUrl(drawing(map, { paper: true, bounds: t, pad: 0 })));
  return { overview, tiles };
}
