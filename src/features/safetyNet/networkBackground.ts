import { createKeyValueStore } from '../../services/storage/keyValueStore';

export type NetworkBackground =
  | { type: 'default' }
  | { type: 'color'; value: string }
  | { type: 'gradient'; value: string }
  | { type: 'image'; value: string }; // data URL, same pattern as resource photos

export const NETWORK_BACKGROUND_DEFAULT: NetworkBackground = { type: 'default' };

/**
 * "Sicherheitsnetz-Hintergrund einstellbar machen"-Auftrag — a
 * standalone small store rather than a UserSettings field, since an
 * uploaded image's data URL can be sizeable and doesn't belong mixed
 * in with the rest of settings' small, simple values (same reasoning
 * the app already applies elsewhere for photo-bearing data).
 */
export const networkBackgroundStore = createKeyValueStore<NetworkBackground>(
  'network-background',
  NETWORK_BACKGROUND_DEFAULT,
);

export const NETWORK_COLOR_PRESETS = [
  '#f4efe6', '#e8f0e8', '#e6eef5', '#f5e9ec', '#efe6f5', '#f5f0e0',
];

export const NETWORK_GRADIENT_PRESETS = [
  'linear-gradient(160deg, #fde4c8 0%, #f5e9ec 100%)',
  'linear-gradient(160deg, #e6eef5 0%, #e8f0e8 100%)',
  'linear-gradient(160deg, #efe6f5 0%, #e6eef5 100%)',
  'linear-gradient(160deg, #f5f0e0 0%, #fde4c8 100%)',
];

export function cssForNetworkBackground(bg: NetworkBackground): React.CSSProperties {
  if (bg.type === 'color') return { background: bg.value };
  if (bg.type === 'gradient') return { background: bg.value };
  if (bg.type === 'image') return { backgroundImage: `url(${bg.value})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  return {};
}
