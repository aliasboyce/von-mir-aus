import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { playSound, playCompanionSound } from '../../services/sounds';
import { triggerHaptic } from '../../services/haptics';
import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { useRegisterExternalModalOpen } from '../../state/ModalStackContext';

/**
 * "Spiel wie das Chrome-Dino-Spiel, mit dem Wesen"-Auftrag — replaces
 * the earlier needs-and-feelings game entirely (the user didn't like
 * it). Same core mechanic as the reference: the companion runs
 * automatically, tap the screen or press Space to jump, obstacles
 * (stones and roots — a forest-path motif, matching how often the app
 * already talks about walks in nature) must be jumped over, "Funken"
 * (sparks of light) can be collected along the way for bonus points —
 * a companion that's a Lichtwesen gathering its own light felt like
 * the most fitting collectible. Speed increases steadily the longer
 * a run lasts, exactly like the reference game.
 */
const highScoreStore = createKeyValueStore<number>('dino-game-highscore', 0);

const GROUND_Y = 118;
const COMPANION_X = 46;
const COMPANION_SIZE = 34;
const GRAVITY = 0.0022;
const JUMP_VELOCITY = -0.62;
const BASE_SPEED = 0.16; // px/ms
const SPEED_GROWTH = 0.000006; // added per ms survived

type ObstacleKind = 'stein' | 'wurzel';
interface Obstacle {
  x: number;
  kind: ObstacleKind;
  width: number;
  height: number;
  passed: boolean;
}
interface Spark {
  x: number;
  y: number;
  collected: boolean;
}

interface DinoGameProps {
  onClose: () => void;
}

