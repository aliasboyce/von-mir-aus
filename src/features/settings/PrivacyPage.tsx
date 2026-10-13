import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ShieldCheck } from 'lucide-react';
import { goBack } from '../../services/navigation';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { useSettings } from '../../state/SettingsContext';

interface Section {
  id: string;
  emoji: string;
  title: string;
  body: string[];
}

const DE: { title: string; lead: string; sections: Section[]; settingsLink: string; footer: string } = {
  title: 'Datenschutz',
  lead: 'So funktioniert „von mir aus“ in Bezug auf deine Daten – in einfachen Worten. Kurz gesagt: Was du einträgst, bleibt auf deinem Gerät. Es gibt kein Konto, keine Werbung, kein Tracking und keine KI, an die deine Einträge gehen.',
  sections: [
    { id: 'local', emoji: '📱', title: 'Wo deine Daten liegen', body: ['Alles, was du einträgst (Check-ins, Tagebuch, Ressourcen, Brücken, Kontakte, Sicherheitsplan, Briefe, Einstellungen, eigene Fotos), wird nur im Speicher deines Browsers auf diesem Gerät abgelegt. Wir haben keinen Server, auf dem deine Inhalte liegen, und du brauchst kein Konto.', 'Das heißt: Niemand außer dir – und wer dein entsperrtes Gerät in der Hand hat – kann deine Einträge lesen. Es heißt auch: Wechselst du das Gerät, löschst du die App-Daten des Browsers oder geht das Gerät verloren, sind die Daten weg, wenn du keine Sicherung gemacht hast.'] },
    { id: 'nothing', emoji: '🚫', title: 'Was es nicht gibt', body: ['• keine Registrierung, kein Login', '• keine Analyse- oder Tracking-Dienste, keine Werbung, keine Cookies zu Werbezwecken', '• keine Weitergabe an Dritte', '• keine KI-Auswertung: deine Einträge werden nicht an KI-Systeme gesendet', '• kein Mitlesen durch uns'] },
    { id: 'connections', emoji: '🌐', title: 'Wann die App trotzdem eine Verbindung ins Internet aufbaut', body: ['Die App selbst läuft auf deinem Gerät, wird aber wie jede Webseite von einem Hosting-Dienst ausgeliefert. Dabei sieht dieser Dienst – wie bei jedem Webseitenaufruf – technische Verbindungsdaten (z. B. IP-Adresse, Zeitpunkt). Deine Einträge sind darin nicht enthalten.', '• Update-Prüfung: die App fragt gelegentlich eine kleine Versionsdatei ab, um zu erkennen, ob es eine neue Version gibt. Es werden keine persönlichen Daten gesendet.', '• Beispielfotos: Die Fotos auf Karten kommen vom Dienst picsum.photos. Der Dienst erfährt dabei deine Verbindung. Du kannst das in den Einstellungen unter „Darstellung“ ausschalten – dann siehst du ruhige Farbflächen und es wird nichts geladen. Eigene Fotos bleiben immer nur auf dem Gerät.', '• Wetter (nur wenn du es schon erlaubt hast): Hat dein Browser bereits die Erlaubnis für den Standort, fragt die App bei Open-Meteo, ob es regnet – mit auf etwa 11 km gerundeter Position. Die App fragt nie von sich aus nach deinem Standort.', '• Links: Tippst du auf einen externen Link (z. B. eine Quelle oder Hilfsstelle), öffnet sich diese Webseite mit ihren eigenen Datenschutzregeln.'] },
    { id: 'sharing', emoji: '🔗', title: 'Wenn du etwas teilst', body: ['Ressourcen, Brücken, Kontakte, Lesezeichen und Briefe kannst du als Link oder Datei weitergeben. Der Inhalt steckt dabei im Link bzw. in der Datei selbst – er wird nicht auf einen Server hochgeladen. Die andere Person importiert ihn in ihre App.', 'Bedenke: Wer den Link oder die Datei hat, kann den Inhalt lesen. Verschicke sie nur über Wege, denen du vertraust. Ein Link wird beim Öffnen wie jede Webadresse an den Hosting-Dienst der App übermittelt; für sehr Persönliches ist die Datei die zurückhaltendere Variante.'] },
    { id: 'exports', emoji: '📄', title: 'Sicherungen, PDFs und Kalenderdateien', body: ['Sicherungen (Datei), PDFs (Rückblicke, Sicherheitsplan, Tagebuch …) und Kalenderdateien werden auf deinem Gerät erzeugt und landen dort, wo du sie speicherst oder hinschickst. Sie sind nicht verschlüsselt: Bewahre sie so auf, dass nur du (oder wer du willst) darankommt.', 'Auch ein Brief, ein Termin oder ein PDF, das du per Messenger oder Mail verschickst, verlässt das Gerät erst durch dein Zutun.'] },
    { id: 'reminders', emoji: '🔔', title: 'Erinnerungen und Postfach', body: ['Erinnerungen und Nachrichten im Postfach entstehen auf deinem Gerät und erscheinen nur innerhalb der App – es werden keine Handy-Benachrichtigungen über einen Server verschickt. Schau deshalb ab und zu rein.'] },
    { id: 'control', emoji: '🗝️', title: 'Du behältst die Kontrolle', body: ['• Ansehen: Unter „Meine Daten“ siehst du, was gespeichert ist.', '• Mitnehmen: „Sicherung erstellen“ und die Export-Buttons in den einzelnen Bereichen.', '• Zurückholen: „Sicherung wiederherstellen“.', '• Löschen: In der Gefahrenzone ganz unten kannst du alle Daten auf einmal entfernen. Danach ist nichts mehr da – auch nicht bei uns, weil wir nie etwas hatten.', 'Einzelne Einträge kannst du jederzeit an Ort und Stelle löschen.'] },
    { id: 'limits', emoji: '🧭', title: 'Wichtig zum Einordnen', body: ['Die App ersetzt keine Therapie und keine ärztliche Hilfe. Sie hat keine Gerätesperre: Wenn andere dein Handy entsperrt nutzen können, können sie auch die App öffnen. Nutze dafür die Bildschirmsperre deines Geräts.', 'Dies ist eine verständliche Zusammenfassung, kein Rechtstext. Wenn du eine förmliche Datenschutzerklärung brauchst (z. B. weil du die App für andere bereitstellst), ergänze sie bitte mit dem Betreiber der App.'] },
  ],
  settingsLink: 'Zu den Einstellungen für Fotos aus dem Internet',
  footer: 'Stand: Oktober 2026',
};

