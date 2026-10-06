import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, X, Sparkles, Bell, CalendarClock, Heart, Info } from 'lucide-react';
import { useT } from '../../i18n';
import { markAllMailRead, markMailRead, useMailbox, type MailItem, type MailKind } from '../../services/mailbox';
import { FollowUpBody, isFollowUpMail } from '../calendar/FollowUpBody';
import { ReviewMailBody, isReviewMail } from '../reviews/ReviewMailBody';

/** A live entry computed by HomePage from state that already lives
 * there (a due letter, today's check-in reminder, a custom reminder).
 * Unlike a MailItem it has no stored read-state — its own dismiss
 * handler decides. */
export interface LiveEntry {
  key: string;
  kind: MailKind;
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  actionTo?: string;
  onDismiss?: () => void;
}

const KIND_ICON: Record<MailKind, typeof Mail> = {
  update: Sparkles,
  reminder: Bell,
  letter: Mail,
  followup: CalendarClock,
  checkin: Heart,
  energy: Heart,
  info: Info,
};

function runMailAction(m: MailItem) {
  if (m.actionKind === 'reload') window.location.reload();
}

/** The small envelope in the Home header. Glows and pulses while
 * anything is unread / pending. */
export function PostfachButton({ count, open, onToggle }: { count: number; open: boolean; onToggle: () => void }) {
  const t = useT();
  return (
    <button
      onClick={onToggle}
      aria-label={t.postfach.open}
      aria-expanded={open}
      className={`relative w-10 h-10 rounded-full flex items-center justify-center ${count > 0 ? 'pulse-glow text-[var(--color-accent-clay)]' : 'text-[var(--color-text-muted)]'} hover:bg-[var(--color-surface-muted)]`}
    >
      <Mail size={20} />
      {count > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center"
          style={{ background: 'var(--color-accent-clay)', color: '#fff' }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * The expanded Postfach: live entries first (each with its text shown
 * straight away — reminders are never hidden behind another tap), then
 * unread stored mail, then an "Earlier" list of already-read mail.
 */
export function PostfachPanel({ live }: { live: LiveEntry[] }) {
  const t = useT();
  const { items, unread } = useMailbox();
  const [showEarlier, setShowEarlier] = useState(false);
  const read = items.filter((m) => m.readAt).slice(0, 12);
  const nothing = live.length === 0 && unread.length === 0;

  return (
    <div className="mb-6 rounded-[var(--radius-lg)] p-4 animate-in" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[14px] font-medium text-[var(--color-text)] flex items-center gap-1.5">
          <Mail size={15} className="text-[var(--color-accent-clay)]" />
          {t.postfach.title}
        </p>
        {unread.length > 1 && (
          <button onClick={markAllMailRead} className="text-[12px] text-[var(--color-text-muted)]">
            {t.postfach.markAllRead}
          </button>
        )}
      </div>

      {nothing && <p className="text-[13px] text-[var(--color-text-faint)]">{t.postfach.empty}</p>}

      <div className="flex flex-col gap-2.5">
        {live.map((e) => {
          const Icon = KIND_ICON[e.kind];
          return (
            <div key={e.key} className="rounded-[var(--radius-md)] p-3 pulse-glow" style={{ background: 'var(--color-surface-muted)' }}>
              <div className="flex items-start gap-2">
                <Icon size={16} className="text-[var(--color-accent-clay)] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[var(--color-text)]">{e.title}</p>
                  {e.text && <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed whitespace-pre-line">{e.text}</p>}
                  {e.actionLabel && e.actionTo && (
                    <Link to={e.actionTo} className="text-[13px] text-[var(--color-primary)] inline-block mt-1.5">
                      {e.actionLabel} →
                    </Link>
                  )}
                  {e.actionLabel && e.onAction && (
                    <button onClick={e.onAction} className="text-[13px] text-[var(--color-primary)] block mt-1.5">
                      {e.actionLabel} →
                    </button>
                  )}
                </div>
                {e.onDismiss && (
                  <button onClick={e.onDismiss} aria-label={t.postfach.markRead} className="p-1 text-[var(--color-text-faint)] flex-shrink-0">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {unread.map((m) => (
          <MailRow key={m.id} item={m} unread />
        ))}
      </div>

      {read.length > 0 && (
        <div className="mt-3">
          <button onClick={() => setShowEarlier((v) => !v)} className="text-[12px] text-[var(--color-text-muted)]">
            {t.postfach.earlier} ({read.length}) {showEarlier ? '▲' : '▼'}
          </button>
          {showEarlier && (
            <div className="flex flex-col gap-2 mt-2">
              {read.map((m) => (
                <MailRow key={m.id} item={m} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MailRow({ item, unread = false }: { item: MailItem; unread?: boolean }) {
  const t = useT();
  const Icon = KIND_ICON[item.kind];
  return (
    <div className={`rounded-[var(--radius-md)] p-3 ${unread ? 'pulse-glow' : ''}`} style={{ background: 'var(--color-surface-muted)', opacity: unread ? 1 : 0.75 }}>
      <div className="flex items-start gap-2">
        <Icon size={16} className={`flex-shrink-0 mt-0.5 ${unread ? 'text-[var(--color-accent-clay)]' : 'text-[var(--color-text-faint)]'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[var(--color-text)]">{item.title}</p>
          {item.text && <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed whitespace-pre-line">{item.text}</p>}
          {isFollowUpMail(item) && <FollowUpBody mail={item} />}
          {isReviewMail(item) && <ReviewMailBody mail={item} />}
          {item.actionKind === 'reload' && item.actionLabel && (
            <button onClick={() => runMailAction(item)} className="text-[13px] text-[var(--color-primary)] block mt-1.5">
              {item.actionLabel} →
            </button>
          )}
          {item.actionKind === 'link' && item.actionTo && item.actionLabel && (
            <Link to={item.actionTo} onClick={() => markMailRead(item.id)} className="text-[13px] text-[var(--color-primary)] inline-block mt-1.5">
              {item.actionLabel} →
            </Link>
          )}
        </div>
        {unread && (
          <button onClick={() => markMailRead(item.id)} aria-label={t.postfach.markRead} className="p-1 text-[var(--color-text-faint)] flex-shrink-0">
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
