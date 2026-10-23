import { MediaEmbed } from '../../features/routines/MediaEmbed';
import { parseMediaLink } from '../../features/routines/mediaLink';
import { useSettings } from '../../state/SettingsContext';

/**
 * A song, playlist or video that was saved as a link shows a little preview – inside the app, just like on a routine card.
 * Nothing is loaded from the service before the person taps "play" (privacy). Plain web links show nothing here.
 */
export function LinkPreview({ url, compact = false }: { url: string | undefined; compact?: boolean }) {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const media = parseMediaLink(url);
  if (!media || media.kind === 'other') return null;
  const isList = media.kind === 'spotify' && /\/(playlist|album|show|artist)\//.test(media.url);
  return (
    <div className="rounded-[var(--radius-lg)] p-3 flex flex-col items-center gap-1.5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} data-testid="link-preview">
      <p className="text-[12px] text-[var(--color-text-muted)] self-start" data-testid="link-preview-kind">
        ✓ {en ? `${media.label}${isList ? ' playlist / collection' : ''} recognised – preview:` : `${media.label}${isList ? '-Playlist bzw. -Sammlung' : ''} erkannt – Vorschau:`}
      </p>
      <MediaEmbed key={media.url} url={media.url} color="var(--color-primary)" onEnded={() => undefined} />
      {!compact && media.kind === 'spotify' && (
        <p className="text-[11.5px] text-[var(--color-text-faint)] text-center">{en ? 'The preview plays a short excerpt. For the whole song, open it in Spotify (you may need to log in there).' : 'Die Vorschau spielt einen kurzen Ausschnitt. Das ganze Lied öffnest du in Spotify (dort musst du eventuell angemeldet sein).'}</p>
      )}
    </div>
  );
}
