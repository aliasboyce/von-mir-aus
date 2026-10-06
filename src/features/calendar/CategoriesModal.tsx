import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { createId } from '../../services/storage/repository';
import { calendarCategoriesRepo, appointmentsRepo, CATEGORY_COLOR_CHOICES, type CalendarCategory } from './calendarRepo';

/** "Terminkategorien erstellen, Farben individuell zuordnen"-Auftrag. */
export function CategoriesModal({ open, onClose, onChanged }: { open: boolean; onClose: () => void; onChanged: () => void }) {
  const t = useT();
  const [list, setList] = useState<CalendarCategory[]>(() => calendarCategoriesRepo.getAll());
  const [name, setName] = useState('');
  const [color, setColor] = useState(CATEGORY_COLOR_CHOICES[4]);

  function reload() {
    setList(calendarCategoriesRepo.getAll());
    onChanged();
  }

  function add() {
    if (!name.trim()) return;
    calendarCategoriesRepo.save({ id: createId('cal'), label: name.trim(), color });
    setName('');
    reload();
  }

  function rename(c: CalendarCategory, label: string) {
    calendarCategoriesRepo.save({ ...c, label });
    setList(calendarCategoriesRepo.getAll());
    onChanged();
  }

  function recolor(c: CalendarCategory, next: string) {
    calendarCategoriesRepo.save({ ...c, color: next });
    reload();
  }

  function remove(c: CalendarCategory) {
    // Appointments keep existing, just without a category.
    appointmentsRepo.getAll().filter((a) => a.categoryId === c.id).forEach((a) => appointmentsRepo.save({ ...a, categoryId: undefined }));
    calendarCategoriesRepo.remove(c.id);
    reload();
  }

  return (
    <Modal open={open} onClose={onClose} title={t.calendar.categoriesTitle}>
      <div className="flex flex-col gap-4 pb-2">
        {list.map((c) => (
          <div key={c.id} className="rounded-[var(--radius-md)] p-3" style={{ border: `1.5px solid ${c.color}` }}>
            <div className="flex items-center gap-2 mb-3">
              {/* "Terminkategorien selber bearbeiten/loeschen" — the name is an
               * input that saves as you type */}
              <input
                className="input flex-1"
                aria-label={t.calendar.categoryName}
                value={c.label}
                onChange={(e) => rename(c, e.target.value)}
                style={{ color: c.color, fontWeight: 600 }}
              />
              <button onClick={() => remove(c)} aria-label={t.calendar.categoryDelete} className="text-[var(--color-text-faint)] p-2">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORY_COLOR_CHOICES.map((col) => (
                <button key={col} onClick={() => recolor(c, col)} aria-label={col} className="w-7 h-7 rounded-full" style={{ background: col, outline: c.color === col ? '2px solid var(--color-text)' : 'none', outlineOffset: 2 }} />
              ))}
              <label className="relative w-7 h-7 rounded-full overflow-hidden border border-[var(--color-border)] flex items-center justify-center text-[14px] cursor-pointer" title={t.calendar.categoryOwnColor} style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}>
                <input type="color" value={c.color} onChange={(e) => recolor(c, e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" aria-label={t.calendar.categoryOwnColor} />
              </label>
            </div>
          </div>
        ))}

        <div className="rounded-[var(--radius-md)] p-3" style={{ background: 'var(--color-surface-muted)' }}>
          <input className="input mb-2" placeholder={t.calendar.categoryName} value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex flex-wrap gap-2 mb-3">
            {CATEGORY_COLOR_CHOICES.map((col) => (
              <button key={col} onClick={() => setColor(col)} aria-label={col} className="w-7 h-7 rounded-full" style={{ background: col, outline: color === col ? '2px solid var(--color-text)' : 'none', outlineOffset: 2 }} />
            ))}
            <label className="relative w-7 h-7 rounded-full overflow-hidden border border-[var(--color-border)] cursor-pointer" title={t.calendar.categoryOwnColor} style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" aria-label={t.calendar.categoryOwnColor} />
            </label>
          </div>
          <Button fullWidth onClick={add} disabled={!name.trim()}>
            {t.calendar.categoryAdd}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
