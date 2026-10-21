import { useNavigate } from 'react-router-dom';
import { EyeOff } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';
import { coverNow, getLockConfig, lockNow } from '../../services/appLock';

/** A small, calm button: one tap hides the app behind a neutral screen and returns to the start page underneath. */
export function QuickExit({ above }: { above: boolean }) {
  const { settings } = useSettings();
  const navigate = useNavigate();
  if (!settings.quickExit) return null;
  const label = settings.language === 'en' ? 'Hide now' : 'Schnell weg';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      data-testid="quick-exit"
      onClick={() => {
        navigate('/', { replace: true });
        if (getLockConfig()) lockNow();
        else coverNow();
      }}
      className="fixed left-3 z-[120] w-10 h-10 rounded-full flex items-center justify-center no-print"
      style={{ bottom: above ? 'calc(var(--nav-height) + env(safe-area-inset-bottom) + 12px)' : 'calc(16px + env(safe-area-inset-bottom))', background: 'color-mix(in srgb, var(--color-surface) 85%, transparent)', border: '1px solid var(--color-border-strong)', color: 'var(--color-text-muted)' }}
    >
      <EyeOff size={18} />
    </button>
  );
}
