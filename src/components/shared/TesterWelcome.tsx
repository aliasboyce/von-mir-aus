import { useState } from 'react';
import { ExternalLink, ChevronDown } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';
import { TEST_FEEDBACK_URL } from '../../services/testSupport';

export const TESTER_WELCOME = {
  de: {
    title: '🎉 Herzlichen Glückwunsch! Du wurdest auserwählt!',
    paras: [
      'Du gehörst zu den wenigen Glücklichen (oder Unglücklichen), die diese App als Testpersonen auf Herz und Nieren prüfen dürfen. Mein herzliches Beileid und gleichzeitig ganz viel Spaß!',
      'Ein riesengroßes Dankeschön, dass du dir die Zeit nimmst! Ich hoffe, du hast Freude daran, alles auszuprobieren.',
      'Gib mir super gerne jederzeit Rückmeldung – Lob, Kritik, Verbesserungsvorschläge, Fehlermeldungen oder einfach alles, was dir auffällt. Ich wünsche mir ausdrücklich ehrliche Kritik. Hier darf gemeckert werden!',
      'Viel Spaß beim Testen und danke, dass du Teil dieses kleinen Experiments bist! 🖤',
    ],
    howTitle: 'Wo und wie kannst du etwas melden?',
    how: [
      { icon: '💬', h: 'Kurz zwischendurch', t: 'Tippe aufs Wesen → „Das Wesen“ → „Kurz was an Boycie melden“. Ein Satz, fertig.' },
      { icon: '📝', h: 'Ausführlich', t: 'Der lange Bogen (anonym, ca. 1 Minute, alles freiwillig):' },
      { icon: '🔁', h: 'Immer wieder findbar', t: 'Einstellungen → Hilfe & Über → Test-Version.' },
    ],
    cta: 'Zum langen Bogen',
    cont: 'Weiter',
  },
  en: {
    title: '🎉 Congratulations! You have been chosen!',
    paras: [
      'You are one of the few lucky (or unlucky) people allowed to put this app through its paces as a tester. My sincere condolences – and lots of fun at the same time!',
      'A huge thank you for taking the time! I hope you enjoy trying everything out.',
      'Please give me feedback any time – praise, criticism, suggestions, bug reports or simply anything you notice. I explicitly want honest criticism. Complaining is allowed here!',
      'Have fun testing, and thank you for being part of this little experiment! 🖤',
    ],
    howTitle: 'Where and how can you report something?',
    how: [
      { icon: '💬', h: 'Quickly, in between', t: 'Tap the companion → “The Wesen” → “Quick note to Boycie”. One sentence, done.' },
      { icon: '📝', h: 'In detail', t: 'The long form (anonymous, about 1 minute, everything optional):' },
      { icon: '🔁', h: 'Always findable', t: 'Settings → Help & about → Test version.' },
    ],
    cta: 'Open the long form',
    cont: 'Continue',
  },
};

