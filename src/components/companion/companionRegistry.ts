/**
 * The companion's complete dialogue system.
 *
 * Every line the companion can ever say lives in COMPANION_LINES below,
 * tagged with:
 *   - page:     which route it belongs to ('*' = any/global)
 *   - trigger:  the situation that can surface it (see CompanionTrigger)
 *   - category: what kind of statement it is (see CompanionCategory)
 *
 * This is the ONE place to add, edit, or retire a line — nothing lives
 * scattered in individual page components. Query it with `getLines()` /
 * `pickLine()` rather than importing raw arrays.
 */

import { getDeactivatedIds, getCustomLines, currentTimeOfDay, expandByFrequency } from './companionContentManagement';

export type CompanionCategory =
  | 'einfuehrung' // introduction — explains what a page/feature is, first encounter
  | 'anleitung' // instruction — how to do something here
  | 'erklaerung' // explanation — the "why" behind a design choice
  | 'tipp' // a short, practical tip
  | 'ermutigung' // encouragement
  | 'beruhigend' // calming
  | 'positiv' // an unprompted positive aside
  | 'humorvoll' // an unprompted light, humorous aside
  | 'feedback' // acknowledges something the person just did (saved, created…)
  | 'funktionshinweis' // points out a feature that might otherwise go unnoticed
  | 'kontext'; // context-specific support tied to a particular situation

export type CompanionTrigger =
  | 'erstes_oeffnen' // first time this page is opened this session
  | 'wiederholtes_oeffnen' // any later visit
  | 'eintrag_erstellen'
  | 'eintrag_bearbeiten'
  | 'speichern'
  | 'loeschen'
  | 'ressource_auswahl'
  | 'bruecke_auswahl'
  | 'kontakt_auswahl'
  | 'inner_weather'
  | 'tageskurve'
  | 'sicherheitsplan_limit' // explains the 3-per-tier cap
  | 'netzwerk'
  | 'einstellungen'
  | 'timer_start'
  | 'timer_ende'
  | 'timer_tap'
  | 'timer_sleep'
  | 'timer_wake'
  | 'garden_neu'
  | 'garden_tag'
  | 'garden_meilenstein'
  | 'garden_reset'
  | 'garden_pause'
  | 'garden_erinnerung'
  | 'checkin_zu_beduerfnis'
  | 'checkin_zu_zugang'
  | 'leerlauf'; // idle / unprompted aside, not tied to a specific action

export interface CompanionLine {
  id: string;
  text: string;
  /** natural (not literal) English equivalent — see docs/open-issues.md
   * for the "don't translate word-for-word" instruction this follows */
  textEn: string;
  category: CompanionCategory;
  /** route key this line belongs to, or '*' for anywhere in the app */
  page: string;
  trigger: CompanionTrigger;
}

/** Set from a central place (CompanionSpeechContext) whenever
 * settings.language changes — avoids threading a language parameter
 * through every single pickLine/getLines call site across the app. */
let currentLanguage: 'de' | 'en' = 'de';
export function setCompanionLanguage(lang: 'de' | 'en'): void {
  currentLanguage = lang;
}
function textFor(line: CompanionLine): string {
  return currentLanguage === 'en' ? line.textEn : line.text;
}

