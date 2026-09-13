import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import {
  playPreview,
  previewSighE,
  previewSighF,
  previewGiggleH,
  previewWakeG,
} from '../../services/sounds';

/**
 * TEMPORAER — Runde 4, fokussiert nur auf die Wesen-Toene (Kichern,
 * Seufzer, Aufwecken), nach dem Feedback "zu elektronisch, soll wie
 * Kleinkind/Mensch klingen". Wird nach der Entscheidung entfernt.
 */
function Row({ label, options }: { label: string; options: { name: string; onPress: () => void }[] }) {
  return (
    <Card className="mb-4" padding="md">
      <p className="text-[14px] text-[var(--color-text)] mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.name}
            onClick={o.onPress}
            data-no-tap-feedback
            className="px-4 py-2.5 rounded-full text-[14px] bg-[var(--color-surface-muted)] text-[var(--color-text)] border border-[var(--color-border)]"
          >
            ▶ {o.name}
          </button>
        ))}
      </div>
    </Card>
  );
}

export function SoundWorkshopPage() {
  return (
    <div className="animate-in">
      <TopBar />
      <div className="px-5 pb-10">
        <h1 className="text-[22px] mb-1">Ton-Werkstatt — Runde 4</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-5">
          Neuer Ansatz: viel mehr Atem-Textur (geformtes Rauschen, wie ein echtes "hhh"), der Ton darunter ist jetzt nur
          eine ganz leise Färbung statt der Hauptklang. Das soll weniger elektronisch und mehr wie ein echtes,
          menschliches Ein-/Ausatmen klingen.
        </p>

        <Row
          label="Seufzer / Ein- und Ausatmen"
          options={[
            { name: 'E (ein Atemzug: ein- dann ausatmen)', onPress: () => playPreview(previewSighE) },
            { name: 'F (nur Ausatmen, ganz weich)', onPress: () => playPreview(previewSighF) },
          ]}
        />

        <Row
          label="Kichern"
          options={[{ name: 'H (kurze Atemstöße statt Töne)', onPress: () => playPreview(previewGiggleH) }]}
        />

        <Row
          label="Aufwecken"
          options={[{ name: 'G (verschlafenes Einatmen)', onPress: () => playPreview(previewWakeG) }]}
        />
      </div>
    </div>
  );
}
