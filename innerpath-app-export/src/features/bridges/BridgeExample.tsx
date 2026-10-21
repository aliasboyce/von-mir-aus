import { useSettings } from '../../state/SettingsContext';
import { Button } from '../../components/ui/Button';
import type { Bridge } from '../../data/types';

interface ExStep {
  title: string;
  titleEn: string;
  detail: string;
  detailEn: string;
  energy: 1 | 2 | 3 | 4;
  /** what carries the step: [kind, name] — kinds mirror the step pickers (Ort, Aktivität, Hilfsmittel, Skill, Person) */
  carries: [kind: 'place' | 'activity' | 'thing' | 'skill' | 'person', de: string, en: string][];
}

const STEPS: ExStep[] = [
  {
    title: 'Aus dem Fenster schauen', titleEn: 'Look out of the window',
    detail: 'Fenster öffnen und eine Minute nach draußen schauen: Was ist grün? Was bewegt sich?', detailEn: 'Open the window and look outside for a minute: what is green? What moves?',
    energy: 1,
    carries: [['place', 'Am Fenster', 'At the window']],
  },
  {
    title: 'Vor die Tür treten', titleEn: 'Step outside',
    detail: 'Schuhe und Jacke an, bis zum Hauseingang. Einmal tief die Luft draußen riechen. Dann darfst du wieder rein.', detailEn: 'Shoes and jacket on, as far as the front door. Smell the outside air once. Then you may go back in.',
    energy: 2,
    carries: [['thing', 'Jacke', 'Jacket']],
  },
  {
    title: 'Zum nächsten Baum gehen', titleEn: 'Walk to the nearest tree',
    detail: 'Dort stehen bleiben und fünf grüne Dinge zählen.', detailEn: 'Stop there and count five green things.',
    energy: 2,
    carries: [['activity', 'Eine Runde gehen', 'Take a walk'], ['skill', '5-4-3-2-1', '5-4-3-2-1']],
  },
  {
    title: 'Auf einer Bank sitzen', titleEn: 'Sit on a bench',
    detail: 'Zehn Minuten nur dasitzen, schauen, Tee trinken.', detailEn: 'Sit for ten minutes, just look, drink tea.',
    energy: 3,
    carries: [['place', 'Bank im Park', 'Bench in the park'], ['thing', 'Thermoskanne mit Tee', 'Flask of tea']],
  },
  {
    title: 'Anna fragen, ob sie mitkommt', titleEn: 'Ask Anna to come along',
    detail: 'Eine Nachricht schicken: „Ich geh in den Park, magst du mit?“', detailEn: 'Send a message: "I am going to the park, want to come?"',
    energy: 4,
    carries: [['person', 'Anna', 'Anna']],
  },
];

const KIND_LABEL: Record<ExStep['carries'][number][0], [string, string]> = {
  place: ['Ort', 'Place'],
  activity: ['Aktivität', 'Activity'],
  thing: ['Hilfsmittel', 'Tool'],
  skill: ['Skill', 'Skill'],
  person: ['Person', 'Person'],
};

/**
 * A fully worked-out example inside the "new bridge" form: ONE value (Natur),
 * the question that leads from the value to a first step, five steps that grow
 * a little each time, and for every step what carries it. Written so that
 * someone who has never built a bridge sees exactly what to type where.
 * "Als Vorlage übernehmen" copies the steps into the form so they can be changed.
 */
