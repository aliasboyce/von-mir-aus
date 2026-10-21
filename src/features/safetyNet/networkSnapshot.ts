import { createElement } from 'react';
import type { ComponentProps } from 'react';
import { NetworkPrintView } from './NetworkPrintView';
import { svgToPngBlob } from '../../services/snapshot';
import type { NetworkBackground } from './networkBackground';

type Props = Omit<ComponentProps<typeof NetworkPrintView>, 'image' | 'background'>;

/** The net as a finished picture (PNG): exactly the drawing of the print view, optionally on the net's own background. */
export async function networkSnapshotPng(props: Props, background?: NetworkBackground): Promise<Blob | null> {
  try {
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(createElement(NetworkPrintView, { ...props, background }));
    const m = /<svg\b[\s\S]*?<\/svg>/.exec(html);
    if (!m) return null;
    return await svgToPngBlob(m[0], { maxSide: 2200, background: background ? '#f6f2ea' : '#ffffff' });
  } catch {
    return null;
  }
}
