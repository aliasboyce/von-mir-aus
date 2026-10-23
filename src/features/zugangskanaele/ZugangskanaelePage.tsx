import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Trash2, ArrowRight } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { useFitFilter } from '../../state/fitFilterStore';
import { availableChannels, type ChannelLevel, type ChannelLevels } from '../../content/fitCriteria';
import { ACCESS_CHANNEL_META, ACCESS_CHANNEL_ORDER } from './accessChannels';
import { ZONE_ACCESSIBILITY } from './zoneAccessibility';
import { ChannelNet } from './ChannelNet';
import { channelSnapshotsRepo, newSnapshot, recentTension, type ChannelSnapshot } from './channelSnapshots';
import { AROUSAL_BANDS, bandForValue } from '../polyvagal/arousalBands';

const LEVEL_ORDER: ChannelLevel[] = [0, 1, 2];

function whenLabel(iso: string, lang: 'de' | 'en'): string {
  try {
    return new Date(iso).toLocaleString(lang === 'en' ? 'en-GB' : 'de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

/**
 * Zugangskanäle — "Was ist gerade vorhanden?": the former Zugangsrad idea
 * (how reachable is something right now, three honest levels, a net), now on
 * the ten Zugangskanäle that every skill, aid and Brücke already carries.
 * What is set here IS the shared "Was geht gerade?" channel filter, so the
 * rest of the app immediately shows what is doable through these channels.
 * A Zustandsaufnahme can be saved to see the net change over time.
 */
export function ZugangskanaelePage() {
  const t = useT();
  const p = t.zugangskanaele.page;
  const { settings } = useSettings();
  const lang = settings.language === 'en' ? 'en' : 'de';
  const { filter, setFilter } = useFitFilter();
  const levels: ChannelLevels = filter.levels ?? {};
  const [snapshots, setSnapshots] = useState<ChannelSnapshot[]>(() => channelSnapshotsRepo.getAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  const [note, setNote] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const tension = recentTension();
  const band = tension === null ? null : bandForValue(tension);
  const zoneName = (id: string) => {
    const b = AROUSAL_BANDS.find((x) => x.id === id);
    return b ? t.polyvagal.arousalZones[b.labelKey as keyof typeof t.polyvagal.arousalZones].label : '';
  };
  const compareSnap = snapshots.find((s) => s.id === compareId) ?? null;
  const presentCount = availableChannels(levels).length;
  const answered = Object.keys(levels).length > 0;

  function setLevel(c: (typeof ACCESS_CHANNEL_ORDER)[number], level: ChannelLevel) {
    setFilter({ levels: { ...levels, [c]: level } });
    setJustSaved(false);
  }

  function suggest() {
    if (!band) return;
    const z = ZONE_ACCESSIBILITY[band.id];
    const next: ChannelLevels = {};
    for (const c of ACCESS_CHANNEL_ORDER) next[c] = z.open.includes(c) ? 2 : 1;
    setFilter({ levels: next });
    setJustSaved(false);
  }

  function save() {
    if (!answered) return;
    const snap = newSnapshot(levels, note);
    channelSnapshotsRepo.save(snap);
    setSnapshots((prev) => [snap, ...prev]);
    setNote('');
    setJustSaved(true);
  }

  function removeSnap(id: string) {
    if (!window.confirm(p.confirmRemove)) return;
    channelSnapshotsRepo.remove(id);
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
    if (compareId === id) setCompareId(null);
  }

  const shown = showAll ? snapshots : snapshots.slice(0, 5);

  return (
    <div className="animate-in">
      <TopBar action={<HelpButton helpKey="zugangskanaele" />} />
      <div className="px-5 pb-10">
        <h1 className="text-[24px] mb-1">{p.title}</h1>
        <p className="text-[15px] text-[var(--color-text)] mb-1">{p.subtitle}</p>
        <p className="text-[12.5px] text-[var(--color-text-faint)] leading-relaxed mb-5">{p.intro}</p>

        <Card className="mb-4">
          <div className="mx-auto" style={{ maxWidth: 300 }}>
            <ChannelNet levels={levels} compare={compareSnap?.levels ?? null} />
          </div>
          <p className="text-[12px] text-center text-[var(--color-text-muted)] mt-1">
            {answered ? p.presentCount.replace('{n}', String(presentCount)) : t.fit.channelsNone}
            {compareSnap && <span className="block text-[11.5px] text-[var(--color-text-faint)]">{p.compareLegend.replace('{date}', whenLabel(compareSnap.createdAt, lang))}</span>}
          </p>
        </Card>

        <div className="mb-5">
          <button
            type="button"
            onClick={suggest}
            disabled={!band}
            className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] disabled:text-[var(--color-text-faint)]"
          >
            <Sparkles size={14} /> {p.suggest}
          </button>
          <p className="text-[11.5px] text-[var(--color-text-faint)] mt-0.5">
            {band ? p.suggestHint.replace('{zone}', zoneName(band.id)) : p.suggestNone}
          </p>
        </div>

        <div className="flex flex-col gap-2.5 mb-4">
          {ACCESS_CHANNEL_ORDER.map((c) => {
            const meta = ACCESS_CHANNEL_META[c];
            const current = levels[c];
            return (
              <Card key={c} padding="none" className="p-3.5">
                <div className="flex items-center gap-2 text-[14px] text-[var(--color-text)]">
                  <meta.icon size={16} className="text-[var(--color-primary)] flex-shrink-0" />
                  {meta.label(t)}
                </div>
                <p className="text-[11.5px] text-[var(--color-text-faint)] mb-2.5 mt-0.5">{meta.hint(t)}</p>
                <div className="flex gap-2">
                  {LEVEL_ORDER.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setLevel(c, level)}
                      aria-pressed={current === level}
                      className={[
                        'flex-1 rounded-[var(--radius-md)] py-2 text-[12px] text-center transition-colors',
                        current === level ? 'bg-[var(--color-primary)] text-[var(--color-surface)]' : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]',
                      ].join(' ')}
                    >
                      {level === 0 ? p.levelNone : level === 1 ? p.levelSome : p.levelGood}
                    </button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {answered && (
          <button type="button" onClick={() => setFilter({ levels: null })} className="text-[12.5px] text-[var(--color-primary)] mb-5">
            {p.clear}
          </button>
        )}

        {answered && presentCount === 0 && (
          <div className="rounded-[var(--radius-lg)] p-3.5 mb-4" style={{ background: 'var(--color-surface-muted)' }}>
            <p className="text-[13.5px] text-[var(--color-text)] mb-1">{p.noneAvailable}</p>
            <Link to="/sicherheit" className="text-[12.5px] text-[var(--color-primary)] underline underline-offset-2">{p.noneAvailableCta}</Link>
          </div>
        )}

        {answered && (
          <>
            <Link to="/entdecken/ressourcen">
              <Button fullWidth icon={<ArrowRight size={17} />} className="mb-1">
                {p.goResults}
              </Button>
            </Link>
            <p className="text-[11.5px] text-[var(--color-text-faint)] text-center mb-6">{p.goResultsHint}</p>

            <Card className="mb-6">
              <p className="text-[14px] font-medium text-[var(--color-text)]">{p.saveTitle}</p>
              <p className="text-[12px] text-[var(--color-text-faint)] mb-3">{p.saveHint}</p>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={p.notePlaceholder}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[14px] mb-3"
              />
              <Button size="sm" onClick={save}>
                {p.save}
              </Button>
              {justSaved && <span role="status" className="ml-3 text-[12.5px] text-[var(--color-text-muted)]">{p.saved}</span>}
            </Card>
          </>
        )}

        <h2 className="text-[16px] mb-2.5">{p.snapshotsTitle}</h2>
        {snapshots.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-faint)]">{p.snapshotsEmpty}</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {shown.map((s) => (
              <Card key={s.id} padding="none" className="p-3 flex gap-3 items-center">
                <div style={{ width: 84, flexShrink: 0 }}>
                  <ChannelNet levels={s.levels} mini />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[var(--color-text)]">
                    {whenLabel(s.createdAt, lang)}
                    {s.zoneId && <span className="text-[var(--color-text-faint)]"> · {zoneName(s.zoneId)}</span>}
                  </p>
                  <p className="text-[11.5px] text-[var(--color-text-muted)]">{p.presentCount.replace('{n}', String(availableChannels(s.levels).length))}</p>
                  {s.note && <p className="text-[12px] text-[var(--color-text-muted)] truncate">{s.note}</p>}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[12px]">
                    <button type="button" className="text-[var(--color-primary)]" onClick={() => { setFilter({ levels: { ...s.levels } }); setJustSaved(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      {p.use}
                    </button>
                    <button type="button" className="text-[var(--color-primary)]" onClick={() => setCompareId(compareId === s.id ? null : s.id)}>
                      {compareId === s.id ? p.stopCompare : p.compare}
                    </button>
                    <button type="button" aria-label={p.remove} className="text-[var(--color-text-faint)] inline-flex items-center gap-1" onClick={() => removeSnap(s.id)}>
                      <Trash2 size={12} /> {p.remove}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
            {!showAll && snapshots.length > 5 && (
              <button type="button" onClick={() => setShowAll(true)} className="text-[12.5px] text-[var(--color-primary)] text-left">
                {p.moreSnapshots} ({snapshots.length - 5})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
