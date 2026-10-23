import { type CSSProperties, type MouseEventHandler } from 'react';
import { type AnimalConfig, palOf, variantOf } from './animalRegistry';
import { AgeCtx, DefsScope, type AccKind, type ArtOpts } from './kit';
import { PropLayer, TimerClock, isProp } from './extras';
import '../companion.css';
import './animals.css';

export type AnimalState = 'awake' | 'settling' | 'sleeping' | 'waking' | 'meditating';

/** how a companion looks beyond its species: colour variant, accessory, own colours */
export interface AnimalLook {
  variantId?: string;
  acc?: AccKind;
  /** what it has with it ('none' = nothing, unset = species default) */
  item?: string;
  accColor?: string;
  /** own body colour (replaces the variant's) */
  bodyColor?: string;
  /** own accent colour */
  accentColor?: string;
  /** dogs: wear a harness (undefined = what the variant comes with) */
  harness?: boolean;
}

interface Props {
  animal: AnimalConfig;
  look?: AnimalLook;
  /** 0 = newborn … 1 = fully grown */
  age?: number;
  state?: AnimalState;
  joy?: 'hop' | 'spin' | 'wobble' | 'dance' | null;
  size?: number;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /** preview only: draws the open AND the sleepy face, a script switches between them */
  previewBoth?: boolean;
  style?: CSSProperties;
  /** preview only: let the animal walk on the spot in its own gait */
  walking?: boolean;
  /** a still picture (thumbnails, pickers): no button, no animation */
  inert?: boolean;
}

/** deterministic little offset so that several animals on one screen do not blink / wag in sync */
const offset = (id: string) => `${-((id.charCodeAt(0) * 7 + id.length * 13) % 40) / 10}s`;
const ease = (t: number) => t * t * (3 - 2 * t);

/** The animal as a finished figure (no hooks) – shared by the real companion and the preview page. */
export function AnimalFigure({ animal, look, age = 1, state = 'awake', joy = null, size = 108, onClick, previewBoth = false, style, walking = false, inert = false }: Props) {
  const closed = state === 'sleeping' || state === 'settling' || state === 'waking';
  const variant = variantOf(animal, look?.variantId);
  const pal = palOf(animal, look?.variantId);
  if (look?.bodyColor) pal.body = look.bodyColor;
  if (look?.accentColor) pal.accent = look.accentColor;
  const opt: ArtOpts = { ...variant.opt, acc: isProp(look?.acc) ? undefined : look?.acc, accColor: look?.accColor };
  if (look?.harness !== undefined) opt.harness = look.harness;
  const a = Math.max(0, Math.min(1, age));
  const scale = 0.62 + 0.38 * ease(a);
  const cls = [
    'lichtwesen',
    'pa-wrap',
    state === 'settling' ? 'lichtwesen--settling' : state === 'sleeping' ? 'lichtwesen--sleeping' : state === 'waking' ? 'lichtwesen--waking' : state === 'meditating' ? 'lichtwesen--meditating' : `lichtwesen--awake lichtwesen--movement-${animal.movement}`,
    joy ? `lichtwesen--joy-${joy}` : '',
  ].join(' ');
  const itemId = look?.item === 'none' ? undefined : look?.item ?? animal.defaultItem;
  const Art = animal.Art;
  const draw = (eyes: 'open' | 'closed') => <Art eyes={eyes} pal={pal} opt={opt} />;
  const inner = (
    <>
        <span className="lichtwesen__glow" style={{ background: `radial-gradient(circle, ${animal.glow} 0%, transparent 72%)` }} />
        <svg viewBox="0 0 100 110" width={size} height={size} aria-hidden="true" className="pa-svg" style={{ transform: `scale(${scale})`, transformOrigin: '50% 96%' }}>
          <DefsScope>
          <AgeCtx.Provider value={a}>
            <g className="pa-gaitbody">
              {previewBoth ? (
                <>
                  <g className="pa-art-open">{draw('open')}</g>
                  <g className="pa-art-closed">{draw('closed')}</g>
                </>
              ) : (
                draw(closed ? 'closed' : 'open')
              )}
              {state === 'meditating' ? <TimerClock age={a} /> : null}
              <PropLayer kind={itemId} age={a} place={animal.itemPlace} hands={animal.itemHands ? pal.body : undefined} />
            </g>
          </AgeCtx.Provider>
          </DefsScope>
        </svg>
    </>
  );
  return (
    <div
      className={`pa-outer${walking ? ' pa-walking' : ''}${inert ? ' pa-inert' : ''}`}
      data-joy={joy || undefined}
      data-state={previewBoth ? state : undefined}
      data-animal={animal.id}
      data-gait={animal.gait}
      data-idle={animal.idle}
      style={{ ['--pa-d' as string]: offset(animal.id), ['--pa-s' as string]: scale, ...style }}
    >
      <span className="pa-ground" aria-hidden="true" />
      {inert ? (
        <div role="img" aria-label={animal.name} className={cls} style={{ width: size, height: size }}>
          {inner}
        </div>
      ) : (
        <button type="button" onClick={onClick} data-no-tap-feedback aria-label={animal.name} className={cls} style={{ width: size, height: size }}>
          {inner}
        </button>
      )}
      {(state === 'sleeping' || previewBoth) && (
        <span className="pa-zzz" aria-hidden="true">
          <i>z</i>
          <i>z</i>
          <i>Z</i>
        </span>
      )}
      <span className="pa-fx pa-fx-1" aria-hidden="true">♥</span>
      <span className="pa-fx pa-fx-2" aria-hidden="true">✦</span>
      <span className="pa-fx pa-fx-3" aria-hidden="true">♥</span>
    </div>
  );
}
