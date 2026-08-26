import { Database, ExternalLink, Filter, Search, TableProperties } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTheme } from '../design-system/themeStore';
import { useDialogs } from '../dialogs/DialogProvider';
import { EmptyState, SuccessState, WarningState } from '../feedback/Feedback';
import { createDocumentService, InMemoryTextDocumentAdapter } from '../file-system/fileService';
import { useNotifications } from '../notifications/NotificationProvider';
import { useExternalWindowHost } from '../external-windows/ExternalWindowRoute';
import { useOptionalWindowManager } from './WindowManagerProvider';

export function DataExplorerWindow() {
  const { selection } = useTheme();
  const { notify } = useNotifications();
  const { confirm } = useDialogs();
  const manager = useOptionalWindowManager();
  const externalHost = useExternalWindowHost();
  const presentation = manager?.getPresentationState('data-explorer') ?? { mode: 'dual' as const, internal: false, external: false };
  const externalOpen = presentation.external || externalHost;
  const windowStateLabel = presentation.internal && externalOpen
    ? 'Open internally and externally'
    : presentation.internal
      ? 'Internal only'
      : externalOpen
        ? 'External only'
        : 'Not open';
  const service = useMemo(
    () => createDocumentService(
      new InMemoryTextDocumentAdapter({ savePath: '/text-preview.txt' }),
      {
        confirmDiscard: (document) => confirm({
          title: 'Discard text preview?',
          description: `Replace the unsaved ${document.format} document preview?`,
          confirmLabel: 'Discard',
          tone: 'danger',
        }),
      },
    ),
    [confirm],
  );
  const [documentState, setDocumentState] = useState(service.getState());
  const [feedback, setFeedback] = useState<'empty' | 'ready' | 'saved'>('empty');

  const createPreview = async () => {
    const outcome = await service.newDocument('Generic text document preview.');
    setDocumentState(service.getState());
    if (outcome.kind === 'success') {
      setFeedback('ready');
      notify({ kind: 'success', title: 'Untitled text ready', description: 'A generic in-memory document is ready to save.' });
    }
  };
  const savePreview = async () => {
    const outcome = await service.save();
    setDocumentState(service.getState());
    if (outcome.kind === 'success') {
      setFeedback('saved');
      notify({ kind: 'success', title: 'Text preview saved', description: `Saved through the document service to ${outcome.document.path}.` });
    } else if (outcome.kind === 'cancelled') {
      notify({ kind: 'warning', title: 'Save cancelled' });
    } else {
      notify({ kind: 'error', title: 'Text preview could not be saved', description: outcome.code });
    }
  };

  return (
    <div className="data-explorer">
      <div className="data-explorer__toolbar">
        <div>
          <p>Foundation utility</p>
          <h3>Inspect structured information</h3>
        </div>
        <div className="data-explorer__toolbar-actions">
          <span className="data-explorer__window-state" aria-label="Data Explorer window state">{windowStateLabel}</span>
          {!externalHost && presentation.mode !== 'internal' ? <button type="button" onClick={() => void manager?.openExternal('data-explorer')}><ExternalLink aria-hidden="true" size={15} /> Open in new window</button> : null}
          {!externalHost && externalOpen ? <button type="button" onClick={() => void manager?.closeExternal('data-explorer')}>Close external window</button> : null}
          <button type="button"><Filter aria-hidden="true" size={15} /> Filter</button>
        </div>
      </div>
      <label className="data-explorer__search">
        <Search aria-hidden="true" size={15} />
        <span className="sr-only">Search workspace data</span>
        <input placeholder="Search workspace data" />
      </label>
      <div className="data-explorer__summary">
        <Database aria-hidden="true" size={18} />
        <span>Sample source</span>
        <strong>4 fields</strong>
      </div>
      <div className="data-explorer__table" role="table" aria-label="Data Explorer preview">
        <div role="row" className="data-explorer__row data-explorer__row--head">
          <span role="columnheader">Name</span><span role="columnheader">Type</span><span role="columnheader">Status</span>
        </div>
        {['Project notes', 'Reference files', 'Workspace status'].map((name, index) => (
          <div role="row" className="data-explorer__row" key={name}>
            <span role="cell">{name}</span><span role="cell">{index === 1 ? 'Folder' : 'Record'}</span><span role="cell">Ready</span>
          </div>
        ))}
      </div>
      <section className="data-explorer__service-surface" aria-labelledby="document-feedback-title">
        <div>
          <p>Shared service feedback</p>
          <h4 id="document-feedback-title">Text document preview</h4>
        </div>
        <span>Appearance: {selection.family}-{selection.shade}</span>
        <div className="data-explorer__service-actions">
          <button type="button" onClick={createPreview}>Create untitled text</button>
          <button type="button" disabled={!documentState.document} onClick={savePreview}>Save text preview</button>
        </div>
        {feedback === 'empty' ? <EmptyState title="No active text document" description="Create a generic preview to exercise the file service." /> : null}
        {feedback === 'ready' ? <WarningState title="Untitled text ready" description="The preview has unsaved edits." /> : null}
        {feedback === 'saved' ? <SuccessState title="Text preview saved" description={documentState.currentPath ?? undefined} /> : null}
      </section>
      <div className="data-explorer__footer"><TableProperties aria-hidden="true" size={15} /> Example content is isolated from application data.</div>
    </div>
  );
}
