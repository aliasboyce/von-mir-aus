import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

interface ModalStackContextValue {
  anyModalOpen: boolean;
  registerOpen: () => void;
  registerClose: () => void;
}

const ModalStackContext = createContext<ModalStackContextValue | undefined>(undefined);

/**
 * Tracks how many Modals are currently mounted-and-open across the whole
 * app. AppShell reads `anyModalOpen` to hide the bottom navigation and the
 * floating companion while a dialog has focus — this sidesteps any
 * z-index/stacking-context subtlety entirely: if the nav isn't rendered,
 * it can't visually cover the modal's Save button, full stop.
 */
export function ModalStackProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  return (
    <ModalStackContext.Provider
      value={{
        anyModalOpen: count > 0,
        registerOpen: () => setCount((c) => c + 1),
        registerClose: () => setCount((c) => Math.max(0, c - 1)),
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
