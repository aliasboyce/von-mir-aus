import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, RefreshCw, Check } from 'lucide-react';
import { InlineCompanionNote } from './InlineCompanionNote';
import { DISTRACTION_ITEMS, CATEGORY_KINDS, type DistractionItem, type DistractionCategory, type DistractionDifficulty } from './distractionContent';
import { generateMathProblem, type MathProblem } from './mathProblem';
import { getDeactivatedDistractionTexts, setDistractionActive } from './distractionManagement';
import { pickUnseenFirst, pickUnseenFirstById } from './distractionSeenTracking';
import { VocabLearnFlow } from './VocabLearnFlow';
import { VocabManageModal } from './VocabManageModal';
import { SudokuGame } from './SudokuGame';
import { CrosswordGame } from './CrosswordGame';
import { CustomDistractionManageModal } from './CustomDistractionManageModal';
import { AddOwnItemModal } from './AddOwnItemModal';
import { useRegisterModalOpen } from '../../state/ModalStackContext';
import { customDistractionCategoriesRepo, itemsForCategory, ownItemsForBuiltinCategory, builtinCategoryKey } from './customDistractionRepo';
import type { CustomDistractionItem } from '../../data/types';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';

interface DistractionOverlayProps {
  onClose: () => void;
}

const CATEGORY_ORDER: DistractionCategory[] = ['raetsel', 'brueckenwoerter', 'rechnen', 'sudoku', 'nachdenken', 'fakten', 'allgemeinwissen', 'vokabeln', 'alles'];
const DIFFICULTY_ORDER: DistractionDifficulty[] = ['leicht', 'mittel', 'schwer', 'sehr_schwer'];
/** Only these categories actually contain difficulty-tagged content —
 * showing the picker for a category without it would be a setting with
 * no effect, exactly the kind of "looks like a feature but does
 * nothing" problem this whole rework is fixing elsewhere in the app. */
const DIFFICULTY_AWARE_CATEGORIES: DistractionCategory[] = ['raetsel', 'brueckenwoerter', 'sudoku'];

function pickFromPool(pool: DistractionItem[], categoryKey: DistractionCategory, exclude: DistractionItem | null): DistractionItem {
  return pickUnseenFirst(pool, categoryKey, exclude);
}

const BUILTIN_CATEGORIES_FOR_ALLES: Exclude<DistractionCategory, 'rechnen' | 'alles' | 'vokabeln' | 'sudoku'>[] = [
  'raetsel', 'brueckenwoerter', 'nachdenken', 'fakten', 'allgemeinwissen',
];

/** A person's own addition to a built-in category has no natural
 * DistractionKind of its own — it's just "one more Rätsel" or "one more
 * Fakt" the person wrote themselves. Picking the first kind the
 * category maps to is a reasonable default (matters only for internal
 * bookkeeping like the management-page kind filter, never shown to the
 * person as a label distinct from the category itself). */
function ownItemToDistractionItem(item: ReturnType<typeof ownItemsForBuiltinCategory>[number], category: DistractionCategory): DistractionItem {
  const kind = CATEGORY_KINDS[category as Exclude<DistractionCategory, 'rechnen' | 'alles' | 'vokabeln' | 'sudoku'>]?.[0] ?? 'raetsel';
  return { kind, text: item.text, textEn: item.text, answer: item.answer, answerEn: item.answer, source: item.source };
}

