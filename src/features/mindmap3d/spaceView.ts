import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  FONTS3D, bgInfo, isFlat, layerLook,
  type BgInfo, type Layer3D, type Node3D, type Shape3D, type Space3D,
} from './space3dModel';

/**
 * Die Bühne der 3D-Mindmap: zeichnet nur, wenn sich etwas ändert (schont Akku).
 * Steuerung ist bewusst getrennt: Ein Finger / die Maus tut nur EINE Sache (je nach Modus),
 * zwei Finger entscheiden sich beim Start für Zoomen ODER Verschieben (nie beides zugleich),
 * und jede Bewegungsart lässt sich „einrasten“ (sperren). Pfeil-Tasten der Seite nutzen dieselben Werkzeuge.
 * Keine Daten hier – der Zustand liegt in der React-Seite, die Bühne bekommt ihn per update().
 */

export type DragMode = 'plane' | 'height';
export interface Cam { theta: number; phi: number; dist: number; tx: number; ty: number; tz: number }
export interface Locks { rotate: boolean; zoom: boolean; pan: boolean }

export interface ViewCallbacks {
  onPickNode(id: string): void;
  onPickEdge(id: string): void;
  onPickNone(): void;
  onDragStart(id: string): void;
  onDrag(id: string, x: number, y: number, z: number, layerId: string | undefined): void;
  onDragEnd(id: string): void;
  onCam(cam: Cam): void;
}
export interface ViewUi {
  selNode?: string | null; selEdge?: string | null; selLayer?: string | null; connectFrom?: string | null;
  /** nur diese Ebene ist „aktiv“: alles andere verblasst und lässt sich nicht antippen */
  focusLayer?: string | null;
  /** Ansehen eines früheren Standes: nichts lässt sich anfassen */
  readOnly?: boolean;
}

export const nodeRadius = (n: Pick<Node3D, 'size'>) => 0.45 + 0.25 * Math.max(0.5, Math.min(6, n.size || 2));
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rad = (d: number | undefined) => ((d ?? 0) * Math.PI) / 180;

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines = 5): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = '';
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (ctx.measureText(t).width > maxW && line) {
        out.push(line);
        line = w;
      } else line = t;
    }
    out.push(line);
    if (out.length >= maxLines) break;
  }
  return out.slice(0, maxLines);
}

/** lesbare Schriftfarbe auf einer Fläche */
export function contrastOn(hex: string): string {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(f.slice(0, 6), 16);
  if (Number.isNaN(n)) return '#2b2a28';
  const lin = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const l = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return l > 0.33 ? '#2b2a28' : '#fbf8f1';
}

function starGeometry(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 1 : 0.45;
    const a = (Math.PI / 5) * i + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 2 });
  g.center();
  return g;
}
function heartGeometry(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(0, -0.9);
  s.bezierCurveTo(-1.3, -0.1, -0.95, 0.85, -0.45, 0.85);
  s.bezierCurveTo(-0.15, 0.85, 0, 0.65, 0, 0.45);
  s.bezierCurveTo(0, 0.65, 0.15, 0.85, 0.45, 0.85);
  s.bezierCurveTo(0.95, 0.85, 1.3, -0.1, 0, -0.9);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 3 });
  g.center();
  return g;
}
function stairsGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) {
    const h = 0.4 * (i + 1);
    const b = new THREE.BoxGeometry(1.7, h, 0.5);
    b.translate(0, h / 2, -0.75 + i * 0.5);
    parts.push(b);
  }
  const g = mergeGeometries(parts) ?? new THREE.BoxGeometry(1.7, 1.6, 2);
  parts.forEach((p) => p.dispose());
  g.center();
  return g;
}
function arrowGeometry(): THREE.BufferGeometry {
  const shaft = new THREE.CylinderGeometry(0.26, 0.26, 1.3, 16);
  shaft.translate(0, -0.45, 0);
  const head = new THREE.ConeGeometry(0.72, 1.05, 20);
  head.translate(0, 0.72, 0);
  const g = mergeGeometries([shaft, head]) ?? new THREE.ConeGeometry(1, 2, 12);
  shaft.dispose();
  head.dispose();
  g.rotateZ(-Math.PI / 2);
  g.center();
  return g;
}
function domeGeometry(): THREE.BufferGeometry {
  const half = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const cap = new THREE.CircleGeometry(1, 32);
  cap.rotateX(Math.PI / 2);
  const g = mergeGeometries([half, cap]) ?? half;
  g.translate(0, -0.5, 0);
  return g;
}

function baseGeometry(shape: Shape3D): THREE.BufferGeometry {
  switch (shape) {
    case 'cube': return new THREE.BoxGeometry(1.5, 1.5, 1.5);
    case 'cone': return new THREE.ConeGeometry(1, 1.8, 32);
    case 'cylinder': return new THREE.CylinderGeometry(0.85, 0.85, 1.6, 32);
    case 'pyramid': return new THREE.ConeGeometry(1.1, 1.7, 4);
    case 'tetra': return new THREE.TetrahedronGeometry(1.3);
    case 'prism': return new THREE.CylinderGeometry(1, 1, 1.6, 3);
    case 'hex': return new THREE.CylinderGeometry(1, 1, 1.4, 6);
    case 'dome': return domeGeometry();
    case 'capsule': return new THREE.CapsuleGeometry(0.6, 1.1, 8, 20);
    case 'stairs': return stairsGeometry();
    case 'arrow': return arrowGeometry();
    case 'ring': return new THREE.TorusGeometry(0.85, 0.3, 16, 40);
    case 'diamond': return new THREE.OctahedronGeometry(1.1, 0);
    case 'gem': return new THREE.IcosahedronGeometry(1, 0);
    case 'star': return starGeometry();
    case 'heart': return heartGeometry();
    case 'plate': return new THREE.BoxGeometry(2.4, 1.4, 0.16);
    case 'text': return new THREE.SphereGeometry(0.7, 8, 6);
    default: return new THREE.SphereGeometry(1, 32, 20);
  }
}
const FLAT_FACETED = new Set<Shape3D>(['gem', 'pyramid', 'diamond', 'tetra', 'prism', 'hex', 'stairs']);

interface NodeObj { group: THREE.Group; sig: string; pick: THREE.Object3D[]; radius: number }
interface Gesture {
  kind: 'orbit' | 'pan' | 'pinch' | 'node' | 'none';
  startX: number; startY: number; moved: boolean; touch: boolean;
  hit?: { type: 'node' | 'edge'; id: string };
  axis?: 'h' | 'v';
  sub?: 'zoom' | 'pan';
  pinchD0?: number; pinchC0?: { x: number; y: number }; pinchD?: number; pinchC?: { x: number; y: number };
  offset?: THREE.Vector3; started?: boolean;
}

