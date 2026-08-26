export type DocumentFormat = 'text';

export interface TextDocument {
  format: DocumentFormat;
  path: string | null;
  content: string;
  dirty: boolean;
}

export type FileErrorCode = 'not-found' | 'permission-denied' | 'unknown';

export type FileOperationResult =
  | { kind: 'success'; document: TextDocument }
  | { kind: 'cancelled' }
  | { kind: 'failure'; code: FileErrorCode; message?: string };

export type DocumentOperationState = 'idle' | 'loading' | 'success' | 'failure';

export interface DocumentState {
  status: DocumentOperationState;
  document: TextDocument | null;
  currentPath: string | null;
  recentFiles: readonly string[];
  error?: Extract<FileOperationResult, { kind: 'failure' }>;
}

export interface TextDocumentAdapter {
  chooseOpenPath(signal?: AbortSignal): Promise<string | null>;
  chooseSavePath(suggestedPath?: string, signal?: AbortSignal): Promise<string | null>;
  readText(path: string, signal?: AbortSignal): Promise<string>;
  writeText(path: string, content: string, signal?: AbortSignal): Promise<void>;
}

export type ConfirmDocumentDiscard = (document: TextDocument) => Promise<boolean>;

export interface DocumentServiceOptions {
  confirmDiscard?: ConfirmDocumentDiscard;
}

export interface DocumentService {
  getState(): DocumentState;
  subscribe(listener: () => void): () => void;
  newDocument(content?: string): Promise<FileOperationResult>;
  open(): Promise<FileOperationResult>;
  load(path: string): Promise<FileOperationResult>;
  save(): Promise<FileOperationResult>;
  saveAs(): Promise<FileOperationResult>;
  cancel(): void;
  updateContent(content: string): void;
}
