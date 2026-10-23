/** Texts for the example entries of the safety network (same wording as the safety plan). */
export function netExampleTexts(lang: 'de' | 'en') {
  return lang === 'en'
    ? {
        badge: 'Example',
        hint: 'Entries marked “Example” are only suggestions. Edit them, keep them as yours or delete them – you can also delete all examples at once.',
        keep: 'Keep as mine',
        deleteAll: 'Delete all examples',
        confirmAll: 'Delete all example entries? Your own entries stay.',
        detailHint: 'This is an example. Change it so it fits you, keep it as it is, or delete it.',
      }
    : {
        badge: 'Beispiel',
        hint: 'Mit „Beispiel“ markierte Einträge sind nur Anregungen. Bearbeite sie, übernimm sie als deine eigenen oder lösche sie – auch alle Beispiele auf einmal.',
        keep: 'Als meinen übernehmen',
        deleteAll: 'Alle Beispiele löschen',
        confirmAll: 'Alle Beispiel-Einträge löschen? Deine eigenen Einträge bleiben.',
        detailHint: 'Das ist ein Beispiel. Ändere es so, dass es zu dir passt, übernimm es wie es ist oder lösche es.',
      };
}
