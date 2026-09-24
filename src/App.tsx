import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './app/ErrorBoundary';
import { SettingsProvider } from './state/SettingsContext';
import { SplashScreen } from './app/SplashScreen';
import { ThemeEffect } from './state/ThemeEffect';
import { ModalStackProvider } from './state/ModalStackContext';
import { CompanionSpeechProvider } from './state/CompanionSpeechContext';
import { HeroCompanionProvider } from './state/HeroCompanionContext';
import { I18nProvider } from './i18n';
import { AppShell } from './app/AppShell';
import { HomePage } from './features/home/HomePage';
import { CrisisModePage } from './features/home/CrisisModePage';
import { HelperModePage } from './features/home/HelperModePage';
import { NervousSystemReferencePage } from './features/accessBuildingBlocks/NervousSystemReferencePage';
import { BodyAwarenessReferencePage } from './features/accessBuildingBlocks/BodyAwarenessReferencePage';
import { ProtectionStrategiesReferencePage } from './features/accessBuildingBlocks/ProtectionStrategiesReferencePage';
import { DenkmaschinePage } from './features/denkmaschine/DenkmaschinePage';
import { FeelingsReferencePage } from './features/feelings/FeelingsReferencePage';
import { WertekompassPage } from './features/wertekompass/WertekompassPage';
import { LetGoPage } from './features/letGo/LetGoPage';
import { BriefAnMichPage } from './features/briefAnMich/BriefAnMichPage';
import { ExplorePage } from './features/home/ExplorePage';
import { SafetyHubPage } from './features/home/SafetyHubPage';
import { InnerWeatherPage } from './features/innerWeather/InnerWeatherPage';
import { BridgesPage } from './features/bridges/BridgesPage';
import { BridgeDetailPage } from './features/bridges/BridgeDetailPage';
import { ResourcesPage } from './features/resources/ResourcesPage';
// AccessWheelPage retired — see App.tsx route comment
import { ZugangPage } from './features/zugang/ZugangPage';
import { ZugangReviewPage } from './features/zugang/ZugangReviewPage';
import { CompanionContentPage } from './components/companion/CompanionContentPage';
import { CompanionAboutPage } from './features/settings/CompanionAboutPage';
import { SystemMapPage } from './features/systemMap/SystemMapPage';
import { SourceLibraryPage } from './features/sources/SourceLibraryPage';
import { NeedsCompassPage } from './features/accessWheel/NeedsCompassPage';
import { BookmarksPage } from './features/bookmarks/BookmarksPage';
import { FavoritesPage } from './features/favorites/FavoritesPage';
import { WeeklyReviewPage } from './features/diary/WeeklyReviewPage';
import { ResourceImportPage } from './features/resources/ResourceImportPage';
import { BridgeImportPage } from './features/bridges/BridgeImportPage';
import { BookmarkImportPage } from './features/bookmarks/BookmarkImportPage';
import { NetworkImportPage } from './features/safetyNet/NetworkImportPage';
import { SimpleTimerPage } from './features/timer/SimpleTimerPage';
import { GardenPage } from './features/garden/GardenPage';
import { MediLogPage } from './features/mediLog/MediLogPage';
import { MedicationPackagesPage } from './features/mediLog/MedicationPackagesPage';
import { PolyvagalPage } from './features/polyvagal/PolyvagalPage';
import { MeineEntwicklungPage } from './features/polyvagal/MeineEntwicklungPage';
import { SafetyNetPage } from './features/safetyNet/SafetyNetPage';
import { KontaktePage } from './features/safetyNet/KontaktePage';
import { SafetyPlanPage } from './features/safetyPlan/SafetyPlanPage';
import { DiaryPage } from './features/diary/DiaryPage';
import { SettingsPage } from './features/settings/SettingsPage';

