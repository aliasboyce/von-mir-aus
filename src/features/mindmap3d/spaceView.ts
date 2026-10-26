import * as THREE from 'three';
import type { Layer3D, Node3D, Shape3D, Space3D } from './space3dModel';

/**
 * Die Bühne der 3D-Mindmap: zeichnet nur, wenn sich etwas ändert (schont Akku),
 * Drehen / Zoomen / Verschieben mit Maus, Touch und Zwei-Finger-Geste, Dinge anfassen und im Raum verschieben.
 * Keine Daten hier – der Zustand liegt in der React-Seite, die Bühne bekommt ihn per update().
 */

export type DragMode = 'plane' | 'height';
export interface Cam { theta: number; phi: number; dist: number; tx: number; ty: number; tz: number }

export interface ViewCallbacks {
  onPickNode(id: string): void;
  onPickEdge(id: string): void;
  onPickNone(): void;
  onDragStart(id: string): void;
  onDrag(id: string, x: number, y: number, z: number, layerId: string | undefined): void;
  onDragEnd(id: string): void;
  onCam(cam: Cam): void;
}
export interface ViewUi { selNode?: string | null; selEdge?: string | null; selLayer?: string | null; connectFrom?: string | null }

const BG = { dark: 0x161a22, light: 0xf3efe6, dusk: 0x2a2540 } as const;
const INK = { dark: '#f4f1ea', light: '#2b2a28', dusk: '#f4f1ea' } as const;
const HALO = { dark: '#161a22', light: '#f3efe6', dusk: '#2a2540' } as const;

export const nodeRadius = (n: Pick<Node3D, 'size'>) => 0.45 + 0.25 * Math.max(1, Math.min(4, n.size || 2));
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
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
    if (out.length >= 5) break;
  }
  return out.slice(0, 5);
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

