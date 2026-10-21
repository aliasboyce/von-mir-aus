import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BrowserTabNotice } from '../../components/shared/BrowserTabNotice';
import { useSettings } from '../../state/SettingsContext';
import { MindmapDrawing } from './MindmapScene';
import { decodeMap, mapFromPayload, mindmapRepo, validatePayload, type SharedMapPayload } from './mindmapModel';
import { mindmapTexts } from './mindmapTexts';

/** Receiving a mind map: the whole map travels inside the link (or a file) – nothing is uploaded anywhere. */
export function MindmapImportPage() {
  const { settings } = useSettings();
  const lang = settings.language === 'en' ? 'en' : 'de';
  const T = mindmapTexts(lang);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [payload, setPayload] = useState<SharedMapPayload | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'invalid'>('loading');
  const [savedId, setSavedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const d = params.get('d');
    if (!d) {
      setState('invalid');
      return;
    }
    void decodeMap(decodeURIComponent(d)).then((p) => {
      setPayload(p);
      setState(p ? 'ok' : 'invalid');
    });
  }, [params]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const p = validatePayload(JSON.parse(await file.text()));
      setPayload(p);
      setState(p ? 'ok' : 'invalid');
    } catch {
      setState('invalid');
    }
  }
  function accept() {
    if (!payload) return;
    const m = mapFromPayload(payload);
    mindmapRepo.save(m);
    setSavedId(m.id);
  }

  return (
    <div className="animate-in">
      <TopBar />
      <div className="px-5 pb-8">
        <BrowserTabNotice />
        <h1 className="text-[22px] mb-3">{T.importTitle}</h1>
        {state === 'loading' && <p className="text-[14px] text-[var(--color-text-muted)]">…</p>}
        {state === 'invalid' && (
          <div data-testid="mindmap-import-invalid">
            <p className="text-[14px] text-[var(--color-text-muted)] mb-4">{T.importInvalid}</p>
          </div>
        )}
        {state === 'ok' && payload && !savedId && (
          <>
            <p className="text-[14px] text-[var(--color-text-muted)] mb-3">{T.importWho.replace('{who}', payload.from || T.importSomeone)}</p>
            <Card padding="none" className="overflow-hidden mb-4">
              <div style={{ background: '#fff', maxHeight: 260 }}>
                <MindmapDrawing map={{ nodes: payload.nodes, edges: payload.edges, bg: payload.bg }} maxHeight="260px" />
              </div>
              <div className="p-3">
                <p className="text-[15px] text-[var(--color-text)]">{payload.title}</p>
                <p className="text-[12px] text-[var(--color-text-faint)]">{T.elements.replace('{n}', String(payload.nodes.length))}</p>
              </div>
            </Card>
            <Button fullWidth onClick={accept} data-testid="mindmap-import-accept">{T.importAccept}</Button>
          </>
        )}
        {savedId && (
          <div className="flex flex-col items-center text-center gap-4 py-8" data-testid="mindmap-import-saved">
            <Check size={40} className="text-[var(--color-primary)]" />
            <p className="text-[15px] text-[var(--color-text)] max-w-[300px]">{T.importSaved}</p>
            <Button onClick={() => navigate(`/entdecken/mindmap/${savedId}`, { replace: true })}>{T.importOpen}</Button>
          </div>
        )}
        {!savedId && (
          <>
            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} data-testid="mindmap-import-file" />
            <button type="button" onClick={() => fileRef.current?.click()} className="mt-5 text-[13.5px] text-[var(--color-primary)] underline underline-offset-2">{T.importFile}</button>
          </>
        )}
      </div>
    </div>
  );
}
