import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import {
  playPreview,
  previewGiggleA,
  previewGiggleB,
  previewGiggleC,
  previewSighA,
  previewSighB,
  previewWakeA,
  previewWakeB,
  previewWakeC,
  previewClickSoft,
  previewClickSofter,
  previewCloseA,
  previewCloseB,
  previewRewardA,
  previewRewardB,
  previewMenuA,
  previewMenuB,
} from '../../services/sounds';
import { previewVibrate } from '../../services/haptics';

/**
 * TEMPORAER — nur zur gemeinsamen Ton-/Haptik-Auswahl mit dem Nutzer.
 * Nicht verlinkt, nur ueber die direkte URL /einstellungen/ton-werkstatt
 * erreichbar. Wird nach der Entscheidung wieder entfernt.
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
        <h1 className="text-[22px] mb-1">Ton-Werkstatt</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-5">
          Tippe jede Variante an und hör sie dir an — am besten mit Ton an, nicht auf lautlos. Sag mir danach einfach, welcher
          Buchstabe/welche Nummer dir bei jeder Zeile am besten gefällt.
        </p>

        <Row
          label="1) Kichern beim Antippen des Wesens"
          options={[
            { name: 'A (bisherig)', onPress: () => playPreview(previewGiggleA) },
            { name: 'B (höher, schneller)', onPress: () => playPreview(previewGiggleB) },
            { name: 'C (weich, gleitend)', onPress: () => playPreview(previewGiggleC) },
          ]}
        />

        <Row
          label="2) Seufzer beim Schlafen legen (höher + länger gewünscht)"
          options={[
            { name: 'A (höher, 0.8s)', onPress: () => playPreview(previewSighA) },
            { name: 'B (noch höher, 1.1s)', onPress: () => playPreview(previewSighB) },
          ]}
        />

        <Row
          label="3) Aufwecken-Ton (komplett neu)"
          options={[
            { name: 'A (sanft steigend)', onPress: () => playPreview(previewWakeA) },
            { name: 'B (zwei Töne)', onPress: () => playPreview(previewWakeB) },
            { name: 'C (fragend, wie bisher aber anders)', onPress: () => playPreview(previewWakeC) },
          ]}
        />

        <Row
          label="4) Klick-Ton (weicher als aktuell)"
          options={[
            { name: 'A (etwas weicher)', onPress: () => playPreview(previewClickSoft) },
            { name: 'B (deutlich weicher)', onPress: () => playPreview(previewClickSofter) },
          ]}
        />

        <Row
          label="5) Kreuz / Abbrechen (neu)"
          options={[
            { name: 'A (weiches Wisch-Geräusch)', onPress: () => playPreview(previewCloseA) },
            { name: 'B (kurzer, tieferer Ton)', onPress: () => playPreview(previewCloseB) },
          ]}
        />

        <Row
          label="6) Belohnung / Abschluss (neu)"
          options={[
            { name: 'A (drei aufsteigende Töne)', onPress: () => playPreview(previewRewardA) },
            { name: 'B (warmer Doppelklang)', onPress: () => playPreview(previewRewardB) },
          ]}
        />

        <Row
          label="7) Hauptmenü-Punkte (wärmer/tiefer als normaler Klick)"
          options={[
            { name: 'A (tiefer Klick)', onPress: () => playPreview(previewMenuA) },
            { name: 'B (warmer Ton)', onPress: () => playPreview(previewMenuB) },
          ]}
        />

        <Row
          label="8) Haptik-Varianten (nur fühlbar, kein Ton)"
          options={[
            { name: 'Ganz leicht (15ms)', onPress: () => previewVibrate(15) },
            { name: 'Normal (25ms)', onPress: () => previewVibrate(25) },
            { name: 'Kräftig (45ms)', onPress: () => previewVibrate(45) },
            { name: 'Doppel-Puls kurz', onPress: () => previewVibrate([15, 30, 15]) },
            { name: 'Doppel-Puls kräftig', onPress: () => previewVibrate([25, 40, 35]) },
            { name: 'Dreifach (für Wichtiges)', onPress: () => previewVibrate([20, 30, 20, 30, 30]) },
          ]}
        />
      </div>
    </div>
  );
}
