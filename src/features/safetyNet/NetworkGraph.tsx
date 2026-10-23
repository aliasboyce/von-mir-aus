import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Maximize, Minus, Phone, Plus } from 'lucide-react';
import { getIcon } from '../../components/icons/networkIcons';
import { seededRandom } from '../../hooks/seededRandom';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { useCamera } from '../../components/canvas/useCamera';
import { connectionCurvesStore, pairKey } from './connectionCurves';
import { computePositions, netBounds, validParentId, type Pt } from './networkLayout';
import { linkCategoriesRepo, linkMetaStore, resolveLink, DEFAULT_LINK_COLOR } from './networkLinks';
import type { CenterNodeConfig } from './networkCategories';
import type { NetworkCategoryConfig, NetworkEntry } from '../../data/types';
import { networkBackgroundStore, cssForNetworkBackground, type NetworkBackground } from './networkBackground';

interface NetworkGraphProps {
  entries: NetworkEntry[];
  categories: NetworkCategoryConfig[];
  onSelect: (entry: NetworkEntry) => void;
  onMove: (entry: NetworkEntry, position: { x: number; y: number }) => void;
  onSelectCenter?: () => void;
  centerNode?: CenterNodeConfig;
  /** Fullscreen mode: free pan (as far as you like), wheel/pinch zoom, zoom buttons, no clamping. */
  expanded?: boolean;
  /** id of the entry currently waiting for a second tap to complete a new
   * free connection — while set, tapping any OTHER node completes the
   * connection instead of opening it, and tapping the same node cancels. */
  connectingFromId?: string | null;
  onCompleteConnection?: (target: NetworkEntry) => void;
  onCancelConnecting?: () => void;
  /** tap on a line (free connection or sub-element link): opens its editor (name, colour, remove) */
  onLinkTap?: (aId: string, bId: string) => void;
  /** bump to re-read connection names/colours after the editor changed them */
  linksVersion?: number;
  background?: NetworkBackground;
}

const DRAG_THRESHOLD_PX = 6;
const clampPos = (v: number, min = 0.05, max = 0.95) => Math.min(max, Math.max(min, v));

