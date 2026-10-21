import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

interface ModalStackContextValue {
  anyModalOpen: boolean;
  registerOpen: () => void;
  registerClose: () => void;
  /** "Wesen doppelt beim Timer"-Auftrag — a second, parallel counter
   * for modals that live OUTSIDE CompanionDock (like BridgeTimerView),
   * which already has its own richer companion presence and so should
   * hide the generic floating dock while open. Deliberately separate
   * from anyModalOpen: DistractionOverlay/GroundingOverlay/NeedsGame
   * are rendered AS CHILDREN of CompanionDock and register via the
   * plain (non-external) hook below — folding them into this counter
   * too would hide their own parent the instant they open, destroying
   * them before they could ever be seen (this exact bug happened once
   * before with anyModalOpen itself; see AppShell's hideCompanionDock
   * comment). */
  externalModalOpen: boolean;
  registerExternalOpen: () => void;
  registerExternalClose: () => void;
}

const ModalStackContext = createContext<ModalStackContextValue | undefined>(undefined);

/**
 * Tracks how many Modals are currently mounted-and-open across the whole
 * app. AppShell reads `anyModalOpen` to hide the bottom navigation while
 * a dialog has focus — this sidesteps any z-index/stacking-context
 * subtlety entirely: if the nav isn't rendered, it can't visually cover
 * the modal's Save button, full stop. `externalModalOpen` is the
 * separate, safe-for-the-floating-companion-too counter — see its own
 * doc comment above.
 */
export function ModalStackProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [externalCount, setExternalCount] = useState(0);
  return (
    <ModalStackContext.Provider
      value={{
        anyModalOpen: count > 0,
        registerOpen: () => setCount((c) => c + 1),
        registerClose: () => setCount((c) => Math.max(0, c - 1)),
        externalModalOpen: externalCount > 0,
        registerExternalOpen: () => setExternalCount((c) => c + 1),
        registerExternalClose: () => setExternalCount((c) => Math.max(0, c - 1)),
      }}
    >
      {children}
    </ModalStackContext.Provider>
  );
}

export function useModalStack(): ModalStackContextValue {
  const ctx = useContext(ModalStackContext);
  if (!ctx) throw new Error('useModalStack must be used within ModalStackProvider');
  return ctx;
}

/** Call from any modal-like component with its `open` boolean; registers
 * and unregisters itself with the shared stack automatically. */
export function useRegisterModalOpen(open: boolean) {
  const { registerOpen, registerClose } = useModalStack();
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      registerOpen();
      wasOpen.current = true;
    } else if (!open && wasOpen.current) {
      registerClose();
      wasOpen.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(
    () => () => {
      if (wasOpen.current) registerClose();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}

/** Same as useRegisterModalOpen, but ALSO hides the floating companion
 * dock while open — only safe for modals that are not themselves
 * rendered as children of CompanionDock. See the context's doc comment
 * for why this needs to be a separate counter. */
export function useRegisterExternalModalOpen(open: boolean) {
  useRegisterModalOpen(open);
  const { registerExternalOpen, registerExternalClose } = useModalStack();
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      registerExternalOpen();
      wasOpen.current = true;
    } else if (!open && wasOpen.current) {
      registerExternalClose();
      wasOpen.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(
    () => () => {
      if (wasOpen.current) registerExternalClose();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}

