import { useSettings } from '../state/SettingsContext';

/**
 * "Fotos aus dem Internet": the example photos on cards and in the image
 * picker are requests to an external service (picsum.photos), which learns
 * the person's connection and which fails without network. This is the
 * one switch for all of them — own photos (data: URLs) are never affected.
 */
export const isRemoteImage = (url: string | undefined): boolean => !!url && /^https?:\/\//i.test(url);

/** True when a remote image may be requested right now. */
export function useRemoteImagesAllowed(): boolean {
  const { settings } = useSettings();
  return settings.onlineImages !== false;
}
