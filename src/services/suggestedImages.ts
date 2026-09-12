/**
 * Thin wrapper around imageSuggestionLibrary.ts's real, keyword-matched
 * photo suggestions (Lorem Picsum, picsum.photos — genuine
 * photographs, not icons/symbols/emoji). Kept as a separate file so
 * the public suggestedImageOptions/suggestedImage API stays stable for
 * every existing call site, even if the underlying photo source
 * changes again in the future.
 */
import { suggestImagesFor } from '../components/shared/imageSuggestionLibrary';

export function suggestedImageOptions(title: string, category: string, count = 18): string[] {
  const options = suggestImagesFor(title, category);
  return options.slice(0, count);
}

export function suggestedImage(title: string, category: string): string {
  return suggestedImageOptions(title, category, 1)[0];
}
