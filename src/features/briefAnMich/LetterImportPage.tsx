import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/navigation/TopBar';
import { useT } from '../../i18n';
import { pendingLetterStore } from './lettersRepo';
import { decodeLetter, type SharedLetterPayload } from './letterShare';
import { LetterPreview, LetterReceivePanel } from './LetterReceive';
import { goBack } from '../../services/navigation';

/** Route /brief/importieren?d=… — opened by tapping a letter link. */
export function LetterImportPage() {
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [payload, setPayload] = useState<SharedLetterPayload | null>(null);
  const [failed, setFailed] = useState(false);
  const token = params.get('d');

  useEffect(() => {
    let alive = true;
    if (!token) { setFailed(true); return; }
    decodeLetter(token).then((p) => { if (!alive) return; if (p) setPayload(p); else { setFailed(true); pendingLetterStore.set(null); } });
    return () => { alive = false; };
  }, [token]);

  return (
    <div className="animate-in">
      <TopBar onBack={() => goBack(navigate)} />
      <div className="px-5 pb-8">
        <h1 className="text-[24px] mb-4">{t.briefAnMich.receiveTitle}</h1>
        {payload && <LetterPreview payload={payload} showIosHint />}
        {failed && <LetterReceivePanel onClose={() => navigate('/entdecken/brief-an-mich')} />}
      </div>
    </div>
  );
}
