import { createContext, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import './dialogs.css';

export interface ConfirmDialogRequest {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
}

export interface DialogApi {
  confirm(request: ConfirmDialogRequest): Promise<boolean>;
  error(request: Omit<ConfirmDialogRequest, 'confirmLabel' | 'cancelLabel'>): Promise<void>;
}

type PendingDialog =
  | { kind: 'confirm'; request: ConfirmDialogRequest; resolve: (confirmed: boolean) => void; returnFocus: HTMLElement | null }
  | { kind: 'error'; request: Omit<ConfirmDialogRequest, 'confirmLabel' | 'cancelLabel'>; resolve: () => void; returnFocus: HTMLElement | null };

const DialogContext = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: PropsWithChildren) {
  const [queue, setQueue] = useState<readonly PendingDialog[]>([]);
  const actionRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const pending = queue[0] ?? null;

  useEffect(() => {
    if (!pending) return;
    (pending.kind === 'confirm' ? cancelRef.current : actionRef.current)?.focus();
  }, [pending]);

  const close = (confirmed: boolean) => {
    if (!pending) return;
    if (pending.kind === 'confirm') pending.resolve(confirmed);
    else pending.resolve();
    setQueue((current) => current.slice(1));
    queueMicrotask(() => pending.returnFocus?.focus());
  };

  const value = useMemo<DialogApi>(() => ({
    confirm(request) {
      const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      return new Promise<boolean>((resolve) => setQueue((current) => [...current, { kind: 'confirm', request, resolve, returnFocus }]));
    },
    error(request) {
      const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      return new Promise<void>((resolve) => setQueue((current) => [...current, { kind: 'error', request, resolve, returnFocus }]));
    },
  }), []);

  const request = pending?.request;
  return (
    <DialogContext.Provider value={value}>
      {children}
      {pending && request ? (
        <div className="dialog-backdrop" onMouseDown={() => close(false)}>
          <section
            className="app-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-dialog-title"
            aria-describedby={request.description ? 'app-dialog-description' : undefined}
            onMouseDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); close(false); } }}
          >
            <h2 id="app-dialog-title">{request.title}</h2>
            {request.description ? <p id="app-dialog-description">{request.description}</p> : null}
            <div className="app-dialog__actions">
              {pending.kind === 'confirm' ? <button ref={cancelRef} type="button" onClick={() => close(false)}>{pending.request.cancelLabel ?? 'Cancel'}</button> : null}
              <button
                ref={actionRef}
                className={pending.kind === 'confirm' && request.tone === 'danger' ? 'app-dialog__confirm--danger' : ''}
                type="button"
                onClick={() => close(true)}
              >
                {pending.kind === 'confirm' ? pending.request.confirmLabel ?? 'Confirm' : 'Close'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </DialogContext.Provider>
  );
}

export function useDialogs(): DialogApi {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialogs must be used within a DialogProvider.');
  return context;
}
