import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';
import { resourcesRepo } from '../../features/resources/resourcesRepo';

/**
 * What follows Orientierung — especially in the Krisenmodus. The order is
 * fixed and always the same:
 *   1. körperliche Sicherheit (first, always) — with questions and
 *      suggestions, also about Reize (stimuli)
 *   2. bemerken        — notice, change nothing
 *   3. benennen        — put it into words (a bridge to the language
 *                        areas, Broca) …
 *      stoppen         — … and then stop for a moment
 *   4. somatischer Reiz — one bodily stimulus that anchors in the here
 *                        and now
 * Everything is optional, nothing is typed into storage — like Orientierung
 * itself, it leaves no trace, and "Das hilft gerade nicht" is always there.
 */

type Phase = 'safety' | 'notice' | 'name' | 'stop' | 'soma';
const ORDER: Phase[] = ['safety', 'notice', 'name', 'stop', 'soma'];

interface L { de: string; en: string }

const SAFE_ANSWERS: { id: 'yes' | 'no' | 'unsure'; label: L }[] = [
  { id: 'yes', label: { de: 'Ja, ich glaube schon', en: 'Yes, I think so' } },
  { id: 'no', label: { de: 'Nicht ganz', en: 'Not quite' } },
  { id: 'unsure', label: { de: 'Ich weiß es nicht', en: "I don't know" } },
];

const SAFETY_IDEAS: L[] = [
  { de: 'Wenn du kannst: geh an einen Ort, an dem dich niemand bedrängt – oder schließ eine Tür hinter dir.', en: 'If you can: go somewhere nobody pushes you – or close a door behind you.' },
  { de: 'Such dir eine stabile Position: Rücken an eine Wand oder Lehne, Füße flach auf den Boden.', en: 'Find a stable position: back against a wall or backrest, feet flat on the floor.' },
  { de: 'Wenn dir kalt ist: eine Decke oder Jacke. Wenn dir schwindelig ist: setz oder leg dich hin.', en: 'If you are cold: a blanket or jacket. If you feel dizzy: sit or lie down.' },
  { de: 'Wenn du dir etwas antun könntest oder jemand in Gefahr ist: Notruf 112 – oder ein Mensch aus deinem Sicherheitsnetz.', en: 'If you might hurt yourself or someone is in danger: emergency 112 – or someone from your safety network.' },
];

const STIMULI: { id: string; label: L; ideas: L[] }[] = [
  { id: 'noise', label: { de: 'Lärm', en: 'Noise' }, ideas: [{ de: 'Ohrstöpsel oder Kopfhörer, in einen leiseren Raum, die Hände sanft auf die Ohren.', en: 'Earplugs or headphones, a quieter room, hands gently over your ears.' }] },
  { id: 'light', label: { de: 'Helles Licht', en: 'Bright light' }, ideas: [{ de: 'Licht dimmen oder ausschalten, Augen schließen, Kapuze oder Sonnenbrille.', en: 'Dim or switch off the light, close your eyes, hood or sunglasses.' }] },
  { id: 'smell', label: { de: 'Gerüche', en: 'Smells' }, ideas: [{ de: 'Fenster öffnen, an die frische Luft, oder an etwas riechen, das dir vertraut ist.', en: 'Open a window, get fresh air, or smell something familiar.' }] },
  { id: 'touch', label: { de: 'Berührung / Nähe', en: 'Touch / closeness' }, ideas: [{ de: 'Mehr Abstand schaffen, die Arme vor dir verschränken, dir Raum nehmen – du darfst „Stopp“ sagen.', en: 'Create more distance, cross your arms, take space – you may say "stop".' }] },
  { id: 'people', label: { de: 'Viele Menschen', en: 'Many people' }, ideas: [{ de: 'Eine Ecke oder einen Rand suchen, den Rücken frei haben, kurz allein sein.', en: 'Find a corner or an edge, keep your back free, be alone for a moment.' }] },
  { id: 'screen', label: { de: 'Handy / Bildschirm', en: 'Phone / screen' }, ideas: [{ de: 'Handy umdrehen oder weglegen, Benachrichtigungen aus, Bildschirm aus.', en: 'Turn the phone over or put it away, notifications off, screen off.' }] },
  { id: 'temp', label: { de: 'Kälte / Hitze', en: 'Cold / heat' }, ideas: [{ de: 'Zu kalt: Decke, warmer Tee. Zu heiß: Fenster auf, Jacke aus, kühles (nicht eiskaltes) Wasser über die Handgelenke.', en: 'Too cold: blanket, warm tea. Too hot: open a window, jacket off, cool (not icy) water over your wrists.' }] },
  { id: 'body', label: { de: 'Hunger / Durst', en: 'Hunger / thirst' }, ideas: [{ de: 'Ein Glas Wasser, ein paar Schlucke. Etwas Kleines essen, wenn es geht.', en: 'A glass of water, a few sips. Something small to eat if you can.' }] },
];

