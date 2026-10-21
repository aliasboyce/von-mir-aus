/**
 * A card may carry one link to a song, a video or a podcast for exactly the time it plays
 * ("Lieblingslied hören", "5-Minuten-Dehnvideo"). Known services are embedded inside the app so the
 * person does not leave it; anything else opens in a new tab while the card's own timer keeps counting.
 */
export type MediaKind = 'youtube' | 'spotify' | 'soundcloud' | 'vimeo' | 'audio' | 'video' | 'other';

export interface ParsedMedia {
  kind: MediaKind;
  url: string;
  /** iframe address (embedded services only) */
  embedUrl?: string;
  /** a rough height for the embed */
  height?: number;
  label: string;
}

const YT_ID = /^[\w-]{11}$/;

export function parseMediaLink(raw: string | undefined): ParsedMedia | null {
  const text = (raw ?? '').trim();
  if (!text) return null;
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  const host = u.hostname.replace(/^www\.|^m\./, '');
  const url = u.toString();

  // YouTube
  if (host === 'youtu.be' || host === 'youtube.com' || host === 'music.youtube.com' || host === 'youtube-nocookie.com') {
    let id = '';
    if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    else if (u.pathname === '/watch') id = u.searchParams.get('v') ?? '';
    else {
      const m = /^\/(?:shorts|embed|live|v)\/([\w-]{11})/.exec(u.pathname);
      if (m) id = m[1];
    }
    const list = u.searchParams.get('list');
    if (YT_ID.test(id)) {
      const start = Number(u.searchParams.get('t')?.replace(/\D/g, '') || u.searchParams.get('start') || 0);
      return {
        kind: 'youtube',
        url,
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0&enablejsapi=1${start > 0 ? `&start=${start}` : ''}`,
        height: 170,
        label: 'YouTube',
      };
    }
    if (list) {
      return { kind: 'youtube', url, embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}&playsinline=1&rel=0&enablejsapi=1`, height: 170, label: 'YouTube' };
    }
  }
  // Spotify
  if (host === 'open.spotify.com') {
    const m = /^\/(?:intl-[a-z]+\/)?(track|episode|album|playlist|show|artist)\/(\w+)/.exec(u.pathname);
    if (m) {
      const compact = m[1] === 'track' || m[1] === 'episode';
      return { kind: 'spotify', url, embedUrl: `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator`, height: compact ? 96 : 232, label: 'Spotify' };
    }
  }
  // SoundCloud
  if (host === 'soundcloud.com') {
    return { kind: 'soundcloud', url, embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&visual=false&show_comments=false`, height: 130, label: 'SoundCloud' };
  }
  // Vimeo
  if (host === 'vimeo.com') {
    const m = /^\/(\d+)/.exec(u.pathname);
    if (m) return { kind: 'vimeo', url, embedUrl: `https://player.vimeo.com/video/${m[1]}?playsinline=1`, height: 170, label: 'Vimeo' };
  }
  // direct files
  if (/\.(mp3|m4a|aac|wav|ogg|oga|flac)$/i.test(u.pathname)) return { kind: 'audio', url, label: 'Audio' };
  if (/\.(mp4|m4v|mov|webm|ogv)$/i.test(u.pathname)) return { kind: 'video', url, height: 170, label: 'Video' };
  return { kind: 'other', url, label: u.hostname.replace(/^www\./, '') };
}

/** Is `kind` one that can report "the end" back to the card? */
export function reportsEnd(kind: MediaKind): boolean {
  return kind === 'youtube' || kind === 'audio' || kind === 'video' || kind === 'spotify';
}
