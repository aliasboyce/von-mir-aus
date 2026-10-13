import { useT } from '../../i18n';
import { ReflectionModal, type ReflectionStep } from '../../components/shared/ReflectionModal';
import { saveProtectionReflection, protectionReflectionFor, NEW_PREFIX } from './protectionReflectionRepo';
import { PROTECTION_ALTERNATIVES_DE, PROTECTION_ALTERNATIVES_GENERIC_DE } from '../zugang/zugangContent';

/**
 * Old protection strategy: protected from / costs / valence / alternatives.
 * Everything is saved immediately while writing (autoSave) — "wenn man was
 * dazu aufschreibt, soll es gleich mit den Fragen gespeichert werden".
 */
export function ProtectionReflectionModal({ strategy, onClose }: { strategy: string; onClose: () => void }) {
  const t = useT();
  const existing = protectionReflectionFor(strategy);

  const steps: ReflectionStep[] = [
    { id: 'intro', type: 'intro', introText: t.protectionRef.reflectionIntroText },
    { id: 'valence', type: 'checklist', label: t.protectionRef.valenceQ, options: t.protectionRef.valenceOptions },
    { id: 'protectedFrom', type: 'question', label: t.protectionRef.reflectionProtectedQ, placeholder: t.protectionRef.reflectionProtectedPlaceholder },
    { id: 'costsToday', type: 'question', label: t.protectionRef.reflectionCostsQ, placeholder: t.protectionRef.reflectionCostsPlaceholder },
    {
      id: 'alternative',
      type: 'question',
      label: t.protectionRef.reflectionAltQ,
      placeholder: t.protectionRef.reflectionAltPlaceholder,
      trailingHint: t.protectionRef.reflectionNoWrongHint,
      suggestions: PROTECTION_ALTERNATIVES_DE[strategy] ?? PROTECTION_ALTERNATIVES_GENERIC_DE,
      suggestionsLabel: t.protectionRef.altSuggestionsLabel,
    },
  ];

  return (
    <ReflectionModal
      heading={strategy}
      steps={steps}
      mode="stepped"
      autoSave
      autoSaveNote={t.protectionRef.autoSavedNote}
      initialValues={{
        valence: existing?.valence ?? '',
        protectedFrom: existing?.protectedFrom ?? '',
        costsToday: existing?.costsToday ?? '',
        alternative: existing?.alternative ?? '',
      }}
      onSave={(values) => saveProtectionReflection(strategy, values)}
      onClose={onClose}
    />
  );
}

/** New protection strategy: what for / when / what is needed. */
export function NewProtectionModal({ strategy, onClose }: { strategy: string; onClose: () => void }) {
  const t = useT();
  const key = NEW_PREFIX + strategy;
  const existing = protectionReflectionFor(key);

  const steps: ReflectionStep[] = [
    { id: 'intro', type: 'intro', introText: t.protectionRef.newIntroText },
    { id: 'whatFor', type: 'question', label: t.protectionRef.newWhatQ, placeholder: t.protectionRef.newWhatPlaceholder },
    { id: 'whenTry', type: 'question', label: t.protectionRef.newWhenQ, placeholder: t.protectionRef.newWhenPlaceholder },
    { id: 'needed', type: 'question', label: t.protectionRef.newNeedQ, placeholder: t.protectionRef.newNeedPlaceholder, trailingHint: t.protectionRef.reflectionNoWrongHint },
  ];

  return (
    <ReflectionModal
      heading={strategy}
      steps={steps}
      mode="stepped"
      autoSave
      autoSaveNote={t.protectionRef.autoSavedNote}
      initialValues={{
        whatFor: existing?.whatFor ?? '',
        whenTry: existing?.whenTry ?? '',
        needed: existing?.needed ?? '',
      }}
      onSave={(values) => saveProtectionReflection(key, values)}
      onClose={onClose}
    />
  );
}

export function ObstacleReflectionModal({
  obstacle,
  applies,
  initial,
  onChange,
  onClose,
}: {
  obstacle: string;
  applies: boolean;
  initial: { how?: string; when?: string; small?: string };
  onChange: (values: { applies: boolean; how: string; when: string; small: string }) => void;
  onClose: () => void;
}) {
  const t = useT();
  const steps: ReflectionStep[] = [
    { id: 'intro', type: 'intro', introText: t.protectionRef.obstacleReflectIntro },
    { id: 'applies', type: 'checklist', label: t.protectionRef.obstacleAppliesQ, options: [t.protectionRef.obstacleAppliesOption] },
    { id: 'how', type: 'question', label: t.protectionRef.obstacleHowQ, placeholder: t.protectionRef.obstacleHowPlaceholder },
    { id: 'when', type: 'question', label: t.protectionRef.obstacleWhenQ, placeholder: t.protectionRef.obstacleWhenPlaceholder },
    { id: 'small', type: 'question', label: t.protectionRef.obstacleSmallQ, placeholder: t.protectionRef.obstacleSmallPlaceholder, trailingHint: t.protectionRef.reflectionNoWrongHint },
  ];
  return (
    <ReflectionModal
      heading={obstacle}
      steps={steps}
      mode="stepped"
      autoSave
      autoSaveNote={t.protectionRef.autoSavedNote}
      initialValues={{
        applies: applies ? t.protectionRef.obstacleAppliesOption : '',
        how: initial.how ?? '',
        when: initial.when ?? '',
        small: initial.small ?? '',
      }}
      onSave={(v) => onChange({ applies: !!v.applies, how: v.how ?? '', when: v.when ?? '', small: v.small ?? '' })}
      onClose={onClose}
    />
  );
}