const EN: typeof DE = {
  title: 'Privacy',
  lead: 'How “von mir aus” handles your data — in plain words. In short: what you enter stays on your device. There is no account, no ads, no tracking and no AI that receives your entries.',
  sections: [
    { id: 'local', emoji: '📱', title: 'Where your data lives', body: ['Everything you enter (check-ins, diary, resources, bridges, contacts, safety plan, letters, settings, your own photos) is stored only in your browser’s storage on this device. We have no server holding your content, and you do not need an account.', 'That means: nobody but you — and whoever holds your unlocked device — can read your entries. It also means: if you change device, clear the browser’s app data or lose the device, the data is gone unless you made a backup.'] },
    { id: 'nothing', emoji: '🚫', title: 'What does not exist', body: ['• no registration, no login', '• no analytics or tracking services, no ads, no advertising cookies', '• no passing data on to third parties', '• no AI analysis: your entries are not sent to AI systems', '• no reading along by us'] },
    { id: 'connections', emoji: '🌐', title: 'When the app still connects to the internet', body: ['The app runs on your device but is delivered by a hosting service like any website. That service sees technical connection data (e.g. IP address, time), as with any page visit. Your entries are not part of it.', '• Update check: now and then the app requests a small version file to see whether a new version exists. No personal data is sent.', '• Example photos: the photos on cards come from picsum.photos. That service learns your connection. You can switch this off in Settings under “Appearance” — you then see calm colour fields and nothing is loaded. Your own photos stay on the device only.', '• Weather (only if you already allowed it): if your browser already has location permission, the app asks Open-Meteo whether it rains — with the position rounded to about 11 km. The app never asks for your location by itself.', '• Links: if you tap an external link (e.g. a source or help service), that website opens with its own privacy rules.'] },
    { id: 'sharing', emoji: '🔗', title: 'When you share something', body: ['Resources, bridges, contacts, bookmarks and letters can be passed on as a link or file. The content is inside the link or file itself — it is not uploaded to a server. The other person imports it into their app.', 'Keep in mind: whoever has the link or file can read the content. Send it only through channels you trust. When opened, a link is transmitted to the app’s hosting service like any web address; for very personal things the file is the more discreet option.'] },
    { id: 'exports', emoji: '📄', title: 'Backups, PDFs and calendar files', body: ['Backups (file), PDFs (reviews, safety plan, diary …) and calendar files are created on your device and end up where you save or send them. They are not encrypted: keep them where only you (or whoever you choose) can reach them.', 'A letter, appointment or PDF that you send by messenger or mail also only leaves the device through your action.'] },
    { id: 'reminders', emoji: '🔔', title: 'Reminders and mailbox', body: ['Reminders and messages in the mailbox are created on your device and appear only inside the app — no phone notifications are sent through a server. So look in now and then.'] },
    { id: 'control', emoji: '🗝️', title: 'You stay in control', body: ['• See: under “My data” you see what is stored.', '• Take along: “Create backup” and the export buttons in the individual areas.', '• Get back: “Restore backup”.', '• Delete: in the danger zone at the very bottom you can remove all data at once. After that nothing is left — not with us either, because we never had anything.', 'You can delete single entries in place at any time.'] },
    { id: 'limits', emoji: '🧭', title: 'Good to know', body: ['The app does not replace therapy or medical help. It has no device lock: if others can use your unlocked phone, they can open the app. Use your device’s screen lock for that.', 'This is an understandable summary, not legal text. If you need a formal privacy policy (e.g. because you provide the app to others), please complete it together with the operator of the app.'] },
  ],
  settingsLink: 'To the settings for photos from the internet',
  footer: 'As of: October 2026',
};

