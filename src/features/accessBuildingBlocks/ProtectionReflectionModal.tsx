import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n';
import { useProtectionTexts } from './protectionTexts';
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
  const px = useProtectionTexts();
  const navigate = useNavigate();
  const existing = protectionReflectionFor(strategy);
  const go = (to: string) => {
    onClose();
    navigate(to);
  };

  const steps: ReflectionStep[] = [
    { id: 'intro', type: 'intro', introText: t.protectionRef.reflectionIntroText },
    { id: 'valence', type: 'checklist', label: t.protectionRef.valenceQ, options: t.protectionRef.valenceOptions },
    { id: 'protectedFrom', type: 'question', label: t.protectionRef.reflectionProtectedQ, placeholder: t.protectionRef.reflectionProtectedPlaceholder },
    { id: 'costsToday', type: 'question', label: t.protectionRef.reflectionCostsQ, placeholder: t.protectionRef.reflectionCostsPlaceholder },
    { id: 'notice', type: 'question', label: px.noticeQ, placeholder: px.noticePh },
    { id: 'trigger', type: 'question', label: px.triggerQ, placeholder: px.triggerPh },
    {
      id: 'alternative',
      type: 'question',
      label: t.protectionRef.reflectionAltQ,
      placeholder: t.protectionRef.reflectionAltPlaceholder,
      trailingHint: t.protectionRef.reflectionNoWrongHint,
      suggestions: PROTECTION_ALTERNATIVES_DE[strategy] ?? PROTECTION_ALTERNATIVES_GENERIC_DE,
      suggestionsLabel: t.protectionRef.altSuggestionsLabel,
    },
    {
      id: 'moreAlt',
      type: 'custom',
      render: () => (
        <div className="rounded-[var(--radius-lg)] p-4" style={{ background: 'var(--color-surface-muted)' }} data-testid="protection-more-alt">
          <p className="text-[14px] font-medium text-[var(--color-text)] mb-1">{px.moreAltTitle}</p>
          <p className="text-[12.5px] text-[var(--color-text-muted)] mb-3 leading-relaxed">{px.moreAltText}</p>
          <div className="flex flex-col gap-2">
            <button type="button" className="text-left text-[13.5px] px-4 py-2.5 rounded-full border border-[var(--color-border-strong)] text-[var(--color-text)]" onClick={() => { onClose(); setTimeout(() => document.getElementById('neue-schutzstrategien')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }} data-testid="protection-go-new">🛡️ {px.moreAltNew}</button>
            <button type="button" className="text-left text-[13.5px] px-4 py-2.5 rounded-full border border-[var(--color-border-strong)] text-[var(--color-text)]" onClick={() => go(`/entdecken/garten?alternativeFor=${encodeURIComponent(strategy)}`)} data-testid="protection-go-garden">🌱 {px.moreAltGarden}</button>
            <button type="button" className="text-left text-[13.5px] px-4 py-2.5 rounded-full border border-[var(--color-border-strong)] text-[var(--color-text)]" onClick={() => go(`/entdecken/routinen/neu?alternativeFor=${encodeURIComponent(strategy)}`)} data-testid="protection-go-routine">🔁 {px.moreAltRoutine}</button>
          </div>
        </div>
      ),
    },
    { id: 'replaceRoutine', type: 'question', label: px.replaceQ, placeholder: px.replacePh },
    { id: 'reward', type: 'question', label: px.rewardQ, placeholder: px.rewardPh },
    { id: 'setbackSupport', type: 'question', label: px.setbackQ, placeholder: px.setbackPh },
    { id: 'avoid', type: 'question', label: px.avoidQ, placeholder: px.avoidPh },
    { id: 'keepGoing', type: 'question', label: px.keepQ, placeholder: px.keepPh, trailingHint: t.protectionRef.reflectionNoWrongHint },
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
        notice: existing?.notice ?? '',
        trigger: existing?.trigger ?? '',
        replaceRoutine: existing?.replaceRoutine ?? '',
        reward: existing?.reward ?? '',
        setbackSupport: existing?.setbackSupport ?? '',
        avoid: existing?.avoid ?? '',
        keepGoing: existing?.keepGoing ?? '',
      }}
      onSave={(values) => saveProtectionReflection(strategy, values)}
      onClose={onClose}
    />
  );
}

/** New protection strategy: what for / when / what is needed. */
export function NewProtectionModal({ strategy, onClose }: { strategy: string; onClose: () => void }) {
  const t = useT();
  const px = useProtectionTexts();
  const key = NEW_PREFIX + strategy;
  const existing = protectionReflectionFor(key);

  const steps: ReflectionStep[] = [
    { id: 'intro', type: 'intro', introText: t.protectionRef.newIntroText },
    { id: 'whatFor', type: 'question', label: t.protectionRef.newWhatQ, placeholder: t.protectionRef.newWhatPlaceholder },
    { id: 'whenTry', type: 'question', label: t.protectionRef.newWhenQ, placeholder: t.protectionRef.newWhenPlaceholder },
    { id: 'needed', type: 'question', label: t.protectionRef.newNeedQ, placeholder: t.protectionRef.newNeedPlaceholder },
    { id: 'reward', type: 'question', label: px.rewardQ, placeholder: px.rewardPh },
    { id: 'setbackSupport', type: 'question', label: px.setbackQ, placeholder: px.setbackPh },
    { id: 'avoid', type: 'question', label: px.avoidQ, placeholder: px.avoidPh },
    { id: 'keepGoing', type: 'question', label: px.keepQ, placeholder: px.keepPh, trailingHint: t.protectionRef.reflectionNoWrongHint },
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
        reward: existing?.reward ?? '',
        setbackSupport: existing?.setbackSupport ?? '',
        avoid: existing?.avoid ?? '',
        keepGoing: existing?.keepGoing ?? '',
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