/** The welcome text for people who test the app, plus a short "where and how to give feedback" block. */
export function TesterWelcomeContent() {
  const { settings } = useSettings();
  const T = TESTER_WELCOME[settings.language === 'en' ? 'en' : 'de'];
  return (
    <div className="flex flex-col gap-4 text-left" data-testid="tester-welcome">
      <div className="rounded-[var(--radius-lg)] px-4 py-4" style={{ background: 'var(--color-primary-soft)', border: '1px solid var(--color-border)' }}>
        <h1 className="text-[19px] leading-snug mb-2.5">{T.title}</h1>
        {T.paras.map((p, i) => (
          <p key={i} className="text-[14px] text-[var(--color-text)] leading-relaxed mb-2 last:mb-0">{p}</p>
        ))}
      </div>
      <div>
        <p className="text-[13.5px] text-[var(--color-text)] mb-2">{T.howTitle}</p>
        <div className="flex flex-col gap-2">
          {T.how.map((p, i) => (
            <div key={i} className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5">
              <span className="text-[19px] leading-none mt-0.5" aria-hidden>{p.icon}</span>
              <div className="min-w-0">
                <p className="text-[13.5px] text-[var(--color-text)]">{p.h}</p>
                <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed">{p.t}</p>
                {i === 1 && (
                  <a href={TEST_FEEDBACK_URL} target="_blank" rel="noopener noreferrer" data-testid="welcome-survey-link" className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] underline underline-offset-2">
                    <ExternalLink size={13} />{T.cta}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const TESTER_INFO = {
  de: {
    title: 'Gut zu wissen',
    sub: 'Kurz und ehrlich – tippe auf eine Zeile, wenn du mehr lesen magst.',
    items: [
      { icon: '🤝', h: 'Aktuell nur unter Vertrauten', s: 'Die App ist gerade nur für Freundinnen, Freunde und Vertrauenspersonen zum Testen da.', d: 'Vieles ist noch nicht das Endergebnis. Manches kommt noch raus, anderes kommt noch dazu – falls wir die App wirklich veröffentlichen. Bitte gib sie noch nicht weiter.' },
      { icon: '📲', h: 'Auf den Startbildschirm', s: 'So öffnet sie sich wie eine richtige App – und deine Daten sind sicherer.', d: 'iPhone/iPad: in Safari öffnen → Teilen-Symbol (Quadrat mit Pfeil) → „Zum Home-Bildschirm“ → „Hinzufügen“. Android: in Chrome Menü ⋮ → „App installieren“ oder „Zum Startbildschirm hinzufügen“. Gleich zeige ich dir die Schritte noch genauer.' },
      { icon: '▶️', h: 'So nutzt du sie', s: 'Öffnen wie jede andere App – nach dem ersten Laden auch ohne Internet.', d: 'Du musst nichts einrichten. Schau dich um, probier aus, lass weg, was nicht passt. „Das hilft gerade nicht“ geht immer.' },
      { icon: '🔄', h: 'Updates', s: 'Kommen von allein – deine Daten bleiben.', d: 'Gibt es eine neue Version, erscheint auf der Startseite ein Hinweis. Einmal auf „Neu laden“ tippen – fertig. Du musst nichts neu installieren. „Was ist neu?“ zeigt dir die Änderungen.' },
      { icon: '🔒', h: 'Deine Daten', s: 'Alles bleibt nur auf deinem Gerät.', d: 'Was du einträgst, wird nirgendwohin gesendet und auf keinem Server gespeichert. Es gibt keine Konten. Ich sehe nichts davon. Wie jede Webseite wird die App von einem Hosting-Dienst ausgeliefert, der technische Verbindungsdaten sieht – deine Einträge betrifft das nie. Wichtig: Gerät weg heißt Daten weg – mach ab und zu eine Sicherung (Einstellungen → Meine Daten).' },
      { icon: '🗑️', h: 'Jederzeit löschen', s: 'Du kannst alles wieder entfernen.', d: 'Einstellungen → Meine Daten → „Von vorne beginnen / alles löschen“. Danach ist alles auf deinem Gerät weg. Einzelne Einträge kannst du natürlich auch einzeln löschen.' },
      { icon: '💌', h: 'Was ich erfahre', s: 'Nur das, was du mir als Rückmeldung schickst.', d: 'Sonst nichts. Keine Nutzungsdaten, keine Einträge. Rückmeldung geht über den anonymen Bogen oder „Kurz was an Boycie melden“ – und nur, wenn du es abschickst.' },
    ],
  },
  en: {
    title: 'Good to know',
    sub: 'Short and honest – tap a line if you want to read more.',
    items: [
      { icon: '🤝', h: 'Only among people we trust (for now)', s: 'The app is currently only for friends and trusted people to test.', d: 'A lot of it is not the final result yet. Some things will still go, others will be added – if we really publish the app. Please do not pass it on yet.' },
      { icon: '📲', h: 'Onto the home screen', s: 'It then opens like a real app – and your data is safer.', d: 'iPhone/iPad: open in Safari → share symbol (square with arrow) → "Add to Home Screen" → "Add". Android: in Chrome menu ⋮ → "Install app" or "Add to home screen". In a moment I will show you the steps in more detail.' },
      { icon: '▶️', h: 'How to use it', s: 'Open it like any other app – after the first load also without internet.', d: 'You do not have to set anything up. Look around, try things, leave out what does not fit. "This does not help right now" is always possible.' },
      { icon: '🔄', h: 'Updates', s: 'They come on their own – your data stays.', d: 'If there is a new version, a notice appears on the start page. Tap "Reload" once – done. You do not have to install anything again. "What is new?" shows you the changes.' },
      { icon: '🔒', h: 'Your data', s: 'Everything stays only on your device.', d: 'What you enter is not sent anywhere and not stored on any server. There are no accounts. I see none of it. Like any website the app is delivered by a hosting service that sees technical connection data – this never concerns your entries. Important: device gone means data gone – make a backup now and then (Settings → My data).' },
      { icon: '🗑️', h: 'Delete any time', s: 'You can remove everything again.', d: 'Settings → My data → "Start over / delete everything". Afterwards everything on your device is gone. Single entries can of course be deleted one by one too.' },
      { icon: '💌', h: 'What I get to know', s: 'Only what you send me as feedback.', d: 'Nothing else. No usage data, no entries. Feedback goes through the anonymous form or "Quick note to Boycie" – and only if you send it.' },
    ],
  },
};

/** Calm overview for testers: install, use, updates, data, deleting, what the maker learns – folds out line by line. */
export function TesterInfoContent() {
  const { settings } = useSettings();
  const T = TESTER_INFO[settings.language === 'en' ? 'en' : 'de'];
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-2.5 text-left" data-testid="tester-info">
      {T.items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} data-testid={`tester-info-${i}`} className="w-full flex gap-3 px-3.5 py-3 text-left">
              <span className="text-[21px] leading-none mt-0.5" aria-hidden>{it.icon}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[14.5px] text-[var(--color-text)]">{it.h}</span>
                <span className="block text-[13px] text-[var(--color-text-muted)] leading-relaxed mt-0.5">{it.s}</span>
              </span>
              <ChevronDown size={16} className={`mt-1 flex-shrink-0 text-[var(--color-text-faint)] transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {isOpen && <p className="px-3.5 pb-3.5 pl-[52px] text-[13.5px] text-[var(--color-text)] leading-relaxed" data-testid={`tester-info-detail-${i}`}>{it.d}</p>}
          </div>
        );
      })}
    </div>
  );
}
