import { useCallback, useEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline, Heading, IndentIncrease, IndentDecrease } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';
import { editorToMarkup, markupToEditorHtml, MARK_CHAR, MAX_LEVEL, type ListMark } from '../../services/richText';

/**
 * Schreibfeld mit kleiner Leiste: fett, kursiv, unterstrichen, Überschrift, Aufzählung (Punkt / Herz / Stern) und
 * Einrücken für Unterpunkte – wie in der Notiz-App. Jede Zeile ist ein <div>; Listen-Marker und Einrückung sind
 * Attribute der Zeile (kein verschachteltes HTML), dadurch bleibt alles vorhersehbar. Gespeichert wird ein einfacher Text.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  style,
  autoFocus,
  minRows = 6,
  testId = 'rte',
}: {
  value: string;
  onChange: (markup: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  autoFocus?: boolean;
  minRows?: number;
  testId?: string;
}) {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const ref = useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = useState(!value);
  const [active, setActive] = useState({ b: false, i: false, u: false, h: false, mark: '' as '' | ListMark });
  const last = useRef(value);

  // the content is set once (and again only if the text is replaced from outside, e.g. a template)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.dataset.ready && last.current === value) return;
    el.innerHTML = markupToEditorHtml(value);
    el.dataset.ready = '1';
    last.current = value;
    setEmpty(!value.trim());
    if (autoFocus && !el.dataset.focused) {
      el.dataset.focused = '1';
      el.focus();
      const sel = window.getSelection();
      if (sel) {
        const r = document.createRange();
        r.selectNodeContents(el);
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
      }
    }
  }, [value, autoFocus]);

  const normalize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // everything lives in line <div>s: wrap stray text (the browser sometimes leaves it at the top level)
    const kids = Array.from(el.childNodes);
    if (kids.length === 0) {
      el.innerHTML = '<div><br></div>';
      return;
    }
    let run: Node[] = [];
    const wrap = () => {
      if (!run.length) return;
      const d = document.createElement('div');
      run[0].parentNode?.insertBefore(d, run[0]);
      run.forEach((n) => d.appendChild(n));
      run = [];
    };
    kids.forEach((n) => {
      if (n.nodeType === 1 && (n as HTMLElement).tagName === 'DIV') wrap();
      else if (n.nodeType === 1 && (n as HTMLElement).tagName === 'BR') {
        run.push(n);
        wrap();
      } else run.push(n);
    });
    wrap();
  }, []);

  const emit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    normalize();
    const m = editorToMarkup(el);
    last.current = m;
    setEmpty(!m.trim());
    onChange(m);
  }, [normalize, onChange]);

  /** the line <div> that contains a node */
  const lineOf = useCallback((n: Node | null, offset = 0): HTMLElement | null => {
    const root = ref.current;
    if (!root || !n) return null;
    // the caret can sit directly in the editor (e.g. when it is still empty): then the line is the child at that position
    if (n === root) n = root.childNodes[Math.min(offset, root.childNodes.length - 1)] ?? null;
    while (n && n.parentNode !== root) n = n.parentNode;
    return n && n.nodeType === 1 ? (n as HTMLElement) : null;
  }, []);

  /** all lines touched by the selection */
  const selectedLines = useCallback((): HTMLElement[] => {
    const root = ref.current;
    const sel = window.getSelection();
    if (!root || !sel || sel.rangeCount === 0) return [];
    const r = sel.getRangeAt(0);
    if (!root.contains(r.startContainer)) return [];
    const a = lineOf(r.startContainer, r.startOffset);
    const b = lineOf(r.endContainer, Math.max(0, r.endOffset - 1));
    if (!a || !b) return [];
    const out: HTMLElement[] = [];
    let cur: Element | null = a;
    while (cur) {
      out.push(cur as HTMLElement);
      if (cur === b) break;
      cur = cur.nextElementSibling;
    }
    return out;
  }, [lineOf]);

  const refreshActive = useCallback(() => {
    const root = ref.current;
    if (!root || document.activeElement !== root) return;
    const line = selectedLines()[0];
    let b = false;
    let i = false;
    let u = false;
    try {
      b = document.queryCommandState('bold');
      i = document.queryCommandState('italic');
      u = document.queryCommandState('underline');
    } catch {
      // not supported – the buttons just don't show their state
    }
    setActive({ b, i, u, h: !!line?.dataset.h, mark: (line?.dataset.m as ListMark | undefined) ?? '' });
  }, [selectedLines]);

  useEffect(() => {
    document.addEventListener('selectionchange', refreshActive);
    return () => document.removeEventListener('selectionchange', refreshActive);
  }, [refreshActive]);

  function keepCaretIn(line: HTMLElement, atEnd = false) {
    const sel = window.getSelection();
    if (!sel) return;
    const r = document.createRange();
    r.selectNodeContents(line);
    r.collapse(!atEnd);
    sel.removeAllRanges();
    sel.addRange(r);
  }

  function clearLineKind(line: HTMLElement) {
    delete line.dataset.h;
    delete line.dataset.m;
    delete line.dataset.l;
  }

  function fmt(cmd: 'bold' | 'italic' | 'underline') {
    ref.current?.focus();
    document.execCommand(cmd);
    emit();
    refreshActive();
  }

  function toggleHeading() {
    ref.current?.focus();
    const lines = selectedLines();
    if (!lines.length) return;
    const on = !lines.every((l) => l.dataset.h);
    lines.forEach((l) => {
      clearLineKind(l);
      if (on) l.dataset.h = '1';
    });
    emit();
    refreshActive();
  }

  function toggleMark(mark: ListMark) {
    ref.current?.focus();
    const lines = selectedLines();
    if (!lines.length) return;
    const off = lines.every((l) => l.dataset.m === mark);
    lines.forEach((l) => {
      const level = l.dataset.l;
      delete l.dataset.h;
      if (off) clearLineKind(l);
      else {
        l.dataset.m = mark;
        l.dataset.l = level ?? '0';
      }
    });
    emit();
    refreshActive();
  }

  function indent(dir: 1 | -1) {
    ref.current?.focus();
    const lines = selectedLines().filter((l) => l.dataset.m);
    lines.forEach((l) => {
      const n = Math.max(0, Math.min(MAX_LEVEL, (Number(l.dataset.l) || 0) + dir));
      l.dataset.l = String(n);
    });
    emit();
  }

  /** a new line after `line`, taking over what stands behind the caret; list lines continue the list */
  function splitLine(line: HTMLElement) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const r = sel.getRangeAt(0);
    if (!r.collapsed) r.deleteContents();
    const tail = document.createRange();
    tail.setStart(r.endContainer, r.endOffset);
    tail.setEnd(line, line.childNodes.length);
    const frag = tail.extractContents();
    const next = document.createElement('div');
    if (line.dataset.m) {
      next.dataset.m = line.dataset.m;
      next.dataset.l = line.dataset.l ?? '0';
    }
    next.appendChild(frag);
    if (!next.textContent && !next.querySelector('br')) next.appendChild(document.createElement('br'));
    if (!line.textContent && !line.querySelector('br')) line.appendChild(document.createElement('br'));
    line.after(next);
    keepCaretIn(next);
    next.scrollIntoView?.({ block: 'nearest' });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const sel = window.getSelection();
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      const line = lineOf(sel?.anchorNode ?? null, sel?.anchorOffset ?? 0);
      if (!line) return;
      e.preventDefault();
      // an empty list line + Enter ends the list (or goes one level out)
      if (line.dataset.m && !line.textContent?.trim()) {
        const lvl = Number(line.dataset.l) || 0;
        if (lvl > 0) line.dataset.l = String(lvl - 1);
        else clearLineKind(line);
      } else splitLine(line);
      emit();
      refreshActive();
      return;
    }
    if (e.key === 'Tab') {
      const line = lineOf(sel?.anchorNode ?? null, sel?.anchorOffset ?? 0);
      if (line?.dataset.m) {
        e.preventDefault();
        indent(e.shiftKey ? -1 : 1);
      }
      return;
    }
    if (e.key === 'Backspace' && sel && sel.isCollapsed) {
      const line = lineOf(sel.anchorNode, sel.anchorOffset);
      if (line && (line.dataset.m || line.dataset.h)) {
        const pre = document.createRange();
        pre.setStart(line, 0);
        pre.setEnd(sel.anchorNode!, sel.anchorOffset);
        if (pre.toString() === '' && !pre.cloneContents().querySelector('img')) {
          e.preventDefault();
          const lvl = Number(line.dataset.l) || 0;
          if (line.dataset.m && lvl > 0) line.dataset.l = String(lvl - 1);
          else clearLineKind(line);
          emit();
          refreshActive();
        }
      }
    }
  }

  /** pasted text always comes in as plain text, line by line */
  function onPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain').replace(/\r\n?/g, '\n');
    if (!text) return;
    const parts = text.split('\n');
    parts.forEach((p, i) => {
      if (i > 0) {
        const sel = window.getSelection();
        const line = lineOf(sel?.anchorNode ?? null, sel?.anchorOffset ?? 0);
        if (line) splitLine(line);
      }
      if (p) document.execCommand('insertText', false, p);
    });
    emit();
  }

  const btn = 'w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--color-text-muted)] flex-shrink-0';
  const on = 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]';
  const keep = (e: React.SyntheticEvent) => e.preventDefault(); // tapping a button must not take the cursor away
  const L = en
    ? { bold: 'Bold', italic: 'Italic', underline: 'Underline', heading: 'Heading', dot: 'Bullet list', heart: 'Heart list', star: 'Star list', ind: 'Indent (sub-point)', out: 'Outdent' }
    : { bold: 'Fett', italic: 'Kursiv', underline: 'Unterstrichen', heading: 'Überschrift', dot: 'Aufzählung mit Punkten', heart: 'Aufzählung mit Herzen', star: 'Aufzählung mit Sternen', ind: 'Einrücken (Unterpunkt)', out: 'Ausrücken' };

  return (
    <div className="mb-3" data-testid={testId}>
      <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar mb-1.5 -mx-1 px-1" role="toolbar" aria-label={en ? 'Formatting' : 'Formatierung'}>
        <button type="button" className={`${btn} ${active.b ? on : ''}`} onMouseDown={keep} onClick={() => fmt('bold')} aria-label={L.bold} aria-pressed={active.b} title={L.bold} data-testid={`${testId}-bold`}><Bold size={17} /></button>
        <button type="button" className={`${btn} ${active.i ? on : ''}`} onMouseDown={keep} onClick={() => fmt('italic')} aria-label={L.italic} aria-pressed={active.i} title={L.italic} data-testid={`${testId}-italic`}><Italic size={17} /></button>
        <button type="button" className={`${btn} ${active.u ? on : ''}`} onMouseDown={keep} onClick={() => fmt('underline')} aria-label={L.underline} aria-pressed={active.u} title={L.underline} data-testid={`${testId}-underline`}><Underline size={17} /></button>
        <button type="button" className={`${btn} ${active.h ? on : ''}`} onMouseDown={keep} onClick={toggleHeading} aria-label={L.heading} aria-pressed={active.h} title={L.heading} data-testid={`${testId}-heading`}><Heading size={17} /></button>
        <span className="w-px h-5 bg-[var(--color-border)] mx-1 flex-shrink-0" aria-hidden="true" />
        {(['dot', 'heart', 'star'] as ListMark[]).map((m) => (
          <button key={m} type="button" className={`${btn} text-[17px] ${active.mark === m ? on : ''}`} onMouseDown={keep} onClick={() => toggleMark(m)} aria-label={L[m]} aria-pressed={active.mark === m} title={L[m]} data-testid={`${testId}-list-${m}`}>{MARK_CHAR[m]}</button>
        ))}
        <button type="button" className={btn} onMouseDown={keep} onClick={() => indent(1)} aria-label={L.ind} title={L.ind} data-testid={`${testId}-indent`}><IndentIncrease size={17} /></button>
        <button type="button" className={btn} onMouseDown={keep} onClick={() => indent(-1)} aria-label={L.out} title={L.out} data-testid={`${testId}-outdent`}><IndentDecrease size={17} /></button>
      </div>
      <div className="relative">
        {empty && placeholder && (
          <div className="absolute left-0 top-0 px-[14px] py-[10px] pointer-events-none text-[var(--color-text-faint)]" style={style} aria-hidden="true">{placeholder}</div>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={placeholder}
          className="input rte-editor rte-lines"
          style={{ ...style, minHeight: `${minRows * 1.7}em`, height: 'auto', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}
          onInput={emit}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={emit}
          data-testid={`${testId}-editor`}
        />
      </div>
    </div>
  );
}
