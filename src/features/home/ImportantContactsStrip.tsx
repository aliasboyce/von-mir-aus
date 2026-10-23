import { Link } from 'react-router-dom';
import { Phone, User } from 'lucide-react';
import { useT } from '../../i18n';
import { networkRepo } from '../safetyNet/networkRepo';

/**
 * "Die wichtigen Kontakte müssen über die Startseite sofort erreichbar
 * sein" — the person's starred contacts, one tap from the Startseite:
 * with a phone number the chip calls directly, without one it opens the
 * contact. Reads live from the network (same data as "Wichtige Kontakte"
 * in Sicherheit), so nothing is stored twice.
 */
export function ImportantContactsStrip() {
  const t = useT();
  const important = networkRepo.getAll().filter((e) => e.isImportantContact && !e.isExample);

  if (important.length === 0) {
    return (
      <Link to="/sicherheit/kontakte" className="text-[12px] text-[var(--color-primary)] block mb-6 -mt-3" data-testid="important-contacts-setup">
        {t.home.importantContactsSetup}
      </Link>
    );
  }

  const shown = important.slice(0, 4);
  return (
    <section className="mb-6 -mt-3" data-testid="important-contacts" aria-label={t.home.importantContactsTitle}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)]">{t.home.importantContactsTitle}</p>
        <Link to="/sicherheit/kontakte" className="text-[12px] text-[var(--color-primary)]">
          {t.home.importantContactsAll} →
        </Link>
      </div>
      <div className="flex gap-2 flex-wrap">
        {shown.map((c) => {
          const inner = (
            <>
              {c.phone ? <Phone size={14} className="flex-shrink-0" /> : <User size={14} className="flex-shrink-0" />}
              <span className="truncate max-w-[130px]">{c.name}</span>
            </>
          );
          const cls = 'flex items-center gap-2 px-3.5 py-2.5 rounded-full text-[13px] border';
          const style = { background: 'var(--color-primary-soft)', borderColor: 'var(--color-primary)', color: 'var(--color-text)' };
          return c.phone ? (
            <a key={c.id} href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} aria-label={t.home.importantContactsCall.replace('{name}', c.name)} className={cls} style={style}>
              {inner}
            </a>
          ) : (
            <Link key={c.id} to={`/sicherheit/netzwerk?open=${c.id}`} className={cls} style={style}>
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
