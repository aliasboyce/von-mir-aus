import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, X as XIcon, Phone, Compass, MessageCircle } from 'lucide-react';
import { useT } from '../../i18n';
import { GroundingOverlay } from '../../components/companion/GroundingOverlay';
import { HelperSituationGuide } from './HelperSituationGuide';
import { SourceNoteCard } from '../../components/shared/SourceNoteCard';

/**
 * Scoped deliberately: general, sound guidance for someone supporting
 * another person, not a personalized system built on that other
 * person's private data (their safety plan, diary, etc. stay theirs —
 * this page never reaches into another account's data, there being no
 * multi-account concept in this app in the first place). If the app
 * ever grows a genuine multi-person "helper" system later, this is the
 * natural place to extend from.
 *
 * Section 7 of the "Verbinden, glätten" brief — connects two already-
 * existing, genuinely useful pieces instead of inventing a parallel
 * system: the Orientierung exercise (same GroundingOverlay Zugang
 * itself uses, reframed here as something to walk through *together*
 * rather than alone) and a small set of gentle, autonomy-respecting
 * questions to offer the other person — never a script to follow, and
 * never a substitute for what they actually say they need.
 */
export function HelperModePage() {
  const t = useT();
  const navigate = useNavigate();
  const [groundingOpen, setGroundingOpen] = useState(false);

  return (
    <div className="min-h-screen px-5 pt-6 pb-10 animate-in">
      <button
        onClick={() => navigate('/')}
        aria-label={t.common.back}
        className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-muted)] mb-2"
      >
        <ChevronLeft size={22} />
      </button>

      <h1 className="text-[24px] mb-1">{t.helperMode.title}</h1>
      <p className="text-[14px] text-[var(--color-text-muted)] mb-6 leading-relaxed">{t.helperMode.subtitle}</p>

      <HelperSituationGuide onOpenGrounding={() => setGroundingOpen(true)} />

      <div className="flex flex-col gap-2 mb-6">
        <button
          onClick={() => setGroundingOpen(true)}
          className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[var(--color-surface)] text-left"
        >
          <Compass size={18} className="flex-shrink-0" />
          <span className="text-[14px]">{t.helperMode.groundingTogetherCta}</span>
        </button>
      </div>

      <p className="text-[13px] font-medium text-[var(--color-text)] mt-2 mb-3">{t.helperMode.generalGuidanceIntro}</p>

      <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2 flex items-center gap-1.5">
        <MessageCircle size={12} /> {t.helperMode.askableQuestionsTitle}
      </p>
      <div className="flex flex-col gap-2 mb-6">
        {t.helperMode.askableQuestions.map((q, i) => (
          <p key={i} className="text-[14px] text-[var(--color-text)] leading-relaxed italic px-1">„{q}"</p>
        ))}
      </div>

      <div className="flex flex-col gap-2 mb-6">
        {t.helperMode.doItems.map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--color-primary-soft)]">
            <Check size={16} className="text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
            <p className="text-[14px] text-[var(--color-text)] leading-relaxed">{item}</p>
          </div>
        ))}
      </div>

      <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{t.helperMode.avoidTitle}</p>
      <div className="flex flex-col gap-2 mb-6">
        {t.helperMode.avoidItems.map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]">
            <XIcon size={16} className="text-[var(--color-text-faint)] flex-shrink-0 mt-0.5" />
            <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed">{item}</p>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] mb-4">
        <p className="flex items-center gap-2 text-[13px] font-medium text-[var(--color-text)] mb-2">
          <Phone size={15} /> {t.helperMode.emergencyTitle}
        </p>
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.helperMode.emergencyText}</p>
      </div>

      <Link to="/sicherheit/netzwerk" className="text-[13px] text-[var(--color-primary)]">
        {t.helperMode.linkToSafetyNet} →
      </Link>

      <div className="mt-5">
        <SourceNoteCard text={t.helperMode.sourceNote} sourceIds={['bbk-psychische-erste-hilfe', 'ifrc-psychologische-erste-hilfe']} />
      </div>

      {groundingOpen && <GroundingOverlay onClose={() => setGroundingOpen(false)} />}
    </div>
  );
}