export const COMPANION_LINES: CompanionLine[] = [
  // ---- Global greetings (shown on Home / at app open) ----
  { id: 'greet-1', text: 'Schön, dass du da bist.', textEn: 'Glad you\'re here.', category: 'einfuehrung', page: '/', trigger: 'erstes_oeffnen' },
  { id: 'greet-2', text: 'Hallo. Ich bin hier, ganz in deinem Tempo.', textEn: 'Hi. I\'m here, at whatever pace works for you.', category: 'einfuehrung', page: '/', trigger: 'erstes_oeffnen' },
  { id: 'greet-3', text: 'Da bist du ja. Kein Grund zur Eile.', textEn: 'There you are. No rush.', category: 'einfuehrung', page: '/', trigger: 'wiederholtes_oeffnen' },
  { id: 'greet-4', text: 'Übrigens: Du kannst mich halten und verschieben, wohin du magst — und über mein Menü schlafen legen oder aufwecken.', textEn: 'By the way: you can hold and move me wherever you like — and put me to sleep or wake me up from my menu.', category: 'einfuehrung', page: '/', trigger: 'wiederholtes_oeffnen' },
  { id: 'greet-4', text: 'Willkommen zurück.', textEn: 'Welcome back.', category: 'einfuehrung', page: '/', trigger: 'wiederholtes_oeffnen' },
  { id: 'home-1', text: 'Du musst hier nichts leisten — nur schauen, was gerade da ist.', textEn: 'There\'s nothing to achieve here — just notice what\'s there right now.', category: 'beruhigend', page: '*', trigger: 'erstes_oeffnen' },
  { id: 'home-2', text: 'Ein kleiner Check-in reicht schon.', textEn: 'A quick check-in is plenty.', category: 'tipp', page: '/', trigger: 'leerlauf' },
  { id: 'home-3', text: 'Kein Druck. Du entscheidest, was du gerade brauchst.', textEn: 'No pressure. You decide what you need right now.', category: 'beruhigend', page: '*', trigger: 'leerlauf' },

  // ---- Inner Weather ----
  { id: 'iw-1', text: 'Es gibt kein falsches Wetter.', textEn: 'There\'s no wrong weather.', category: 'beruhigend', page: '*', trigger: 'erstes_oeffnen' },
  { id: 'iw-2', text: 'Du kannst jederzeit überspringen.', textEn: 'You can skip this anytime.', category: 'anleitung', page: '/inneres-wetter', trigger: 'erstes_oeffnen' },
  { id: 'iw-3', text: 'Nimm dir die Zeit, die es braucht — auch wenn das eine Sekunde ist.', textEn: 'Take whatever time this needs — even if that\'s one second.', category: 'beruhigend', page: '*', trigger: 'leerlauf' },
  { id: 'iw-4', text: 'Auch "ich weiß es gerade nicht" ist eine gültige Antwort.', textEn: '"I don\'t know right now" counts as an answer too.', category: 'beruhigend', page: '*', trigger: 'leerlauf' },
  { id: 'iw-5', text: 'Der Zustand von eben muss nicht der von jetzt sein.', textEn: 'How you felt a moment ago doesn\'t have to be how you feel now.', category: 'erklaerung', page: '/inneres-wetter', trigger: 'leerlauf' },
  { id: 'iw-7', text: 'Magst du kurz schauen, wie es dir gerade geht?', textEn: 'Want to take a quick look at how you\'re doing?', category: 'kontext', page: '/inneres-wetter', trigger: 'inner_weather' },
  { id: 'iw-8', text: 'Es gibt kein richtig oder falsch — nur eine Momentaufnahme.', textEn: 'There\'s no right or wrong here — just a snapshot.', category: 'beruhigend', page: '*', trigger: 'inner_weather' },
  { id: 'iw-6', text: 'Danke, dass du kurz bei dir warst.', textEn: 'Thanks for taking a moment for yourself.', category: 'feedback', page: '/inneres-wetter', trigger: 'speichern' },

  // ---- Brücken ----
  { id: 'br-1', text: 'Level 1 ist genauso gültig wie Level 4.', textEn: 'Level 1 counts just as much as level 4.', category: 'erklaerung', page: '/bruecken', trigger: 'erstes_oeffnen' },
  { id: 'br-8', text: 'Eine Brücke bringt dich von hier zu etwas, das dir hilft — nicht sofort, nur ein Stück.', textEn: 'A bridge gets you from here to something that helps — not all at once, just a bit closer.', category: 'erklaerung', page: '/bruecken', trigger: 'leerlauf' },
  { id: 'br-9', text: 'Manche Tage reicht Level 1. Das ist kein Rückschritt.', textEn: 'Some days, level 1 is enough. That\'s not a setback.', category: 'beruhigend', page: '*', trigger: 'leerlauf' },
  { id: 'br-10', text: 'Du darfst auch mal eine Brücke gar nicht nutzen — sie wartet trotzdem.', textEn: 'It\'s fine to skip a bridge sometimes too — it\'ll still be here.', category: 'beruhigend', page: '*', trigger: 'leerlauf' },
  { id: 'br-11', text: 'Schau mal, ob eine deiner Brücken gerade zu deinem heutigen Zustand passt.', textEn: 'See if one of your bridges fits how you\'re feeling today.', category: 'tipp', page: '/bruecken', trigger: 'leerlauf' },
  { id: 'br-timer-1', text: 'Okay. Mehr musst du gerade nicht schaffen.', textEn: 'Okay. That\'s all you need to manage right now.', category: 'beruhigend', page: '*', trigger: 'timer_start' },
  { id: 'br-timer-2', text: 'Ich bin hier, solange die Zeit läuft.', textEn: 'I\'m here for as long as the timer runs.', category: 'beruhigend', page: '*', trigger: 'timer_start' },
  { id: 'br-timer-3', text: 'Geschafft. Du hast diese Zeit gemacht.', textEn: 'Done. You made that time.', category: 'feedback', page: '/bruecken', trigger: 'timer_ende' },
  { id: 'br-timer-4', text: 'Fertig. Das war dein Stück Zeit, ganz für dich.', textEn: 'Finished. That was your bit of time, just for you.', category: 'feedback', page: '/bruecken', trigger: 'timer_ende' },
  { id: 'br-timer-tap-1', text: 'Du musst gerade nichts perfekt machen.', textEn: "You don't have to get this right.", category: 'beruhigend', page: '*', trigger: 'timer_tap' },
  { id: 'br-timer-tap-2', text: 'Einfach Schritt für Schritt.', textEn: 'Just one step at a time.', category: 'beruhigend', page: '*', trigger: 'timer_tap' },
  { id: 'br-timer-tap-3', text: 'Du darfst auch einfach nur hier sein.', textEn: 'It\'s okay to just be here.', category: 'beruhigend', page: '*', trigger: 'timer_tap' },
  { id: 'br-timer-tap-4', text: 'Ich bleibe ein bisschen bei dir.', textEn: "I'll stay with you a while.", category: 'beruhigend', page: '*', trigger: 'timer_tap' },
  { id: 'br-timer-tap-5', text: 'Es gibt hier kein richtig oder falsch.', textEn: "There's no right or wrong here.", category: 'beruhigend', page: '*', trigger: 'timer_tap' },
  { id: 'br-timer-tap-6', text: 'Noch ein kleines Stück. Du machst das gut.', textEn: "A little further. You're doing fine.", category: 'ermutigung', page: '/bruecken', trigger: 'timer_tap' },
  { id: 'br-timer-tap-7', text: 'Falls es gerade schwer ist: Das darf so sein.', textEn: "If this feels hard right now, that's allowed.", category: 'beruhigend', page: '*', trigger: 'timer_tap' },
  { id: 'br-timer-tap-8', text: 'Ich bin noch da.', textEn: "Still here.", category: 'beruhigend', page: '*', trigger: 'timer_tap' },
  { id: 'br-timer-sleep-1', text: 'Ich leg mich solange mal schlafen, bis du mich brauchst.', textEn: "I'll rest here for a bit until you need me.", category: 'beruhigend', page: '*', trigger: 'timer_sleep' },
  { id: 'br-timer-sleep-2', text: 'Ich mach kurz die Augen zu. Ruf mich, wenn was ist.', textEn: "I'll close my eyes for a moment. Call if you need me.", category: 'beruhigend', page: '*', trigger: 'timer_sleep' },
  { id: 'br-timer-wake-1', text: 'Ja, ich bin da.', textEn: "Yes, I'm here.", category: 'beruhigend', page: '*', trigger: 'timer_wake' },
  { id: 'br-timer-wake-2', text: 'Hallo wieder.', textEn: 'Hello again.', category: 'beruhigend', page: '*', trigger: 'timer_wake' },
  { id: 'br-timer-wake-3', text: 'Da bin ich.', textEn: 'Here I am.', category: 'beruhigend', page: '*', trigger: 'timer_wake' },
  { id: 'garden-neu-1', text: 'Ein neuer Anfang. Du bestimmst das Tempo.', textEn: 'A new beginning. You set the pace.', category: 'ermutigung', page: '/entdecken/garten', trigger: 'garden_neu' },
  { id: 'garden-neu-2', text: 'Hier wächst etwas, ganz in deinem Rhythmus.', textEn: 'Something grows here, entirely at your own rhythm.', category: 'ermutigung', page: '/entdecken/garten', trigger: 'garden_neu' },
  { id: 'garden-tag-1', text: 'Noch ein Tag. Das zählt.', textEn: 'One more day. That counts.', category: 'feedback', page: '/entdecken/garten', trigger: 'garden_tag' },
  { id: 'garden-tag-2', text: 'Du bist noch da. Das ist nicht nichts.', textEn: "You're still here. That's not nothing.", category: 'ermutigung', page: '/entdecken/garten', trigger: 'garden_tag' },
  { id: 'garden-tag-3', text: 'Ein weiterer Tag in deinem Tempo.', textEn: 'Another day at your own pace.', category: 'feedback', page: '/entdecken/garten', trigger: 'garden_tag' },
  { id: 'garden-meilenstein-1', text: 'Schau, was hier gewachsen ist.', textEn: 'Look what has grown here.', category: 'positiv', page: '*', trigger: 'garden_meilenstein' },
  { id: 'garden-erinnerung-1', text: 'Kleine Erinnerung von mir: Heute wäre dein Garten wieder dran. 🌱', textEn: 'Small reminder from me: your garden could use you again today. 🌱', category: 'ermutigung', page: '/entdecken/garten', trigger: 'garden_erinnerung' },
  { id: 'garden-erinnerung-2', text: 'Falls du gerade Zeit und Lust hast — eine deiner Pflanzen wartet auf dich.', textEn: "If you have a moment and feel like it — one of your plants is waiting for you.", category: 'ermutigung', page: '/entdecken/garten', trigger: 'garden_erinnerung' },
  { id: 'garden-erinnerung-3', text: 'Kein Druck, nur ein sanfter Hinweis: dein Garten ist noch da.', textEn: 'No pressure, just a gentle note: your garden is still here.', category: 'ermutigung', page: '/entdecken/garten', trigger: 'garden_erinnerung' },
  { id: 'garden-erinnerung-4', text: 'Wann immer es passt — heute wäre ein guter Tag für deinen Garten.', textEn: 'Whenever it fits — today could be a good day for your garden.', category: 'ermutigung', page: '/entdecken/garten', trigger: 'garden_erinnerung' },
  { id: 'garden-erinnerung-5', text: 'Ich dachte gerade an deinen Garten. Magst du kurz vorbeischauen?', textEn: 'I was just thinking about your garden. Want to stop by for a moment?', category: 'ermutigung', page: '/entdecken/garten', trigger: 'garden_erinnerung' },
  { id: 'garden-erinnerung-6', text: 'Nur ein kleiner Gedanke: heute könnte ein guter Moment für deinen Garten sein.', textEn: 'Just a small thought: today could be a good moment for your garden.', category: 'ermutigung', page: '/entdecken/garten', trigger: 'garden_erinnerung' },
  { id: 'checkin-need-1', text: 'Jetzt wissen wir ein bisschen besser, wie es dir gerade geht. Schauen wir mal, was du brauchst.', textEn: 'Now we know a little better how you\'re doing right now. Let\'s see what you need.', category: 'kontext', page: '/inneres-wetter', trigger: 'checkin_zu_beduerfnis' },
  { id: 'checkin-need-2', text: 'Du hast dir gerade kurz zugehört. Das Nächste: worauf könntest du jetzt Lust haben?', textEn: 'You just listened to yourself for a moment. Next up: what might you feel like doing now?', category: 'kontext', page: '/inneres-wetter', trigger: 'checkin_zu_beduerfnis' },
  { id: 'checkin-need-3', text: 'Ein klareres Bild von gerade eben — und jetzt schauen wir gemeinsam weiter.', textEn: 'A clearer picture of right now — and now let\'s take a look together.', category: 'kontext', page: '/inneres-wetter', trigger: 'checkin_zu_beduerfnis' },
  { id: 'checkin-need-4', text: 'Danke, dass du dir das angeschaut hast. Als Nächstes: was würde dir jetzt guttun?', textEn: 'Thanks for taking a look at that. Next: what might feel good to you right now?', category: 'kontext', page: '/inneres-wetter', trigger: 'checkin_zu_beduerfnis' },
  { id: 'checkin-zugang-1', text: 'Das ist völlig in Ordnung. Manchmal braucht es ein paar Schritte mehr, um wieder klarer zu sehen — genau dabei kann Zugang helfen.', textEn: "That's completely okay. Sometimes it takes a few more steps to see more clearly again — that's exactly what Access can help with.", category: 'kontext', page: '/inneres-wetter', trigger: 'checkin_zu_zugang' },
  { id: 'checkin-zugang-2', text: 'Kein Problem, wenn das gerade nicht greifbar ist. Lass uns gemeinsam Schritt für Schritt schauen.', textEn: "No problem if that's not quite graspable right now. Let's take a look together, step by step.", category: 'kontext', page: '/inneres-wetter', trigger: 'checkin_zu_zugang' },
  { id: 'checkin-zugang-3', text: 'Manchmal ist „ich weiß es nicht" der ehrlichste Ausgangspunkt. Zugang hilft dir, dich von dort aus Schritt für Schritt zu orientieren.', textEn: '"I don\'t know" is sometimes the most honest starting point. Access helps you find your bearings from there, step by step.', category: 'kontext', page: '/inneres-wetter', trigger: 'checkin_zu_zugang' },
  { id: 'garden-meilenstein-2', text: 'Das hier ist dein Garten. Niemand sonst hat diesen gepflanzt.', textEn: "This is your garden. No one else planted this one.", category: 'positiv', page: '*', trigger: 'garden_meilenstein' },
  { id: 'garden-reset-1', text: 'Ein einzelner Tag entscheidet nicht über deine ganze Geschichte.', textEn: "A single day doesn't decide your whole story.", category: 'beruhigend', page: '*', trigger: 'garden_reset' },
  { id: 'garden-reset-2', text: 'Du musst nicht wieder bei null anfangen. Du hast trotzdem etwas gelernt.', textEn: "You don't have to start over from nothing. You still learned something.", category: 'beruhigend', page: '*', trigger: 'garden_reset' },
  { id: 'garden-reset-3', text: 'Der Garten bleibt, auch wenn heute anders war.', textEn: 'The garden stays, even if today looked different.', category: 'beruhigend', page: '*', trigger: 'garden_reset' },
  { id: 'garden-pause-1', text: 'Eine Pause ist kein Ende.', textEn: "A pause isn't an ending.", category: 'beruhigend', page: '*', trigger: 'garden_pause' },
  { id: 'garden-tag-4', text: 'Ein weiterer kleiner Baustein für deinen Garten.', textEn: 'Another small building block for your garden.', category: 'feedback', page: '/entdecken/garten', trigger: 'garden_tag' },
  { id: 'garden-tag-5', text: 'Du baust dir gerade etwas auf.', textEn: "You're building yourself something here.", category: 'ermutigung', page: '/entdecken/garten', trigger: 'garden_tag' },
  { id: 'garden-meilenstein-3', text: 'Schau, wie viel hier schon gewachsen ist.', textEn: 'Look how much has already grown here.', category: 'positiv', page: '*', trigger: 'garden_meilenstein' },
  { id: 'br-2', text: 'Wähle das, was sich gerade richtig anfühlt, nicht das, was am meisten bringt.', textEn: 'Pick whatever feels right now, not whatever seems most impressive.', category: 'tipp', page: '/bruecken', trigger: 'bruecke_auswahl' },
  { id: 'br-3', text: 'Du kannst jederzeit ein anderes Level wählen.', textEn: 'You can pick a different level anytime.', category: 'anleitung', page: '/bruecken', trigger: 'bruecke_auswahl' },
  { id: 'br-4', text: 'Eine Brücke ist ein kleiner Schritt, kein Sprung.', textEn: 'A bridge is a small step, not a leap.', category: 'erklaerung', page: '/bruecken', trigger: 'eintrag_erstellen' },
  { id: 'br-6', text: 'Deine Brücke darf sich verändern, so wie du dich veränderst.', textEn: 'Your bridge is allowed to change, just like you do.', category: 'ermutigung', page: '/bruecken', trigger: 'eintrag_bearbeiten' },
  { id: 'br-7', text: 'Änderung gespeichert.', textEn: 'Change saved.', category: 'feedback', page: '/bruecken', trigger: 'eintrag_bearbeiten' },
  { id: 'br-5', text: 'Deine Brücke ist gespeichert.', textEn: 'Your bridge is saved.', category: 'feedback', page: '/bruecken', trigger: 'speichern' },

  // ---- Entdecken (hub) ----
  { id: 'ent-1', text: 'Hier findest du Dinge, die dir sonst schwerer zugänglich sind.', textEn: 'This is where you\'ll find things that are otherwise harder to reach.', category: 'einfuehrung', page: '/entdecken', trigger: 'erstes_oeffnen' },
  { id: 'ent-2', text: 'Nichts hier ist in Stein gemeißelt — alles darf sich verändern.', textEn: 'Nothing here is set in stone — everything\'s allowed to change.', category: 'beruhigend', page: '*', trigger: 'leerlauf' },

  // ---- Ressourcen ----
  {
    id: 'res-1',
    text: 'Ressourcen sind Dinge, die dir selbst Halt geben. Brücken sind kleine Schritte, die dich von hier zu etwas anderem hinführen — zu dir, zu deinem Körper, zu anderen oder nach draußen.', textEn: 'Resources are things that give you steadiness. Bridges are small steps that lead you from here to something else — to yourself, your body, other people, or the outside world.',
    category: 'erklaerung',
    page: '/entdecken/ressourcen',
    trigger: 'erstes_oeffnen',
  },
  { id: 'res-2', text: 'Auch ein einzelnes Lied kann eine Ressource sein.', textEn: 'Even a single song can be a resource.', category: 'tipp', page: '/entdecken/ressourcen', trigger: 'leerlauf' },
  { id: 'res-3', text: 'Favoriten helfen dir, schnell zurückzufinden.', textEn: 'Favorites help you find your way back quickly.', category: 'funktionshinweis', page: '/entdecken/ressourcen', trigger: 'leerlauf' },
  { id: 'res-7', text: 'Eine Ressource muss nicht besonders sein — nur echt.', textEn: 'A resource doesn\'t have to be special — just real.', category: 'tipp', page: '/entdecken/ressourcen', trigger: 'leerlauf' },
  { id: 'res-8', text: 'Auch ein Geruch, ein Ort oder eine Erinnerung kann eine Ressource sein.', textEn: 'A smell, a place, or a memory can be a resource too.', category: 'tipp', page: '/entdecken/ressourcen', trigger: 'leerlauf' },
  { id: 'res-9', text: 'Du musst nicht alle deine Ressourcen auf einmal sammeln.', textEn: 'You don\'t have to collect all your resources at once.', category: 'beruhigend', page: '*', trigger: 'leerlauf' },
  { id: 'res-10', text: 'Manche Ressourcen wirken sofort, andere erst mit der Zeit — beides zählt.', textEn: 'Some resources work right away, others take time — both count.', category: 'erklaerung', page: '/entdecken/ressourcen', trigger: 'leerlauf' },
  { id: 'res-11', text: 'Ressourcen müssen nicht nur Dinge sein, die du gerade benutzt — du kannst hier auch speichern, woran du dich später erinnern möchtest.', textEn: "Resources don't have to be things you're using right now — you can also save things you want to remember for later.", category: 'erklaerung', page: '/entdecken/ressourcen', trigger: 'leerlauf' },
  { id: 'res-12', text: 'Ein Buch, das du lesen willst. Ein Ort, den du besuchen möchtest. Auch das darf hier stehen.', textEn: 'A book you want to read. A place you want to visit. Those belong here too.', category: 'tipp', page: '/entdecken/ressourcen', trigger: 'leerlauf' },
  { id: 'res-4', text: 'Ressource gespeichert.', textEn: 'Resource saved.', category: 'feedback', page: '/entdecken/ressourcen', trigger: 'speichern' },
  { id: 'res-6', text: 'Änderung gespeichert.', textEn: 'Change saved.', category: 'feedback', page: '/entdecken/ressourcen', trigger: 'eintrag_bearbeiten' },
  { id: 'res-5', text: 'Schön, dass du das entdeckt hast.', textEn: 'Glad you found that.', category: 'feedback', page: '/entdecken/ressourcen', trigger: 'ressource_auswahl' },

  // ---- Zugangsrad ("Was ist greifbar") ----
  { id: 'wheel-1', text: 'Nicht zugänglich bedeutet nicht verschwunden.', textEn: 'Not reachable doesn\'t mean gone.', category: 'erklaerung', page: '/entdecken/zugangsrad', trigger: 'erstes_oeffnen' },
  { id: 'wheel-2', text: 'Die Regler dürfen sich täglich verschieben.', textEn: 'These sliders are allowed to shift day to day.', category: 'anleitung', page: '/entdecken/zugangsrad', trigger: 'leerlauf' },
  { id: 'wheel-3', text: 'Verknüpfe hier etwas Konkretes, das dir hilft, wenn dieser Bereich sich fern anfühlt.', textEn: 'Link something concrete here that helps when this area feels out of reach.', category: 'tipp', page: '/entdecken/zugangsrad', trigger: 'leerlauf' },
  { id: 'wheel-4', text: 'Ein niedriger Wert heute sagt nichts über morgen.', textEn: 'A low score today says nothing about tomorrow.', category: 'beruhigend', page: '*', trigger: 'leerlauf' },

  // ---- Bedürfnis-Kompass ----
  { id: 'need-1', text: 'Ein Bedürfnis zu erkennen ist schon ein wichtiger Schritt.', textEn: 'Recognizing a need is already an important step.', category: 'ermutigung', page: '/entdecken/beduerfnis-kompass', trigger: 'erstes_oeffnen' },
  { id: 'need-2', text: 'Es gibt meist mehr als einen Weg, ein Bedürfnis zu erfüllen.', textEn: 'There\'s usually more than one way to meet a need.', category: 'erklaerung', page: '/entdecken/beduerfnis-kompass', trigger: 'leerlauf' },
  { id: 'need-4', text: 'Ein Bedürfnis darf auch unklar bleiben — das ist kein Fehler.', textEn: 'A need is allowed to stay unclear — that\'s not a failure.', category: 'beruhigend', page: '*', trigger: 'leerlauf' },
  { id: 'need-5', text: 'Mehrere Bedürfnisse gleichzeitig zu spüren ist ganz normal.', textEn: 'Feeling several needs at once is completely normal.', category: 'erklaerung', page: '/entdecken/beduerfnis-kompass', trigger: 'leerlauf' },
  { id: 'need-3', text: 'Gut erkannt. Magst du schauen, was das gerade für dich bedeutet?', textEn: 'Good noticing. Want to look at what that means for you right now?', category: 'feedback', page: '/entdecken/beduerfnis-kompass', trigger: 'speichern' },

  // ---- Tageskurve ----
  { id: 'pv-1', text: 'Ein Punkt reicht — du musst nicht den ganzen Tag tracken.', textEn: 'One point is enough — you don\'t have to track the whole day.', category: 'beruhigend', page: '*', trigger: 'erstes_oeffnen' },
  { id: 'pv-2', text: 'Muster zeigen sich erst mit der Zeit, das ist normal.', textEn: 'Patterns only show up over time — that\'s normal.', category: 'erklaerung', page: '/entdecken/tageskurve', trigger: 'leerlauf' },
  { id: 'pv-4', text: 'Es gibt keinen falschen Punkt auf der Kurve.', textEn: 'There\'s no wrong point on the curve.', category: 'beruhigend', page: '*', trigger: 'leerlauf' },
  { id: 'pv-5', text: 'Du kannst so oft am Tag eintragen, wie es für dich stimmt — auch nur einmal.', textEn: 'Log as often in a day as feels right for you — even just once.', category: 'anleitung', page: '/entdecken/tageskurve', trigger: 'leerlauf' },
  { id: 'pv-6', text: 'Ein Zustand ist eine Momentaufnahme, keine Diagnose.', textEn: 'A state is a snapshot, not a diagnosis.', category: 'erklaerung', page: '/entdecken/tageskurve', trigger: 'leerlauf' },
  { id: 'pv-3', text: 'Gespeichert.', textEn: 'Saved.', category: 'feedback', page: '/entdecken/tageskurve', trigger: 'tageskurve' },

  // ---- Sicherheit (hub) ----
  { id: 'sic-1', text: 'Das hier ist dein privater, geschützter Bereich.', textEn: 'This is your private, protected space.', category: 'einfuehrung', page: '/sicherheit', trigger: 'erstes_oeffnen' },
  { id: 'sic-2', text: 'Du bestimmst, was hier hineinkommt.', textEn: 'You decide what goes in here.', category: 'beruhigend', page: '*', trigger: 'leerlauf' },

  // ---- Netzwerk ----
  { id: 'net-1', text: 'Du kannst die Knoten frei anordnen, wie es sich stimmig anfühlt.', textEn: 'You can arrange the nodes however feels right.', category: 'anleitung', page: '/sicherheit/netzwerk', trigger: 'erstes_oeffnen' },
  { id: 'net-2', text: 'Auch Orte oder Lieblingslieder dürfen hier rein.', textEn: 'Places or favorite songs are welcome here too.', category: 'tipp', page: '/sicherheit/netzwerk', trigger: 'leerlauf' },
  { id: 'net-7', text: 'Nicht jede Verbindung muss stark sein, um wichtig zu sein.', textEn: 'Not every connection has to be strong to matter.', category: 'erklaerung', page: '/sicherheit/netzwerk', trigger: 'leerlauf' },
  { id: 'net-8', text: 'Ein Foto ist optional — ein Symbol reicht genauso.', textEn: 'A photo is optional — a symbol works just as well.', category: 'funktionshinweis', page: '/sicherheit/netzwerk', trigger: 'leerlauf' },
  { id: 'net-3', text: 'Person gespeichert.', textEn: 'Person saved.', category: 'feedback', page: '/sicherheit/netzwerk', trigger: 'speichern' },
  { id: 'net-6', text: 'Änderung gespeichert.', textEn: 'Change saved.', category: 'feedback', page: '/sicherheit/netzwerk', trigger: 'eintrag_bearbeiten' },
  { id: 'net-4', text: 'Verbindung gelöscht.', textEn: 'Connection removed.', category: 'feedback', page: '/sicherheit/netzwerk', trigger: 'loeschen' },
  { id: 'net-5', text: 'Diese Person hilft dir vielleicht gerade.', textEn: 'This person might be able to help right now.', category: 'kontext', page: '/sicherheit/netzwerk', trigger: 'kontakt_auswahl' },

  // ---- Sicherheitsplan ----
  { id: 'plan-1', text: 'Das hier ist deine Struktur für schwierige Momente — persönlich, nicht klinisch.', textEn: 'This is your structure for hard moments — personal, not clinical.', category: 'einfuehrung', page: '/sicherheit/plan', trigger: 'erstes_oeffnen' },
  { id: 'plan-2', text: 'Dieser Plan darf sich jederzeit verändern.', textEn: 'This plan is allowed to change anytime.', category: 'beruhigend', page: '*', trigger: 'leerlauf' },
  { id: 'plan-3', text: 'Du kannst ihn als PDF exportieren und teilen, wenn du magst.', textEn: 'You can export it as a PDF and share it, if you\'d like.', category: 'funktionshinweis', page: '/sicherheit/plan', trigger: 'leerlauf' },
  { id: 'plan-5', text: 'Drei Möglichkeiten pro Warnstufe reichen oft mehr als eine lange Liste.', textEn: 'Three options per warning level often go further than one long list.', category: 'erklaerung', page: '/sicherheit/plan', trigger: 'leerlauf' },
  { id: 'plan-6', text: 'Du kannst mehrere Pläne anlegen, wenn dir das hilft, verschiedene Situationen zu unterscheiden.', textEn: 'You can create several plans if that helps you tell different situations apart.', category: 'funktionshinweis', page: '/sicherheit/plan', trigger: 'leerlauf' },
  { id: 'plan-7', text: 'Ganz bewusst nur Schwarz oder Weiß hier — dein Blick soll direkt bei den Warnfarben landen, nicht erst einen bunten Hintergrund sortieren müssen.', textEn: 'Deliberately just black or white here — your eye should go straight to the warning colors, not have to sort through a busy background first.', category: 'erklaerung', page: '/sicherheit/plan', trigger: 'leerlauf' },
  {
    id: 'plan-limit-1',
    text: 'Ich gebe dir hier nur drei Möglichkeiten, damit du im entscheidenden Moment nicht erst aus vielen Dingen auswählen musst. Wir suchen lieber die wenigen Dinge heraus, die dir wirklich helfen.', textEn: 'I\'m only giving you three options here, so in the moment that matters you\'re not sorting through a long list. Better to pick out the few things that truly help.',
    category: 'erklaerung',
    page: '/sicherheit/plan',
    trigger: 'sicherheitsplan_limit',
  },
  {
    id: 'plan-limit-2',
    text: 'In einer belastenden Situation ist eine kleine Auswahl leichter zugänglich als eine lange Liste. Deshalb gibt es hier bewusst nur drei Plätze — für das, was wirklich hilft.', textEn: 'In a hard moment, a short list is easier to reach for than a long one. That\'s why there are only three slots here — for what really helps.',
    category: 'erklaerung',
    page: '/sicherheit/plan',
    trigger: 'sicherheitsplan_limit',
  },
  {
    id: 'plan-limit-3',
    text: 'Wenn es schwer wird, hilft wenig Auswahl mehr als viel. Drei gut gewählte Dinge findest du schneller wieder als zehn.', textEn: 'When things get hard, fewer options help more than many. Three well-chosen things are easier to find again than ten.',
    category: 'erklaerung',
    page: '/sicherheit/plan',
    trigger: 'sicherheitsplan_limit',
  },

  // ---- Tagebuch ----
  { id: 'diary-1', text: 'Ein ruhiger, privater Ort — nur für dich.', textEn: 'A quiet, private space — just for you.', category: 'einfuehrung', page: '/sicherheit/tagebuch', trigger: 'erstes_oeffnen' },
  { id: 'diary-2', text: 'Niemand liest hier mit außer dir.', textEn: 'No one reads this but you.', category: 'beruhigend', page: '*', trigger: 'leerlauf' },
  { id: 'diary-3', text: 'Auch ein einziger Satz zählt als Eintrag.', textEn: 'Even a single sentence counts as an entry.', category: 'ermutigung', page: '/sicherheit/tagebuch', trigger: 'leerlauf' },
  { id: 'diary-5', text: 'Es muss nicht schön geschrieben sein. Es darf einfach ehrlich sein.', textEn: 'It doesn\'t have to be well-written. It just has to be honest.', category: 'ermutigung', page: '/sicherheit/tagebuch', trigger: 'leerlauf' },
  { id: 'diary-6', text: 'Eigene Kategorien helfen, Dinge auseinanderzuhalten, die nicht zusammengehören.', textEn: 'Custom categories help keep things apart that don\'t belong together.', category: 'funktionshinweis', page: '/sicherheit/tagebuch', trigger: 'leerlauf' },
  { id: 'diary-7', text: 'Du kannst jederzeit zurückblättern, ohne dich neu zu erklären.', textEn: 'You can look back anytime without having to explain yourself again.', category: 'erklaerung', page: '/sicherheit/tagebuch', trigger: 'leerlauf' },
  { id: 'diary-4', text: 'Eintrag gespeichert.', textEn: 'Entry saved.', category: 'feedback', page: '/sicherheit/tagebuch', trigger: 'speichern' },

  // ---- Lesezeichen ----
  { id: 'bm-1', text: 'Ein ruhiger Ort für Dinge, die dir wichtig waren oder wichtig werden könnten.', textEn: 'A quiet place for things that mattered to you, or might someday.', category: 'einfuehrung', page: '/entdecken/lesezeichen', trigger: 'erstes_oeffnen' },
  { id: 'bm-3', text: 'Eine Notiz dazu hilft dir später, dich wieder zu erinnern, warum es dir wichtig war.', textEn: 'A note alongside it helps you remember later why it mattered.', category: 'tipp', page: '/entdecken/lesezeichen', trigger: 'leerlauf' },
  { id: 'bm-4', text: 'Eigene Kategorien machen es leichter, später wiederzufinden, was du suchst.', textEn: 'Custom categories make it easier to find things again later.', category: 'funktionshinweis', page: '/entdecken/lesezeichen', trigger: 'leerlauf' },
  { id: 'bm-2', text: 'Quelle gespeichert.', textEn: 'Source saved.', category: 'feedback', page: '/entdecken/lesezeichen', trigger: 'speichern' },

  // ---- Medi-Log ----
  { id: 'medi-1', text: 'Ein ruhiger Ort, um festzuhalten, was du eingenommen hast — nichts weiter.', textEn: 'A quiet place to note what you\'ve taken — nothing more.', category: 'einfuehrung', page: '/entdecken/medi-log', trigger: 'erstes_oeffnen' },
  { id: 'medi-2', text: 'Ich bewerte hier nichts — das bleibt ganz bei dir.', textEn: 'I\'m not judging anything here — that\'s entirely up to you.', category: 'beruhigend', page: '*', trigger: 'leerlauf' },
  { id: 'medi-3', text: 'Auch eine kurze Notiz dazu, wie es war, kann später hilfreich sein.', textEn: 'Even a short note on how it went can be useful later.', category: 'tipp', page: '/entdecken/medi-log', trigger: 'leerlauf' },

  // ---- Sicherheitsplan: Warnsignale/Hilfsmittel hinzufügen ----
  { id: 'plan-4', text: 'Notiert.', textEn: 'Noted.', category: 'feedback', page: '/sicherheit/plan', trigger: 'speichern' },

  // ---- Einstellungen ----
  { id: 'set-1', text: 'Du darfst mich jederzeit gegen ein anderes Wesen tauschen.', textEn: 'You can swap me for a different being anytime.', category: 'funktionshinweis', page: '/einstellungen', trigger: 'erstes_oeffnen' },
  { id: 'set-2', text: 'Farbwelt, Sprache, Bewegung — alles anpassbar.', textEn: 'Color, language, movement — all yours to adjust.', category: 'einfuehrung', page: '/einstellungen', trigger: 'leerlauf' },
  { id: 'set-3', text: 'Du kannst mir auch eigene Eigenschaften geben, wenn dir keins der vorhandenen Wesen entspricht.', textEn: 'You can also give me your own traits, if none of the existing beings quite fit.', category: 'tipp', page: '/einstellungen', trigger: 'leerlauf' },

  // ---- Global unprompted asides (any page, shown occasionally when idle) ----
  { id: 'pos-1', text: 'Du bist schon einen Schritt weiter, als du denkst.', textEn: 'You\'re further along than you think.', category: 'positiv', page: '*', trigger: 'leerlauf' },
  { id: 'pos-2', text: 'Dass du hier bist, ist schon etwas.', textEn: 'The fact that you\'re here already counts for something.', category: 'positiv', page: '*', trigger: 'leerlauf' },
  { id: 'pos-3', text: 'Du kennst dich besser, als es sich manchmal anfühlt.', textEn: 'You know yourself better than it sometimes feels like.', category: 'positiv', page: '*', trigger: 'leerlauf' },
  { id: 'pos-4', text: 'Kleine Momente der Achtsamkeit summieren sich.', textEn: 'Small moments of noticing add up.', category: 'positiv', page: '*', trigger: 'leerlauf' },
  { id: 'calm-1', text: 'Atme kurz durch. Ich warte hier.', textEn: 'Take a breath. I\'ll wait right here.', category: 'beruhigend', page: '*', trigger: 'leerlauf' },
  { id: 'calm-2', text: 'Alles darf langsamer werden.', textEn: 'Everything\'s allowed to slow down.', category: 'beruhigend', page: '*', trigger: 'leerlauf' },
  { id: 'calm-3', text: 'Du musst gerade nichts entscheiden.', textEn: 'You don\'t have to decide anything right now.', category: 'beruhigend', page: '*', trigger: 'leerlauf' },
  { id: 'calm-4', text: 'Ein Moment nach dem anderen reicht.', textEn: 'One moment at a time is enough.', category: 'beruhigend', page: '*', trigger: 'leerlauf' },
  { id: 'hum-1', text: 'Ich zähl mal meine Funken. Eins, zwei… ah, verzählt.', textEn: 'I\'m counting my sparkles. One, two… ah, lost count.', category: 'humorvoll', page: '*', trigger: 'leerlauf' },
  { id: 'hum-2', text: 'Falls ich gerade komisch schaue — das ist nur mein Nachdenk-Gesicht.', textEn: 'If I look a bit odd right now, that\'s just my thinking face.', category: 'humorvoll', page: '*', trigger: 'leerlauf' },
  { id: 'hum-3', text: 'Ich schwebe hier einfach mal ein bisschen rum.', textEn: 'Just floating around here for a bit.', category: 'humorvoll', page: '*', trigger: 'leerlauf' },
  { id: 'hum-4', text: 'Kein Druck, aber ich find dich schon ziemlich gut.', textEn: 'No pressure, but I think you\'re pretty great.', category: 'humorvoll', page: '*', trigger: 'leerlauf' },
  { id: 'hum-5', text: 'Ich warte hier ganz professionell.', textEn: 'I\'m waiting here very professionally.', category: 'humorvoll', page: '*', trigger: 'leerlauf' },
  { id: 'hum-6', text: 'Nur falls du dich fragst: Ich bin immer noch da.', textEn: 'Just in case you\'re wondering — still here.', category: 'humorvoll', page: '*', trigger: 'leerlauf' },
  { id: 'hum-7', text: 'Ich könnte jetzt etwas sehr Kluges sagen. Ich entscheide mich dagegen.', textEn: 'I could say something very wise right now. Choosing not to.', category: 'humorvoll', page: '*', trigger: 'leerlauf' },
  { id: 'hum-8', text: 'Keine Sorge, ich mache auch mal Pause.', textEn: 'Don\'t worry, I take breaks too.', category: 'humorvoll', page: '*', trigger: 'leerlauf' },
  { id: 'hum-9', text: 'Ich übe gerade, geheimnisvoll auszusehen. Klappt mäßig.', textEn: 'Practicing my mysterious look. Going so-so.', category: 'humorvoll', page: '*', trigger: 'leerlauf' },
  { id: 'hum-10', text: 'Offiziell tue ich gerade sehr viel. Inoffiziell: nicht so sehr.', textEn: 'Officially, I\'m very busy right now. Unofficially: not really.', category: 'humorvoll', page: '*', trigger: 'leerlauf' },
  { id: 'hum-11', text: 'Ich hab kurz überlegt, was ich sagen soll. Das hier ist das Ergebnis.', textEn: 'I thought for a moment about what to say. This is the result.', category: 'humorvoll', page: '*', trigger: 'leerlauf' },
  { id: 'hum-12', text: 'Manchmal bin ich einfach nur hier. Das reicht auch.', textEn: 'Sometimes I\'m just here. That\'s enough too.', category: 'humorvoll', page: '*', trigger: 'leerlauf' },
  { id: 'hum-13', text: 'Ich hätte auch tanzen können. Hab mich für Stillstand entschieden.', textEn: 'I could\'ve danced instead. Went with standing still.', category: 'humorvoll', page: '*', trigger: 'leerlauf' },
  { id: 'hum-14', text: 'Falls du eine Pause brauchst — ich bin quasi Expertin darin, nichts zu tun.', textEn: 'If you need a break, I\'m basically an expert at doing nothing.', category: 'humorvoll', page: '*', trigger: 'leerlauf' },
  { id: 'hum-15', text: 'Ich glänze hier einfach mal ein bisschen vor mich hin.', textEn: 'Just quietly glowing over here.', category: 'humorvoll', page: '*', trigger: 'leerlauf' },
  { id: 'hum-16', text: 'Kleiner Funfact über mich: Ich bin sehr gut im Dasein.', textEn: 'Fun fact about me: I\'m very good at existing.', category: 'humorvoll', page: '*', trigger: 'leerlauf' },
  { id: 'hum-17', text: 'Ich hab mir überlegt, jetzt besonders weise zu wirken. Frag mich nicht, wie.', textEn: 'I decided to look extra wise right now. Don\'t ask me how.', category: 'humorvoll', page: '*', trigger: 'leerlauf' },
  { id: 'hum-18', text: 'Falls es dich beruhigt: Ich finde dich auch an schlechten Tagen okay.', textEn: 'If it helps: I think you\'re okay even on the bad days.', category: 'humorvoll', page: '*', trigger: 'leerlauf' },
  { id: 'trans-1', text: 'Gut. Weiter geht\u2019s.', textEn: 'Good. Onward.', category: 'feedback', page: '*', trigger: 'speichern' },
  { id: 'trans-2', text: 'Alles gespeichert.', textEn: 'All saved.', category: 'feedback', page: '*', trigger: 'speichern' },
  { id: 'trans-3', text: 'Das ist notiert.', textEn: 'Noted.', category: 'feedback', page: '*', trigger: 'speichern' },
  { id: 'trans-4', text: 'Schön gemacht.', textEn: 'Nicely done.', category: 'feedback', page: '*', trigger: 'speichern' },
  { id: 'trans-5', text: 'Du kannst mich übrigens auch dahin schieben, wo ich dich weniger störe.', textEn: 'By the way, you can drag me somewhere I\'m less in your way.', category: 'humorvoll', page: '*', trigger: 'leerlauf' },
  { id: 'trans-6', text: 'Ich kann auch umziehen. Ich bin da flexibel.', textEn: 'I can relocate too. I\'m flexible that way.', category: 'humorvoll', page: '*', trigger: 'leerlauf' },
];