function poolForCategory(category: DistractionCategory, difficulty: DistractionDifficulty | null): DistractionItem[] {
  if (category === 'rechnen' || category === 'vokabeln' || category === 'sudoku') return []; // handled entirely separately, never actually reached
  const deactivated = getDeactivatedDistractionTexts();
  const notDeactivated = DISTRACTION_ITEMS.filter((i) => !deactivated.has(i.text));
  const base = category === 'alles' ? notDeactivated : notDeactivated.filter((i) => CATEGORY_KINDS[category as Exclude<DistractionCategory, 'rechnen' | 'alles' | 'vokabeln' | 'sudoku'>].includes(i.kind));
  // Point 7 — a person's own items for this exact built-in category
  // (or, for "Alles", their own items across every built-in category)
  // are mixed straight into the same pool, not shown as some separate
  // second list — from the person's point of view it's simply more
  // Rätsel, more Fakten, and so on.
  const ownItems =
    category === 'alles'
      ? BUILTIN_CATEGORIES_FOR_ALLES.flatMap((c) => ownItemsForBuiltinCategory(c).map((i) => ownItemToDistractionItem(i, c)))
      : ownItemsForBuiltinCategory(category).map((i) => ownItemToDistractionItem(i, category));
  const combined = [...base, ...ownItems];
  if (!difficulty || category === 'alles') return combined;
  // Items with no difficulty tag (facts, jokes, open questions, and
  // every own addition) are difficulty-agnostic and always included
  // regardless of which tier is selected, so picking "Schwer" for
  // Rätsel doesn't accidentally hide content that was never meant to
  // have a difficulty in the first place.
  return combined.filter((i) => !i.difficulty || i.difficulty === difficulty);
}

/**
 * Starts with a category picker (Point 14) rather than jumping straight
 * into random content — the person chooses what they're in the mood
 * for. "Rechnen" is handled entirely separately from the static content
 * pool: math problems are generated fresh each time (see
 * mathProblem.ts) with a real interactive answer-check flow (type an
 * answer, check it, one retry if wrong, then the solution) instead of
 * the simple tap-to-reveal pattern the other content types use.
 */
