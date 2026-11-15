import { memo, useId } from 'react';
import { BackgroundPattern, MapItems, SceneDefs, SceneProvider, useMapLookup } from '../mindmap/MindmapScene';
import { bgColor, bgIsDark, type MindMap } from '../mindmap/mindmapModel';
import { PAGE_BOUNDS, PAGE_H, PAGE_W } from './scrapModel';

/**
 * Das Papier einer Seite (A4-Rechteck): Farbe, Muster, eigenes Foto und – wenn gewählt – der Vintage-Look
 * (leicht gealterte Ränder und feine Körnung). Wird im Editor, im Buch und im PDF gleich gezeichnet.
 */
export function PaperLayer({ bg, uid }: { bg: MindMap['bg']; uid: string }) {
  const color = bgColor(bg.tone);
  const dark = bgIsDark(bg.tone);
  const clip = `${uid}-pclip`;
  const vig = `${uid}-pvig`;
  const grain = `${uid}-pgrain`;
  const { minX, minY } = PAGE_BOUNDS;
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <rect x={minX} y={minY} width={PAGE_W} height={PAGE_H} />
        </clipPath>
        <radialGradient id={vig} cx="50%" cy="50%" r="75%">
          <stop offset="70%" stopColor="#8a6a3a" stopOpacity="0" />
          <stop offset="100%" stopColor="#6b4a22" stopOpacity={dark ? 0.3 : 0.2} />
        </radialGradient>
        <filter id={grain} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
          <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.27  0 0 0 0 0.15  0 0 0 0.55 0" />
        </filter>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect x={minX} y={minY} width={PAGE_W} height={PAGE_H} fill={color} />
        {bg.img ? (
          <>
            <image href={bg.img} x={minX} y={minY} width={PAGE_W} height={PAGE_H} preserveAspectRatio="xMidYMid slice" />
            {(bg.imgDim ?? 0) > 0 && <rect x={minX} y={minY} width={PAGE_W} height={PAGE_H} fill={color} opacity={bg.imgDim} />}
          </>
        ) : (
          <BackgroundPattern kind={bg.kind} dark={dark} uid={uid} />
        )}
        {bg.aged && (
          <>
            <rect x={minX} y={minY} width={PAGE_W} height={PAGE_H} filter={`url(#${grain})`} opacity={0.14} />
            <rect x={minX} y={minY} width={PAGE_W} height={PAGE_H} fill={`url(#${vig})`} />
          </>
        )}
      </g>
    </g>
  );
}

/** Eine fertige Seite als stilles Bild (Buchansicht, Monatsübersicht, PDF). Was über den Rand ragt, wird abgeschnitten. */
export const ScrapPageView = memo(function ScrapPageView({ page, className, testId }: { page: Pick<MindMap, 'nodes' | 'edges' | 'bg'>; className?: string; testId?: string }) {
  const raw = useId();
  const uid = `sp${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
  const resolve = useMapLookup();
  const color = bgColor(page.bg.tone);
  return (
    <svg viewBox={`${PAGE_BOUNDS.minX} ${PAGE_BOUNDS.minY} ${PAGE_W} ${PAGE_H}`} preserveAspectRatio="xMidYMid slice" className={className} style={{ display: 'block', width: '100%', height: '100%' }} data-testid={testId}>
      <SceneProvider uid={uid} resolveMap={resolve}>
        <SceneDefs uid={uid} />
        <PaperLayer bg={page.bg} uid={uid} />
        <g clipPath={`url(#${uid}-pclip)`}>
          <MapItems map={page} bg={color} />
        </g>
      </SceneProvider>
    </svg>
  );
});