export function BridgeExample({ canApply, onApply }: { canApply: boolean; onApply: (patch: Partial<Bridge>) => void }) {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const x = (de: string, e: string) => (en ? e : de);

  function apply() {
    onApply({
      title: x('Zehn Minuten Grün', 'Ten minutes of green'),
      description: x('Vom Fenster bis zur Bank im Park — jeder Schritt ein kleines Stück weiter nach draußen.', 'From the window to a bench in the park — each step a little further outside.'),
      connectionTags: ['Natur'],
      levels: STEPS.map((s, i) => ({ level: i + 1, title: x(s.title, s.titleEn), description: x(s.detail, s.detailEn), energyLevel: s.energy })),
    });
  }

  const h = 'text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)] mb-1.5';
  const p = 'text-[13.5px] text-[var(--color-text)] leading-relaxed';

  return (
    <div className="flex flex-col gap-5">
      <p className={p}>{x('Eine Brücke führt dich in kleinen Schritten von dort, wo du gerade bist, zu einem Wert, der dir wichtig ist. Hier ein ganz genaues Beispiel — so könntest du selbst vorgehen.', 'A bridge leads you in small steps from where you are now to a value that matters to you. Here is one in exact detail — this is how you can go about it yourself.')}</p>

      <div>
        <p className={h}>{x('1 · Einen Wert wählen', '1 · Choose a value')}</p>
        <p className={p}>{x('Du wählst „Natur“. Das ist die Richtung, in die die Brücke führt. Die App ordnet dem Wert Bedürfnisse zu (hier: Ruhe, Erholung, Frieden, Ästhetik) und kann dir dadurch später passende Dinge für die Schritte vorschlagen.', 'You choose "Nature". That is the direction the bridge leads. The app links the value to needs (here: calm, recovery, peace, aesthetics) and can later suggest fitting things for the steps.')}</p>
      </div>

      <div>
        <p className={h}>{x('2 · Dich fragen', '2 · Ask yourself')}</p>
        <p className={p}>{x('„Was wäre der allerkleinste Schritt in diese Richtung — und was käme danach?“ Der erste Schritt ist so klein, dass er auch an einem schweren Tag geht. Jeder weitere ist nur ein Stück größer.', '"What would be the very smallest step in this direction — and what comes after?" The first step is so small that it works on a hard day. Each further one is only a little bigger.')}</p>
      </div>

      <div>
        <p className={h}>{x('3 · Schritte bauen — und was jeden trägt', '3 · Build the steps — and what carries each one')}</p>
        <p className={`${p} mb-3 text-[var(--color-text-muted)]`}>{x('Titel der Brücke: „Zehn Minuten Grün“', 'Title of the bridge: "Ten minutes of green"')}</p>
        <ol className="flex flex-col gap-3">
          {STEPS.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center text-[12px] font-medium flex-shrink-0 mt-0.5">{i + 1}</span>
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-[var(--color-text)]">{x(s.title, s.titleEn)}</p>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mt-0.5">{x(s.detail, s.detailEn)}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {s.carries.map(([kind, de, e]) => (
                    <span key={kind + de} className="text-[11.5px] rounded-full px-2.5 py-1 bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]">
                      {x(KIND_LABEL[kind][0], KIND_LABEL[kind][1])}: <span className="text-[var(--color-text)]">{x(de, e)}</span>
                    </span>
                  ))}
                  <span className="text-[11.5px] rounded-full px-2.5 py-1 bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]">
                    {x('Energie', 'Energy')} {s.energy}/4
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <p className={h}>{x('4 · Was du daran siehst', '4 · What to take from it')}</p>
        <ul className={`${p} list-disc pl-4 flex flex-col gap-1.5`}>
          <li>{x('Ressourcen sind einzelne Dinge (Tee, die 5-4-3-2-1-Übung, eine Bank). Die Brücke ist der Weg, auf dem du sie nacheinander einsetzt.', 'Resources are single things (tea, the 5-4-3-2-1 exercise, a bench). The bridge is the path on which you use them one after another.')}</li>
          <li>{x('Du darfst auf jeder Stufe stehen bleiben. Schon Schritt 1 ist die Brücke.', 'You may stop on any step. Step 1 alone is already the bridge.')}</li>
          <li>{x('Du musst nicht alles ausfüllen: ein Wert und ein Schritt reichen für eine erste Brücke. Orte, Aktivitäten, Hilfsmittel, Skills und Personen hängst du an, was du schon in der App hast.', 'You do not have to fill in everything: one value and one step are enough for a first bridge. You attach places, activities, tools, skills and people you already have in the app.')}</li>
        </ul>
      </div>

      {canApply && (
        <Button type="button" variant="secondary" onClick={apply}>
          {x('Als Vorlage übernehmen und anpassen', 'Use as a template and adapt')}
        </Button>
      )}
    </div>
  );
}
