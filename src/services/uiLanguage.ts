/** the current UI language for code that is not a React component (registries, helpers) – set from SettingsContext/CompanionSpeechContext */
let lang: 'de' | 'en' = 'de';
export const setUiLanguage = (l: 'de' | 'en') => {
  lang = l;
};
export const getUiLanguage = () => lang;
