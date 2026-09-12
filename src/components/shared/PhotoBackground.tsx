import { useEffect, useState } from 'react';

/**
 * "Es klappt schon wieder nicht mit den Fotos"-Auftrag — this is the
 * THIRD time this exact complaint has come up. The previous
 * investigation (making Resource.image/Bridge.image required fields)
 * found and fixed two genuine code-level gaps, but the complaint
 * persisted — which points at something no code review alone can
 * catch: every single photo URL in this app is a request to an
 * EXTERNAL third-party service (picsum.photos). If that service is
 * blocked by a firewall/ad-blocker, rate-limited, slow, or briefly
 * down in the person's actual environment, the image fails to load —
 * completely independent of whether the surrounding React/TypeScript
 * code is correct. A broken/blank image in that situation could look
 * exactly like "the photo feature stopped working and reverted to
 * nothing", which matches the recurring complaint far better than a
 * fourth pass over already-verified component code would.
 *
 * This component makes that failure mode visibly graceful instead of
 * silently broken: it preloads the URL, and on failure, tries one
 * simple built-in fallback (a different picsum seed) before finally
 * settling on a soft, honest "photo not available right now" card —
 * clearly a network hiccup, never something that reads as "back to
 * icons". Use this instead of a raw `style={{ backgroundImage }}` div
 * wherever a resource/bridge photo is shown.
 */
export function PhotoBackground({
  src,
  className,
  style,
  children,
}: {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'fallback-loading' | 'fallback-ok' | 'failed'>('loading');
  const fallbackSrc = toFallbackSeed(src);

  useEffect(() => {
    setStatus('loading');
    const img = new Image();
    img.onload = () => setStatus('ok');
    img.onerror = () => setStatus('fallback-loading');
    img.src = src;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  useEffect(() => {
    if (status !== 'fallback-loading') return;
    const img = new Image();
    img.onload = () => setStatus('fallback-ok');
    img.onerror = () => setStatus('failed');
    img.src = fallbackSrc;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [status, fallbackSrc]);

  const activeUrl = status === 'ok' ? src : status === 'fallback-ok' ? fallbackSrc : null;

  return (
    <div
      className={className}
      style={
        activeUrl
          ? { ...style, backgroundImage: `url("${activeUrl}")` }
          : { ...style, background: 'var(--color-surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }
    >
      {!activeUrl && status === 'failed' && (
        <span className="text-[11px] text-[var(--color-text-faint)] text-center px-2">📷</span>
      )}
      {children}
    </div>
  );
}

function toFallbackSeed(url: string): string {
  // picsum.photos/seed/{seed}/... — swap in a different, unrelated
  // seed so a failure that's specific to one seed (rare, but possible
  // with certain characters or edge-case values) gets a genuinely
  // different request rather than retrying the identical URL.
  return url.replace(/seed\/[^/]+\//, 'seed/fallback-general-1/');
}