export class SpaceView {
  private el: HTMLElement;
  private cb: ViewCallbacks;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(48, 1, 0.1, 400);
  private cam: Cam = { theta: 0.7, phi: 1.15, dist: 20, tx: 0, ty: 0, tz: 0 };
  private space: Space3D | null = null;
  private ui: ViewUi = {};
  private nodes = new Map<string, NodeObj>();
  private dynamic = new THREE.Group();
  private geos = new Map<Shape3D, THREE.BufferGeometry>();
  private labels = new Map<string, { tex: THREE.CanvasTexture; w: number; h: number }>();
  private photos = new Map<string, { tex: THREE.CanvasTexture; ready: boolean }>();
  private raf = 0;
  private tween = 0;
  private ro: ResizeObserver;
  private dragMode: DragMode = 'plane';
  private locks: Locks = { rotate: false, zoom: false, pan: false };
  private oneFinger: 'turn' | 'pan' = 'turn';
  private freeOrbit = false;
  private ptrs = new Map<number, { x: number; y: number }>();
  private gesture: Gesture | null = null;
  private disposed = false;
  private bi: BgInfo = bgInfo({ bg: 'dark' });
  private bgKey = '';
  private bgTex: THREE.Texture | null = null;

  constructor(el: HTMLElement, cb: ViewCallbacks) {
    this.el = el;
    this.cb = cb;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const cv = this.renderer.domElement;
    cv.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;outline:none';
    cv.setAttribute('data-testid', 'mm3-canvas');
    (cv as unknown as { __view: SpaceView }).__view = this;
    el.appendChild(cv);
    this.scene.add(this.dynamic);
    this.scene.add(this.camera);
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(0.4, 0.8, 1);
    this.camera.add(sun);
    this.scene.background = new THREE.Color(0x161a22);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(el);
    cv.addEventListener('pointerdown', this.onDown);
    cv.addEventListener('pointermove', this.onMove);
    cv.addEventListener('pointerup', this.onUp);
    cv.addEventListener('pointercancel', this.onUp);
    cv.addEventListener('wheel', this.onWheel, { passive: false });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    this.resize();
  }

  /* ----------------------------------------------------------- public */
  setDragMode(m: DragMode) { this.dragMode = m; }
  setLocks(l: Locks) { this.locks = { ...l }; }
  setOneFinger(m: 'turn' | 'pan') { this.oneFinger = m; }
  setFreeOrbit(b: boolean) { this.freeOrbit = b; }
  getCam(): Cam { return { ...this.cam }; }
  setCam(c: Partial<Cam>) { this.cam = { ...this.cam, ...c }; this.applyCam(); }
  zoom(f: number) { this.cam.dist = clamp(this.cam.dist * f, 3, 90); this.applyCam(); this.cb.onCam(this.getCam()); }
  focus(x: number, y: number, z: number) { this.goTo({ tx: x, ty: y, tz: z }, 260); }
  rotateBy(dTheta: number, dPhi: number) { this.cam.theta += dTheta; this.cam.phi = clamp(this.cam.phi + dPhi, 0.05, Math.PI - 0.05); this.applyCam(); this.cb.onCam(this.getCam()); }