export function DistractionOverlay({ onClose }: DistractionOverlayProps) {
  const t = useT();
  const { settings } = useSettings();
  useRegisterModalOpen(true);
  const isEn = settings.language === 'en';
  const [category, setCategory] = useState<DistractionCategory | null>(null);
  const [difficulty, setDifficulty] = useState<DistractionDifficulty | null>(null);
  const [puzzleType, setPuzzleType] = useState<'klassisch' | 'kreuzwort' | null>(null);
  const [current, setCurrent] = useState<DistractionItem | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [freeTextInput, setFreeTextInput] = useState('');
  const [freeTextState, setFreeTextState] = useState<'active' | 'wrongOnce' | 'correct'>('active');
  const [hintShown, setHintShown] = useState(false);
  const [quizState, setQuizState] = useState<'active' | 'wrongOnce' | 'correct' | 'solution'>('active');
  const [mathProblem, setMathProblem] = useState<MathProblem | null>(null);
  const [mathInput, setMathInput] = useState('');
  const [mathAttempts, setMathAttempts] = useState(0);
  const [mathState, setMathState] = useState<'active' | 'correct' | 'solution'>('active');
  const [vocabManageOpen, setVocabManageOpen] = useState(false);
  const [manageCustomOpen, setManageCustomOpen] = useState(false);
  const [addOwnItemOpen, setAddOwnItemOpen] = useState(false);
  const [customCategoryId, setCustomCategoryId] = useState<string | null>(null);
  const [customItem, setCustomItem] = useState<CustomDistractionItem | null>(null);
  const [customRevealed, setCustomRevealed] = useState(false);
  // The manage modal is a separate component with its own local state —
  // saving a new category there does not by itself re-render this
  // parent, so without this counter the freshly created category would
  // never actually appear back here on the picker screen. Bumped every
  // time the modal closes (see its onClose below).
  const [customRefresh, setCustomRefresh] = useState(0);
  const customCategories = useMemo(
    () => customDistractionCategoriesRepo.getAll().filter((c) => !c.archived),
    [customRefresh]
  );

  function chooseCustomCategory(categoryId: string) {
    setCustomCategoryId(categoryId);
    setCategory(null); // custom flow is rendered independently of the built-in `category` state
    const items = itemsForCategory(categoryId);
    setCustomItem(pickUnseenFirstById(items, categoryId, null));
    setCustomRevealed(false);
  }

  function nextCustomItem() {
    if (!customCategoryId) return;
    const items = itemsForCategory(customCategoryId);
    setCustomItem(pickUnseenFirstById(items, customCategoryId, customItem?.id ?? null));
    setCustomRevealed(false);
  }

  function chooseCategory(cat: DistractionCategory) {
    // Reset on every category change — a difficulty picked for one
    // category (e.g. Rätsel → schwer) must never silently carry over to
    // a different category (e.g. Rechnen), which is exactly the bug
    // this reset fixes: switching categories now always re-asks.
    setDifficulty(null);
    setPuzzleType(null);
    if (DIFFICULTY_AWARE_CATEGORIES.includes(cat)) {
      // Ask for a difficulty first rather than defaulting silently — the
      // brief specifically wants this to be a real, visible choice.
      setCategory(cat);
      return;
    }
    startCategory(cat, null);
  }

  function startCategory(cat: DistractionCategory, diff: DistractionDifficulty | null) {
    setCategory(cat);
    if (cat === 'rechnen') {
      setMathProblem(generateMathProblem());
      setMathInput('');
      setMathAttempts(0);
      setMathState('active');
    } else if (cat === 'vokabeln' || cat === 'sudoku') {
      // Rendered entirely by VocabLearnFlow / SudokuGame below — no
      // DISTRACTION_ITEMS pool to pick from for either category.
    } else {
      setCurrent(pickFromPool(poolForCategory(cat, diff), cat, null));
      setRevealed(false);
      setSelectedOption(null);
      setFreeTextInput('');
      setFreeTextState('active');
      setHintShown(false);
      setQuizState('active');
    }
  }

  function chooseDifficulty(diff: DistractionDifficulty) {
    setDifficulty(diff);
    if (category === 'raetsel') {
      // For Rätsel specifically, difficulty is followed by a puzzle-type
      // choice (classic riddle / crossword) rather than jumping straight
      // into a random classic riddle. Sudoku is its own top-level
      // category now, not nested here.
      return;
    }
    if (category) startCategory(category, diff);
  }

  function choosePuzzleType(type: 'klassisch' | 'kreuzwort') {
    setPuzzleType(type);
    if (type === 'klassisch' && category) startCategory(category, difficulty);
  }

  function next() {
    if (category === 'rechnen') {
      setMathProblem(generateMathProblem());
      setMathInput('');
      setMathAttempts(0);
      setMathState('active');
      return;
    }
    // Sudoku and Vokabeln each manage their own "next" state entirely
    // inside SudokuGame / VocabLearnFlow (their own "Neues Rätsel" /
    // card-queue controls) — this generic pool-based next() must never
    // run for them, since poolForCategory() returns an empty array for
    // both and would just clear the display.
    if (category === 'sudoku' || category === 'vokabeln') return;
    if (!category) return;
    setCurrent((prev) => pickFromPool(poolForCategory(category, difficulty), category, prev));
    setRevealed(false);
    setSelectedOption(null);
    setFreeTextInput('');
    setFreeTextState('active');
    setHintShown(false);
    setQuizState('active');
  }

  // Mirrors the math flow's shape (try, one retry if wrong, then the
  // solution) rather than the old flat tap-to-reveal — a wrong first
  // guess doesn't just dump the answer, it invites one more attempt.
  function pickOption(index: number) {
    if (!current || quizState === 'correct' || quizState === 'solution') return;
    setSelectedOption(index);
    if (index === current.correctIndex) {
      setQuizState('correct');
    } else if (quizState === 'active') {
      setQuizState('wrongOnce');
    } else {
      setQuizState('solution');
    }
  }

  /** Deliberately lenient rather than exact-match — the stored answer
   * text is often a full sentence ("162." or "14 Jahre (die Mutter ist
   * 41)."), not a strict single token, so this checks whether the
   * person's normalized guess appears as a whole "word" inside the
   * normalized answer, which comfortably covers single-word answers
   * (bridge words, riddle solutions) and short-number answers alike
   * without demanding the person match the full explanation text. */
  function answerRoughlyMatches(guess: string, answerText: string): boolean {
    const normalize = (s: string) => s.toLowerCase().trim().replace(/[.,!?"„"']/g, '');
    const g = normalize(guess);
    if (!g) return false;
    const a = normalize(answerText);
    return new RegExp(`(^|[^a-zäöüß0-9])${g.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-zäöüß0-9]|$)`).test(a);
  }

  function checkFreeText() {
    if (!current || !freeTextInput.trim()) return;
    const answerText = isEn ? current.answerEn ?? current.answer : current.answer ?? current.answerEn;
    if (answerText && answerRoughlyMatches(freeTextInput, answerText)) {
      setFreeTextState('correct');
    } else {
      setFreeTextState('wrongOnce');
    }
  }

  function checkMathAnswer() {
    if (!mathProblem) return;
    const parsed = Number(mathInput.trim().replace(',', '.'));
    if (parsed === mathProblem.answer) {
      setMathState('correct');
    } else if (mathAttempts === 0) {
      setMathAttempts(1);
      setMathInput('');
    } else {
      setMathState('solution');
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[240] bg-[var(--color-bg)] flex flex-col items-center px-6 py-16 overflow-y-auto animate-in no-print"
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        aria-label={t.common.close}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center"
        style={{ top: 'max(20px, env(safe-area-inset-top))' }}
      >
        <X size={20} />
      </button>

      <InlineCompanionNote />

      {customCategoryId ? (
        <div className="mt-6 w-full max-w-[300px] flex flex-col items-center">
          <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
            ✨ {customCategories.find((c) => c.id === customCategoryId)?.name}
          </p>
          {customItem ? (
            <>
              <p className="text-[17px] text-[var(--color-text)] text-center leading-relaxed mb-4">{customItem.text}</p>
              {customItem.answer && (
                <div className="mb-4 min-h-[24px] text-center">
                  {customRevealed ? (
                    <p className="text-[15px] text-[var(--color-primary)]">{customItem.answer}</p>
                  ) : (
                    <button onClick={() => setCustomRevealed(true)} className="text-[13px] text-[var(--color-primary)] underline">
                      {t.companion.revealAnswer}
                    </button>
                  )}
                </div>
              )}
              <p className="text-[11px] text-[var(--color-text-faint)] mb-4 italic">{customItem.source}</p>
            </>
          ) : (
            <p className="text-[13px] text-[var(--color-text-faint)] text-center mb-4">{t.customDistraction.noItems}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={nextCustomItem}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] bg-[var(--color-surface-muted)] text-[var(--color-text)]"
            >
              <RefreshCw size={14} />
              {t.companion.distractionNext}
            </button>
            <button
              onClick={() => setCustomCategoryId(null)}
              className="text-[13px] text-[var(--color-text-faint)] underline"
            >
              {t.companion.distractionChangeCategory}
            </button>
          </div>
        </div>
      ) : !category ? (
        <div className="mt-6 w-full max-w-[320px]">
          <p className="text-[17px] text-[var(--color-text)] text-center mb-2">{t.companion.distractionCategoryTitle}</p>
          <p className="text-[12px] text-[var(--color-text-faint)] text-center mb-5 leading-relaxed">{t.companion.distractionContentNote}</p>
          <div className="flex flex-col gap-2">
            {CATEGORY_ORDER.map((cat) => (
              <button
                key={cat}
                onClick={() => chooseCategory(cat)}
                className="px-4 py-3 rounded-[var(--radius-lg)] text-[15px] text-left bg-[var(--color-surface-muted)] text-[var(--color-text)]"
              >
                {t.companion.distractionCategories[cat]}
              </button>
            ))}
            {customCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => chooseCustomCategory(cat.id)}
                className="px-4 py-3 rounded-[var(--radius-lg)] text-[15px] text-left bg-[var(--color-surface-muted)] text-[var(--color-text)]"
              >
                ✨ {cat.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => setManageCustomOpen(true)}
            className="text-[13px] text-[var(--color-primary)] mt-4 block mx-auto"
          >
            + {t.customDistraction.createFromPicker}
          </button>
          <p className="text-[11px] text-[var(--color-text-faint)] text-center mt-2 leading-relaxed px-4">
            {t.customDistraction.ownContentHint}
          </p>
        </div>
      ) : DIFFICULTY_AWARE_CATEGORIES.includes(category) && difficulty === null ? (
        <div className="mt-6 w-full max-w-[320px]">
          <p className="text-[17px] text-[var(--color-text)] text-center mb-5">{t.companion.difficultyTitle}</p>
          <div className="flex flex-col gap-2">
            {DIFFICULTY_ORDER.map((diff) => (
              <button
                key={diff}
                onClick={() => chooseDifficulty(diff)}
                className="px-4 py-3 rounded-[var(--radius-lg)] text-[15px] text-left bg-[var(--color-surface-muted)] text-[var(--color-text)]"
              >
                {t.companion.difficultyLevels[diff]}
              </button>
            ))}
          </div>
          <button onClick={() => setCategory(null)} className="text-[13px] text-[var(--color-text-faint)] underline mt-4 block mx-auto">
            {t.common.back}
          </button>
        </div>
      ) : category === 'raetsel' && difficulty !== null && puzzleType === null ? (
        <div className="mt-6 w-full max-w-[320px]">
          <p className="text-[17px] text-[var(--color-text)] text-center mb-5">{t.companion.puzzleTypeTitle}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => choosePuzzleType('klassisch')}
              className="px-4 py-3 rounded-[var(--radius-lg)] text-[15px] text-left bg-[var(--color-surface-muted)] text-[var(--color-text)]"
            >
              {t.companion.puzzleTypeKlassisch}
            </button>
            <button
              onClick={() => choosePuzzleType('kreuzwort')}
              className="px-4 py-3 rounded-[var(--radius-lg)] text-[15px] text-left bg-[var(--color-surface-muted)] text-[var(--color-text)]"
            >
              {t.companion.puzzleTypeKreuzwort}
            </button>
          </div>
          <button onClick={() => setDifficulty(null)} className="text-[13px] text-[var(--color-text-faint)] underline mt-4 block mx-auto">
            {t.common.back}
          </button>
        </div>
      ) : category === 'sudoku' ? (
        <SudokuGame difficulty={difficulty === 'sehr_schwer' ? 'schwer' : (difficulty ?? 'mittel')} />
      ) : puzzleType === 'kreuzwort' ? (
        <CrosswordGame />
      ) : category === 'vokabeln' ? (
        <VocabLearnFlow onManage={() => setVocabManageOpen(true)} />
      ) : category === 'rechnen' && mathProblem ? (
        <>
          <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mt-5 mb-2">
            {t.companion.distractionCategories.rechnen}
          </p>
          <p className="text-[28px] text-[var(--color-text)] text-center mb-5 font-medium">{mathProblem.question}</p>

          {mathState === 'active' && (
            <div className="flex flex-col items-center gap-2 mb-4 w-full max-w-[220px]">
              {mathAttempts > 0 && <p className="text-[13px] text-[var(--color-text-muted)]">{t.companion.mathTryAgain}</p>}
              <input
                autoFocus
                type="number"
                inputMode="numeric"
                className="input text-center"
                placeholder={t.companion.mathPlaceholder}
                value={mathInput}
                onChange={(e) => setMathInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkMathAnswer()}
              />
              <button
                onClick={checkMathAnswer}
                disabled={mathInput.trim() === ''}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full text-[14px] bg-[var(--color-primary)] text-[var(--color-surface)] disabled:opacity-40"
              >
                <Check size={14} />
                {t.companion.mathCheck}
              </button>
            </div>
          )}

          {mathState === 'correct' && (
            <p className="text-[15px] text-[var(--color-primary)] mb-4">{t.companion.mathCorrect}</p>
          )}

          {mathState === 'solution' && (
            <p className="text-[15px] text-[var(--color-primary)] mb-4">
              {t.companion.mathSolution}: {mathProblem.answer}
            </p>
          )}
        </>
      ) : current ? (
        <>
          <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mt-5 mb-2">
            {t.companion.distractionKinds[current.kind]}
          </p>

          <p className="text-[17px] text-[var(--color-text)] text-center max-w-[300px] leading-relaxed mb-4">
            {isEn ? current.textEn : current.text}
          </p>

          {(difficulty === 'schwer' || difficulty === 'sehr_schwer') &&
          (current.kind === 'raetsel' || current.kind === 'brueckenwort') &&
          (current.answer || current.answerEn) ? (
            <div className="w-full max-w-[300px] flex flex-col items-center gap-2 mb-4">
              {freeTextState !== 'correct' && !revealed ? (
                <>
                  <input
                    className="input text-center"
                    placeholder={t.companion.freeTextPlaceholder}
                    value={freeTextInput}
                    onChange={(e) => setFreeTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && checkFreeText()}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={checkFreeText}
                      disabled={!freeTextInput.trim()}
                      className="px-4 py-2 rounded-full text-[13px] bg-[var(--color-primary)] text-[var(--color-surface)] disabled:opacity-40"
                    >
                      {t.companion.checkAnswerCta}
                    </button>
                    {!hintShown && (current.hint || current.hintEn) && (
                      <button onClick={() => setHintShown(true)} className="px-4 py-2 rounded-full text-[13px] bg-[var(--color-surface-muted)] text-[var(--color-text)]">
                        {t.companion.hintCta}
                      </button>
                    )}
                  </div>
                  {freeTextState === 'wrongOnce' && <p className="text-[13px] text-[var(--color-text-muted)] text-center">{t.companion.quizTryAgain}</p>}
                  {hintShown && (current.hint || current.hintEn) && (
                    <p className="text-[13px] text-[var(--color-text-muted)] text-center italic">{isEn ? current.hintEn ?? current.hint : current.hint ?? current.hintEn}</p>
                  )}
                  <button onClick={() => setRevealed(true)} className="text-[12px] text-[var(--color-text-faint)] underline mt-1">
                    {t.companion.revealAnswer}
                  </button>
                </>
              ) : (
                <>
                  {freeTextState === 'correct' && <p className="text-[14px] text-[var(--color-primary)] text-center">{t.companion.quizCorrect}</p>}
                  <p className="text-[15px] text-[var(--color-primary)] text-center">{isEn ? current.answerEn : current.answer}</p>
                  {(current.explanation || current.explanationEn) && (
                    <p className="text-[13px] text-[var(--color-text-muted)] text-center leading-relaxed">
                      {isEn ? current.explanationEn ?? current.explanation : current.explanation ?? current.explanationEn}
                    </p>
                  )}
                </>
              )}
            </div>
          ) : current.options && current.options.length > 0 ? (
            <div className="w-full max-w-[300px] flex flex-col gap-2 mb-4">
              {(isEn ? current.optionsEn ?? current.options : current.options).map((opt, i) => {
                const isSelected = selectedOption === i;
                const isCorrect = i === current.correctIndex;
                const showState = quizState === 'correct' || quizState === 'solution';
                return (
                  <button
                    key={i}
                    onClick={() => pickOption(i)}
                    disabled={quizState === 'correct' || quizState === 'solution'}
                    className="px-4 py-2.5 rounded-[var(--radius-lg)] text-[14px] text-left"
                    style={{
                      background: showState && isCorrect ? 'var(--color-primary-soft)' : isSelected && !isCorrect ? 'var(--color-danger-soft, #fbe4e4)' : 'var(--color-surface-muted)',
                      color: showState && isCorrect ? 'var(--color-primary)' : isSelected && !isCorrect ? 'var(--color-danger)' : 'var(--color-text)',
                      outline: showState && isCorrect ? '1.5px solid var(--color-primary)' : 'none',
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
              {quizState === 'wrongOnce' && <p className="text-[13px] text-[var(--color-text-muted)] text-center mt-1">{t.companion.quizTryAgain}</p>}
              {quizState === 'correct' && <p className="text-[14px] text-[var(--color-primary)] text-center mt-1">{t.companion.quizCorrect}</p>}
              {(quizState === 'correct' || quizState === 'solution') && (current.explanation || current.explanationEn) && (
                <p className="text-[13px] text-[var(--color-text-muted)] text-center mt-1 leading-relaxed">
                  {isEn ? current.explanationEn ?? current.explanation : current.explanation ?? current.explanationEn}
                </p>
              )}
            </div>
          ) : (
            (current.kind === 'raetsel' || current.kind === 'frage') &&
            (current.answer || current.answerEn) && (
              <div className="mb-4 min-h-[24px] text-center">
                {revealed ? (
                  <>
                    <p className="text-[15px] text-[var(--color-primary)] max-w-[300px]">{isEn ? current.answerEn : current.answer}</p>
                    {(current.explanation || current.explanationEn) && (
                      <p className="text-[13px] text-[var(--color-text-muted)] max-w-[300px] mt-1.5 leading-relaxed">
                        {isEn ? current.explanationEn ?? current.explanation : current.explanation ?? current.explanationEn}
                      </p>
                    )}
                  </>
                ) : (
                  <button onClick={() => setRevealed(true)} className="text-[13px] text-[var(--color-primary)] underline">
                    {t.companion.revealAnswer}
                  </button>
                )}
              </div>
            )
          )}

          {current.kind === 'fakt' && current.source && (
            <p className="text-[11px] text-[var(--color-text-faint)] mb-4 text-center">
              {t.companion.sourceLabel}:{' '}
              {current.sourceUrl ? (
                <a href={current.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  {current.source}
                </a>
              ) : (
                current.source
              )}
            </p>
          )}
        </>
      ) : null}

      {category && category !== 'sudoku' && category !== 'vokabeln' && puzzleType !== 'kreuzwort' && (
        <button
          onClick={next}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] bg-[var(--color-surface-muted)] text-[var(--color-text)] mt-2"
        >
          <RefreshCw size={14} />
          {category === 'rechnen' && mathState === 'active' ? t.companion.mathSkip : t.companion.distractionNext}
        </button>
      )}
      {category && category !== 'rechnen' && category !== 'vokabeln' && category !== 'sudoku' && category !== 'alles' && puzzleType !== 'kreuzwort' && (
        <button onClick={() => setAddOwnItemOpen(true)} className="text-[13px] text-[var(--color-primary)] mt-3">
          + {t.customDistraction.addOwnToCategoryCta}
        </button>
      )}
      {current && (
        <button
          onClick={() => {
            setDistractionActive(current.text, false);
            next();
          }}
          className="text-[12px] text-[var(--color-text-faint)] underline mt-2"
        >
          {t.companion.hideThisContentCta}
        </button>
      )}
      {(category || puzzleType) && (
        <button
          onClick={() => {
            setCategory(null);
            setCustomCategoryId(null);
            setPuzzleType(null);
            setDifficulty(null);
          }}
          className="text-[13px] text-[var(--color-text-faint)] underline mt-3"
        >
          {t.companion.distractionChangeCategory}
        </button>
      )}

      <VocabManageModal open={vocabManageOpen} onClose={() => setVocabManageOpen(false)} />
      <CustomDistractionManageModal
        open={manageCustomOpen}
        onClose={() => {
          setManageCustomOpen(false);
          setCustomRefresh((n) => n + 1);
        }}
        startCreating
      />
      {category && category !== 'rechnen' && category !== 'vokabeln' && category !== 'sudoku' && category !== 'alles' && (
        <AddOwnItemModal
          open={addOwnItemOpen}
          onClose={() => setAddOwnItemOpen(false)}
          categoryId={builtinCategoryKey(category)}
          categoryLabel={t.companion.distractionCategories[category]}
          onSaved={next}
        />
      )}
    </div>,
    document.body,
  );
}
