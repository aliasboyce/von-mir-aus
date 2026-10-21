import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CompanionDock } from '../../components/companion/CompanionDock';
import { GroundingOverlay } from '../../components/companion/GroundingOverlay';
import { SkyAmbiance } from '../../components/shared/SkyAmbiance';
import { useSettings } from '../../state/SettingsContext';

/**
 * "Nur jetzt" — the whole app reduced to a handful of large, quiet doors. No Postfach, no contacts
 * strip, no explainers, no lists: just what is needed right now. Skills, Ressourcen and Brücken
 * stay usable, each as one small suggestion at a time (see NurJetztListPage).
 */
export function NurJetztHome() {
  const { settings, updateSettings } = useSettings();
  const en = settings.language === 'en';
  const [groundingOpen, setGroundingOpen] = useState(false);

  const doors: { key: string; emoji: string; label: string; to?: string; onClick?: () => void }[] = [
    { key: 'orient', emoji: '🧭', label: en ? 'Orient myself' : 'Mich orientieren', onClick: () => setGroundingOpen(true) },
    { key: 'checkin', emoji: '⛅', label: en ? 'Check in' : 'Einchecken', to: '/inneres-wetter' },
    { key: 'skill', emoji: '🧰', label: en ? 'One small skill' : 'Ein kleiner Skill', to: '/nur-jetzt/skills' },
    { key: 'res', emoji: '🪴', label: en ? 'Something of mine' : 'Etwas von mir', to: '/nur-jetzt/ressourcen' },
    { key: 'bridge', emoji: '🌉', label: en ? 'One small bridge' : 'Eine kleine Brücke', to: '/nur-jetzt/bruecken' },
    { key: 'help', emoji: '🛟', label: en ? 'I need help' : 'Ich brauche Hilfe', to: '/krisenmodus' },
  ];

  const cls = 'w-full flex items-center gap-4 px-5 py-4 rounded-[var(--radius-xl)] text-left text-[18px] text-[var(--color-text)]';
  const style = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' } as const;

  return (
    <div className="px-5 pt-10 pb-8 animate-in relative" data-testid="nur-jetzt-home">
      <SkyAmbiance />
      <div className="flex flex-col items-center mb-6">
        <CompanionDock variant="hero" />
        <p className="text-[15px] text-[var(--color-text-muted)] mt-3">{en ? 'Only now. Nothing else.' : 'Nur jetzt. Sonst nichts.'}</p>
      </div>
      <div className="flex flex-col gap-3">
        {doors.map((d) =>
          d.to ? (
            <Link key={d.key} to={d.to} className={cls} style={style}>
              <span className="text-[26px]" aria-hidden="true">{d.emoji}</span>
              {d.label}
            </Link>
          ) : (
            <button key={d.key} type="button" onClick={d.onClick} className={cls} style={style}>
              <span className="text-[26px]" aria-hidden="true">{d.emoji}</span>
              {d.label}
            </button>
          ),
        )}
      </div>
      <div className="flex flex-col items-center gap-1 mt-8">
        <Link to="/zugang" className="text-[13px] text-[var(--color-text-faint)] underline underline-offset-2">
          {en ? 'More thoroughly: Access' : 'Ausführlicher: Zugang'}
        </Link>
        <button type="button" onClick={() => updateSettings({ nurJetztMode: false })} className="text-[13px] text-[var(--color-text-faint)] underline underline-offset-2 mt-2" data-testid="nur-jetzt-exit">
          {en ? 'End "Only now"' : '„Nur jetzt“ beenden'}
        </button>
      </div>
      {groundingOpen && <GroundingOverlay onClose={() => setGroundingOpen(false)} />}
    </div>
  );
}