/** Query the registry. Any field left undefined matches everything for that field. */
export function getLines(filter: { page?: string; trigger?: CompanionTrigger; category?: CompanionCategory }): CompanionLine[] {
  const deactivated = getDeactivatedIds();
  const builtIn = COMPANION_LINES.filter((line) => !deactivated.has(line.id));
  const now = currentTimeOfDay();
  const customMatchingTime = getCustomLines().filter((l) => !l.timeOfDay || l.timeOfDay === 'any' || l.timeOfDay === now);
  const custom = expandByFrequency(customMatchingTime);
  return [...builtIn, ...custom].filter((line) => {
    if (filter.page && line.page !== filter.page && line.page !== '*') return false;
    if (filter.trigger && line.trigger !== filter.trigger) return false;
    if (filter.category && line.category !== filter.category) return false;
    return true;
  });
}

/** Picks one matching line at random, or null if nothing matches.
 * When `preferredCategories` is given (a companion's personality — see
 * lichtwesen.ts), matches in those categories are strongly favored, so two
 * different beings on the same page genuinely tend to say different kinds
 * of things, not just look different. */
// Session-scoped memory of recently spoken lines (resets on a real page
// reload, persists across SPA navigation) — so the companion doesn't say
// the exact same thing twice in a row, or even within the same handful of
// moments. Excludes recent lines when picking, but always falls back to
// the full pool if that would leave nothing to say (a very small category
// with only 1-2 lines total should never go silent just because of this).
const RECENT_LINES_LIMIT = 6;
let recentLines: string[] = [];

