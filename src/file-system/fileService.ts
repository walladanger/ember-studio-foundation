import type {
  DocumentService,
  DocumentServiceOptions,
  DocumentState,
  FileErrorCode,
  FileOperationResult,
  TextDocument,
  TextDocumentAdapter,
} from './fileTypes';

function failureFrom(error: unknown): Extract<FileOperationResult, { kind: 'failure' }> {
  const code = error instanceof Error ? error.message : String(error);
  const normalized: FileErrorCode = code === 'not-found' || code === 'permission-denied' ? code : 'unknown';
  return { kind: 'failure', code: normalized, ...(normalized === 'unknown' ? { message: code } : {}) };
}

function newState(): DocumentState {
  return { status: 'idle', document: null, currentPath: null, recentFiles: [] };
}

function wasAborted(error: unknown, signal: AbortSignal) {
  return signal.aborted || (error instanceof DOMException && error.name === 'AbortError');
}

export function createDocumentService(
  adapter: TextDocumentAdapter,
  { confirmDiscard = async () => true }: DocumentServiceOptions = {},
): DocumentService {
  let state = newState();
  let revision = 0;
  let operation = 0;
  let activeController: AbortController | null = null;
  const listeners = new Set<() => void>();
  const publish = () => listeners.forEach((listener) => listener());
  const setState = (next: DocumentState) => { state = next; publish(); };
  const addRecent = (path: string, recentFiles = state.recentFiles) => [path, ...recentFiles.filter((recent) => recent !== path)].slice(0, 10);
  const success = (document: TextDocument): FileOperationResult => ({ kind: 'success', document });
  const isCurrent = (id: number) => id === operation;
  const begin = () => {
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;
    const id = ++operation;
    return { id, controller };
  };
  const finish = (id: number) => { if (isCurrent(id)) activeController = null; };
  const cancelOutcome = (id: number): FileOperationResult => {
    if (isCurrent(id)) setState({ ...state, status: 'idle', error: undefined });
    return { kind: 'cancelled' };
  };
  const confirmReplacement = async (id: number) => {
    if (!state.document?.dirty) return true;
    const confirmed = await confirmDiscard(state.document);
    return confirmed && isCurrent(id);
  };

  const loadAt = async (path: string, id: number, signal: AbortSignal): Promise<FileOperationResult> => {
    setState({ ...state, status: 'loading', error: undefined });
    try {
      const content = await adapter.readText(path, signal);
      if (!isCurrent(id) || signal.aborted) return { kind: 'cancelled' };
      const document: TextDocument = { format: 'text', path, content, dirty: false };
      revision += 1;
      setState({ status: 'success', document, currentPath: path, recentFiles: addRecent(path) });
      return success(document);
    } catch (error) {
      if (!isCurrent(id) || wasAborted(error, signal)) return cancelOutcome(id);
      const outcome = failureFrom(error);
      setState({ ...state, status: 'failure', error: outcome });
      return outcome;
    } finally {
      finish(id);
    }
  };

  const load = async (path: string): Promise<FileOperationResult> => {
    const { id, controller } = begin();
    if (!await confirmReplacement(id)) return cancelOutcome(id);
    return loadAt(path, id, controller.signal);
  };

  const open = async (): Promise<FileOperationResult> => {
    const { id, controller } = begin();
    if (!await confirmReplacement(id)) return cancelOutcome(id);
    try {
      const path = await adapter.chooseOpenPath(controller.signal);
      if (!isCurrent(id) || controller.signal.aborted || !path) return cancelOutcome(id);
      return loadAt(path, id, controller.signal);
    } catch (error) {
      if (!isCurrent(id) || wasAborted(error, controller.signal)) return cancelOutcome(id);
      const outcome = failureFrom(error);
      setState({ ...state, status: 'failure', error: outcome });
      finish(id);
      return outcome;
    }
  };

  const writeAt = async (path: string, id: number, signal: AbortSignal, document: TextDocument, savedRevision: number): Promise<FileOperationResult> => {
    setState({ ...state, status: 'loading', error: undefined });
    try {
      await adapter.writeText(path, document.content, signal);
      const savedDocument: TextDocument = { ...document, path, dirty: false };
      if (!isCurrent(id) || signal.aborted) return { kind: 'cancelled' };
      if (revision === savedRevision) {
        revision += 1;
        setState({ status: 'success', document: savedDocument, currentPath: path, recentFiles: addRecent(path) });
      } else {
        setState({ ...state, status: 'idle', error: undefined });
      }
      return success(savedDocument);
    } catch (error) {
      if (!isCurrent(id) || wasAborted(error, signal)) return cancelOutcome(id);
      const outcome = failureFrom(error);
      setState({ ...state, status: 'failure', error: outcome });
      return outcome;
    } finally {
      finish(id);
    }
  };

  const saveTo = async (path: string, id: number, controller: AbortController, document: TextDocument | null, savedRevision: number): Promise<FileOperationResult> => {
    if (!document) {
      const outcome: Extract<FileOperationResult, { kind: 'failure' }> = { kind: 'failure', code: 'unknown', message: 'No document is open.' };
      if (isCurrent(id)) setState({ ...state, status: 'failure', error: outcome });
      return outcome;
    }
    return writeAt(path, id, controller.signal, document, savedRevision);
  };

  const saveAs = async (): Promise<FileOperationResult> => {
    const { id, controller } = begin();
    const document = state.document;
    const savedRevision = revision;
    try {
      const path = await adapter.chooseSavePath(state.currentPath ?? undefined, controller.signal);
      if (!isCurrent(id) || controller.signal.aborted || !path) return cancelOutcome(id);
      return saveTo(path, id, controller, document, savedRevision);
    } catch (error) {
      if (!isCurrent(id) || wasAborted(error, controller.signal)) return cancelOutcome(id);
      const outcome = failureFrom(error);
      setState({ ...state, status: 'failure', error: outcome });
      finish(id);
      return outcome;
    }
  };

  const save = async (): Promise<FileOperationResult> => {
    if (!state.currentPath) return saveAs();
    const { id, controller } = begin();
    return saveTo(state.currentPath, id, controller, state.document, revision);
  };

  return {
    getState: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    async newDocument(content = '') {
      const { id } = begin();
      if (!await confirmReplacement(id)) return cancelOutcome(id);
      const document: TextDocument = { format: 'text', path: null, content, dirty: true };
      revision += 1;
      setState({ ...state, status: 'success', document, currentPath: null, error: undefined });
      finish(id);
      return success(document);
    },
    open,
    load,
    save,
    saveAs,
    cancel() {
      activeController?.abort();
      activeController = null;
      operation += 1;
      setState({ ...state, status: 'idle', error: undefined });
    },
    updateContent(content) {
      if (!state.document) return;
      revision += 1;
      setState({ ...state, status: 'idle', document: { ...state.document, content, dirty: true }, error: undefined });
    },
  };
}

export interface InMemoryTextDocumentAdapterOptions {
  files?: Record<string, string>;
  openPath?: string | null;
  savePath?: string | null;
  readError?: FileErrorCode;
  writeError?: FileErrorCode;
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
}

export class InMemoryTextDocumentAdapter implements TextDocumentAdapter {
  private readonly files: Record<string, string>;
  private readonly options: InMemoryTextDocumentAdapterOptions;
  constructor(options: InMemoryTextDocumentAdapterOptions = {}) { this.options = options; this.files = { ...options.files }; }
  async chooseOpenPath(signal?: AbortSignal) { throwIfAborted(signal); return this.options.openPath ?? null; }
  async chooseSavePath(_suggestedPath?: string, signal?: AbortSignal) { throwIfAborted(signal); return this.options.savePath ?? null; }
  async readText(path: string, signal?: AbortSignal) { throwIfAborted(signal); if (this.options.readError) throw new Error(this.options.readError); if (!(path in this.files)) throw new Error('not-found'); return this.files[path]; }
  async writeText(path: string, content: string, signal?: AbortSignal) { throwIfAborted(signal); if (this.options.writeError) throw new Error(this.options.writeError); this.files[path] = content; }
  getFile(path: string) { return this.files[path]; }
}
