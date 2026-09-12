import { useT } from '../../i18n';
import { ReflectionModal, type ReflectionStep } from '../../components/shared/ReflectionModal';
import { saveProtectionReflection, protectionReflectionFor } from './protectionReflectionRepo';

/**
 * "Großer Qualitäts- und Erweiterungsprompt" brief, Section 10 — now
 * built on the shared ReflectionModal (audit Problem 3) instead of its
 * own bespoke stepped modal. Same intro card + three questions, same
 * step-by-step flow with progress bar — only the underlying component
 * changed.
 */
export function ProtectionReflectionModal({ strategy, onClose }: { strategy: string; onClose: () => void }) {
  const t = useT();
  const existing = protectionReflectionFor(strategy);

  const steps: ReflectionStep[] = [
    { id: 'intro', type: 'intro', introText: t.protectionRef.reflectionIntroText },
    { id: 'protectedFrom', type: 'question', label: t.protectionRef.reflectionProtectedQ, placeholder: t.protectionRef.reflectionProtectedPlaceholder },
    { id: 'costsToday', type: 'question', label: t.protectionRef.reflectionCostsQ, placeholder: t.protectionRef.reflectionCostsPlaceholder },
    { id: 'alternative', type: 'question', label: t.protectionRef.reflectionAltQ, placeholder: t.protectionRef.reflectionAltPlaceholder, trailingHint: t.protectionRef.reflectionNoWrongHint },
  ];

  return (
    <ReflectionModal
      heading={strategy}
      steps={steps}
      mode="stepped"
      initialValues={{
        protectedFrom: existing?.protectedFrom ?? '',
        costsToday: existing?.costsToday ?? '',
        alternative: existing?.alternative ?? '',
      }}
      onSave={(values) => saveProtectionReflection(strategy, values)}
      onClose={onClose}
    />
  );
}
