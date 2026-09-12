import { useT } from '../../i18n';
import { Link } from 'react-router-dom';
import { ReflectionModal, type ReflectionStep } from '../../components/shared/ReflectionModal';
import { valueCardFor, saveValueCard } from './wertekompassData';
import { indicatorsFor } from './valueIndicators';
import { useSettings } from '../../state/SettingsContext';
import { bridgesRepo } from '../bridges/bridgesRepo';
import { Card } from '../../components/ui/Card';
import { PhotoBackground } from '../../components/shared/PhotoBackground';

/**
 * "Weiterarbeit" brief, Sections 9/10/14 — now built on the shared
 * ReflectionModal (audit Problem 3) instead of its own bespoke modal.
 * Same four questions, same single-screen layout, same optional
 * fields — only the underlying component changed.
 *
 * "ChatGPT-Konzept" brief — new checklist step: "Woran würde ich
 * merken, dass ich so lebe?" turns the value into observable,
 * checkable everyday behavior (see valueIndicators.ts) rather than
 * only free-text reflection.
 */
export function ValueCardModal({ value, onClose }: { value: string; onClose: () => void }) {
  const t = useT();
  const { settings } = useSettings();
  const isEn = settings.language === 'en';
  const existing = valueCardFor(value);
  const indicatorSet = indicatorsFor(value);
  const matchingBridges = bridgesRepo.getAll().filter((b) => (b.connectionTags ?? []).includes(value));

  const steps: ReflectionStep[] = [
    { id: 'presenceInLife', type: 'question', label: t.wertekompass.cardPresenceLabel, placeholder: t.wertekompass.cardPresencePlaceholder },
    { id: 'presenceSatisfaction', type: 'question', label: t.wertekompass.cardSatisfactionLabel, placeholder: t.wertekompass.cardSatisfactionPlaceholder },
    { id: 'desiredSpace', type: 'question', label: t.wertekompass.cardDesiredSpaceLabel, placeholder: t.wertekompass.cardDesiredSpacePlaceholder },
    { id: 'personalMeaning', type: 'question', label: t.wertekompass.cardMeaningLabel, placeholder: t.wertekompass.cardMeaningPlaceholder },
    ...(indicatorSet
      ? [
          {
            id: 'livedIndicators',
            type: 'checklist' as const,
            label: t.wertekompass.cardIndicatorsLabel,
            options: isEn ? indicatorSet.indicatorsEn : indicatorSet.indicators,
            trailingHint: t.wertekompass.cardIndicatorsHint,
          },
        ]
      : []),
    { id: 'noticedThrough', type: 'question', label: t.wertekompass.cardNoticedLabel, placeholder: t.wertekompass.cardNoticedPlaceholder },
    { id: 'obstacles', type: 'question', label: t.wertekompass.cardObstaclesLabel, placeholder: t.wertekompass.cardObstaclesPlaceholder },
    { id: 'smallPossibilities', type: 'question', label: t.wertekompass.cardTodayLabel, placeholder: t.wertekompass.cardTodayPlaceholder },
    ...(matchingBridges.length > 0
      ? [
          {
            id: 'matchingBridges',
            type: 'custom' as const,
            render: () => (
              <div>
                <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">🌉 {t.wertekompass.cardMatchingBridgesTitle}</p>
                <div className="flex flex-col gap-2">
                  {matchingBridges.slice(0, 4).map((b) => (
                    <Link key={b.id} to={`/bruecken/${b.id}`}>
                      <Card interactive className="flex items-center gap-3">
                        <PhotoBackground src={b.image} className="w-10 h-10 rounded-full bg-cover bg-center flex-shrink-0" />
                        <p className="text-[14px] text-[var(--color-text)] truncate">{b.title}</p>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ),
          },
        ]
      : []),
    { id: 'hint', type: 'intro', introText: t.wertekompass.cardNoWrongHint },
  ];

  return (
    <ReflectionModal
      heading={value}
      steps={steps}
      mode="single"
      initialValues={{
        presenceInLife: existing?.presenceInLife ?? '',
        presenceSatisfaction: existing?.presenceSatisfaction ?? '',
        desiredSpace: existing?.desiredSpace ?? '',
        personalMeaning: existing?.personalMeaning ?? '',
        livedIndicators: (existing?.livedIndicators ?? []).join('|||'),
        noticedThrough: existing?.noticedThrough ?? '',
        obstacles: existing?.obstacles ?? '',
        smallPossibilities: existing?.smallPossibilities ?? '',
      }}
      onSave={(values) =>
        saveValueCard(value, {
          ...values,
          livedIndicators: values.livedIndicators ? values.livedIndicators.split('|||') : [],
        })
      }
      onClose={onClose}
    />
  );
}