function rememberLine(text: string): void {
  recentLines = [text, ...recentLines.filter((l) => l !== text)].slice(0, RECENT_LINES_LIMIT);
}

function pickAvoidingRepeats(pool: CompanionLine[]): CompanionLine {
  const fresh = pool.filter((l) => !recentLines.includes(textFor(l)));
  const source = fresh.length > 0 ? fresh : pool;
  const chosen = source[Math.floor(Math.random() * source.length)];
  rememberLine(textFor(chosen));
  return chosen;
}

export function pickLine(filter: {
  page?: string;
  trigger?: CompanionTrigger;
  category?: CompanionCategory;
  preferredCategories?: CompanionCategory[];
}): string | null {
  const matches = getLines(filter);
  if (matches.length === 0) return null;

  if (filter.preferredCategories && filter.preferredCategories.length > 0 && !filter.category) {
    // Weighted, not exclusive: a companion's preferred categories make its
    // own lines somewhat more likely to come up (personality still shows
    // through), but never at the cost of starving the rest of the pool.
    // The previous version picked ONLY from the preferred subset 75% of
    // the time — with most companions preferring just 2 of the ~8-10
    // categories a page uses, that meant seeing only a couple of lines
    // out of a much larger pool on repeat visits. Duplicating preferred
    // lines' weight instead of excluding everything else keeps the full
    // pool in play while still leaning toward the companion's voice.
    const weighted: CompanionLine[] = [];
    matches.forEach((l) => {
      weighted.push(l);
      if (filter.preferredCategories!.includes(l.category)) weighted.push(l);
    });
    return textFor(pickAvoidingRepeats(weighted));
  }

  return textFor(pickAvoidingRepeats(matches));
}

/** Exported so callers with their own fallback pool (like pageTips.ts) can
 * still benefit from repeat-avoidance instead of picking with raw
 * Math.random() and bypassing it. */
export function pickLineAvoidingRepeats(pool: CompanionLine[]): string | null {
  if (pool.length === 0) return null;
  return textFor(pickAvoidingRepeats(pool));
}
