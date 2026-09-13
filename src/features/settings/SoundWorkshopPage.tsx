import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import {
  playPreview,
  previewGiggleG,
  previewSighA,
  previewSighC,
  previewSighD,
  previewWakeF,
  previewCloseA,
  previewCloseC,
  previewCloseD,
  previewRewardB,
  previewRewardC,
  previewRewardD,
} from '../../services/sounds';
import { previewVibrate } from '../../services/haptics';

/**
 * TEMPORAER — Runde 3. Bereits entschiedene Punkte (Klick=B,
 * Hauptmenue=B, Kichern=D/E, Aufwecken=D/E, Seufzer=A, Kreuz=A,
 * Beenden=C, Zurueck/Abbruch=D) sind schon in Produktion und nicht
 * mehr hier — nur noch offene Punkte plus ein paar neue Ideen.
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
        <h1 className="text-[22px] mb-1">Ton-Werkstatt — Runde 3</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-2">
          Bereits fest eingebaut: Klick, Hauptmenü, Kichern (D/E), Aufwecken (D/E), Seufzer (A), Kreuz (A), Beenden (C),
          Zurück/Abbruch (D). Hier nur noch offene Fragen plus zwei neue Ideen.
        </p>

        <Row
          label="Neue Idee: noch verspielteres Kichern (zusätzlich zu D/E, falls das noch besser passt)"
          options={[{ name: 'G (stärkerer Triller)', onPress: () => playPreview(previewGiggleG) }]}
        />

        <Row
          label="Neue Idee: Aufwecken als sanftes „Piep-Piep“ wie ein Vogeljunges (zusätzlich zu D/E)"
          options={[{ name: 'F (zwei hohe, sanfte Silben)', onPress: () => playPreview(previewWakeF) }]}
        />

        <Row
          label="Seufzer — A ist gewählt. Falls noch babyhafter gewünscht, hier zwei Alternativen:"
          options={[
            { name: 'A (aktuell gewählt, Referenz)', onPress: () => playPreview(previewSighA) },
            { name: 'C (mit Vibrato + Atem)', onPress: () => playPreview(previewSighC) },
            { name: 'D (Coo-Laut, babyhafter)', onPress: () => playPreview(previewSighD) },
          ]}
        />

        <Row
          label="Kreuz/Abbrechen — A ist gewählt. Zum Vergleich die Alternativen:"
          options={[
            { name: 'A (aktuell gewählt, Referenz)', onPress: () => playPreview(previewCloseA) },
            { name: 'C (klarer, tonaler Ton)', onPress: () => playPreview(previewCloseC) },
            { name: 'D (zwei fallende Töne)', onPress: () => playPreview(previewCloseD) },
          ]}
        />

        <Row
          label="Belohnung/Abschluss — C ist gewählt. Zum Vergleich:"
          options={[
            { name: 'B (Referenz, ungefiltert)', onPress: () => playPreview(previewRewardB) },
            { name: 'C (aktuell gewählt)', onPress: () => playPreview(previewRewardC) },
            { name: 'D (nur ein ganz sanfter Ton)', onPress: () => playPreview(previewRewardD) },
          ]}
        />

        <Row
          label="Haptik-Varianten — jetzt ohne Klick-Ton dabei, nur die reine Vibration"
          options={[
            { name: 'Ganz leicht (15ms)', onPress: () => previewVibrate(15) },
            { name: 'Normal (25ms)', onPress: () => previewVibrate(25) },
            { name: 'Kräftig (45ms)', onPress: () => previewVibrate(45) },
            { name: 'Doppel-Puls kurz', onPress: () => previewVibrate([15, 30, 15]) },
            { name: 'Doppel-Puls kräftig', onPress: () => previewVibrate([25, 40, 35]) },
            { name: 'Dreifach (für Wichtiges)', onPress: () => previewVibrate([20, 30, 20, 30, 30]) },
          ]}
        />
        <Card className="mb-4" padding="md">
          <p className="text-[14px] text-[var(--color-text)] mb-1">Unterstützt dieses Gerät Vibration überhaupt?</p>
          <p
            className="text-[13px]"
            style={{ color: 'vibrate' in navigator ? 'var(--color-primary)' : '#c0392b' }}
          >
            {'vibrate' in navigator
              ? '✓ Ja — die Funktion ist im Browser vorhanden. Falls du trotzdem nichts spürst: bitte "Kräftig" oben antippen und prüfen, ob der Klingeltonschalter/Stumm-Schalter am Handy auf laut steht (manche Handys koppeln Vibration daran), und ob das Handy nicht im absoluten Ruhemodus ist.'
              : '✗ Nein — dieser Browser/dieses Gerät unterstützt Vibration technisch gar nicht. Das ist auf iPhones in Safari (und jedem Browser auf dem iPhone, da alle intern Safari nutzen) eine feste Einschränkung von Apple selbst, nicht reparierbar. Auf Android-Handys sollte es funktionieren.'}
          </p>
        </Card>
      </div>
    </div>
  );
}