const PLACES: L[] = [
  { de: 'Kopf', en: 'Head' }, { de: 'Hals / Kehle', en: 'Throat' }, { de: 'Brust', en: 'Chest' }, { de: 'Bauch', en: 'Belly' },
  { de: 'Rücken', en: 'Back' }, { de: 'Arme / Hände', en: 'Arms / hands' }, { de: 'Beine / Füße', en: 'Legs / feet' },
  { de: 'ganzer Körper', en: 'whole body' }, { de: 'ich spüre kaum etwas', en: 'I hardly feel anything' },
];

const STARTERS: L[] = [
  { de: 'Da ist …', en: 'There is …' },
  { de: 'In meinem Körper ist …', en: 'In my body there is …' },
  { de: 'Das fühlt sich an wie …', en: 'It feels like …' },
  { de: 'Ich bin gerade …', en: 'Right now I am …' },
  { de: 'Ich merke …', en: 'I notice …' },
];

const SOMA: { id: string; label: L; how: L; kind: 'calm' | 'wake' }[] = [
  { id: 'press', kind: 'calm', label: { de: 'Druck', en: 'Pressure' }, how: { de: 'Drück die Handflächen 5 Sekunden fest gegeneinander. Dann loslassen und nachspüren.', en: 'Press your palms firmly together for 5 seconds. Then let go and notice.' } },
  { id: 'warm', kind: 'calm', label: { de: 'Wärme', en: 'Warmth' }, how: { de: 'Hände um eine warme Tasse legen oder die Hände aneinander reiben und auf Brust oder Bauch legen.', en: 'Wrap your hands around a warm cup, or rub them together and rest them on chest or belly.' } },
  { id: 'wall', kind: 'calm', label: { de: 'Halt', en: 'Support' }, how: { de: 'Lehn den Rücken gegen eine Wand oder drück die Füße fest in den Boden – dem Körper Halt geben.', en: 'Lean your back against a wall or press your feet into the floor – give your body something to rest on.' } },
  { id: 'hum', kind: 'calm', label: { de: 'Summen', en: 'Humming' }, how: { de: 'Summ einen tiefen, langen Ton beim Ausatmen und spür die Vibration in Brust und Hals.', en: 'Hum a low, long note on the out-breath and feel the vibration in chest and throat.' } },
  { id: 'cool', kind: 'wake', label: { de: 'Kühle', en: 'Coolness' }, how: { de: 'Kühles (nicht eiskaltes) Wasser über Handgelenke oder Gesicht, oder die Hände an eine kühle Fläche legen.', en: 'Cool (not icy) water over wrists or face, or put your hands on a cool surface.' } },
  { id: 'stomp', kind: 'wake', label: { de: 'Stampfen', en: 'Stomping' }, how: { de: 'Stampf abwechselnd mit den Füßen auf den Boden – 10 Mal, spür den Aufprall.', en: 'Stomp alternately on the floor – 10 times, feel the impact.' } },
  { id: 'move', kind: 'wake', label: { de: 'Bewegung', en: 'Movement' }, how: { de: 'Schultern kreisen, die Arme ausschütteln, aufstehen und dich strecken.', en: 'Roll your shoulders, shake out your arms, stand up and stretch.' } },
  { id: 'hold', kind: 'wake', label: { de: 'Etwas halten', en: 'Hold something' }, how: { de: 'Nimm einen Gegenstand mit Gewicht oder Struktur in die Hand und spür Gewicht, Kanten, Oberfläche.', en: 'Take an object with weight or texture in your hand and feel its weight, edges, surface.' } },
];