export function NetworkGraph({
  entries,
  categories,
  onSelect,
  onMove,
  onSelectCenter,
  centerNode,
  expanded = false,
  connectingFromId = null,
  onCompleteConnection,
  onCancelConnecting,
  onLinkTap,
  linksVersion = 0,
  background,
}: NetworkGraphProps) {
  const t = useT();
  const { settings } = useSettings();
  const [ownBackground] = useState<NetworkBackground>(() => networkBackgroundStore.get());
  const effectiveBackground = background ?? ownBackground;
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<Pt | null>(null);
  const dragMoved = useRef(false);
  const dragStart = useRef<{ px: number; py: number } | null>(null);
  const [activeCommTip, setActiveCommTip] = useState<{ a: string; b: string; x: number; y: number } | null>(null);
  const [curveDrag, setCurveDrag] = useState<{ key: string; amount: number } | null>(null);
  const curveDragKeyRef = useRef<{ a: string; b: string } | null>(null);

  // ---- the square "world": one graph unit = S pixels, so nothing is ever stretched ----
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [fixedS, setFixedS] = useState(0);
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    // in fullscreen the world size is fixed once, so rotating the phone does not shuffle the map
    if (expanded && !fixedS && box.w && box.h) setFixedS(Math.min(box.w, box.h));
  }, [expanded, fixedS, box]);
  const S = expanded ? fixedS || Math.min(box.w, box.h) : Math.min(box.w, box.h);
  const offX = (box.w - S) / 2;
  const offY = (box.h - S) / 2;

  const cam = useCamera(containerRef, { enabled: expanded, minScale: 0.12, maxScale: 5 });
  const { view, fit, setView } = cam;
  const camReady = useRef(false);

  const positions = useMemo(() => computePositions(entries), [entries]);
  const byId = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);
  const parentOf = useMemo(() => {
    const m = new Map<string, string | undefined>();
    entries.forEach((e) => m.set(e.id, validParentId(e, byId)));
    return m;
  }, [entries, byId]);

  const fitAll = useCallback(() => {
    if (!S) return;
    const b = netBounds(positions);
    fit({ minX: b.minX * S - 70, minY: b.minY * S - 50, maxX: b.maxX * S + 70, maxY: b.maxY * S + 80 }, 24);
  }, [S, positions, fit]);

  // first layout of fullscreen: centre the square; if nodes were pulled far out, fit everything
  useEffect(() => {
    if (!expanded || !S || camReady.current || !box.w) return;
    camReady.current = true;
    const b = netBounds(positions);
    const outside = b.minX < 0.02 || b.minY < 0.02 || b.maxX > 0.98 || b.maxY > 0.98;
    if (outside) fitAll();
    else setView({ scale: 1, tx: offX, ty: offY });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, S, box.w]);

  const toGraph = useCallback(
    (clientX: number, clientY: number): Pt => {
      const rect = containerRef.current!.getBoundingClientRect();
      if (expanded) {
        const w = cam.toWorld(clientX, clientY);
        return { x: w.x / S, y: w.y / S };
      }
      return { x: (clientX - rect.left - offX) / S, y: (clientY - rect.top - offY) / S };
    },
    [expanded, cam, S, offX, offY],
  );

  const categoryById = (id: string) => categories.find((c) => c.id === id) ?? categories[0];
  const posOf = (id: string): Pt => (id === dragId && dragPos ? dragPos : positions.get(id) ?? { x: 0.5, y: 0.5 });

  // ---- dragging a node ----
  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, entry: NetworkEntry) => {
      e.stopPropagation();
      cam.stopMomentum();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragMoved.current = false;
      dragStart.current = { px: e.clientX, py: e.clientY };
      setDragId(entry.id);
      setDragPos(positions.get(entry.id) ?? { x: 0.5, y: 0.5 });
    },
    [positions, cam],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (!dragId || !containerRef.current || !dragStart.current || !S) return;
      const dx = e.clientX - dragStart.current.px;
      const dy = e.clientY - dragStart.current.py;
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) dragMoved.current = true;
      if (!dragMoved.current) return;
      const p = toGraph(e.clientX, e.clientY);
      setDragPos(expanded ? p : { x: clampPos(p.x), y: clampPos(p.y) });
    },
    [dragId, S, toGraph, expanded],
  );

  const handlePointerUp = useCallback(
    (entry: NetworkEntry) => {
      if (dragMoved.current && dragPos) {
        onMove(entry, dragPos);
      } else if (connectingFromId) {
        if (entry.id === connectingFromId) onCancelConnecting?.();
        else onCompleteConnection?.(entry);
      } else {
        onSelect(entry);
      }
      setDragId(null);
      setDragPos(null);
      dragStart.current = null;
    },
    [dragPos, onMove, onSelect, connectingFromId, onCompleteConnection, onCancelConnecting],
  );

  // ---- bending a communication line ----
  const handleCurveHandleDown = useCallback((e: ReactPointerEvent<SVGCircleElement>, a: NetworkEntry, b: NetworkEntry, currentAmount: number) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    curveDragKeyRef.current = { a: a.id, b: b.id };
    setCurveDrag({ key: pairKey(a.id, b.id), amount: currentAmount });
  }, []);

  const handleCurveHandleMove = useCallback(
    (e: ReactPointerEvent<SVGCircleElement>) => {
      const pair = curveDragKeyRef.current;
      if (!pair || !containerRef.current || !S) return;
      const posA = positions.get(pair.a);
      const posB = positions.get(pair.b);
      if (!posA || !posB) return;
      const p = toGraph(e.clientX, e.clientY);
      const midX = (posA.x + posB.x) / 2;
      const midY = (posA.y + posB.y) / 2;
      const dx = posB.x - posA.x;
      const dy = posB.y - posA.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const amount = Math.min(0.3, Math.max(-0.3, 2 * ((p.x - midX) * nx + (p.y - midY) * ny)));
      setCurveDrag({ key: pairKey(pair.a, pair.b), amount });
    },
    [positions, S, toGraph],
  );

  const handleCurveHandleUp = useCallback(() => {
    const pair = curveDragKeyRef.current;
    if (pair && curveDrag) connectionCurvesStore.set(pair.a, pair.b, { amount: curveDrag.amount });
    curveDragKeyRef.current = null;
    setCurveDrag(null);
  }, [curveDrag]);

  // ---- lines ----
  const commPaths: Array<[NetworkEntry, NetworkEntry]> = [];
  const seenPairs = new Set<string>();
  entries.forEach((entry) => {
    (entry.connections ?? []).forEach((otherId) => {
      const other = byId.get(otherId);
      if (!other) return;
      const key = pairKey(entry.id, other.id);
      if (seenPairs.has(key)) return;
      seenPairs.add(key);
      commPaths.push([entry, other]);
    });
  });
  const freeLinks: Array<[NetworkEntry, NetworkEntry]> = [];
  const seenFree = new Set<string>();
  entries.forEach((entry) => {
    (entry.linkedTo ?? []).forEach((otherId) => {
      const other = byId.get(otherId);
      if (!other) return;
      const key = pairKey(entry.id, other.id);
      if (seenFree.has(key)) return;
      seenFree.add(key);
      freeLinks.push([entry, other]);
    });
  });
  const linkCats = useMemo(() => linkCategoriesRepo.getAll(), [linksVersion]); // eslint-disable-line react-hooks/exhaustive-deps
  const linkMeta = useMemo(() => linkMetaStore.all(), [linksVersion]); // eslint-disable-line react-hooks/exhaustive-deps
  const metaFor = (a: string, b: string) => resolveLink(linkMeta[pairKey(a, b)] ?? {}, linkCats);

  const worldStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: S,
    height: S,
    transformOrigin: '0 0',
    transform: expanded ? `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})` : `translate(${offX}px, ${offY}px)`,
  };

  const hitPath = (a: string, b: string, d: string) => (
    <path
      d={d}
      stroke="transparent"
      strokeWidth={expanded ? 4 : 5}
      fill="none"
      data-testid={`net-link-${pairKey(a, b)}`}
      style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => onLinkTap?.(a, b)}
    />
  );

  const labelPill = (a: string, b: string, x: number, y: number, label: string, color: string | null) =>
    label ? (
      <button
        key={`lbl-${pairKey(a, b)}`}
        type="button"
        className="network-link-label"
        data-testid={`net-link-label-${pairKey(a, b)}`}
        style={{ left: `${x * 100}%`, top: `${y * 100}%`, borderColor: color ?? DEFAULT_LINK_COLOR, color: 'var(--color-text)' }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onLinkTap?.(a, b)}
      >
        <span className="network-link-label__dot" style={{ background: color ?? DEFAULT_LINK_COLOR }} />
        {label}
      </button>
    ) : null;

  return (
    <div className={`relative w-full ${expanded ? 'h-full' : 'aspect-square'}`} style={expanded ? undefined : { maxHeight: 340 }}>
      <div
        ref={containerRef}
        className="absolute inset-0 select-none touch-none rounded-[var(--radius-lg)] overflow-hidden"
        style={{
          ...cssForNetworkBackground(effectiveBackground),
          cursor: expanded ? (cam.gesturing ? 'grabbing' : 'grab') : undefined,
        }}
        data-testid={expanded ? 'network-canvas-expanded' : 'network-canvas'}
        {...(expanded ? cam.bind : {})}
      >
        {S > 0 && (
          <div style={worldStyle} data-testid="network-world" data-scale={expanded ? view.scale.toFixed(3) : '1'}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100" aria-hidden="true">
              {/* "you" → every top-level element (sub-elements hang under their parent instead) */}
              {entries.map((entry) => {
                if (parentOf.get(entry.id)) return null;
                const pos = posOf(entry.id);
                return (
                  <line
                    key={entry.id}
                    x1="50"
                    y1="50"
                    x2={pos.x * 100}
                    y2={pos.y * 100}
                    stroke="var(--color-border-strong)"
                    strokeWidth={0.55}
                    strokeDasharray="0.4 1.8"
                    strokeLinecap="round"
                  />
                );
              })}
              {/* sub-element → its parent */}
              {entries.map((entry) => {
                const pid = parentOf.get(entry.id);
                if (!pid) return null;
                const a = posOf(pid);
                const b = posOf(entry.id);
                const { color } = metaFor(pid, entry.id);
                const d = `M ${a.x * 100} ${a.y * 100} L ${b.x * 100} ${b.y * 100}`;
                return (
                  <g key={`par-${entry.id}`} className="network-edge-in">
                    <path d={d} stroke={color ?? categoryById(entry.category)?.color ?? DEFAULT_LINK_COLOR} strokeWidth={0.6} strokeLinecap="round" fill="none" opacity={0.7} />
                    {hitPath(pid, entry.id, d)}
                  </g>
                );
              })}
              {freeLinks.map(([a, b]) => {
                const pa = posOf(a.id);
                const pb = posOf(b.id);
                const { color } = metaFor(a.id, b.id);
                const d = `M ${pa.x * 100} ${pa.y * 100} L ${pb.x * 100} ${pb.y * 100}`;
                return (
                  <g key={`free-${a.id}-${b.id}`} className="network-edge-in">
                    <path d={d} stroke={color ?? 'var(--color-primary)'} strokeWidth={color ? 0.75 : 0.55} strokeLinecap="round" fill="none" opacity={color ? 0.85 : 0.6} />
                    {hitPath(a.id, b.id, d)}
                  </g>
                );
              })}
              {commPaths.map(([a, b]) => {
                const posA = posOf(a.id);
                const posB = posOf(b.id);
                const key = pairKey(a.id, b.id);
                const amount = curveDrag?.key === key ? curveDrag.amount : connectionCurvesStore.get(a.id, b.id).amount;
                const midX = (posA.x + posB.x) / 2;
                const midY = (posA.y + posB.y) / 2;
                const dx = posB.x - posA.x;
                const dy = posB.y - posA.y;
                const len = Math.hypot(dx, dy) || 1;
                const controlX = midX + (-dy / len) * amount;
                const controlY = midY + (dx / len) * amount;
                const curveMidX = 0.25 * posA.x + 0.5 * controlX + 0.25 * posB.x;
                const curveMidY = 0.25 * posA.y + 0.5 * controlY + 0.25 * posB.y;
                const pathD = `M ${posA.x * 100} ${posA.y * 100} Q ${controlX * 100} ${controlY * 100} ${posB.x * 100} ${posB.y * 100}`;
                return (
                  <g key={key}>
                    <path d={pathD} stroke="var(--color-text-faint)" strokeWidth={0.5} strokeDasharray="0.6 1.4" strokeLinecap="round" fill="none" opacity={0.85} />
                    <path
                      d={pathD}
                      stroke="transparent"
                      strokeWidth={5}
                      fill="none"
                      style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() =>
                        setActiveCommTip((prev) => (prev && prev.a === a.id && prev.b === b.id ? null : { a: a.id, b: b.id, x: curveMidX, y: curveMidY }))
                      }
                    />
                    <circle
                      cx={curveMidX * 100}
                      cy={curveMidY * 100}
                      r={2.6}
                      fill="var(--color-surface)"
                      stroke="var(--color-text-faint)"
                      strokeWidth={0.3}
                      style={{ cursor: 'grab', pointerEvents: 'all', touchAction: 'none' }}
                      onPointerDown={(e) => handleCurveHandleDown(e, a, b, amount)}
                      onPointerMove={handleCurveHandleMove}
                      onPointerUp={handleCurveHandleUp}
                    />
                    <Phone x={curveMidX * 100 - 1.1} y={curveMidY * 100 - 1.1} width={2.2} height={2.2} color="var(--color-text-faint)" strokeWidth={2.4} style={{ pointerEvents: 'none' }} />
                  </g>
                );
              })}
            </svg>

            {/* names of connections */}
            {freeLinks.map(([a, b]) => {
              const pa = posOf(a.id);
              const pb = posOf(b.id);
              const { label, color } = metaFor(a.id, b.id);
              return labelPill(a.id, b.id, (pa.x + pb.x) / 2, (pa.y + pb.y) / 2, label, color);
            })}
            {entries.map((entry) => {
              const pid = parentOf.get(entry.id);
              if (!pid) return null;
              const pa = posOf(pid);
              const pb = posOf(entry.id);
              const { label, color } = metaFor(pid, entry.id);
              return labelPill(pid, entry.id, (pa.x + pb.x) / 2, (pa.y + pb.y) / 2, label, color ?? categoryById(entry.category)?.color ?? null);
            })}

            <button
              type="button"
              onClick={onSelectCenter}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={centerNode?.label || t.network.you}
              className="absolute flex flex-col items-center justify-center rounded-full text-[var(--color-surface)] shadow-[var(--shadow-md)] border-none cursor-pointer network-node__dot"
              style={{ width: 76, height: 76, left: '50%', top: '50%', transform: 'translate(-50%, -50%)', background: centerNode?.color || 'var(--color-primary)' }}
            >
              {centerNode?.photoDataUrl ? (
                <img
                  src={centerNode.photoDataUrl}
                  alt=""
                  className="w-full h-full object-cover rounded-full"
                  style={{ transform: `translate(${centerNode.photoOffsetX ?? 0}%, ${centerNode.photoOffsetY ?? 0}%) scale(${centerNode.photoScale ?? 1})` }}
                />
              ) : centerNode?.iconKey ? (
                (() => {
                  const CenterIcon = getIcon(centerNode.iconKey, 'sparkles');
                  return <CenterIcon size={26} />;
                })()
              ) : (
                <span className="text-[12px] font-semibold tracking-wide px-1 text-center break-words">{centerNode?.label || t.network.you}</span>
              )}
            </button>

            {entries.map((entry, i) => {
              const pos = posOf(entry.id);
              const category = categoryById(entry.category);
              const Icon = getIcon(entry.iconKey, category.iconKey);
              const phase = seededRandom(entry.id, 'p');
              const isDragging = entry.id === dragId && dragMoved.current;
              const isChild = !!parentOf.get(entry.id);
              return (
                <button
                  key={entry.id}
                  type="button"
                  onPointerDown={(e) => handlePointerDown(e, entry)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={() => handlePointerUp(entry)}
                  aria-label={entry.name}
                  data-testid={`net-node-${entry.id}`}
                  className={`network-node ${settings.reduceMotion ? '' : 'network-node--float'} ${isDragging ? 'network-node--dragging' : ''} ${connectingFromId === entry.id ? 'network-node--connecting' : ''} ${isChild ? 'network-node--child' : ''}`}
                  style={
                    {
                      left: `${pos.x * 100}%`,
                      top: `${pos.y * 100}%`,
                      touchAction: 'none',
                      '--float-delay': `${phase * -8}s`,
                      '--float-duration': `${6 + phase * 3}s`,
                      zIndex: isDragging ? 20 : 10 + i,
                    } as React.CSSProperties
                  }
                >
                  <span className="network-node__dot" style={{ background: category.color }}>
                    {entry.photoDataUrl ? (
                      <img
                        src={entry.photoDataUrl}
                        alt=""
                        className="w-full h-full object-cover rounded-full"
                        style={{ transform: `translate(${entry.photoOffsetX ?? 0}%, ${entry.photoOffsetY ?? 0}%) scale(${entry.photoScale ?? 1})` }}
                      />
                    ) : (
                      <Icon size={isChild ? 14 : 17} color="#fff" />
                    )}
                  </span>
                  <span className="network-node__label">{entry.name}</span>
                </button>
              );
            })}

            {activeCommTip &&
              (() => {
                const a = byId.get(activeCommTip.a);
                const b = byId.get(activeCommTip.b);
                if (!a || !b) return null;
                return (
                  <div className="network-comm-tip" style={{ left: `${activeCommTip.x * 100}%`, top: `${activeCommTip.y * 100}%` }} onClick={() => setActiveCommTip(null)}>
                    {a.name} {t.network.connectionsTipAnd} {b.name} {t.network.connectionsTipSuffix}
                  </div>
                );
              })()}
          </div>
        )}
      </div>

      {expanded && (
        <div className="absolute right-3 top-3 flex flex-col gap-2 z-30" data-testid="network-zoom-controls">
          {[
            { id: 'in', icon: <Plus size={18} />, label: 'Zoom +', run: () => cam.zoomAt(1.35) },
            { id: 'out', icon: <Minus size={18} />, label: 'Zoom −', run: () => cam.zoomAt(1 / 1.35) },
            { id: 'fit', icon: <Maximize size={16} />, label: settings.language === 'en' ? 'Show everything' : 'Alles zeigen', run: fitAll },
          ].map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={b.run}
              aria-label={b.label}
              data-testid={`network-zoom-${b.id}`}
              className="w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center text-[var(--color-text-muted)]"
            >
              {b.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
