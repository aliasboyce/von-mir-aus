import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Moon, MessageCircle, Compass, Wand2, Bell, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { useT } from '../../i18n';

/**
 * "Großer Qualitäts- und Erweiterungsprompt" brief, Section 2 — a
 * dedicated, calm info area for the companion, reached from Settings.
 * Deliberately small cards with short explanations rather than one
 * long text block. The "schlafen legen" card gets particular emphasis
 * per the explicit request: it must not read like deleting the
 * companion — it stays, it's just quiet for a while, and can be woken
 * any time.
 */
export function CompanionAboutPage() {
  const t = useT();
  const navigate = useNavigate();
  const [openDetail, setOpenDetail] = useState<string | null>(null);

  const items = [
    { icon: <MessageCircle size={18} />, title: t.companionAbout.messagesTitle, text: t.companionAbout.messagesText },
    { icon: <Compass size={18} />, title: t.companionAbout.helpTitle, text: t.companionAbout.helpText },
    { icon: <Bell size={18} />, title: t.companionAbout.feedbackTitle, text: t.companionAbout.feedbackText },
    { icon: <Wand2 size={18} />, title: t.companionAbout.randomTitle, text: t.companionAbout.randomText },
    { icon: <Settings2 size={18} />, title: t.companionAbout.customizeTitle, text: t.companionAbout.customizeText },
  ];

  const details = t.companionAbout.detailItems;

  return (
    <div className="animate-in">
      <TopBar onBack={() => navigate(-1)} />
      <div className="px-5 pb-8">
        <h1 className="text-[24px] mb-1">{t.companionAbout.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-6 leading-relaxed">{t.companionAbout.subtitle}</p>

        <Card className="mb-4" style={{ background: 'var(--color-primary-soft)' }}>
          <div className="flex items-start gap-3">
            <Moon size={20} className="text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-medium text-[var(--color-text)] mb-1.5">{t.companionAbout.sleepTitle}</p>
              <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-2">{t.companionAbout.sleepText}</p>
              <p className="text-[13px] text-[var(--color-text)] leading-relaxed font-medium">{t.companionAbout.sleepReassurance}</p>
            </div>
          </div>
        </Card>

        <Card className="mb-4">
          <p className="text-[14px] font-medium text-[var(--color-text)] mb-1">{t.companionAbout.hideTitle}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.companionAbout.hideText}</p>
        </Card>

        {items.map((item) => (
          <Card key={item.title} className="mb-3">
            <div className="flex items-start gap-3">
              <span className="text-[var(--color-primary)] flex-shrink-0 mt-0.5">{item.icon}</span>
              <div>
                <p className="text-[14px] font-medium text-[var(--color-text)] mb-1">{item.title}</p>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{item.text}</p>
              </div>
            </div>
          </Card>
        ))}

        <Card className="mt-3">
          <p className="text-[14px] font-medium text-[var(--color-text)] mb-1">{t.companionAbout.distractionTitle}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.companionAbout.distractionText}</p>
        </Card>

        <p className="text-[16px] text-[var(--color-text)] mt-7 mb-1">{t.companionAbout.detailSectionTitle}</p>
        <p className="text-[12px] text-[var(--color-text-faint)] mb-4 leading-relaxed">{t.companionAbout.detailSectionHint}</p>
        <div className="flex flex-col gap-2">
          {details.map((d) => {
            const open = openDetail === d.id;
            return (
              <Card key={d.id} padding="md">
                <button onClick={() => setOpenDetail(open ? null : d.id)} className="w-full flex items-center justify-between text-left">
                  <span className="text-[13px] font-medium text-[var(--color-text)]">{d.title}</span>
                  {open ? <ChevronUp size={15} className="text-[var(--color-text-faint)] flex-shrink-0" /> : <ChevronDown size={15} className="text-[var(--color-text-faint)] flex-shrink-0" />}
                </button>
                {open && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex flex-col gap-2.5">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-0.5">{t.companionAbout.qWhatIsIt}</p>
                      <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{d.whatIsIt}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-0.5">{t.companionAbout.qWhenHelpful}</p>
                      <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{d.whenHelpful}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-0.5">{t.companionAbout.qWhereConfigure}</p>
                      <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{d.whereConfigure}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-0.5">{t.companionAbout.qHowDisable}</p>
                      <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{d.howDisable}</p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
        <Link to="/einstellungen/wesen-inhalte" className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] mt-5">
          {t.companionAbout.manageContentLink} →
        </Link>
      </div>
    </div>
  );
}
