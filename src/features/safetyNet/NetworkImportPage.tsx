import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { useT } from '../../i18n';
import { networkRepo } from './networkRepo';
import { createId } from '../../services/storage/repository';

interface SharedContactPayload {
  name: string;
  role?: string;
  description?: string;
  helpsWith?: string[];
}

/**
 * Same approach as ResourceImportPage.tsx/BridgeImportPage.tsx — no
 * backend, the shared contact's data travels entirely inside the link
 * itself. Deliberately excludes phone/email/photo: sharing someone
 * else's contact details (not just your own note about them) inside a
 * URL that could end up anywhere is a real privacy question, so the
 * recipient gets the name/role/description/helps-with and adds
 * contact details themselves if they want them, exactly like they
 * would for any new safety-net entry.
 */
export function NetworkImportPage() {
  const t = useT();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [saved, setSaved] = useState(false);

  const payload = useMemo<SharedContactPayload | null>(() => {
    const raw = searchParams.get('data');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      if (typeof parsed.name !== 'string') return null;
      return parsed;
    } catch {
      return null;
    }
  }, [searchParams]);

  function accept() {
    if (!payload) return;
    const now = new Date().toISOString();
    networkRepo.save({
      id: createId('net'),
      name: payload.name,
      category: 'person',
      role: payload.role,
      description: payload.description,
      helpsWith: payload.helpsWith ?? [],
      createdAt: now,
      updatedAt: now,
    });
    setSaved(true);
  }

  return (
    <div className="animate-in">
      <TopBar />
      <div className="px-5 pb-6">
        {!payload ? (
          <EmptyState title={t.network.importInvalid} />
        ) : saved ? (
          <div className="flex flex-col items-center text-center gap-4 py-10">
            <Check size={40} className="text-[var(--color-primary)]" />
            <p className="text-[16px] text-[var(--color-text)]">{t.network.importSaved}</p>
            <Button onClick={() => navigate('/sicherheit/netzwerk')}>{t.nav.safety}</Button>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-5">
              <InlineCompanionNote />
              <p className="text-[14px] text-[var(--color-text)] flex-1">{t.network.importIntro}</p>
            </div>
            <Card className="mb-5">
              <p className="text-[17px] text-[var(--color-text)] mb-1">{payload.name}</p>
              {payload.role && <p className="text-[13px] text-[var(--color-text-faint)] mb-2">{payload.role}</p>}
              {payload.description && (
                <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed">{payload.description}</p>
              )}
            </Card>
            <Button fullWidth onClick={accept}>
              {t.network.importAccept}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
