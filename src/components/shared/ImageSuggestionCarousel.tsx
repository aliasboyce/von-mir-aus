import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageSuggestionCarouselProps {
  images: string[];
  selected?: string;
  onSelect: (url: string) => void;
  ariaLabel: string;
  /** rendered as one more flex-shrink-0 item at the end of the same
   * scrollable row — e.g. a "no image" / clear button — so callers that
   * need one don't have to build a second, separate scroll region. */
  trailingContent?: React.ReactNode;
}

/**
 * Fixes a real bug, not just a cosmetic one: the previous version used
 * a hidden scrollbar (no-scrollbar) on an overflow-x-auto row. That's
 * invisible on desktop with no obvious way to grab and drag it, and a
 * normal vertical mouse wheel doesn't scroll a horizontal region at
 * all — so with more than ~4 suggestions, everything past the visible
 * edge was effectively unreachable with a mouse. Touch/swipe on mobile
 * technically still worked, but with zero visual hint that more images
 * existed off-screen.
 *
 * Fix: a real (visible) scrollbar plus explicit left/right arrow
 * buttons that scroll the row programmatically — works with mouse,
 * touch, and keyboard-focused buttons alike, and the arrows make "there
 * is more here" obvious without anyone having to discover it by
 * accident.
 */
export function ImageSuggestionCarousel({ images, selected, onSelect, ariaLabel, trailingContent }: ImageSuggestionCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollBy(amount: number) {
    scrollerRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  }

  if (images.length === 0 && !trailingContent) return null;

  return (
    <div className="relative">
      {images.length > 4 && (
        <button
          type="button"
          onClick={() => scrollBy(-160)}
          aria-label="←"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center text-[var(--color-text-muted)]"
        >
          <ChevronLeft size={15} />
        </button>
      )}
      <div
        ref={scrollerRef}
        className="flex gap-2 overflow-x-auto py-1"
        style={{ paddingLeft: images.length > 4 ? 34 : 4, paddingRight: images.length > 4 ? 34 : 4 }}
        role="group"
        aria-label={ariaLabel}
      >
        {images.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => onSelect(url)}
            className="w-16 h-16 rounded-[var(--radius-md)] bg-cover bg-center bg-[var(--color-surface-muted)] flex-shrink-0"
            style={{
              backgroundImage: `url("${url}")`,
              outline: selected === url ? '2.5px solid var(--color-primary)' : 'none',
              outlineOffset: 2,
            }}
            aria-label={ariaLabel}
          />
        ))}
        {trailingContent}
      </div>
      {images.length > 4 && (
        <button
          type="button"
          onClick={() => scrollBy(160)}
          aria-label="→"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center text-[var(--color-text-muted)]"
        >
          <ChevronRight size={15} />
        </button>
      )}
    </div>
  );
}