  /** weich zu einer Ansicht fahren (Voreinstellungen, Fotos, „Alles im Blick“) */
  goTo(t: Partial<Cam>, ms = 320) {
    cancelAnimationFrame(this.tween);
    const from = { ...this.cam };
    const to = { ...from, ...t };
    if (t.theta !== undefined) {
      let dt = to.theta - from.theta;
      dt = ((((dt + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
      to.theta = from.theta + dt;
    }
    to.phi = clamp(to.phi, 0.05, Math.PI - 0.05);
    to.dist = clamp(to.dist, 3, 90);
    if (ms <= 0) { this.cam = to; this.applyCam(); this.cb.onCam(this.getCam()); return; }
    const t0 = performance.now();
    const step = (now: number) => {
      if (this.disposed) return;
      const k = clamp((now - t0) / ms, 0, 1);
      const e = 1 - (1 - k) ** 3;
      (['theta', 'phi', 'dist', 'tx', 'ty', 'tz'] as const).forEach((key) => { this.cam[key] = from[key] + (to[key] - from[key]) * e; });
      this.applyCam();
      if (k < 1) this.tween = requestAnimationFrame(step);
      else this.cb.onCam(this.getCam());
    };
    this.tween = requestAnimationFrame(step);
  }
  /** Drehen in festen 15°-Schritten („einrastend“). dx/dy wie beim Ziehen: +1 = nach rechts / unten */
  turnSnap(dx: number, dy: number) {
    const step = Math.PI / 12;
    const next = (v: number, dir: number) => (dir > 0 ? Math.floor(v / step + 1e-6) + 1 : Math.ceil(v / step - 1e-6) - 1) * step;
    const t: Partial<Cam> = {};
    if (dx) t.theta = next(this.cam.theta, -dx);
    if (dy) t.phi = clamp(next(this.cam.phi, -dy), 0.05, Math.PI - 0.05);
    this.goTo(t, 150);
  }
  /** Blickpunkt verschieben: rechts / vorwärts (in den Raum hinein) / hoch, in Raumeinheiten */
  moveFocus(right: number, forward: number, up: number) {
    const { theta } = this.cam;
    const rx = Math.cos(theta);
    const rz = -Math.sin(theta);
    const fx = -Math.sin(theta);
    const fz = -Math.cos(theta);
    this.goTo({ tx: this.cam.tx + rx * right + fx * forward, tz: this.cam.tz + rz * right + fz * forward, ty: this.cam.ty + up }, 140);
  }
  /** Raumrichtung (nur x/z, auf die nächste Achse gerastet), in die „rechts“ bzw. „vorwärts“ gerade zeigt */
  axisDir(which: 'right' | 'forward'): { x: number; z: number } {
    const { theta } = this.cam;
    const v = which === 'right' ? { x: Math.cos(theta), z: -Math.sin(theta) } : { x: -Math.sin(theta), z: -Math.cos(theta) };
    return Math.abs(v.x) >= Math.abs(v.z) ? { x: Math.sign(v.x) || 1, z: 0 } : { x: 0, z: Math.sign(v.z) || 1 };
  }
  /** Blickpunkt auf alles richten */
  fitAll() {
    if (!this.space || !this.space.nodes.length) { this.goTo({ tx: 0, ty: 0, tz: 0, dist: 20 }); return; }
    const ns = this.space.nodes.filter((n) => this.layerVisible(n));
    const list = ns.length ? ns : this.space.nodes;
    const b = new THREE.Box3();
    list.forEach((n) => b.expandByPoint(new THREE.Vector3(n.x, n.y, n.z)));
    const c = b.getCenter(new THREE.Vector3());
    const r = Math.max(4, b.getSize(new THREE.Vector3()).length() / 2 + 3);
    this.goTo({ tx: c.x, ty: c.y, tz: c.z, dist: clamp(r / Math.tan((this.camera.fov * Math.PI) / 360) * 0.95, 8, 90) });
  }
  /** Bildschirmposition (Pixel im Host) eines Dings – für Tests und Hilfen */
  screenPos(id: string): { x: number; y: number } | null {
    const n = this.space?.nodes.find((x) => x.id === id);
    if (!n) return null;
    this.camera.updateMatrixWorld();
    const v = new THREE.Vector3(n.x, n.y, n.z).project(this.camera);
    const r = this.renderer.domElement.getBoundingClientRect();
    return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
  }
  /** Fokus-Punkt (z. B. für neue Dinge) */
  target() { return { x: this.cam.tx, y: this.cam.ty, z: this.cam.tz }; }

  update(space: Space3D, ui: ViewUi) {
    this.space = space;
    this.ui = ui;
    const bi = bgInfo(space);
    const key = `${bi.id}|${space.bgImage ? space.bgImage.length : 0}|${bi.dark ? 'd' : 'l'}`;
    if (this.bgKey !== key) {
      const darkChanged = this.bi.dark !== bi.dark || this.bi.id !== bi.id;
      this.bi = bi;
      this.bgKey = key;
      this.applyBackground(space, key);
      if (darkChanged) {
        this.labels.forEach((l) => l.tex.dispose());
        this.labels.clear();
        this.nodes.forEach((o) => this.disposeObj(o.group));
        this.nodes.clear();
      }
    }
    this.rebuild();
    this.requestRender();
  }
  setInitialCam(c: Cam) { this.cam = { ...c }; this.applyCam(); }

  /** Bild der aktuellen Ansicht. JPEG mit Hintergrundfarbe oder PNG. */
  snapshot(maxSide: number, type: 'image/jpeg' | 'image/png' = 'image/jpeg', quality = 0.82): string | null {
    try {
      this.renderNow();
      const src = this.renderer.domElement;
      const k = Math.min(1, maxSide / Math.max(src.width, src.height));
      const w = Math.max(1, Math.round(src.width * k));
      const h = Math.max(1, Math.round(src.height * k));
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = this.bi.a;
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(src, 0, 0, w, h);
      const url = c.toDataURL(type, quality);
      return url.length > 100 ? url : null;
    } catch {
      return null;
    }
  }
  /** wie snapshot(), aber ohne Auswahl-Hervorhebung (für Kamera-Fotos) */
  snapshotClean(maxSide: number, quality = 0.74): string | null {
    const sp = this.space;
    if (!sp) return null;
    const ui = this.ui;
    this.update(sp, { focusLayer: ui.focusLayer });
    const url = this.snapshot(maxSide, 'image/jpeg', quality);
    this.update(sp, ui);
    return url;
  }

  /**
   * Übersichtsbild für Liste und PDF: gleicher Blickwinkel wie gerade, aber alles Sichtbare passt ins Bild
   * (Querformat), egal wie klein der Bildschirm ist. Auf hellem „Papier“ (druckfreundlich, spart Tinte).
   */
  snapshotFit(w: number, h: number, quality = 0.82, paper = true): string | null {
    const sp = this.space;
    if (!sp) return null;
    const swap = paper && bgInfo(sp).dark;
    if (swap) this.update({ ...sp, bg: 'light', bgImage: undefined }, { ...this.ui, selNode: null, selEdge: null, connectFrom: null, selLayer: null });
    const saved = { cam: { ...this.cam }, size: this.renderer.getSize(new THREE.Vector2()), pr: this.renderer.getPixelRatio(), aspect: this.camera.aspect };
    try {
      const box = new THREE.Box3();
      const vis = sp.nodes.filter((n) => this.layerVisible(n));
      vis.forEach((n) => { const r = (this.nodes.get(n.id)?.radius ?? nodeRadius(n)) + 1.2; box.expandByPoint(new THREE.Vector3(n.x - r, n.y - r, n.z - r)); box.expandByPoint(new THREE.Vector3(n.x + r, n.y + r + 1, n.z + r)); });
      sp.layers.filter((l) => l.visible).forEach((l) => { box.expandByPoint(new THREE.Vector3(box.min.x, l.y, box.min.z)); box.expandByPoint(new THREE.Vector3(box.max.x, l.y + 0.8, box.max.z)); });
      if (box.isEmpty()) box.set(new THREE.Vector3(-6, -3, -6), new THREE.Vector3(6, 3, 6));
      const c = box.getCenter(new THREE.Vector3());
      const rd = box.getSize(new THREE.Vector3()).length() / 2;
      const vf = (this.camera.fov * Math.PI) / 180;
      const hf = 2 * Math.atan(Math.tan(vf / 2) * (w / h));
      this.renderer.setPixelRatio(1);
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.fitBgTexture();
      this.cam = { ...this.cam, tx: c.x, ty: c.y, tz: c.z, dist: clamp((rd / Math.sin(Math.min(vf, hf) / 2)) * 0.82, 6, 120) };
      this.applyCam();
      return this.snapshot(Math.max(w, h), 'image/jpeg', quality);
    } catch {
      return null;
    } finally {
      if (swap) this.update(sp, this.ui);
      this.cam = saved.cam;
      this.renderer.setPixelRatio(saved.pr);
      this.renderer.setSize(saved.size.x, saved.size.y, false);
      this.camera.aspect = saved.aspect;
      this.camera.updateProjectionMatrix();
      this.fitBgTexture();
      this.applyCam();
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    cancelAnimationFrame(this.tween);
    this.ro.disconnect();
    const cv = this.renderer.domElement;
    cv.removeEventListener('pointerdown', this.onDown);
    cv.removeEventListener('pointermove', this.onMove);
    cv.removeEventListener('pointerup', this.onUp);
    cv.removeEventListener('pointercancel', this.onUp);
    cv.removeEventListener('wheel', this.onWheel);
    this.clearDynamic();
    this.nodes.forEach((o) => this.disposeObj(o.group));
    this.nodes.clear();
    this.geos.forEach((g) => g.dispose());
    this.labels.forEach((l) => l.tex.dispose());
    this.photos.forEach((p) => p.tex.dispose());
    this.bgTex?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    cv.remove();
  }

  /* ------------------------------------------------------------ render */
  private resize() {
    const w = Math.max(1, this.el.clientWidth);
    const h = Math.max(1, this.el.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.fitBgTexture();
    this.requestRender();
  }
  private applyCam() {
    const { theta, phi, dist, tx, ty, tz } = this.cam;
    this.camera.position.set(tx + dist * Math.sin(phi) * Math.sin(theta), ty + dist * Math.cos(phi), tz + dist * Math.sin(phi) * Math.cos(theta));
    this.camera.lookAt(tx, ty, tz);
    this.camera.updateMatrixWorld();
    this.requestRender();
  }
  private requestRender() {
    if (this.raf || this.disposed) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      if (!this.disposed) this.renderNow();
    });
  }
  private renderNow() {
    this.camera.updateMatrixWorld();
    this.renderer.render(this.scene, this.camera);
  }

  /* -------------------------------------------------------- background */
  private applyBackground(space: Space3D, key: string) {
    const bi = this.bi;
    const old = this.bgTex;
    this.bgTex = null;
    if (bi.id === 'photo' && space.bgImage) {
      this.scene.background = new THREE.Color(bi.a);
      const img = new Image();
      img.onload = () => {
        if (this.disposed || this.bgKey !== key) return;
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        this.bgTex = tex;
        this.scene.background = tex;
        this.fitBgTexture();
        this.requestRender();
      };
      img.src = space.bgImage;
    } else if (!bi.flat) {
      const c = document.createElement('canvas');
      c.width = 2;
      c.height = 256;
      const g = c.getContext('2d')!;
      const grad = g.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, bi.a);
      grad.addColorStop(1, bi.b);
      g.fillStyle = grad;
      g.fillRect(0, 0, 2, 256);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      this.bgTex = tex;
      this.scene.background = tex;
    } else {
      this.scene.background = new THREE.Color(bi.a);
    }
    old?.dispose();
  }
  /** Foto-Hintergrund füllt den Bildschirm (zugeschnitten, nicht verzerrt) */
  private fitBgTexture() {
    const t = this.bgTex;
    const img = t?.image as HTMLImageElement | undefined;
    if (!t || !img || this.bi.id !== 'photo' || !img.width) return;
    const va = this.camera.aspect;
    const ia = img.width / img.height;
    t.repeat.set(1, 1);
    t.offset.set(0, 0);
    if (va > ia) { t.repeat.y = ia / va; t.offset.y = (1 - t.repeat.y) / 2; }
    else { t.repeat.x = va / ia; t.offset.x = (1 - t.repeat.x) / 2; }
    t.matrixAutoUpdate = true;
  }

  /* ----------------------------------------------------------- content */
  private layerVisible(n: Node3D) {
    if (!n.layerId || !this.space) return true;
    const l = this.space.layers.find((x) => x.id === n.layerId);
    return !l || l.visible;
  }
  private geo(shape: Shape3D) {
    let g = this.geos.get(shape);
    if (!g) {
      g = baseGeometry(shape);
      this.geos.set(shape, g);
    }
    return g;
  }
  private ink() { return this.bi.dark ? '#f4f1ea' : '#2b2a28'; }
  private halo() { return this.bi.dark ? '#161a22' : '#f3efe6'; }
  private fontCss(n: Pick<Node3D, 'font' | 'bold' | 'italic'>, px: number) {
    const f = FONTS3D.find((x) => x.id === n.font)?.css ?? FONTS3D[0].css;
    return `${n.italic ? 'italic ' : ''}${n.bold ? 800 : 600} ${px}px ${f}, "Noto Color Emoji", sans-serif`;
  }

  private label(text: string, opts: { px?: number; color?: string; halo?: string | null; font?: Pick<Node3D, 'font' | 'bold' | 'italic'>; alpha?: number } = {}): THREE.Sprite {
    const px = opts.px ?? 46;
    const color = opts.color ?? this.ink();
    const halo = opts.halo === undefined ? this.halo() : opts.halo;
    const fnt = opts.font ?? {};
    const fontKey = `${fnt.font ?? ''}${fnt.bold ? 'b' : ''}${fnt.italic ? 'i' : ''}`;
    const key = `${px}|${color}|${halo}|${fontKey}|${text}`;
    let entry = this.labels.get(key);
    if (!entry) {
      if (this.labels.size > 400) { this.labels.forEach((l) => l.tex.dispose()); this.labels.clear(); }
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d')!;
      const font = this.fontCss(fnt, px);
      ctx.font = font;
      const lines = wrapLines(ctx, text, px * 9);
      const wMax = Math.max(...lines.map((l) => ctx.measureText(l).width), 10);
      const lh = px * 1.25;
      c.width = Math.ceil(wMax + 24);
      c.height = Math.ceil(lh * lines.length + 16);
      const g = c.getContext('2d')!;
      g.font = font;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.lineJoin = 'round';
      lines.forEach((l, i) => {
        const y = 8 + lh * (i + 0.5);
        if (halo) {
          g.lineWidth = Math.max(4, px / 5);
          g.strokeStyle = halo;
          g.strokeText(l, c.width / 2, y);
        }
        g.fillStyle = color;
        g.fillText(l, c.width / 2, y);
      });
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 2;
      entry = { tex, w: c.width, h: c.height };
      this.labels.set(key, entry);
    }
    const mat = new THREE.SpriteMaterial({ map: entry.tex, depthTest: false, transparent: true, opacity: opts.alpha ?? 1 });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(entry.w * 0.0155, entry.h * 0.0155, 1);
    sp.renderOrder = 20;
    return sp;
  }

  /** Sprechblase / Gedankenblase / Ausruf / Zettel als Bild */
  private bubbleTex(n: Node3D): { tex: THREE.CanvasTexture; w: number; h: number } {
    const px = Math.round(40 * clamp(n.fs ?? 1, 0.6, 2.4));
    const text = `${n.symbol ? n.symbol + ' ' : ''}${n.text || ' '}${n.link ? ' ↗' : ''}`;
    const textColor = n.textColor ?? contrastOn(n.color);
    const lineCol = n.outlineColor ?? (contrastOn(n.color) === '#2b2a28' ? '#2b2a28' : '#fbf8f1');
    const border = n.outline !== false;
    const tail = n.tail ?? 'bl';
    const key = `B|${n.shape}|${n.color}|${textColor}|${lineCol}|${border}|${tail}|${px}|${n.font ?? ''}${n.bold ? 'b' : ''}${n.italic ? 'i' : ''}|${text}`;
    const hit = this.labels.get(key);
    if (hit) return hit;
    if (this.labels.size > 400) { this.labels.forEach((l) => l.tex.dispose()); this.labels.clear(); }
    const c = document.createElement('canvas');
    const g = c.getContext('2d')!;
    const font = this.fontCss(n, px);
    g.font = font;
    const lines = wrapLines(g, text, px * 11, 6);
    const tw = Math.max(...lines.map((l) => g.measureText(l).width), px);
    const lh = px * 1.28;
    const th = lh * lines.length;
    const pad = px * (n.shape === 'shout' ? 1.5 : n.shape === 'thought' ? 1.15 : 0.75);
    const bw = Math.ceil(tw + pad * 2);
    const bh = Math.ceil(th + pad * 1.6);
    const m = 14;
    const tailH = n.shape === 'note' || n.shape === 'shout' ? 0 : px * 1.1;
    c.width = bw + m * 2;
    c.height = bh + m * 2 + tailH;
    const ctx = c.getContext('2d')!;
    const top = tail[0] === 't';
    const left = tail[1] === 'l';
    const x0 = m;
    const y0 = m + (top ? tailH : 0);
    ctx.lineJoin = 'round';
    ctx.lineWidth = border ? Math.max(3, px / 9) : 0;
    ctx.strokeStyle = lineCol;
    ctx.fillStyle = n.color;
    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };
    if (n.shape === 'bubble') {
      const tx = left ? x0 + bw * 0.16 : x0 + bw * 0.84;
      const dir = left ? 1 : -1;
      rr(x0, y0, bw, bh, px * 0.7);
      ctx.fill();
      if (border) ctx.stroke();
      // Spitze: überdeckt die Kante und zeichnet nur zwei Seiten
      const ty = top ? y0 : y0 + bh;
      const sgn = top ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(tx - dir * px * 0.1, ty - sgn * 2);
      ctx.lineTo(tx - dir * px * 0.55, ty + sgn * tailH);
      ctx.lineTo(tx + dir * px * 0.75, ty - sgn * 2);
      ctx.closePath();
      ctx.fillStyle = n.color;
      ctx.fill();
      if (border) {
        ctx.beginPath();
        ctx.moveTo(tx - dir * px * 0.1, ty - sgn * 1);
        ctx.lineTo(tx - dir * px * 0.55, ty + sgn * tailH);
        ctx.lineTo(tx + dir * px * 0.75, ty - sgn * 1);
        ctx.stroke();
        ctx.save();
        ctx.fillStyle = n.color;
        ctx.fillRect(Math.min(tx - dir * px * 0.1, tx + dir * px * 0.75) + 1, ty - sgn * 2 - (sgn > 0 ? 0 : 3), Math.abs(px * 0.85) - 2, 5);
        ctx.restore();
      }
    } else if (n.shape === 'thought') {
      ctx.beginPath();
      ctx.ellipse(x0 + bw / 2, y0 + bh / 2, bw / 2, bh / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      if (border) ctx.stroke();
      const cx = left ? x0 + bw * 0.18 : x0 + bw * 0.82;
      const dirY = top ? -1 : 1;
      const yb = top ? y0 : y0 + bh;
      [[0.28, 0.5], [0.62, 0.78], [0.9, 1]].forEach(([d, s], i) => {
        const r = px * 0.3 * (1.15 - i * 0.28) * (s as number);
        ctx.beginPath();
        ctx.arc(cx + (left ? -1 : 1) * i * px * 0.1, yb + dirY * (d as number) * tailH, Math.max(3, r), 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();
        if (border) ctx.stroke();
      });
    } else if (n.shape === 'shout') {
      const cx = x0 + bw / 2;
      const cy = y0 + bh / 2;
      const spikes = 14;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? 1 : 0.8;
        const a = (Math.PI / spikes) * i;
        const x = cx + Math.cos(a) * (bw / 2) * r;
        const y = cy + Math.sin(a) * (bh / 2) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      if (border) ctx.stroke();
    } else {
      // Notizzettel mit Schatten und umgeknickter Ecke
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.28)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.fillRect(x0, y0, bw, bh);
      ctx.restore();
      if (border) ctx.strokeRect(x0, y0, bw, bh);
      const f = px * 0.7;
      ctx.beginPath();
      ctx.moveTo(x0 + bw, y0 + bh - f);
      ctx.lineTo(x0 + bw - f, y0 + bh);
      ctx.lineTo(x0 + bw, y0 + bh);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      ctx.fill();
    }
    ctx.font = font;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cy = y0 + bh / 2;
    lines.forEach((l, i) => ctx.fillText(l, x0 + bw / 2, cy - th / 2 + lh * (i + 0.5)));
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const entry = { tex, w: c.width, h: c.height };
    this.labels.set(key, entry);
    return entry;
  }

  private photoTex(n: Node3D): { tex: THREE.CanvasTexture; w: number; h: number } {
    const ar = clamp(n.ar ?? 1.33, 0.3, 4);
    const H = 300;
    const frame = n.outline !== false ? 14 : 0;
    const w = Math.round(H * ar) + frame * 2;
    const h = H + frame * 2;
    const key = `${n.id}|${n.image ? n.image.length : 0}|${frame}|${n.outlineColor ?? ''}`;
    let p = this.photos.get(key);
    if (!p) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = frame ? (n.outlineColor ?? '#fbf8f1') : '#cfcabd';
      ctx.fillRect(0, 0, w, h);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      p = { tex, ready: false };
      this.photos.set(key, p);
      if (n.image) {
        const img = new Image();
        const entry = p;
        img.onload = () => {
          if (this.disposed) return;
          ctx.drawImage(img, frame, frame, w - frame * 2, h - frame * 2);
          if (frame) { ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, w - 2, h - 2); }
          entry.ready = true;
          entry.tex.needsUpdate = true;
          this.requestRender();
        };
        img.src = n.image;
      } else {
        ctx.fillStyle = '#8a8f98';
        ctx.font = '600 44px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🖼️', w / 2, h / 2);
        p.tex.needsUpdate = true;
      }
      if (this.photos.size > 60) {
        const first = this.photos.keys().next().value as string | undefined;
        if (first && first !== key) { this.photos.get(first)?.tex.dispose(); this.photos.delete(first); }
      }
    }
    return { tex: p.tex, w, h };
  }

