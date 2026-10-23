import type { ReactNode, CSSProperties } from 'react';
import type { Bridge, Resource, ResourceCategory } from '../../data/types';
import type { Skillkette } from '../../data/types';
import { PhotoBackground } from './PhotoBackground';
import { SKILL_CATEGORY_ZONE_COLOR, RESOURCE_CATEGORY_TO_GROUP } from '../../features/resources/resourceMeta';
import { BRIDGE_CATEGORY_META } from '../../features/bridges/bridgeMeta';
import { useT } from '../../i18n';
import { createCustomCategoryStore } from '../../services/customCategories';
import { RESOURCE_GROUP_COLOR as GROUP_COLOR, BRIDGE_GROUP_COLOR, NEUTRAL_COLOR } from './itemColors';

const customResourceCategories = createCustomCategoryStore('resource-custom-categories');

/**
 * "Wenn Skills/Aktivitäten/Ressourcen/Brücken woanders angezeigt werden als auf ihrer eigenen
 * Hauptseite, sollen sie trotzdem mit Farben und Bildern lebendig dargestellt werden."
 * One shared look for every place that shows such an item outside its own page: a photo
 * (or a soft colour field with the item's symbol when there is none) on a tinted card whose
 * colour belongs to the item's category — the same colours the main pages use.
 */

const NEUTRAL = NEUTRAL_COLOR;
export const CHAIN_COLOR = '#c9522f';

export function resourceColor(category: ResourceCategory | string): string {
  const skill = SKILL_CATEGORY_ZONE_COLOR[category as ResourceCategory];
  if (skill) return skill;
  const group = RESOURCE_CATEGORY_TO_GROUP[category as ResourceCategory] ?? customResourceCategories.getAll().find((c) => c.id === category)?.group;
  return (group && GROUP_COLOR[group]) || NEUTRAL;
}
export function bridgeColor(category: string): string {
  const meta = (BRIDGE_CATEGORY_META as Record<string, { group: string } | undefined>)[category];
  return (meta && BRIDGE_GROUP_COLOR[meta.group]) || '#8fae3d';
}

const RESOURCE_EMOJI: Record<string, string> = {
  achtsamkeit: '🧘', stresstoleranz: '🧊', emotionsregulation: '🌊', zwischenmenschlich: '🤝', mittelweg: '⚖️',
  visuell: '👁️', auditiv: '👂', olfaktorisch: '🌸', gustatorisch: '🍵', haptisch: '🧸', kognitiv: '🧩', motorisch: '🏃',
  komfort: '🛋️', strukturell: '🗂️', musik: '🎵', natur: '🌿', wissen: '💡', videos: '🎬', texte: '📝', apps: '📱',
  buecher: '📚', orte: '📍', aktivitaeten: '🎈', menschen: '🫂', sonstiges: '✨',
};

interface BaseProps {
  image?: string;
  color: string;
  emoji: string;
  label?: string;
  title: string;
  subtitle?: string;
  /** any extra content under the title (e.g. a fit summary) */
  extra?: ReactNode;
  onClick?: () => void;
  trailing?: ReactNode;
  /** smaller, for dense lists */
  compact?: boolean;
  /** show as selected (ring in its colour); also sets aria-pressed on a button */
  selected?: boolean;
  /** toggle semantics (aria-pressed) */
  toggle?: boolean;
  className?: string;
  testId?: string;
}

export function ItemTile({ image, color, emoji, label, title, subtitle, extra, onClick, trailing, compact, selected, toggle, className = '', testId }: BaseProps) {
  const size = compact ? 48 : 60;
  const style: CSSProperties = {
    background: `color-mix(in srgb, var(--color-surface) 88%, ${color} 9%)`,
    border: `1px solid ${color}${selected ? 'cc' : '55'}`,
    boxShadow: selected ? `0 0 0 2px ${color}66` : `0 2px 10px ${color}22`,
  };
  const inner = (
    <>
      <span className="flex-shrink-0 rounded-[14px] overflow-hidden relative flex items-center justify-center" style={{ width: size, height: size, background: `${color}26` }} aria-hidden="true">
        {!image && <span className="text-[22px] leading-none">{emoji}</span>}
        {image && <PhotoBackground src={image} className="absolute inset-0 bg-cover bg-center" />}
        {image && (
          <span className="absolute bottom-0.5 right-0.5 w-[20px] h-[20px] rounded-full flex items-center justify-center text-[12px] leading-none" style={{ background: `color-mix(in srgb, var(--color-surface) 82%, ${color} 18%)`, boxShadow: `0 0 0 1px ${color}55` }}>
            {emoji}
          </span>
        )}
        <span className="absolute inset-0 rounded-[14px]" style={{ boxShadow: `inset 0 0 0 1px ${color}33` }} />
      </span>
      <span className="min-w-0 flex-1 text-left">
        {label && (
          <span className="block text-[10.5px] uppercase tracking-wide leading-tight mb-0.5 truncate" style={{ color }}>
            {label}
          </span>
        )}
        <span className="block text-[14px] leading-snug text-[var(--color-text)] [overflow-wrap:anywhere]">{title}</span>
        {subtitle && <span className="block text-[12px] leading-snug text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{subtitle}</span>}
        {extra && <span className="block mt-1">{extra}</span>}
      </span>
      {trailing}
    </>
  );
  const cls = `w-full flex items-center gap-3 p-2 rounded-[var(--radius-lg)] ${className}`;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={toggle ? !!selected : undefined} className={cls} style={style} data-testid={testId} data-item-tile>
        {inner}
      </button>
    );
  }
  return (
    <div className={cls} style={style} data-testid={testId} data-item-tile>
      {inner}
    </div>
  );
}

type TileExtra = Pick<BaseProps, 'onClick' | 'trailing' | 'compact' | 'selected' | 'toggle' | 'className' | 'testId' | 'subtitle' | 'extra'>;

export function ResourceTile({ resource, ...rest }: { resource: Pick<Resource, 'title' | 'category' | 'image'> } & TileExtra) {
  const t = useT();
  const cat = resource.category as string;
  return (
    <ItemTile
      image={resource.image || undefined}
      color={resourceColor(cat)}
      emoji={RESOURCE_EMOJI[cat] ?? '✨'}
      label={(t.resources.categories as Record<string, string>)[cat] ?? customResourceCategories.getAll().find((c) => c.id === cat)?.label ?? cat}
      title={resource.title}
      {...rest}
    />
  );
}

export function BridgeTile({ bridge, ...rest }: { bridge: Pick<Bridge, 'title' | 'category' | 'image'> } & TileExtra) {
  const t = useT();
  const cat = bridge.category as string;
  return (
    <ItemTile
      image={bridge.image || undefined}
      color={bridgeColor(cat)}
      emoji="🌉"
      label={(t.bridges.categories as Record<string, string>)[cat] ?? t.bridges.title}
      title={bridge.title}
      {...rest}
    />
  );
}

export function ChainTile({ chain, ...rest }: { chain: Pick<Skillkette, 'title' | 'subtitle'> } & TileExtra) {
  const t = useT();
  return <ItemTile color={CHAIN_COLOR} emoji="⛓️" label={t.systemMap.areaLinks.skillketten} title={chain.title} {...rest} subtitle={rest.subtitle ?? chain.subtitle} />;
}
