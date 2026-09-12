import { Users, ShieldCheck, NotebookPen, Library } from 'lucide-react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { ReorderableTiles } from '../../components/navigation/ReorderableTiles';
import { useT } from '../../i18n';

export function SafetyHubPage() {
  const t = useT();

  const tiles = [
    { key: 'ressourcen', to: '/entdecken/ressourcen', icon: Library, title: t.resources.title, subtitle: t.resources.subtitle },
    { key: 'netzwerk', to: '/sicherheit/netzwerk', icon: Users, title: t.network.title, subtitle: t.network.subtitle },
    { key: 'sicherheitsplan', to: '/sicherheit/plan', icon: ShieldCheck, title: t.safetyPlan.title, subtitle: t.safetyPlan.subtitle },
    { key: 'tagebuch', to: '/sicherheit/tagebuch', icon: NotebookPen, title: t.diary.title, subtitle: t.diary.subtitle },
  ];

  return (
    <div className="px-5 pt-8 pb-6 animate-in">
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-[24px]">{t.nav.safety}</h1>
        <HelpButton helpKey="sicherheit" />
      </div>
      <p className="text-[14px] text-[var(--color-text-muted)] mb-6">Dein privater, geschützter Bereich.</p>

      <ReorderableTiles section="sicherheit" tiles={tiles} />
    </div>
  );
}
