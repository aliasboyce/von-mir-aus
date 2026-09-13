import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import {
  playPreview,
  previewGiggleD,
  previewGiggleE,
  previewGiggleF,
  previewSighA,
  previewSighC,
  previewSighD,
  previewWakeD,
  previewWakeE,
  previewCloseA,
  previewCloseC,
  previewCloseD,
  previewRewardB,
  previewRewardC,
  previewRewardD,
} from '../../services/sounds';
import { previewVibrate } from '../../services/haptics';

/**
 * TEMPORAER — Runde 2, nach Nutzer-Feedback zu Runde 1. Bereits
 * entschiedene Punkte (Klick = B, Hauptmenue = B) sind nicht mehr
 * hier, nur noch das, was noch offen ist. Wird nach der Entscheidung
 * komplett entfernt.
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
        <h1 className="text-[22px] mb-1">Ton-Werkstatt — Runde 2</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-2">
          Neue Versuche mit Vibrato (leichtes Zittern der Tonhöhe, wie eine echte Stimme) und Atem-Textur statt reiner
          Elektronik-Töne.
        </p>
        <p className="text-[12px] text-[var(--color-primary)] mb-5">
          ✓ Klick = Variante B, ✓ Hauptmenü = Variante B — beide schon entschieden, nicht mehr hier.
        </p>

        <Row
          label="1) Kichern — soll süß, stimmhaft, nicht mechanisch sein"
          options={[
            { name: 'D (sanftes Vibrato)', onPress: () => playPreview(previewGiggleD) },
            { name: 'E (mehr Silben, wackeliger)', onPress: () => playPreview(previewGiggleE) },
            { name: 'F (baby-tierhaft, höher)', onPress: () => playPreview(previewGiggleF) },
          ]}
        />

        <Row
          label="2) Seufzer — soll wie Baby/Baby-Tier klingen, nicht mechanisch"
          options={[
            { name: 'A (dein Favorit aus Runde 1)', onPress: () => playPreview(previewSighA) },
            { name: 'C (mit Vibrato + Atem)', onPress: () => playPreview(previewSighC) },
            { name: 'D (Coo-Laut, babyhafter)', onPress: () => playPreview(previewSighD) },
          ]}
        />

        <Row
          label="3) Aufwecken — komplett neuer Versuch, babyhaft/verspielt"
          options={[
            { name: 'D (sanft fragend, Vibrato)', onPress: () => playPreview(previewWakeD) },
            { name: 'E (zwei verschlafene mrrn-Silben)', onPress: () => playPreview(previewWakeE) },
          ]}
        />

        <Row
          label="5) Kreuz/Abbrechen — muss klar anders klingen als der Klick (der ist jetzt ein weiches Rauschen)"
          options={[
            { name: 'A (dein Favorit aus Runde 1)', onPress: () => playPreview(previewCloseA) },
            { name: 'C (klarer, tonaler Ton statt Rauschen)', onPress: () => playPreview(previewCloseC) },
            { name: 'D (zwei fallende Töne)', onPress: () => playPreview(previewCloseD) },
          ]}
        />

        <Row
          label="6) Belohnung/Abschluss — B-Richtung war gut, aber weicher"
          options={[
            { name: 'B (dein Favorit aus Runde 1, Referenz)', onPress: () => playPreview(previewRewardB) },
            { name: 'C (deutlich leiser/weicher)', onPress: () => playPreview(previewRewardC) },
            { name: 'D (nur ein ganz sanfter Ton)', onPress: () => playPreview(previewRewardD) },
          ]}
        />

        <Row
          label="8) Haptik-Varianten — jetzt OHNE Klick-Ton dabei, nur die Vibration"
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