function App() {
  return (
    <ErrorBoundary>
    <SettingsProvider>
      <ThemeEffect />
      <SplashScreen>
      <I18nProvider>
        <ModalStackProvider>
          <CompanionSpeechProvider>
            <HeroCompanionProvider>
            <BrowserRouter>
              <Routes>
              <Route element={<AppShell />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/krisenmodus" element={<CrisisModePage />} />
                <Route path="/helfermodus" element={<HelperModePage />} />
                <Route path="/entdecken/nervensystem" element={<NervousSystemReferencePage />} />
                <Route path="/entdecken/koerper" element={<BodyAwarenessReferencePage />} />
                <Route path="/entdecken/schutzstrategien" element={<ProtectionStrategiesReferencePage />} />
                <Route path="/entdecken/denkmaschine" element={<DenkmaschinePage />} />
                <Route path="/entdecken/gefuehle" element={<FeelingsReferencePage />} />
                <Route path="/entdecken/wertekompass" element={<WertekompassPage />} />
                <Route path="/entdecken/loslassen" element={<LetGoPage />} />
                <Route path="/entdecken/brief-an-mich" element={<BriefAnMichPage />} />
                <Route path="/inneres-wetter" element={<InnerWeatherPage />} />

                <Route path="/entdecken" element={<ExplorePage />} />
                <Route path="/entdecken/ressourcen" element={<ResourcesPage />} />
                {/* Zugangsrad retired per explicit audit decision — its
                 * sliders now live inside Wertekompass (AccessDomainsSection). */}
                <Route path="/zugang" element={<ZugangPage />} />
                <Route path="/zugang/rueckblick" element={<ZugangReviewPage />} />
                <Route path="/einstellungen/wesen-inhalte" element={<CompanionContentPage />} />
                <Route path="/einstellungen/wesen-info" element={<CompanionAboutPage />} />
                <Route path="/system-karte" element={<SystemMapPage />} />
                <Route path="/quellen" element={<SourceLibraryPage />} />
                <Route path="/entdecken/beduerfnis-kompass" element={<NeedsCompassPage />} />
                <Route path="/entdecken/tageskurve" element={<PolyvagalPage />} />
                <Route path="/entdecken/tageskurve/entwicklung" element={<MeineEntwicklungPage />} />
                <Route path="/entdecken/lesezeichen" element={<BookmarksPage />} />
                <Route path="/favoriten" element={<FavoritesPage />} />
                <Route path="/wochenrueckblick" element={<WeeklyReviewPage />} />
                <Route path="/entdecken/ressourcen/importieren" element={<ResourceImportPage />} />
                <Route path="/bruecken/importieren" element={<BridgeImportPage />} />
                <Route path="/entdecken/lesezeichen/importieren" element={<BookmarkImportPage />} />
                <Route path="/sicherheit/kontakte/importieren" element={<NetworkImportPage />} />
                <Route path="/entdecken/timer" element={<SimpleTimerPage />} />
                <Route path="/entdecken/garten" element={<GardenPage />} />
                <Route path="/entdecken/medi-log" element={<MediLogPage />} />
                <Route path="/entdecken/medi-log/packungen" element={<MedicationPackagesPage />} />

                <Route path="/bruecken" element={<BridgesPage />} />
                <Route path="/bruecken/:id" element={<BridgeDetailPage />} />

                <Route path="/sicherheit" element={<SafetyHubPage />} />
                <Route path="/sicherheit/netzwerk" element={<SafetyNetPage />} />
                <Route path="/sicherheit/kontakte" element={<KontaktePage />} />
                <Route path="/sicherheit/plan" element={<SafetyPlanPage />} />
                <Route path="/sicherheit/tagebuch" element={<DiaryPage />} />

                <Route path="/einstellungen" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
              </Routes>
            </BrowserRouter>
            </HeroCompanionProvider>
          </CompanionSpeechProvider>
        </ModalStackProvider>
      </I18nProvider>
      </SplashScreen>
    </SettingsProvider>
    </ErrorBoundary>
  );
}

export default App;
