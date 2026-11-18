import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MessageCircleHeart } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { useL } from '../projects/useL';
import { QuickHelpModal } from '../safetyPlan/QuickHelpModal';
import { StatusPanel } from './StatusPanel';
import { commCardsRepo } from './commCardsRepo';

function Tile({ emoji, title, text, onClick, testId }: { emoji: string; title: string; text: string; onClick: () => void; testId: string }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 text-left rounded-2xl p-4 border border-[var(--color-border-strong)] bg-[var(--color-surface)] min-h-[84px]" data-testid={testId}>
      <span className="text-[34px] leading-none flex-shrink-0" aria-hidden="true">{emoji}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-[17px] font-medium text-[var(--color-text)]">{title}</span>
        <span className="block text-[13.5px] text-[var(--color-text-muted)] leading-snug mt-0.5">{text}</span>
      </span>
      <ChevronRight size={20} className="text-[var(--color-text-faint)] flex-shrink-0" />
    </button>
  );
}

/** „Nonverbale Kommunikation“ (früher „Schnell Hilfe holen“): zwei ruhige Wege, wenn Sprechen gerade nicht geht. */
export function NonverbalHubPage() {
  const { L } = useL();
  const navigate = useNavigate();
  const n = commCardsRepo.getAll().length;
  return (
    <div className="pb-24">
      <TopBar />
      <div className="px-5">
        <h1 className="text-[24px] font-medium text-[var(--color-text)] mb-1.5">{L('Nonverbale Kommunikation', 'Non-verbal communication')}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed mb-5">{L('Für Momente, in denen Sprechen oder Schreiben nicht geht. Du musst nichts erklären – es ist alles vorbereitet.', 'For moments when speaking or writing is not possible. You do not have to explain anything – it is all prepared.')}</p>
        <div className="flex flex-col gap-3">
          <Tile emoji="📨" title={L('Automatische Status-Weitergabe', 'Automatic status sharing')} text={L('Vorformulierte Nachrichten an Vertraute – ein Tipp, und sie sind versandfertig.', 'Prepared messages for trusted people – one tap and they are ready to send.')} onClick={() => navigate('/sicherheit/nonverbal/status')} testId="nv-status" />
          <Tile emoji="🪧" title={L('Kommunikationskarten', 'Communication cards')} text={L(`Karten zum Zeigen, die den ganzen Bildschirm füllen. ${n} vorhanden.`, `Cards to show that fill the whole screen. ${n} so far.`)} onClick={() => navigate('/sicherheit/nonverbal/karten')} testId="nv-cards" />
        </div>
      </div>
    </div>
  );
}

export function StatusPage() {
  const { L } = useL();
  const [quick, setQuick] = useState(false);
  return (
    <div className="pb-24">
      <TopBar />
      <div className="px-5">
        <h1 className="text-[24px] font-medium text-[var(--color-text)] mb-1.5">{L('Status-Weitergabe', 'Status sharing')}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed mb-5">
          {L('Wähle eine Karte, tippe auf „Senden“ – die Nachricht ist fertig vorbereitet. Gesendet wird erst, wenn du in WhatsApp oder SMS selbst auf Senden tippst; die App schickt nie von allein etwas ab.', 'Pick a card and tap “Send” – the message is prepared. It is only sent when you tap send in WhatsApp or SMS yourself; the app never sends anything on its own.')}
        </p>
        <StatusPanel />
        <button onClick={() => setQuick(true)} className="w-full flex items-center gap-3 mt-5 rounded-2xl p-4 border border-[var(--color-border)] text-left" data-testid="status-quick">
          <MessageCircleHeart size={22} className="text-[var(--color-primary)] flex-shrink-0" />
          <span className="flex-1">
            <span className="block text-[15px] font-medium text-[var(--color-text)]">{L('Hilfe-Nachricht (kurz · deutlich · dringend)', 'Help message (short · clear · urgent)')}</span>
            <span className="block text-[12.5px] text-[var(--color-text-muted)]">{L('Die bisherige „Schnell Hilfe holen“-Nachricht.', 'The former “Get help quickly” message.')}</span>
          </span>
        </button>
      </div>
      <QuickHelpModal open={quick} onClose={() => setQuick(false)} />
    </div>
  );
}