export function AfterGrounding({ onClose }: { onClose: () => void }) {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const tx = (l: L) => (en ? l.en : l.de);
  const [phase, setPhase] = useState<Phase>('safety');
  const [safe, setSafe] = useState<'yes' | 'no' | 'unsure' | null>(null);
  const [stimuli, setStimuli] = useState<string[]>([]);
  const [places, setPlaces] = useState<string[]>([]);
  const [naming, setNaming] = useState('');
  const [soma, setSoma] = useState<string | null>(null);

  const own = useMemo(
    () => resourcesRepo.getAll().filter((r) => r.favorite && ['haptisch', 'komfort', 'motorisch', 'olfaktorisch', 'auditiv'].includes(r.category)).slice(0, 4),
    [],
  );

  const idx = ORDER.indexOf(phase);
  const next = () => setPhase(ORDER[Math.min(idx + 1, ORDER.length - 1)]);
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const chip = (active: boolean) => ({
    background: active ? 'var(--color-primary)' : 'var(--color-surface-muted)',
    color: active ? 'var(--color-surface)' : 'var(--color-text)',
  });

  const title: Record<Phase, L> = {
    safety: { de: '1 · Körperliche Sicherheit', en: '1 · Physical safety' },
    notice: { de: '2 · Bemerken', en: '2 · Notice' },
    name: { de: '3 · Benennen', en: '3 · Name it' },
    stop: { de: 'Stopp', en: 'Stop' },
    soma: { de: '4 · Ein körperlicher Reiz', en: '4 · A bodily stimulus' },
  };

  return (
    <div className="w-full max-w-[330px] flex flex-col items-stretch mt-6" data-testid="after-grounding">
      <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] text-center mb-2">{tx(title[phase])}</p>

      {phase === 'safety' && (
        <>
          <p className="text-[17px] text-[var(--color-text)] leading-relaxed text-center mb-1">{tx({ de: 'Bist du gerade körperlich sicher?', en: 'Are you physically safe right now?' })}</p>
          <p className="text-[12.5px] text-[var(--color-text-faint)] text-center mb-4">{tx({ de: 'Das kommt immer zuerst. Antworte, wie es sich gerade stimmt.', en: 'This always comes first. Answer however it is true right now.' })}</p>
          <div className="flex flex-col gap-2 mb-4">
            {SAFE_ANSWERS.map((a) => (
              <button key={a.id} onClick={() => setSafe(a.id)} aria-pressed={safe === a.id} className="px-4 py-3 rounded-[var(--radius-lg)] text-[14.5px] text-left" style={chip(safe === a.id)}>
                {tx(a.label)}
              </button>
            ))}
          </div>
          {(safe === 'no' || safe === 'unsure') && (
            <div className="rounded-[var(--radius-lg)] p-3.5 mb-4 animate-in" style={{ background: 'var(--color-primary-soft)' }}>
              <p className="text-[13px] text-[var(--color-text)] mb-2">{safe === 'no' ? tx({ de: 'Das geht vor allem anderen. Vielleicht hilft eins davon:', en: 'This comes before everything else. Maybe one of these helps:' }) : tx({ de: 'Dann schauen wir kurz gemeinsam hin. Vielleicht hilft eins davon:', en: "Then let's look briefly together. Maybe one of these helps:" })}</p>
              <ul className="flex flex-col gap-1.5">
                {SAFETY_IDEAS.map((i) => <li key={i.de} className="text-[13px] text-[var(--color-text)] leading-snug">• {tx(i)}</li>)}
              </ul>
              <Link to="/sicherheit" onClick={onClose} className="inline-block mt-2.5 text-[12.5px] text-[var(--color-primary)] underline underline-offset-2">
                {tx({ de: 'Zum Sicherheitsbereich', en: 'To the safety area' })}
              </Link>
            </div>
          )}
          <p className="text-[14px] text-[var(--color-text)] mb-1">{tx({ de: 'Gibt es gerade Reize, die zu viel sind?', en: 'Are there stimuli right now that are too much?' })}</p>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-2">{tx({ de: 'Tipp an, was auf dich zutrifft – oder nichts davon.', en: 'Tap what applies – or none of them.' })}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {STIMULI.map((s) => (
              <button key={s.id} onClick={() => toggle(stimuli, setStimuli, s.id)} aria-pressed={stimuli.includes(s.id)} className="px-3.5 py-2 rounded-full text-[13.5px]" style={chip(stimuli.includes(s.id))}>
                {tx(s.label)}
              </button>
            ))}
          </div>
          {STIMULI.filter((s) => stimuli.includes(s.id)).map((s) => (
            <p key={s.id} className="text-[13px] text-[var(--color-text)] leading-snug mb-2 animate-in"><span className="text-[var(--color-text-faint)]">{tx(s.label)}: </span>{tx(s.ideas[0])}</p>
          ))}
        </>
      )}

      {phase === 'notice' && (
        <>
          <p className="text-[17px] text-[var(--color-text)] leading-relaxed text-center mb-1">{tx({ de: 'Nur bemerken. Du musst nichts ändern.', en: 'Just notice. You do not have to change anything.' })}</p>
          <p className="text-[12.5px] text-[var(--color-text-faint)] text-center mb-4">{tx({ de: 'Wo in deinem Körper ist gerade am meisten los – oder am wenigsten?', en: 'Where in your body is the most going on right now – or the least?' })}</p>
          <div className="flex flex-wrap gap-2 justify-center mb-3">
            {PLACES.map((p) => (
              <button key={p.de} onClick={() => toggle(places, setPlaces, p.de)} aria-pressed={places.includes(p.de)} className="px-3.5 py-2 rounded-full text-[13.5px]" style={chip(places.includes(p.de))}>
                {tx(p)}
              </button>
            ))}
          </div>
          {places.length > 0 && <p className="text-[13px] text-[var(--color-text-muted)] text-center leading-relaxed animate-in">{tx({ de: 'Gut. Bleib einen Atemzug lang dort – nur bemerken, ohne es wegzumachen.', en: 'Good. Stay there for one breath – just notice, without making it go away.' })}</p>}
        </>
      )}

      {phase === 'name' && (
        <>
          <p className="text-[17px] text-[var(--color-text)] leading-relaxed text-center mb-1">{tx({ de: 'Gib dem, was du bemerkst, einen Namen.', en: 'Give what you notice a name.' })}</p>
          <p className="text-[12.5px] text-[var(--color-text-faint)] text-center mb-4">{tx({ de: 'Ein Wort oder ein kurzer Satz reicht. Sprache zu finden holt den Teil von dir zurück, der ordnen kann – das Sprachzentrum (Broca-Areal) beruhigt die Alarmzentrale. „Keine Ahnung“ zählt auch.', en: 'One word or a short sentence is enough. Finding language brings back the part of you that can sort things – the speech area (Broca) calms the alarm centre. "No idea" counts too.' })}</p>
          <div className="flex flex-wrap gap-2 justify-center mb-3">
            {STARTERS.map((s) => (
              <button key={s.de} onClick={() => setNaming(tx(s))} className="px-3 py-1.5 rounded-full text-[13px]" style={chip(naming === tx(s))}>
                {tx(s)}
              </button>
            ))}
          </div>
          <input className="input text-center" value={naming} onChange={(e) => setNaming(e.target.value)} placeholder={tx({ de: 'Da ist …', en: 'There is …' })} aria-label={tx({ de: 'Benennen', en: 'Name it' })} />
          <p className="text-[11px] text-[var(--color-text-faint)] text-center mt-2">{tx({ de: 'Wird nicht gespeichert.', en: 'Not saved.' })}</p>
        </>
      )}

      {phase === 'stop' && (
        <div className="text-center py-6">
          <p className="text-[34px] text-[var(--color-text)] mb-3">{tx({ de: 'Stopp.', en: 'Stop.' })}</p>
          <p className="text-[15px] text-[var(--color-text-muted)] leading-relaxed max-w-[270px] mx-auto">{tx({ de: 'Nichts erklären, nichts lösen. Einmal ausatmen und kurz anhalten. Es ist benannt – das reicht für jetzt.', en: 'Explain nothing, solve nothing. Breathe out once and pause. It is named – that is enough for now.' })}</p>
        </div>
      )}

      {phase === 'soma' && (
        <>
          <p className="text-[17px] text-[var(--color-text)] leading-relaxed text-center mb-1">{tx({ de: 'Such dir einen körperlichen Reiz aus.', en: 'Pick one bodily stimulus.' })}</p>
          <p className="text-[12.5px] text-[var(--color-text-faint)] text-center mb-4">{tx({ de: 'Eher aufgedreht? Dann eher beruhigend (Druck, Wärme, Halt). Eher schwer, leer oder weit weg? Dann eher weckend (Kühle, Stampfen, Bewegung).', en: 'Rather wired? Go for calming (pressure, warmth, support). Rather heavy, empty or far away? Go for waking (coolness, stomping, movement).' })}</p>
          <div className="flex flex-wrap gap-2 justify-center mb-3">
            {SOMA.map((s) => (
              <button key={s.id} onClick={() => setSoma(soma === s.id ? null : s.id)} aria-pressed={soma === s.id} className="px-3.5 py-2 rounded-full text-[13.5px]" style={chip(soma === s.id)}>
                {tx(s.label)}
              </button>
            ))}
          </div>
          {soma && <p className="text-[14px] text-[var(--color-text)] text-center leading-relaxed mb-3 animate-in">{tx(SOMA.find((s) => s.id === soma)!.how)}</p>}
          {own.length > 0 && (
            <div className="rounded-[var(--radius-lg)] p-3 mb-3" style={{ background: 'var(--color-surface-muted)' }}>
              <p className="text-[12px] text-[var(--color-text-faint)] mb-1.5">{tx({ de: 'Aus deinen eigenen Dingen:', en: 'From your own things:' })}</p>
              <p className="text-[13.5px] text-[var(--color-text)]">{own.map((r) => r.title).join(' · ')}</p>
            </div>
          )}
          <Link to="/entdecken/ressourcen/skills" onClick={onClose} className="text-center text-[12.5px] text-[var(--color-primary)] underline underline-offset-2 mb-1">
            {tx({ de: 'Meine Skills ansehen', en: 'See my skills' })}
          </Link>
        </>
      )}

      <div className="flex flex-col items-center gap-3 mt-5">
        {phase === 'soma' ? (
          <button onClick={onClose} className="px-5 py-2.5 rounded-full text-[14px] bg-[var(--color-primary)] text-[var(--color-surface)]">
            {tx({ de: 'Fertig', en: 'Done' })}
          </button>
        ) : (
          <button onClick={next} className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] bg-[var(--color-surface-muted)] text-[var(--color-text)]">
            {phase === 'name' ? tx({ de: 'Stoppen', en: 'Stop' }) : tx({ de: 'Weiter', en: 'Continue' })}
            <ArrowRight size={14} />
          </button>
        )}
        {phase !== 'soma' && (
          <button onClick={onClose} className="text-[12px] text-[var(--color-text-faint)] underline">
            {tx({ de: 'Das hilft gerade nicht', en: 'This does not help right now' })}
          </button>
        )}
      </div>
    </div>
  );
}
