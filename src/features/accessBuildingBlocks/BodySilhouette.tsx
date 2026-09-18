import { useState } from 'react';
import { useT } from '../../i18n';
import { BODY_REGION_ORDER, BODY_REGION_SENSATIONS, type BodyRegion } from './bodyRegions';
import { colorForSensation } from '../zugang/sensationZones';

/**
 * Priority 6 — a simple, warm silhouette (not a literal anatomical
 * diagram) with five tappable regions, letting someone explore "what
 * might I notice here?" region by region instead of only scanning one
 * long flat list. Selecting a region highlights it and shows its
 * sensations from the shared BODY_REGION_SENSATIONS mapping.
 */
export function BodySilhouette() {
  const t = useT();
  const [region, setRegion] = useState<BodyRegion>('ganzerKoerper');

  const fillFor = (r: BodyRegion) => (region === r ? 'var(--color-primary)' : 'var(--color-surface-muted)');
  const strokeFor = (r: BodyRegion) => (region === r ? 'var(--color-primary)' : 'var(--color-border-strong)');

  return (
    <div>
      <div className="flex justify-center mb-4">
        <svg viewBox="0 0 140 220" width="150" height="235" role="img" aria-hidden="true">
          {/* head */}
          <circle
            cx="70" cy="28" r="22"
            fill={fillFor('kopf')} stroke={strokeFor('kopf')} strokeWidth="1.5"
            style={{ cursor: 'pointer' }} onClick={() => setRegion('kopf')}
          />
          {/* chest */}
          <path
            d="M42,50 Q70,42 98,50 L104,110 Q70,122 36,110 Z"
            fill={fillFor('brust')} stroke={strokeFor('brust')} strokeWidth="1.5"
            style={{ cursor: 'pointer' }} onClick={() => setRegion('brust')}
          />
          {/* belly */}
          <path
            d="M36,110 Q70,122 104,110 L100,150 Q70,160 40,150 Z"
            fill={fillFor('bauch')} stroke={strokeFor('bauch')} strokeWidth="1.5"
            style={{ cursor: 'pointer' }} onClick={() => setRegion('bauch')}
          />
          {/* arms */}
          <path
            d="M42,52 Q22,60 16,110 Q14,130 22,145 L34,140 Q28,120 32,105 Q36,75 50,58 Z"
            fill={fillFor('arme')} stroke={strokeFor('arme')} strokeWidth="1.5"
            style={{ cursor: 'pointer' }} onClick={() => setRegion('arme')}
          />
          <path
            d="M98,52 Q118,60 124,110 Q126,130 118,145 L106,140 Q112,120 108,105 Q104,75 90,58 Z"
            fill={fillFor('arme')} stroke={strokeFor('arme')} strokeWidth="1.5"
            style={{ cursor: 'pointer' }} onClick={() => setRegion('arme')}
          />
          {/* legs */}
          <path
            d="M40,150 Q42,185 38,212 L54,212 Q58,185 58,152 Z"
            fill={fillFor('beine')} stroke={strokeFor('beine')} strokeWidth="1.5"
            style={{ cursor: 'pointer' }} onClick={() => setRegion('beine')}
          />
          <path
            d="M100,150 Q98,185 102,212 L86,212 Q82,185 82,152 Z"
            fill={fillFor('beine')} stroke={strokeFor('beine')} strokeWidth="1.5"
            style={{ cursor: 'pointer' }} onClick={() => setRegion('beine')}
          />
        </svg>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5 mb-3">
        {BODY_REGION_ORDER.map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className="px-3 py-1.5 rounded-full text-[12px]"
            style={{
              background: region === r ? 'var(--color-primary)' : 'var(--color-surface-muted)',
              color: region === r ? 'var(--color-surface)' : 'var(--color-text)',
            }}
          >
            {t.bodyAwarenessRef.regionLabels[r]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {BODY_REGION_SENSATIONS[region].map((s) => {
          const color = colorForSensation(s);
          return (
            <span
              key={s}
              className="px-3 py-1.5 rounded-full text-[13px]"
              style={color ? { background: `${color}18`, color, border: `1.5px solid ${color}` } : { background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}
            >
              {s}
            </span>
          );
        })}
      </div>
    </div>
  );
}