/**
 * "Die Datenschutzerklärung muss irgendwo in den Einstellungen klar stehen, wie die App
 * funktioniert." A calm, expandable plain-language page — reached from Settings → Datenschutz.
 * Written from what the code actually does (storage, the few network requests, sharing, exports).
 */
export function PrivacyPage() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const c = settings.language === 'en' ? EN : DE;
  const [open, setOpen] = useState<string | null>('local');

  return (
    <div className="animate-in">
      <TopBar onBack={() => goBack(navigate)} />
      <div className="px-5 pb-10">
        <div className="flex items-center gap-2.5 mb-2">
          <ShieldCheck size={24} className="text-[var(--color-primary)]" />
          <h1 className="text-[24px]">{c.title}</h1>
        </div>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-5 leading-relaxed">{c.lead}</p>
        <div className="flex flex-col gap-2.5">
          {c.sections.map((s) => {
            const isOpen = open === s.id;
            return (
              <Card key={s.id} padding="md">
                <button type="button" onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen} className="w-full flex items-center gap-3 text-left">
                  <span className="text-[20px] flex-shrink-0" aria-hidden="true">{s.emoji}</span>
                  <span className="flex-1 text-[15px] text-[var(--color-text)]">{s.title}</span>
                  <ChevronDown size={16} className="flex-shrink-0 text-[var(--color-text-faint)]" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
                </button>
                {isOpen && (
                  <div className="mt-3 flex flex-col gap-2">
                    {s.body.map((p, i) => (
                      <p key={i} className="text-[13.5px] text-[var(--color-text-muted)] leading-relaxed">{p}</p>
                    ))}
                    {s.id === 'connections' && (
                      <Link to="/einstellungen" className="text-[13px] text-[var(--color-primary)] mt-1">{c.settingsLink} →</Link>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
        <p className="text-[11.5px] text-[var(--color-text-faint)] mt-5 text-center">{c.footer}</p>
      </div>
    </div>
  );
}
