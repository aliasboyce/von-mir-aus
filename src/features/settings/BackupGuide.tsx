import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useL } from '../projects/useL';

/**
 * Schritt-für-Schritt-Anleitung zur Datensicherung – ruhig, ausklappbar, ohne Fachwörter.
 * Steht in Einstellungen → Meine Daten direkt bei den Sicherungs-Knöpfen.
 */
export function BackupGuide() {
  const { L } = useL();
  const [open, setOpen] = useState(false);

  const blocks: { h: string; steps: string[]; ordered?: boolean }[] = [
    {
      h: L('1 · Sichern (etwa eine Minute)', '1 · Back up (about a minute)'),
      ordered: true,
      steps: [
        L('Tippe hier auf „Sicherung erstellen“.', 'Tap “Create backup” here.'),
        L('Dein Gerät lädt eine Datei herunter: „von-mir-aus-sicherung-JJJJ-MM-TT.json“. Auf dem Handy liegt sie im Ordner „Downloads“ (bzw. in der Dateien-App), am Laptop im Downloads-Ordner.', 'Your device downloads a file: “von-mir-aus-sicherung-YYYY-MM-DD.json”. On a phone it is in the “Downloads” folder (or the Files app), on a laptop in the Downloads folder.'),
        L('Lege eine Kopie an einen zweiten Ort: zum Beispiel in einen Cloud-Ordner, auf einen USB-Stick oder per E-Mail an dich selbst. Nur auf demselben Gerät reicht nicht – dann ist sie mit dem Gerät weg.', 'Put a copy in a second place: for example a cloud folder, a USB stick or an email to yourself. Leaving it only on the same device is not enough – it would be lost with the device.'),
        L('Die Datei ist nicht verschlüsselt und enthält alles Persönliche. Bewahre sie nur dort auf, wo nur du hinkommst.', 'The file is not encrypted and contains everything personal. Keep it only where only you can reach it.'),
      ],
    },
    {
      h: L('2 · Wiederholen', '2 · Repeat'),
      steps: [
        L('Sichere regelmäßig – zum Beispiel einmal pro Woche oder nach größeren Einträgen. Jedes Mal entsteht eine neue Datei mit Datum; die neueste enthält alles.', 'Back up regularly – for example once a week or after bigger entries. Each time a new dated file is created; the newest holds everything.'),
        L('Alte Dateien darfst du löschen. Behalte am besten die letzten zwei.', 'You may delete old files. Best keep the last two.'),
        L('Die App erinnert dich nach etwa einer Woche sanft daran (kannst du oben abschalten).', 'The app gently reminds you after about a week (you can switch that off above).'),
      ],
    },
    {
      h: L('3 · Wiederherstellen (neues Gerät oder nach einem Verlust)', '3 · Restore (new device or after a loss)'),
      ordered: true,
      steps: [
        L('Öffne die App auf dem Gerät (auf einem neuen Gerät dieselbe Adresse öffnen, bei Bedarf zum Startbildschirm hinzufügen).', 'Open the app on the device (on a new device open the same address and add it to the home screen if you like).'),
        L('Hole die Sicherungsdatei aufs Gerät (aus der Cloud, aus der E-Mail oder vom USB-Stick).', 'Get the backup file onto the device (from the cloud, the email or the USB stick).'),
        L('Einstellungen → Meine Daten → „Sicherung wiederherstellen“ → Datei auswählen.', 'Settings → My data → “Restore backup” → choose the file.'),
        L('Du siehst, von wann die Sicherung ist, und bestätigst. Dann wird alles Aktuelle durch den Stand der Datei ersetzt.', 'You see when the backup is from and confirm. Then everything current is replaced by the state in the file.'),
        L('Die App lädt neu – fertig. Klappt etwas nicht, bleibt alles so, wie es vorher war.', 'The app reloads – done. If something fails, everything stays as it was before.'),
      ],
    },
    {
      h: L('Gut zu wissen', 'Good to know'),
      steps: [
        L('Dabei sind: Einträge, Einstellungen, Routinen, eigene Fotos, Videos und Töne (zusammen bis etwa 60 MB; was nicht mehr passt, sagt dir die App).', 'Included: entries, settings, routines, own photos, videos and sounds (up to about 60 MB together; the app tells you what does not fit).'),
        L('Nicht dabei: die App-Sperre (PIN und Sicherheitsfrage). Die richtest du nach dem Wiederherstellen neu ein.', 'Not included: the app lock (PIN and security question). Set it up again after restoring.'),
        L('Eine Sicherung ist ein Foto vom Stand des Tages. Was du danach eingetragen hast, ist nach dem Einspielen nicht mehr da – darum lieber öfter sichern.', 'A backup is a snapshot of that day. Anything entered afterwards is gone after restoring – so better back up often.'),
      ],
    },
  ];

  return (
    <div className="mb-3" data-testid="backup-guide">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} data-testid="backup-guide-toggle"
        className="w-full flex items-center justify-between gap-2 py-2.5 px-3 rounded-[var(--radius-md)] text-[13.5px] font-medium text-[var(--color-primary)] bg-[var(--color-primary-soft)]">
        {L('So geht’s – Schritt für Schritt', 'How it works – step by step')}
        <ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-3.5 px-1" data-testid="backup-guide-body">
          {blocks.map((b) => (
            <div key={b.h}>
              <p className="text-[13.5px] font-semibold text-[var(--color-text)] mb-1">{b.h}</p>
              {b.ordered ? (
                <ol className="list-decimal pl-5 flex flex-col gap-1.5">
                  {b.steps.map((s) => <li key={s} className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">{s}</li>)}
                </ol>
              ) : (
                <ul className="list-disc pl-5 flex flex-col gap-1.5">
                  {b.steps.map((s) => <li key={s} className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">{s}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