function baseGeometry(shape: Shape3D): THREE.BufferGeometry {
  switch (shape) {
    case 'cube': return new THREE.BoxGeometry(1.5, 1.5, 1.5);
    case 'cone': return new THREE.ConeGeometry(1, 1.8, 32);
    case 'cylinder': return new THREE.CylinderGeometry(0.85, 0.85, 1.6, 32);
    case 'pyramid': return new THREE.ConeGeometry(1.1, 1.7, 4);
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

interface NodeObj { group: THREE.Group; sig: string; pick: THREE.Object3D[] }

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
  private raf = 0;
  private ro: ResizeObserver;
  private dragMode: DragMode = 'plane';
  private ptrs = new Map<number, { x: number; y: number }>();
  private gesture: null | { kind: 'orbit' | 'pan' | 'pinch' | 'node'; startX: number; startY: number; moved: boolean; hit?: { type: 'node' | 'edge'; id: string }; pinchD?: number; pinchC?: { x: number; y: number }; offset?: THREE.Vector3; started?: boolean } = null;
  private disposed = false;
  private theme: keyof typeof BG = 'dark';

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
    this.scene.background = new THREE.Color(BG.dark);
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
  getCam(): Cam { return { ...this.cam }; }
  setCam(c: Partial<Cam>) { this.cam = { ...this.cam, ...c }; this.applyCam(); }
  zoom(f: number) { this.cam.dist = clamp(this.cam.dist * f, 3, 90); this.applyCam(); this.cb.onCam(this.getCam()); }
  focus(x: number, y: number, z: number) { this.cam.tx = x; this.cam.ty = y; this.cam.tz = z; this.applyCam(); this.cb.onCam(this.getCam()); }
  rotateBy(dTheta: number, dPhi: number) { this.cam.theta += dTheta; this.cam.phi = clamp(this.cam.phi + dPhi, 0.05, Math.PI - 0.05); this.applyCam(); this.cb.onCam(this.getCam()); }
  /** Blickpunkt auf alles richten */
  fitAll() {
    if (!this.space || !this.space.nodes.length) { this.cam = { ...this.cam, tx: 0, ty: 0, tz: 0, dist: 20 }; this.applyCam(); this.cb.onCam(this.getCam()); return; }
    const ns = this.space.nodes.filter((n) => this.layerVisible(n));
    const list = ns.length ? ns : this.space.nodes;
    const b = new THREE.Box3();
    list.forEach((n) => b.expandByPoint(new THREE.Vector3(n.x, n.y, n.z)));
    const c = b.getCenter(new THREE.Vector3());
    const r = Math.max(4, b.getSize(new THREE.Vector3()).length() / 2 + 3);
    this.cam = { ...this.cam, tx: c.x, ty: c.y, tz: c.z, dist: clamp(r / Math.tan((this.camera.fov * Math.PI) / 360) * 0.95, 8, 90) };
    this.applyCam();
    this.cb.onCam(this.getCam());
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
    if (this.theme !== space.bg) {
      this.theme = space.bg;
      this.scene.background = new THREE.Color(BG[space.bg]);
      this.labels.forEach((l) => l.tex.dispose());
      this.labels.clear();
      this.nodes.forEach((o) => this.disposeObj(o.group));
      this.nodes.clear();
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
      ctx.fillStyle = '#' + BG[this.theme].toString(16).padStart(6, '0');
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(src, 0, 0, w, h);
      const url = c.toDataURL(type, quality);
      return url.length > 100 ? url : null;
    } catch {
      return null;
    }
  }

  /**
   * Übersichtsbild für Liste und PDF: gleicher Blickwinkel wie gerade, aber alles Sichtbare passt ins Bild
   * (Querformat), egal wie klein der Bildschirm ist. Auf hellem „Papier“ (druckfreundlich, spart Tinte).
   */
  snapshotFit(w: number, h: number, quality = 0.82, paper = true): string | null {
    const sp = this.space;
    if (!sp) return null;
    const origBg = sp.bg;
    const swap = paper && origBg !== 'light';
    if (swap) this.update({ ...sp, bg: 'light' }, this.ui);
    const saved = { cam: { ...this.cam }, size: this.renderer.getSize(new THREE.Vector2()), pr: this.renderer.getPixelRatio(), aspect: this.camera.aspect };
    try {
      const box = new THREE.Box3();
      const vis = sp.nodes.filter((n) => this.layerVisible(n));
      vis.forEach((n) => { const r = nodeRadius(n) + 1.2; box.expandByPoint(new THREE.Vector3(n.x - r, n.y - r, n.z - r)); box.expandByPoint(new THREE.Vector3(n.x + r, n.y + r + 1, n.z + r)); });
      sp.layers.filter((l) => l.visible).forEach((l) => { box.expandByPoint(new THREE.Vector3(box.min.x, l.y, box.min.z)); box.expandByPoint(new THREE.Vector3(box.max.x, l.y + 0.8, box.max.z)); });
      if (box.isEmpty()) box.set(new THREE.Vector3(-6, -3, -6), new THREE.Vector3(6, 3, 6));
      const c = box.getCenter(new THREE.Vector3());
      const rad = box.getSize(new THREE.Vector3()).length() / 2;
      const vf = (this.camera.fov * Math.PI) / 180;
      const hf = 2 * Math.atan(Math.tan(vf / 2) * (w / h));
      this.renderer.setPixelRatio(1);
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.cam = { ...this.cam, tx: c.x, ty: c.y, tz: c.z, dist: clamp((rad / Math.sin(Math.min(vf, hf) / 2)) * 0.82, 6, 120) };
      this.applyCam();
      const url = this.snapshot(Math.max(w, h), 'image/jpeg', quality);
      return url;
    } catch {
      return null;
    } finally {
      if (swap) this.update(sp, this.ui);
      this.cam = saved.cam;
      this.renderer.setPixelRatio(saved.pr);
      this.renderer.setSize(saved.size.x, saved.size.y, false);
      this.camera.aspect = saved.aspect;
      this.camera.updateProjectionMatrix();
      this.applyCam();
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
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
  private label(text: string, opts: { px?: number; color?: string; halo?: string } = {}): THREE.Sprite {
    const px = opts.px ?? 46;
    const color = opts.color ?? INK[this.theme];
    const halo = opts.halo ?? HALO[this.theme];
    const key = `${px}|${color}|${halo}|${text}`;
    let entry = this.labels.get(key);
    if (!entry) {
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d')!;
      const font = `600 ${px}px system-ui, -apple-system, "Segoe UI", Roboto, "Noto Color Emoji", sans-serif`;
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
        g.lineWidth = Math.max(4, px / 5);
        g.strokeStyle = halo;
        g.strokeText(l, c.width / 2, y);
        g.fillStyle = color;
        g.fillText(l, c.width / 2, y);
      });
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 2;
      entry = { tex, w: c.width, h: c.height };
      this.labels.set(key, entry);
    }
    const mat = new THREE.SpriteMaterial({ map: entry.tex, depthTest: false, transparent: true });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(entry.w * 0.0155, entry.h * 0.0155, 1);
    sp.renderOrder = 20;
    return sp;
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

  private buildNode(n: Node3D): NodeObj {
    const group = new THREE.Group();
    const R = nodeRadius(n);
    const pick: THREE.Object3D[] = [];
    const selected = this.ui.selNode === n.id || this.ui.connectFrom === n.id;
    if (n.shape === 'text') {
      const hit = new THREE.Mesh(this.geo('text'), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      hit.scale.setScalar(R * 1.1);
      hit.userData.nodeId = n.id;
      group.add(hit);
      pick.push(hit);
    } else {
      const mat = new THREE.MeshStandardMaterial({ color: n.color, roughness: 0.5, metalness: 0.05, flatShading: n.shape === 'gem' || n.shape === 'pyramid' || n.shape === 'diamond' });
      const mesh = new THREE.Mesh(this.geo(n.shape), mat);
      mesh.scale.setScalar(R);
      if (n.shape === 'ring') mesh.rotation.x = Math.PI / 2.6;
      mesh.userData.nodeId = n.id;
      group.add(mesh);
      pick.push(mesh);
      if (selected) {
        const halo = new THREE.Mesh(this.geo(n.shape), new THREE.MeshBasicMaterial({ color: this.ui.connectFrom === n.id ? 0x4cc3ff : 0xffa24a, side: THREE.BackSide }));
        halo.scale.setScalar(R * 1.16);
        halo.rotation.copy(mesh.rotation);
        group.add(halo);
      }
    }
    const text = `${n.symbol ? n.symbol + ' ' : ''}${n.text || ' '}${n.link ? ' ↗' : ''}`;
    const sp = this.label(text, { px: n.shape === 'text' ? 54 : 44, color: n.shape === 'text' ? n.color : undefined });
    const above = n.shape === 'plate' ? 0 : R + 0.35 + sp.scale.y / 2;
    sp.position.set(0, above, n.shape === 'plate' ? 0.12 : 0);
    sp.userData.nodeId = n.id;
    group.add(sp);
    pick.push(sp);
    return { group, sig: this.sigOf(n), pick };
  }
  private sigOf(n: Node3D) {
    const sel = this.ui.selNode === n.id ? 's' : this.ui.connectFrom === n.id ? 'c' : '';
    return [n.shape, n.color, n.size, n.text, n.symbol ?? '', n.link ? 1 : 0, sel, this.theme].join('|');
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
      const gh = new THREE.GridHelper(ext * 2, Math.round(ext * 2), this.theme === 'light' ? 0x8f8a7c : 0x6f7686, this.theme === 'light' ? 0xcfc9ba : 0x3a4152);
      gh.position.y = y;
      gh.userData.ownGeo = true;
      this.dynamic.add(gh);
    }
    // Kanten
    sp.edges.forEach((e) => {
      const a = vis.get(e.from);
      const b = vis.get(e.to);
      if (a && b) this.addEdge(e, a, b);
    });
    // Dinge (Gruppen wiederverwenden, wenn sich nichts geändert hat)
    vis.forEach((n) => {
      alive.add(n.id);
      let o = this.nodes.get(n.id);
      if (!o || o.sig !== this.sigOf(n)) {
        if (o) this.disposeObj(o.group);
        o = this.buildNode(n);
        this.nodes.set(n.id, o);
      }
      o.group.position.set(n.x, n.y, n.z);
      this.scene.add(o.group);
      this.pickables.push(...o.pick);
    });
    this.nodes.forEach((o, id) => {
      if (!alive.has(id)) {
        this.scene.remove(o.group);
        this.disposeObj(o.group);
        this.nodes.delete(id);
      }
    });
  }

  private addLayer(l: Layer3D, ext: number) {
    if (!l.visible) return;
    const g = new THREE.Group();
    g.position.y = l.y;
    const sel = this.ui.selLayer === l.id;
    if (l.plane) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(ext * 2, ext * 2), new THREE.MeshBasicMaterial({ color: l.color, transparent: true, opacity: sel ? 0.26 : 0.13, side: THREE.DoubleSide, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      m.renderOrder = -2;
      m.userData.ownGeo = true;
      g.add(m);
      const pts = [new THREE.Vector3(-ext, 0, -ext), new THREE.Vector3(ext, 0, -ext), new THREE.Vector3(ext, 0, ext), new THREE.Vector3(-ext, 0, ext)];
      const lg = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.LineLoop(lg, new THREE.LineBasicMaterial({ color: l.color, transparent: true, opacity: sel ? 1 : 0.7 }));
      line.userData.ownGeo = true;
      g.add(line);
    }
    const s = this.label(l.name || ' ', { px: 52, color: l.color });
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
    const ra = nodeRadius(a) * 0.9;
    const rb = nodeRadius(b) * 0.9;
    const s = A.clone().add(dir.clone().multiplyScalar(ra));
    const t = B.clone().sub(dir.clone().multiplyScalar(rb));
    const L = s.distanceTo(t);
    if (L < 0.05) return;
    const selected = this.ui.selEdge === e.id;
    const color = selected ? '#ffa24a' : e.color;
    const r = selected ? 0.1 : 0.055;
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const mat = new THREE.MeshBasicMaterial({ color });
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
    this.ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (this.ptrs.size === 2) {
      const [p, q] = [...this.ptrs.values()];
      this.gesture = { kind: 'pinch', startX: 0, startY: 0, moved: true, pinchD: Math.hypot(p.x - q.x, p.y - q.y), pinchC: { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 } };
      return;
    }
    if (this.ptrs.size > 2) return;
    const hit = ev.button === 0 ? this.hitTest(ev) : undefined;
    const pan = ev.button === 1 || ev.button === 2 || ev.shiftKey;
    this.gesture = { kind: hit && hit.type === 'node' && !pan ? 'node' : pan ? 'pan' : 'orbit', startX: ev.clientX, startY: ev.clientY, moved: false, hit };
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
      if (g.pinchD && d > 4) this.cam.dist = clamp((this.cam.dist * g.pinchD) / d, 3, 90);
      if (g.pinchC) this.panBy(c.x - g.pinchC.x, c.y - g.pinchC.y);
      g.pinchD = d;
      g.pinchC = c;
      this.applyCam();
      return;
    }
    const dx = ev.clientX - prev.x;
    const dy = ev.clientY - prev.y;
    if (!g.moved && Math.hypot(ev.clientX - g.startX, ev.clientY - g.startY) < 6) return;
    g.moved = true;
    if (g.kind === 'orbit') {
      this.cam.theta -= dx * 0.008;
      this.cam.phi = clamp(this.cam.phi - dy * 0.008, 0.05, Math.PI - 0.05);
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
    } else this.cb.onCam(this.getCam());
  };

  private wheelTimer = 0;
  private onWheel = (ev: WheelEvent) => {
    ev.preventDefault();
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

  private dragNode(g: NonNullable<SpaceView['gesture']>, ev: PointerEvent) {
    if (!this.space || !g.hit) return;
    const n = this.space.nodes.find((x) => x.id === g.hit!.id);
    if (!n) return;
    const rc = this.ray(ev);
    const pos = new THREE.Vector3(n.x, n.y, n.z);
    let plane: THREE.Plane;
    if (this.dragMode === 'plane') plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -n.y);
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
    if (this.dragMode === 'plane') {
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