  private disposeObj(o: THREE.Object3D) {
    o.traverse((c) => {
      const m = c as THREE.Mesh;
      if (m.material) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach((x) => x.dispose());
      }
      // geometrien der Formen gehören dem Cache; eigene (Röhren) werden hier freigegeben
      if (m.geometry && m.userData.ownGeo) m.geometry.dispose();
    });
  }
  private clearDynamic() {
    while (this.dynamic.children.length) {
      const c = this.dynamic.children[0];
      this.dynamic.remove(c);
      this.disposeObj(c);
    }
  }

  private dimmed(n: Node3D) {
    return !!this.ui.focusLayer && n.layerId !== this.ui.focusLayer;
  }

  private buildNode(n: Node3D): NodeObj {
    const group = new THREE.Group();
    const pick: THREE.Object3D[] = [];
    const selected = this.ui.selNode === n.id || this.ui.connectFrom === n.id;
    const connecting = this.ui.connectFrom === n.id;
    const dim = this.dimmed(n);
    const alpha = clamp(n.opacity ?? 1, 0.15, 1) * (dim ? 0.2 : 1);
    const fnt = { font: n.font, bold: n.bold, italic: n.italic };
    const labelText = `${n.symbol ? n.symbol + ' ' : ''}${n.text || ' '}${n.link ? ' ↗' : ''}`;
    let radius = nodeRadius(n);

    if (isFlat(n.shape)) {
      const k = (0.55 + 0.225 * clamp(n.size || 2, 0.5, 6));
      let sprite: THREE.Sprite;
      let w = 1;
      let h = 1;
      if (n.shape === 'text') {
        const hit = new THREE.Mesh(this.geo('text'), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
        hit.scale.setScalar(radius * 1.1);
        hit.userData.nodeId = n.id;
        group.add(hit);
        pick.push(hit);
        sprite = this.label(labelText, { px: Math.round(54 * clamp(n.fs ?? 1, 0.6, 2.4)), color: n.textColor ?? n.color, halo: n.outline === false ? null : (n.outlineColor ?? this.halo()), font: fnt, alpha });
        sprite.scale.multiplyScalar(k * 0.92);
        w = sprite.scale.x;
        h = sprite.scale.y;
        sprite.material.rotation = rad(n.rot);
      } else {
        const t = n.shape === 'photo' ? this.photoTex(n) : this.bubbleTex(n);
        sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: t.tex, transparent: true, opacity: alpha, depthWrite: false, depthTest: false }));
        const unit = n.shape === 'photo' ? 0.0125 : 0.0155 * 0.95;
        sprite.scale.set(t.w * unit * k, t.h * unit * k, 1);
        sprite.material.rotation = rad(n.rot);
        sprite.renderOrder = 6;
        w = sprite.scale.x;
        h = sprite.scale.y;
      }
      if (selected) {
        const sel = new THREE.Sprite(new THREE.SpriteMaterial({ color: connecting ? 0x4cc3ff : 0xffa24a, transparent: true, opacity: 0.5, depthWrite: false }));
        sel.scale.set(w * 1.1 + 0.25, h * 1.1 + 0.25, 1);
        sel.material.rotation = rad(n.rot);
        sel.renderOrder = 5;
        sel.material.depthTest = false;
        group.add(sel);
      }
      sprite.userData.nodeId = n.id;
      group.add(sprite);
      pick.push(sprite);
      radius = Math.max(w, h) * 0.5;
      if (n.shape === 'photo' && n.text.trim()) {
        const cap = this.label(labelText, { px: Math.round(40 * clamp(n.fs ?? 1, 0.6, 2.4)), color: n.textColor, font: fnt, alpha });
        cap.position.set(0, -h / 2 - cap.scale.y / 2 - 0.4, 0);
        cap.userData.nodeId = n.id;
        group.add(cap);
        pick.push(cap);
      }
      return { group, sig: this.sigOf(n), pick, radius };
    }

    const body = new THREE.Group();
    body.rotation.set(rad(n.tilt), rad(n.rot), 0, 'YXZ');
    group.add(body);
    const faceted = FLAT_FACETED.has(n.shape);
    const mat = new THREE.MeshStandardMaterial({ color: n.color, roughness: 0.5, metalness: 0.05, flatShading: faceted, transparent: alpha < 1, opacity: alpha, depthWrite: alpha >= 0.9, side: n.shape === 'dome' ? THREE.DoubleSide : THREE.FrontSide });
    const mesh = new THREE.Mesh(this.geo(n.shape), mat);
    mesh.scale.setScalar(radius);
    if (n.shape === 'ring') mesh.rotation.x = Math.PI / 2.6;
    mesh.userData.nodeId = n.id;
    body.add(mesh);
    pick.push(mesh);
    const hull = (color: number | string, f: number, op = 1) => {
      const hm = new THREE.Mesh(this.geo(n.shape), new THREE.MeshBasicMaterial({ color, side: THREE.BackSide, transparent: op < 1, opacity: op, depthWrite: false }));
      hm.scale.setScalar(radius * f);
      hm.rotation.copy(mesh.rotation);
      body.add(hm);
    };
    if (n.outline) hull(n.outlineColor ?? (this.bi.dark ? '#f4f1ea' : '#2b2a28'), n.shape === 'plate' ? 1.03 : 1.055, dim ? 0.25 : 1);
    if (selected) hull(connecting ? 0x4cc3ff : 0xffa24a, 1.17);
    // größere, unsichtbare Greiffläche: auf dem Handy trifft man kleine Dinge sonst kaum
    if (!dim) {
      const grab = new THREE.Mesh(this.geo('sphere'), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      grab.scale.setScalar(Math.max(radius * 1.25, 0.95));
      grab.userData.nodeId = n.id;
      group.add(grab);
      pick.push(grab);
    }
    const sp = this.label(labelText, { px: Math.round(44 * clamp(n.fs ?? 1, 0.6, 2.4)), color: n.textColor, font: fnt, alpha: dim ? 0.3 : 1 });
    const above = n.shape === 'plate' ? 0 : radius + 0.35 + sp.scale.y / 2;
    sp.position.set(0, above, n.shape === 'plate' ? 0.12 : 0);
    sp.userData.nodeId = n.id;
    group.add(sp);
    pick.push(sp);
    return { group, sig: this.sigOf(n), pick, radius };
  }
  private sigOf(n: Node3D) {
    const sel = this.ui.selNode === n.id ? 's' : this.ui.connectFrom === n.id ? 'c' : '';
    return JSON.stringify([
      n.shape, n.color, n.size, n.text, n.symbol ?? '', n.link ? 1 : 0, sel, this.bi.id, this.bi.dark, this.dimmed(n),
      n.rot ?? 0, n.tilt ?? 0, n.outline ?? null, n.outlineColor ?? '', n.opacity ?? 1, n.font ?? '', n.fs ?? 1, n.bold ?? 0, n.italic ?? 0,
      n.textColor ?? '', n.image ? n.image.length : 0, n.ar ?? 0, n.tail ?? '',
    ]);
  }

  private pickables: THREE.Object3D[] = [];

  private rebuild() {
    const sp = this.space;
    if (!sp) return;
    this.clearDynamic();
    this.pickables = [];
    const alive = new Set<string>();
    const vis = new Map<string, Node3D>();
    sp.nodes.forEach((n) => { if (this.layerVisible(n)) vis.set(n.id, n); });
    // Ebenen
    let ext = 7;
    sp.nodes.forEach((n) => { ext = Math.max(ext, Math.abs(n.x) + 3, Math.abs(n.z) + 3); });
    ext = Math.min(ext, 40);
    sp.layers.forEach((l) => this.addLayer(l, ext));
    if (sp.grid) {
      const y = sp.layers.length ? Math.min(...sp.layers.map((l) => l.y)) - 0.02 : -0.02;
      const gh = new THREE.GridHelper(ext * 2, Math.round(ext * 2), this.bi.dark ? 0x6f7686 : 0x8f8a7c, this.bi.dark ? 0x3a4152 : 0xcfc9ba);
      gh.position.y = y;
      gh.userData.ownGeo = true;
      this.dynamic.add(gh);
    }
    // Dinge (Gruppen wiederverwenden, wenn sich nichts geändert hat)
    vis.forEach((n) => {
      alive.add(n.id);
      let o = this.nodes.get(n.id);
      if (!o || o.sig !== this.sigOf(n)) {
        if (o) { this.scene.remove(o.group); this.disposeObj(o.group); }
        o = this.buildNode(n);
        this.nodes.set(n.id, o);
      }
      o.group.position.set(n.x, n.y, n.z);
      this.scene.add(o.group);
      if (!this.ui.readOnly && !this.dimmed(n)) this.pickables.push(...o.pick);
    });
    this.nodes.forEach((o, id) => {
      if (!alive.has(id)) {
        this.scene.remove(o.group);
        this.disposeObj(o.group);
        this.nodes.delete(id);
      }
    });
    // Kanten
    sp.edges.forEach((e) => {
      const a = vis.get(e.from);
      const b = vis.get(e.to);
      if (a && b) this.addEdge(e, a, b);
    });
    // Orientierungshilfe: Lotlinie des gewählten Dings bis zur Ebene darunter
    const sel = this.ui.selNode ? vis.get(this.ui.selNode) : undefined;
    if (sel) this.addDropLine(sel);
  }

  private addDropLine(n: Node3D) {
    const sp = this.space;
    if (!sp) return;
    const own = n.layerId ? sp.layers.find((l) => l.id === n.layerId) : undefined;
    const floor = own ? own.y : sp.layers.length ? Math.min(...sp.layers.map((l) => l.y)) : 0;
    const r = this.nodes.get(n.id)?.radius ?? nodeRadius(n);
    const col = 0xffa24a;
    if (Math.abs(n.y - floor) > r + 0.3) {
      const top = n.y > floor ? n.y - r * 0.9 : n.y + r * 0.9;
      const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(n.x, top, n.z), new THREE.Vector3(n.x, floor, n.z)]);
      const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color: col, dashSize: 0.25, gapSize: 0.18 }));
      l.computeLineDistances();
      l.userData.ownGeo = true;
      this.dynamic.add(l);
    }
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.38, 28), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(n.x, floor + 0.03, n.z);
    ring.userData.ownGeo = true;
    this.dynamic.add(ring);
  }

  private addLayer(l: Layer3D, extAuto: number) {
    if (!l.visible) return;
    const ext = l.ext ?? extAuto;
    const look = layerLook(l);
    const faded = !!this.ui.focusLayer && this.ui.focusLayer !== l.id;
    const g = new THREE.Group();
    g.position.y = l.y;
    const sel = this.ui.selLayer === l.id;
    const base = (l.opacity ?? 0.13) * (faded ? 0.35 : 1);
    const fill = (geom: THREE.BufferGeometry, op: number) => {
      const m = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: l.color, transparent: true, opacity: clamp(op, 0, 0.9), side: THREE.DoubleSide, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      m.renderOrder = -2;
      m.userData.ownGeo = true;
      g.add(m);
    };
    const loop = (pts: THREE.Vector3[], op: number) => {
      const lg = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.LineLoop(lg, new THREE.LineBasicMaterial({ color: l.color, transparent: true, opacity: op }));
      line.userData.ownGeo = true;
      g.add(line);
    };
    const square = [new THREE.Vector3(-ext, 0, -ext), new THREE.Vector3(ext, 0, -ext), new THREE.Vector3(ext, 0, ext), new THREE.Vector3(-ext, 0, ext)];
    const lineOp = (sel ? 1 : 0.7) * (faded ? 0.35 : 1);
    if (look === 'plane') { fill(new THREE.PlaneGeometry(ext * 2, ext * 2), sel ? base * 2 : base); loop(square, lineOp); }
    else if (look === 'disc') {
      fill(new THREE.CircleGeometry(ext, 64), sel ? base * 2 : base);
      loop(Array.from({ length: 64 }, (_, i) => new THREE.Vector3(Math.cos((i / 64) * Math.PI * 2) * ext, 0, Math.sin((i / 64) * Math.PI * 2) * ext)), lineOp);
    } else if (look === 'grid') {
      fill(new THREE.PlaneGeometry(ext * 2, ext * 2), (sel ? base * 2 : base) * 0.5);
      const grid = new THREE.GridHelper(ext * 2, Math.max(2, Math.round(ext)), l.color, l.color);
      (grid.material as THREE.Material).transparent = true;
      (grid.material as THREE.Material).opacity = (sel ? 0.8 : 0.5) * (faded ? 0.35 : 1);
      grid.userData.ownGeo = true;
      g.add(grid);
    } else if (look === 'frame') loop(square, Math.min(1, lineOp + 0.2));
    else if (look === 'slab') {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(ext * 2, 0.24, ext * 2), new THREE.MeshStandardMaterial({ color: l.color, transparent: true, opacity: (sel ? 0.8 : 0.62) * (faded ? 0.35 : 1), roughness: 0.7, depthWrite: false }));
      slab.position.y = -0.14;
      slab.userData.ownGeo = true;
      g.add(slab);
    }
    const s = this.label(l.name || ' ', { px: 52, color: l.color, alpha: faded ? 0.35 : 1 });
    s.position.set(-Math.min(ext - 1, 6) + s.scale.x / 2, 0.55, Math.min(ext - 1, 5));
    g.add(s);
    this.dynamic.add(g);
  }

  private addEdge(e: Space3D['edges'][number], a: Node3D, b: Node3D) {
    const A = new THREE.Vector3(a.x, a.y, a.z);
    const B = new THREE.Vector3(b.x, b.y, b.z);
    const dir = B.clone().sub(A);
    const len = dir.length();
    if (len < 0.01) return;
    dir.normalize();
    const ra = (this.nodes.get(a.id)?.radius ?? nodeRadius(a)) * 0.9;
    const rb = (this.nodes.get(b.id)?.radius ?? nodeRadius(b)) * 0.9;
    const s = A.clone().add(dir.clone().multiplyScalar(ra));
    const t = B.clone().sub(dir.clone().multiplyScalar(rb));
    const L = s.distanceTo(t);
    if (L < 0.05) return;
    const selected = this.ui.selEdge === e.id;
    const faded = !!this.ui.focusLayer && (this.dimmed(a) || this.dimmed(b));
    const color = selected ? '#ffa24a' : e.color;
    const r = selected ? 0.1 : 0.055;
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: faded, opacity: faded ? 0.25 : 1 });
    const seg = (from: number, to: number) => {
      const gg = new THREE.CylinderGeometry(r, r, to - from, 6);
      const m = new THREE.Mesh(gg, mat);
      m.userData.ownGeo = true;
      m.position.copy(s.clone().add(dir.clone().multiplyScalar((from + to) / 2)));
      m.quaternion.copy(quat);
      this.dynamic.add(m);
    };
    const tail = e.arrow ? 0.5 : 0;
    if (e.dashed) {
      for (let p = 0; p < L - tail; p += 0.55) seg(p, Math.min(p + 0.32, L - tail));
    } else seg(0, L - tail);
    if (e.arrow) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 12), mat);
      cone.userData.ownGeo = true;
      cone.position.copy(t.clone().sub(dir.clone().multiplyScalar(0.27)));
      cone.quaternion.copy(quat);
      this.dynamic.add(cone);
    }
    if (this.ui.readOnly || faded) return;
    // dicke, unsichtbare Röhre zum leichten Antippen
    const hitG = new THREE.CylinderGeometry(0.3, 0.3, L, 6);
    const hit = new THREE.Mesh(hitG, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    hit.userData.ownGeo = true;
    hit.userData.edgeId = e.id;
    hit.position.copy(s.clone().add(t).multiplyScalar(0.5));
    hit.quaternion.copy(quat);
    this.dynamic.add(hit);
    this.pickables.push(hit);
    if (e.label) {
      const lab = this.label(e.label, { px: 38, color: selected ? '#ffa24a' : undefined });
      lab.position.copy(s.clone().add(t).multiplyScalar(0.5)).add(new THREE.Vector3(0, 0.45, 0));
      lab.userData.edgeId = e.id;
      this.dynamic.add(lab);
      this.pickables.push(lab);
    }
  }

  /* ------------------------------------------------------------ input */
  private ndc(ev: { clientX: number; clientY: number }) {
    const r = this.renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -(((ev.clientY - r.top) / r.height) * 2 - 1));
  }
  private ray(ev: { clientX: number; clientY: number }) {
    const rc = new THREE.Raycaster();
    rc.setFromCamera(this.ndc(ev), this.camera);
    return rc;
  }
  private hitTest(ev: { clientX: number; clientY: number }): { type: 'node' | 'edge'; id: string } | undefined {
    this.camera.updateMatrixWorld();
    const rc = this.ray(ev);
    const hits = rc.intersectObjects(this.pickables, false);
    for (const h of hits) {
      const nid = h.object.userData.nodeId as string | undefined;
      if (nid) return { type: 'node', id: nid };
    }
    for (const h of hits) {
      const eid = h.object.userData.edgeId as string | undefined;
      if (eid) return { type: 'edge', id: eid };
    }
    return undefined;
  }

  private onDown = (ev: PointerEvent) => {
    const cv = this.renderer.domElement;
    try { cv.setPointerCapture(ev.pointerId); } catch { /* nicht schlimm */ }
    cancelAnimationFrame(this.tween);
    this.ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    const touch = ev.pointerType === 'touch' || ev.pointerType === 'pen';
    if (this.ptrs.size === 2) {
      if (this.gesture?.kind === 'node' && this.gesture.started) return;
      const [p, q] = [...this.ptrs.values()];
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      const c = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
      this.gesture = { kind: 'pinch', startX: 0, startY: 0, moved: true, touch, pinchD0: d, pinchC0: c, pinchD: d, pinchC: c };
      return;
    }
    if (this.ptrs.size > 2) return;
    const hit = ev.button === 0 ? this.hitTest(ev) : undefined;
    const pan = ev.button === 1 || ev.button === 2 || ev.shiftKey;
    let kind: Gesture['kind'] = hit && hit.type === 'node' && !pan ? 'node' : pan || this.oneFinger === 'pan' ? 'pan' : 'orbit';
    if ((kind === 'orbit' && this.locks.rotate) || (kind === 'pan' && this.locks.pan)) kind = 'none';
    this.gesture = { kind, startX: ev.clientX, startY: ev.clientY, moved: false, touch, hit };
  };

  private onMove = (ev: PointerEvent) => {
    const prev = this.ptrs.get(ev.pointerId);
    if (!prev) return;
    const g = this.gesture;
    this.ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (!g) return;
    if (g.kind === 'pinch' && this.ptrs.size >= 2) {
      const [p, q] = [...this.ptrs.values()];
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      const c = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
      if (!g.sub) {
        // zwei Finger entscheiden sich EINMAL: zoomen oder verschieben – nie beides zugleich
        const dd = Math.abs(d - (g.pinchD0 ?? d));
        const dc = Math.hypot(c.x - (g.pinchC0?.x ?? c.x), c.y - (g.pinchC0?.y ?? c.y));
        if (dd < 10 && dc < 10) return;
        g.sub = dd >= dc * 1.2 ? 'zoom' : 'pan';
        g.pinchD = d;
        g.pinchC = c;
        return;
      }
      if (g.sub === 'zoom' && !this.locks.zoom && g.pinchD && d > 4) this.cam.dist = clamp((this.cam.dist * g.pinchD) / d, 3, 90);
      if (g.sub === 'pan' && !this.locks.pan && g.pinchC) this.panBy(c.x - g.pinchC.x, c.y - g.pinchC.y);
      g.pinchD = d;
      g.pinchC = c;
      this.applyCam();
      return;
    }
    const dx = ev.clientX - prev.x;
    const dy = ev.clientY - prev.y;
    const tx = ev.clientX - g.startX;
    const ty = ev.clientY - g.startY;
    if (!g.moved && Math.hypot(tx, ty) < (g.touch ? 8 : 5)) return;
    if (!g.moved) {
      g.moved = true;
      if (g.touch && !this.freeOrbit && g.kind === 'orbit') g.axis = Math.abs(tx) >= Math.abs(ty) ? 'h' : 'v';
    }
    if (g.kind === 'orbit') {
      if (g.axis !== 'v') this.cam.theta -= dx * 0.008;
      if (g.axis !== 'h') this.cam.phi = clamp(this.cam.phi - dy * 0.008, 0.05, Math.PI - 0.05);
      this.applyCam();
    } else if (g.kind === 'pan') {
      this.panBy(dx, dy);
      this.applyCam();
    } else if (g.kind === 'node' && g.hit) {
      this.dragNode(g, ev);
    }
  };

  private onUp = (ev: PointerEvent) => {
    const g = this.gesture;
    this.ptrs.delete(ev.pointerId);
    if (this.ptrs.size >= 1 && g?.kind === 'pinch') {
      if (this.ptrs.size < 2) this.gesture = null;
      this.cb.onCam(this.getCam());
      return;
    }
    if (!g) return;
    this.gesture = null;
    if (g.kind === 'node' && g.hit) {
      if (g.started) this.cb.onDragEnd(g.hit.id);
      else this.cb.onPickNode(g.hit.id);
      return;
    }
    if (g.kind === 'pinch') {
      this.cb.onCam(this.getCam());
      return;
    }
    if (!g.moved) {
      if (g.hit?.type === 'edge') this.cb.onPickEdge(g.hit.id);
      else this.cb.onPickNone();
    } else if (g.kind !== 'none') this.cb.onCam(this.getCam());
  };

  private wheelTimer = 0;
  private onWheel = (ev: WheelEvent) => {
    ev.preventDefault();
    if (this.locks.zoom) return;
    this.cam.dist = clamp(this.cam.dist * Math.exp(ev.deltaY * 0.0012), 3, 90);
    this.applyCam();
    window.clearTimeout(this.wheelTimer);
    this.wheelTimer = window.setTimeout(() => this.cb.onCam(this.getCam()), 400);
  };

  private panBy(dx: number, dy: number) {
    const k = this.cam.dist * 0.0016;
    const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 1);
    const mv = right.multiplyScalar(-dx * k).add(up.multiplyScalar(dy * k));
    this.cam.tx += mv.x;
    this.cam.ty += mv.y;
    this.cam.tz += mv.z;
  }

  private dragNode(g: Gesture, ev: PointerEvent) {
    if (!this.space || !g.hit) return;
    const n = this.space.nodes.find((x) => x.id === g.hit!.id);
    if (!n) return;
    const mode: DragMode = this.ui.focusLayer ? 'plane' : this.dragMode;
    const rc = this.ray(ev);
    const pos = new THREE.Vector3(n.x, n.y, n.z);
    let plane: THREE.Plane;
    if (mode === 'plane') plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -n.y);
    else {
      const d = new THREE.Vector3();
      this.camera.getWorldDirection(d);
      const flat = new THREE.Vector3(d.x, 0, d.z);
      if (flat.lengthSq() < 1e-4) flat.set(0, 0, 1);
      flat.normalize();
      plane = new THREE.Plane(flat, -flat.dot(pos));
    }
    const hit = new THREE.Vector3();
    if (!rc.ray.intersectPlane(plane, hit)) return;
    if (!g.started) {
      g.started = true;
      g.offset = pos.clone().sub(hit);
      this.cb.onDragStart(n.id);
      return;
    }
    const target = hit.add(g.offset ?? new THREE.Vector3());
    let x = n.x;
    let y = n.y;
    let z = n.z;
    let layerId: string | undefined = n.layerId;
    if (mode === 'plane') {
      x = clamp(target.x, -60, 60);
      z = clamp(target.z, -60, 60);
    } else {
      y = clamp(target.y, -60, 60);
      layerId = undefined;
      for (const l of this.space.layers) {
        if (l.visible && Math.abs(l.y - y) < 0.55) { y = l.y; layerId = l.id; break; }
      }
    }
    const r2 = (v: number) => Math.round(v * 100) / 100;
    this.cb.onDrag(n.id, r2(x), r2(y), r2(z), layerId);
  }
}
