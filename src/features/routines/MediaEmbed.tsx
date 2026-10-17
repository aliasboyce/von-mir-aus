import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import { parseMediaLink } from './mediaLink';
import { useSettings } from '../../state/SettingsContext';

/**
 * Plays a card's song/video inside the app. Nothing is loaded from the service before the person taps
 * "Abspielen" (privacy: no connection to YouTube/Spotify just because a card is shown).
 * When the media reports that it has ended, `onEnded` fires – the card then shows the soft "done" state.
 */
export function MediaEmbed({ url, onEnded, color }: { url: string; onEnded: () => void; color: string }) {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const media = parseMediaLink(url);
  const [loaded, setLoaded] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const endedRef = useRef(false);
  const fireEnded = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    onEnded();
  };

  // YouTube / Spotify talk to the page through postMessage
  useEffect(() => {
    if (!loaded || !media || (media.kind !== 'youtube' && media.kind !== 'spotify')) return;
    function onMessage(e: MessageEvent) {
      if (!frameRef.current || e.source !== frameRef.current.contentWindow) return;
      let data: unknown = e.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      const d = data as { event?: string; info?: unknown; type?: string; payload?: { position?: number; duration?: number; isPaused?: boolean } };
      if (media!.kind === 'youtube') {
        if (d.event === 'onStateChange' && d.info === 0) fireEnded();
        if (d.event === 'infoDelivery' && typeof d.info === 'object' && d.info && (d.info as { playerState?: number }).playerState === 0) fireEnded();
      } else if (d.type === 'playback_update' && d.payload && d.payload.duration && d.payload.position != null) {
        if (d.payload.position >= d.payload.duration - 400) fireEnded();
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, url]);

  if (!media) return null;
  const openOutside = (
    <a href={media.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12.5px] underline underline-offset-2" style={{ color: 'inherit', opacity: 0.8 }} data-testid="routine-media-open">
      <ExternalLink size={13} /> {en ? `Open in ${media.label}` : `In ${media.label} öffnen`}
    </a>
  );

  if (media.kind === 'other') {
    return (
      <div className="flex flex-col items-center gap-1" data-nodrag data-testid="routine-media">
        <a href={media.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[14px] font-medium text-white" style={{ background: color }} data-testid="routine-media-open">
          <ExternalLink size={15} /> {en ? 'Open link' : 'Link öffnen'} · {media.label}
        </a>
        <p className="text-[11.5px] opacity-70">{en ? 'The timer keeps running. Come back when you are done.' : 'Der Timer läuft weiter. Komm zurück, wenn du fertig bist.'}</p>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="flex flex-col items-center gap-1.5" data-nodrag data-testid="routine-media">
        <button type="button" onClick={() => setLoaded(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[14.5px] font-medium text-white shadow-md" style={{ background: color }} data-testid="routine-media-play">
          <Play size={16} fill="currentColor" /> {media.kind === 'audio' || media.kind === 'spotify' || media.kind === 'soundcloud' ? (en ? 'Play music' : 'Musik abspielen') : en ? 'Play video' : 'Video abspielen'}
        </button>
        <p className="text-[11px] opacity-65">{media.embedUrl ? (en ? `Loads from ${media.label} only when you tap` : `Lädt erst beim Tippen von ${media.label}`) : ''}</p>
        {openOutside}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-1.5" data-nodrag data-testid="routine-media">
      {media.kind === 'audio' ? (
        <audio src={media.url} controls autoPlay onEnded={fireEnded} className="w-full max-w-[300px]" />
      ) : media.kind === 'video' ? (
        <video src={media.url} controls autoPlay playsInline onEnded={fireEnded} className="w-full max-w-[300px] rounded-2xl" style={{ maxHeight: media.height }} />
      ) : (
        <iframe
          ref={frameRef}
          src={media.embedUrl}
          title={media.label}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="w-full max-w-[300px] rounded-2xl border-0"
          style={{ height: media.height }}
          onLoad={() => {
            if (media.kind === 'youtube') {
              const w = frameRef.current?.contentWindow;
              w?.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*');
              w?.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'], id: 1, channel: 'widget' }), '*');
            }
          }}
        />
      )}
      {openOutside}
    </div>
  );
}
