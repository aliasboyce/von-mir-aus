import { Link, useNavigate } from 'react-router-dom';
import { X, Compass, ShieldCheck, Users, ChevronLeft, Phone, Mail } from 'lucide-react';
import { useT } from '../../i18n';
import { GroundingOverlay } from '../../components/companion/GroundingOverlay';import { useState } from 'react';
import { safetyPlansRepo } from '../safetyPlan/safetyPlansRepo';
import { networkRepo } from '../safetyNet/networkRepo';

/**
 * Deliberately the opposite of every other page in this app visually:
 * plain white background, near-black text, solid high-contrast
 * buttons, almost no color or decoration. Not a "calming dark mode" —
 * a neutral, clinical, unmistakably different mode, closer to an
 * emergency information sheet than to the rest of the app's warm
 * palette. Fewer choices, larger touch targets, no tracking, no
 * check-in prompt, no companion chatter, nothing to read that isn't
 * load-bearing. If someone is here, the app should ask nothing of
 * them — just point at the few things that might genuinely help right
 * now, and make leaving just as easy as arriving.
 *
 * Section 6 of the "Verbinden, glätten" brief — the safety plan and
 * network buttons used to navigate straight to the normal, colorful
 * app pages, which meant tapping either one silently ended the crisis
 * mode context entirely. Both now open an in-place summary view,
 * styled the same way as the rest of this page, reading the exact
 * same underlying data (never a second copy) — leaving crisis mode
 * only ever happens via the explicit X button.
 */
export function CrisisModePage() {
  const t = useT();
  const navigate = useNavigate();
  const [groundingOpen, setGroundingOpen] = useState(false);
  const [view, setView] = useState<'main' | 'plan' | 'network'>('main');

  const plan = safetyPlansRepo.getAll()[0];
  const contacts = networkRepo.getAll().filter((c) => c.category === 'menschen');

  if (view === 'plan') {
    return (
      <div className="min-h-screen flex flex-col px-6 py-8 bg-white">
        <BackHeader onBack={() => setView('main')} label={t.crisisMode.safetyPlanCta} />
        {!plan || (plan.warningSignals.length === 0 && plan.helpItems.length === 0) ? (
          <p className="text-[15px] text-black/70 leading-relaxed mt-4">{t.crisisMode.noPlanYet}</p>
        ) : (
          <div className="mt-2 flex-1 overflow-y-auto">
            {plan.warningSignals.length > 0 && (
              <>
                <p className="text-[13px] uppercase tracking-wide text-black/60 mb-2">{t.safetyPlan.warningSignals}</p>
                <ul className="mb-6">
                  {plan.warningSignals.map((w) => (
                    <li key={w.id} className="text-[16px] text-black leading-relaxed mb-1.5">• {w.text}</li>
                  ))}
                </ul>
              </>
            )}
            {plan.helpItems.length > 0 && (
              <>
                <p className="text-[13px] uppercase tracking-wide text-black/60 mb-2">{t.safetyPlan.helpItems}</p>
                <ul>
                  {plan.helpItems.map((h) => (
                    <li key={h.id} className="text-[16px] text-black leading-relaxed mb-1.5">• {h.text}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
        <Link to="/sicherheit/plan" className="text-[14px] text-black/70 underline mt-6">
          {t.crisisMode.openFullPlanLink}
        </Link>
      </div>
    );
  }

  if (view === 'network') {
    return (
      <div className="min-h-screen flex flex-col px-6 py-8 bg-white">
        <BackHeader onBack={() => setView('main')} label={t.crisisMode.reachSomeoneCta} />
        {contacts.length === 0 ? (
          <p className="text-[15px] text-black/70 leading-relaxed mt-4">{t.crisisMode.noContactsYet}</p>
        ) : (
          <div className="flex flex-col gap-3 mt-2 flex-1 overflow-y-auto">
            {contacts.map((c) => (
              <div key={c.id} className="border-2 border-black/15 rounded-[12px] p-4">
                <p className="text-[16px] text-black font-medium mb-1">{c.name}</p>
                {c.role && <p className="text-[13px] text-black/60 mb-2">{c.role}</p>}
                <div className="flex flex-col gap-1">
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-[15px] text-black">
                      <Phone size={15} /> {c.phone}
                    </a>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-[15px] text-black">
                      <Mail size={15} /> {c.email}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <Link to="/sicherheit/netzwerk" className="text-[14px] text-black/70 underline mt-6">
          {t.crisisMode.openFullNetworkLink}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 bg-white">
      <button
        onClick={() => navigate('/')}
        aria-label={t.common.close}
        className="self-end w-11 h-11 rounded-full flex items-center justify-center text-black border-2 border-black hover:bg-black hover:text-white"
        style={{ marginTop: 'max(0px, env(safe-area-inset-top))' }}
      >
        <X size={24} />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-[340px] mx-auto w-full mt-6">
        <p className="text-[24px] text-black leading-relaxed mb-2 font-medium">{t.crisisMode.title}</p>
        <p className="text-[16px] text-black/80 leading-relaxed mb-10">{t.crisisMode.subtitle}</p>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => setGroundingOpen(true)}
            className="flex items-center gap-3 px-5 py-4 rounded-[12px] bg-black text-white text-[17px] font-medium hover:bg-black/85"
          >
            <Compass size={24} className="flex-shrink-0" />
            {t.crisisMode.groundingCta}
          </button>
          <button
            onClick={() => setView('plan')}
            className="flex items-center gap-3 px-5 py-4 rounded-[12px] bg-black text-white text-[17px] font-medium hover:bg-black/85"
          >
            <ShieldCheck size={24} className="flex-shrink-0" />
            {t.crisisMode.safetyPlanCta}
          </button>
          <button
            onClick={() => setView('network')}
            className="flex items-center gap-3 px-5 py-4 rounded-[12px] bg-black text-white text-[17px] font-medium hover:bg-black/85"
          >
            <Users size={24} className="flex-shrink-0" />
            {t.crisisMode.reachSomeoneCta}
          </button>
        </div>
      </div>

      <p className="text-[13px] text-black/60 text-center leading-relaxed mt-6 font-medium">{t.crisisMode.riskBoundaryNote}</p>
      <p className="text-[14px] text-black/70 text-center leading-relaxed mt-3 border-t-2 border-black/15 pt-5">{t.crisisMode.footer}</p>

      {groundingOpen && <GroundingOverlay onClose={() => setGroundingOpen(false)} />}
    </div>
  );
}

function BackHeader({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <button onClick={onBack} aria-label="Zurück" className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-black hover:bg-black/5">
        <ChevronLeft size={22} />
      </button>
      <p className="text-[18px] text-black font-medium">{label}</p>
    </div>
  );
}
