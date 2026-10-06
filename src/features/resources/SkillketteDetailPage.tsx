import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowDown, Pencil, Trash2 } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { useT } from '../../i18n';
import { skillkettenRepo } from './skillkettenRepo';
import { resourcesRepo } from './resourcesRepo';
import type { SkillketteStage } from '../../data/types';

/**
 * "Bei den Skillketten werden dann Skills mit noetigen Hilfsmitteln
 * angezeigt"-Auftrag — the visual chain view: each stage as a colored
 * card, each of its two actions resolved from a Skill id to that
 * Skill's own title (and, if the Skill references one, its needed
 * Hilfsmittel) rather than showing raw ids. A stage with an empty
 * action slot says so plainly instead of rendering nothing.
 */
export function SkillketteDetailPage() {
  const t = useT();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const kette = id ? skillkettenRepo.getById(id) : null;
  const allResources = resourcesRepo.getAll();
  const skillById = new Map(allResources.map((r) => [r.id, r]));

  if (!kette) {
    return (
      <div className="animate-in">
        <TopBar />
        <div className="px-5 text-[14px] text-[var(--color-text-muted)]">{t.resources.skillkettenEmptyState}</div>
      </div>
    );
  }

  function remove() {
    if (!window.confirm(t.resources.confirmDelete)) return;
    skillkettenRepo.remove(kette!.id);
    navigate('/entdecken/ressourcen/skillketten');
  }

  const stages: { stage: SkillketteStage; icon: string; title: string; range: string; color: string; aktion1Label: string; aktion2Label: string }[] = [
    { stage: kette.stufeHoch, icon: '🚨', title: t.resources.skillketteStufeHochTitle, range: '70–100 %', color: '#c9522f', aktion1Label: t.resources.skillketteAktionKoerperchemie, aktion2Label: t.resources.skillketteAktionMotorik },
    { stage: kette.stufeMittel, icon: '⚠️', title: t.resources.skillketteStufeMittelTitle, range: '40–70 %', color: '#e8a83d', aktion1Label: t.resources.skillketteAktionSensorik, aktion2Label: t.resources.skillketteAktionKognitiv },
    { stage: kette.stufeNiedrig, icon: '🧘', title: t.resources.skillketteStufeNiedrigTitle, range: '0–40 %', color: '#6fbf73', aktion1Label: t.resources.skillketteAktionKomfort, aktion2Label: t.resources.skillketteAktionAchtsamkeit },
  ];

  function renderAction(label: string, skillId?: string) {
    const skill = skillId ? skillById.get(skillId) : undefined;
    return (
      <div className="mb-2">
        <p className="text-[11px] text-[var(--color-text-faint)]">{label}</p>
        {skill ? (
          <>
            <p className="text-[13px] text-[var(--color-text)] font-medium">{skill.title}</p>
            {skill.skillDetails?.relatedHilfsmittelIds?.map((hid) => {
              const h = skillById.get(hid);
              return h ? (
                <p key={hid} className="text-[12px] text-[var(--color-text-muted)]">
                  🛠️ {t.resources.skillketteDetailHilfsmittelLabel}: {h.title}
                </p>
              ) : null;
            })}
          </>
        ) : (
          <p className="text-[13px] text-[var(--color-text-faint)] italic">{t.resources.skillketteDetailSkillEmpty}</p>
        )}
      </div>
    );
  }

  return (
    <div className="animate-in">
      <TopBar action={<HelpButton helpKey="ressourcen" />} />
      <div className="px-5 pb-10">
        <div className="flex items-start justify-between mb-1">
          <h1 className="text-[24px]">{kette.title}</h1>
        </div>
        {kette.subtitle && <p className="text-[14px] text-[var(--color-text-muted)] mb-4">{kette.subtitle}</p>}

        {/* "Skillkette starten" — same idea as 'Skill starten', but for the whole chain */}
        <button
          onClick={() => navigate(`/entdecken/ressourcen/skillketten/${kette.id}/start`)}
          className="w-full py-3.5 rounded-[var(--radius-full)] text-[15px] font-medium mb-5"
          style={{ background: 'var(--color-primary)', color: 'var(--color-surface)' }}
        >
          {t.skillRun.chainStartCta}
        </button>

        {(kette.notfallTrigger || kette.koerperlicheWarnsignale || kette.startProzent) && (
          <div className="rounded-[var(--radius-lg)] p-3.5 mb-4" style={{ background: 'var(--color-surface-muted)' }}>
            <p className="text-[12.5px] font-semibold text-[var(--color-text)] mb-1.5">{t.resources.skillketteSection1Title}</p>
            {kette.notfallTrigger && <p className="text-[13px] text-[var(--color-text)] mb-1">{kette.notfallTrigger}</p>}
            {kette.koerperlicheWarnsignale && <p className="text-[13px] text-[var(--color-text-muted)] mb-1">{kette.koerperlicheWarnsignale}</p>}
            {kette.startProzent && (
              <p className="text-[13px] text-[var(--color-text)]">
                {t.resources.skillketteAnspannung}: {kette.startProzent}%
              </p>
            )}
          </div>
        )}

        {stages.map((s, i) => (
          <div key={i}>
            <div className="rounded-[var(--radius-lg)] p-3.5 border-2" style={{ borderColor: s.color, background: `${s.color}14` }}>
              <p className="text-[13px] font-semibold mb-0.5" style={{ color: s.color }}>
                {s.icon} {s.title}
              </p>
              <p className="text-[12px] text-[var(--color-text-faint)] mb-2">
                {t.resources.skillketteAnspannung}: {s.range}
              </p>
              {s.stage.ziel && <p className="text-[13px] text-[var(--color-text)] mb-2 italic">{s.stage.ziel}</p>}
              {renderAction(s.aktion1Label, s.stage.aktion1SkillId)}
              {renderAction(s.aktion2Label, s.stage.aktion2SkillId)}
              {s.stage.dauer && (
                <p className="text-[12px] text-[var(--color-text-faint)] mt-1">
                  {t.resources.skillketteDauerLabel}: {s.stage.dauer}
                </p>
              )}
            </div>
            {i < stages.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowDown size={20} className="text-[var(--color-text-faint)]" />
              </div>
            )}
          </div>
        ))}

        {(kette.logistikZuhause || kette.logistikUnterstuetzung) && (
          <div className="rounded-[var(--radius-lg)] p-3.5 mt-4" style={{ background: 'var(--color-surface-muted)' }}>
            <p className="text-[12.5px] font-semibold text-[var(--color-text)] mb-1.5">{t.resources.skillketteSection3Title}</p>
            {kette.logistikZuhause && <p className="text-[13px] text-[var(--color-text)] mb-1">{kette.logistikZuhause}</p>}
            {kette.logistikUnterstuetzung && <p className="text-[13px] text-[var(--color-text)]">{kette.logistikUnterstuetzung}</p>}
          </div>
        )}

        {(kette.stopCheckRegel || kette.planB) && (
          <div className="rounded-[var(--radius-lg)] p-3.5 mt-3 border" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-[12.5px] font-semibold text-[var(--color-text)] mb-1.5">{t.resources.skillketteSection4Title}</p>
            {kette.stopCheckRegel && <p className="text-[13px] text-[var(--color-text)] mb-1">{kette.stopCheckRegel}</p>}
            {kette.planB && <p className="text-[13px] text-[var(--color-text)]">{kette.planB}</p>}
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <Link to={`/entdecken/ressourcen/skillketten/${kette.id}/bearbeiten`} className="flex-1">
            <button className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[var(--radius-full)] text-[13px]" style={{ border: '1px solid var(--color-border)' }}>
              <Pencil size={14} /> {t.common.edit}
            </button>
          </Link>
          <button onClick={remove} className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[var(--radius-full)] text-[13px]" style={{ border: '1px solid var(--color-border)', color: 'var(--color-danger)' }}>
            <Trash2 size={14} /> {t.common.delete}
          </button>
        </div>
      </div>
    </div>
  );
}
