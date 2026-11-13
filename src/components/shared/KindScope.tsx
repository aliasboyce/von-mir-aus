import type { CSSProperties, ReactNode } from 'react';
import { KIND_COLOR, type ResourceKind } from '../../features/resources/kindColors';

/**
 * Gestaltet eine ganze Seite in der festen Farbe einer Art (z. B. Hilfsmittel = gelb).
 * Statt jede Stelle einzeln einzufärben, werden die Farb-Variablen der Seite neu belegt – Knöpfe, Chips,
 * Rahmen, Karten und Hintergrund werden dadurch von selbst „gelb“. Die Farben werden immer mit den Farben
 * des gewählten Designs gemischt (hell/dunkel/Palette), bleiben aber erkennbar dieselbe Art.
 * Zwei verschachtelte Ebenen: die äußere merkt sich die gemischten Werte unter neuen Namen, die innere
 * setzt damit die Standard-Variablen (eine Variable darf sich nicht selbst enthalten).
 */
export function KindScope({ kind, children, className = '' }: { kind: ResourceKind; children: ReactNode; className?: string }) {
  const c = KIND_COLOR[kind];
  const outer = {
    '--kind': c,
    '--kt-bg': 'color-mix(in srgb, var(--color-bg) 87%, var(--kind) 13%)',
    '--kt-surface': 'color-mix(in srgb, var(--color-surface) 86%, var(--kind) 14%)',
    '--kt-muted': 'color-mix(in srgb, var(--color-surface-muted) 74%, var(--kind) 26%)',
    '--kt-border': 'color-mix(in srgb, var(--color-border) 45%, var(--kind) 55%)',
    '--kt-border-strong': 'color-mix(in srgb, var(--color-border-strong) 35%, var(--kind) 65%)',
    '--kt-primary': 'color-mix(in srgb, var(--kind) 56%, var(--color-text) 44%)',
    '--kt-primary-soft': 'color-mix(in srgb, var(--color-surface) 76%, var(--kind) 24%)',
  } as CSSProperties;
  const inner = {
    '--color-bg': 'var(--kt-bg)',
    '--color-surface': 'var(--kt-surface)',
    '--color-surface-muted': 'var(--kt-muted)',
    '--color-border': 'var(--kt-border)',
    '--color-border-strong': 'var(--kt-border-strong)',
    '--color-primary': 'var(--kt-primary)',
    '--color-primary-soft': 'var(--kt-primary-soft)',
    background: 'var(--kt-bg)',
  } as CSSProperties;
  return (
    <div style={outer} data-kind={kind}>
      <div style={inner} className={`min-h-dvh ${className}`}>{children}</div>
    </div>
  );
}