export function DinoGame({ onClose }: DinoGameProps) {
  const t = useT();
  const { settings } = useSettings();
  useRegisterExternalModalOpen(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({
    running: false,
    started: false,
    gameOver: false,
    companionY: 0,
    velocityY: 0,
    onGround: true,
    speed: BASE_SPEED,
    elapsedMs: 0,
    lastTs: 0,
    obstacles: [] as Obstacle[],
    sparks: [] as Spark[],
    nextObstacleAt: 900,
    nextSparkAt: 1600,
    score: 0,
    sparkCount: 0,
  });

  const [, forceRender] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const lastScoreSyncRef = useRef(0);
  const [highScore, setHighScore] = useState(() => highScoreStore.get());
  const [gameOverUi, setGameOverUi] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  function jump() {
    const s = stateRef.current;
    if (!s.started) {
      startRun();
      return;
    }
    if (s.gameOver) return;
    if (!s.onGround) return;
    s.velocityY = JUMP_VELOCITY;
    s.onGround = false;
    // "Beide Geraeusche gleichzeitig beim Springen"-Auftrag
    playCompanionSound('wake', settings);
    playSound('click', settings);
    triggerHaptic('select', settings);
  }

  function startRun() {
    const s = stateRef.current;
    s.running = true;
    s.started = true;
    s.gameOver = false;
    s.companionY = 0;
    s.velocityY = 0;
    s.onGround = true;
    s.speed = BASE_SPEED;
    s.elapsedMs = 0;
    s.lastTs = 0;
    s.obstacles = [];
    s.sparks = [];
    s.nextObstacleAt = 900;
    s.nextSparkAt = 1600;
    s.score = 0;
    s.sparkCount = 0;
    setDisplayScore(0);
    lastScoreSyncRef.current = 0;
    setGameOverUi(false);
    forceRender((n) => n + 1);
  }

  function endRun() {
    const s = stateRef.current;
    s.running = false;
    s.gameOver = true;
    const finalScoreVal = Math.floor(s.score);
    setFinalScore(finalScoreVal);
    if (finalScoreVal > highScoreStore.get()) {
      highScoreStore.set(finalScoreVal);
      setHighScore(finalScoreVal);
    }
    setGameOverUi(true);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;

    function drawCompanion(x: number, y: number, squashed: boolean) {
      if (!ctx) return;
      const size = COMPANION_SIZE;
      const cy = GROUND_Y - size / 2 + y;
      ctx.save();
      ctx.translate(x + size / 2, cy);
      if (squashed) ctx.scale(1.15, 0.85);
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#f0b429';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 2, size / 2 - 7, 0, Math.PI * 2);
      ctx.fillStyle = '#fff6d8';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-2, 1, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#3a2e20';
      ctx.fill();
      ctx.restore();
    }

    function drawObstacle(o: Obstacle) {
      if (!ctx) return;
      const baseY = GROUND_Y - o.height;
      if (o.kind === 'stein') {
        ctx.beginPath();
        ctx.ellipse(o.x + o.width / 2, baseY + o.height / 2, o.width / 2, o.height / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#9a9488';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(o.x, GROUND_Y);
        ctx.lineTo(o.x + o.width * 0.3, baseY);
        ctx.lineTo(o.x + o.width * 0.6, GROUND_Y - o.height * 0.6);
        ctx.lineTo(o.x + o.width, GROUND_Y);
        ctx.closePath();
        ctx.fillStyle = '#8a5a2f';
        ctx.fill();
      }
    }

    function drawSpark(sp: Spark) {
      if (!ctx) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 5, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, 8);
      grad.addColorStop(0, 'rgba(255,244,194,0.95)');
      grad.addColorStop(1, 'rgba(255,244,194,0)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff4c2';
      ctx.fill();
      ctx.restore();
    }

    function tick(ts: number) {
      const s = stateRef.current;
      if (!ctx) return;
      if (!s.lastTs) s.lastTs = ts;
      const dt = Math.min(48, ts - s.lastTs);
      s.lastTs = ts;

      ctx.clearRect(0, 0, width, height);
      // ground
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(width, GROUND_Y);
      ctx.stroke();

      if (s.running) {
        s.elapsedMs += dt;
        s.speed = BASE_SPEED + s.elapsedMs * SPEED_GROWTH;
        s.score += dt * 0.01;

        // physics
        s.velocityY += GRAVITY * dt;
        s.companionY += s.velocityY * dt;
        if (s.companionY >= 0) {
          s.companionY = 0;
          s.velocityY = 0;
          s.onGround = true;
        }

        // spawn obstacles
        s.nextObstacleAt -= dt;
        if (s.nextObstacleAt <= 0) {
          const kind: ObstacleKind = Math.random() < 0.5 ? 'stein' : 'wurzel';
          const w = kind === 'stein' ? 22 + Math.random() * 10 : 26 + Math.random() * 12;
          const h = kind === 'stein' ? 16 + Math.random() * 6 : 20 + Math.random() * 8;
          s.obstacles.push({ x: width + 10, kind, width: w, height: h, passed: false });
          s.nextObstacleAt = Math.max(420, 1100 - s.elapsedMs * 0.02) + Math.random() * 500;
        }

        // spawn sparks
        s.nextSparkAt -= dt;
        if (s.nextSparkAt <= 0) {
          s.sparks.push({ x: width + 10, y: GROUND_Y - 46 - Math.random() * 24, collected: false });
          s.nextSparkAt = 1400 + Math.random() * 1400;
        }

        // move + collide obstacles
        const moveBy = s.speed * dt;
        for (const o of s.obstacles) o.x -= moveBy;
        s.obstacles = s.obstacles.filter((o) => o.x + o.width > -5);

        const companionTop = GROUND_Y - COMPANION_SIZE + s.companionY;
        const companionBottom = GROUND_Y + s.companionY;
        for (const o of s.obstacles) {
          const oTop = GROUND_Y - o.height;
          const overlapX = COMPANION_X + COMPANION_SIZE * 0.75 > o.x + o.width * 0.15 && COMPANION_X + COMPANION_SIZE * 0.25 < o.x + o.width * 0.85;
          const overlapY = companionBottom > oTop + 3;
          if (overlapX && overlapY && companionTop < GROUND_Y) {
            endRun();
            break;
          }
        }

        // move + collect sparks
        for (const sp of s.sparks) sp.x -= moveBy;
        s.sparks = s.sparks.filter((sp) => sp.x > -10);
        for (const sp of s.sparks) {
          if (sp.collected) continue;
          const dx = sp.x - (COMPANION_X + COMPANION_SIZE / 2);
          const dy = sp.y - (GROUND_Y - COMPANION_SIZE / 2 + s.companionY);
          if (Math.sqrt(dx * dx + dy * dy) < 20) {
            sp.collected = true;
            s.sparkCount += 1;
            s.score += 15;
          }
        }
        s.sparks = s.sparks.filter((sp) => !sp.collected);

        // "Punkteanzeige aktualisiert sich nicht"-Fund — stateRef
        // updates don't trigger a re-render on their own; sync into
        // real React state every ~150ms so the displayed number moves
        // without forcing a re-render on every single frame.
        if (ts - lastScoreSyncRef.current > 150) {
          lastScoreSyncRef.current = ts;
          setDisplayScore(Math.floor(s.score));
        }
      }

      for (const o of s.obstacles) drawObstacle(o);
      for (const sp of s.sparks) drawSpark(sp);
      drawCompanion(COMPANION_X, s.companionY, !s.onGround);

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const s = stateRef.current;

  return (
    <div className="fixed inset-0 z-[400] flex flex-col items-center justify-center bg-[var(--color-surface)]" onClick={jump}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label={t.common.close}
        className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-surface-muted)]"
        style={{ top: 'max(20px, env(safe-area-inset-top))' }}
      >
        <X size={18} />
      </button>

      <p className="text-[13px] text-[var(--color-text-faint)] mb-2">{t.dinoGame.title}</p>

      <div className="relative">
        <canvas ref={canvasRef} width={320} height={150} className="rounded-[var(--radius-lg)]" style={{ background: 'var(--color-surface-muted)' }} />
        {!s.started && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-[14px] text-[var(--color-text-muted)] bg-[var(--color-surface)] px-3 py-1.5 rounded-full">{t.dinoGame.tapToStart}</p>
          </div>
        )}
        {gameOverUi && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--color-surface)]/90 rounded-[var(--radius-lg)]">
            <p className="text-[15px] text-[var(--color-text)]">{t.dinoGame.gameOver}</p>
            <p className="text-[13px] text-[var(--color-text-muted)]">{t.dinoGame.scoreLabel.replace('{score}', String(finalScore))}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startRun();
              }}
              className="mt-1 px-4 py-2 rounded-full text-[13px] bg-[var(--color-primary)] text-[var(--color-surface)]"
            >
              {t.dinoGame.restartCta}
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-4 text-[12px] text-[var(--color-text-faint)]">
        <span>{t.dinoGame.scoreLabel.replace('{score}', String(displayScore))}</span>
        <span>{t.dinoGame.highScoreLabel.replace('{score}', String(highScore))}</span>
      </div>
      <p className="mt-4 text-[12px] text-[var(--color-text-faint)] max-w-[260px] text-center">{t.dinoGame.instructions}</p>
    </div>
  );
}
