import { describe, expect, test } from 'vitest';
import { createDocumentService, InMemoryTextDocumentAdapter } from './fileService';
import type { TextDocumentAdapter } from './fileTypes';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => { resolve = nextResolve; });
  return { promise, resolve };
}

describe('DocumentService', () => {
  test('returns a cancelled result when the user cancels open', async () => {
    const service = createDocumentService(new InMemoryTextDocumentAdapter({ openPath: null }));

    await expect(service.open()).resolves.toEqual({ kind: 'cancelled' });
    expect(service.getState().status).toBe('idle');
  });

  test('maps a missing file to a stable error outcome', async () => {
    const service = createDocumentService(
      new InMemoryTextDocumentAdapter({ openPath: '/missing.txt', readError: 'not-found' }),
    );

    await expect(service.open()).resolves.toMatchObject({ kind: 'failure', code: 'not-found' });
    expect(service.getState()).toMatchObject({ status: 'failure', currentPath: null });
  });

  test('tracks a dirty document and clears it after save-as', async () => {
    const adapter = new InMemoryTextDocumentAdapter({ savePath: '/notes.txt' });
    const service = createDocumentService(adapter);

    expect(await service.newDocument('First note')).toMatchObject({ kind: 'success' });
    service.updateContent('Updated note');
    expect(service.getState()).toMatchObject({ currentPath: null, document: { dirty: true } });

    await expect(service.saveAs()).resolves.toMatchObject({
      kind: 'success',
      document: { path: '/notes.txt', content: 'Updated note', dirty: false },
    });
    expect(adapter.getFile('/notes.txt')).toBe('Updated note');
    expect(service.getState().recentFiles).toEqual(['/notes.txt']);
  });

  test('preserves the current document and reports permission errors while saving', async () => {
    const service = createDocumentService(
      new InMemoryTextDocumentAdapter({ savePath: '/locked.txt', writeError: 'permission-denied' }),
    );

    await service.newDocument('Protected');
    await expect(service.saveAs()).resolves.toMatchObject({ kind: 'failure', code: 'permission-denied' });
    expect(service.getState().document).toMatchObject({ content: 'Protected', dirty: true });
  });

  test('does not replace a dirty document when discard confirmation is denied', async () => {
    const service = createDocumentService(
      new InMemoryTextDocumentAdapter({ files: { '/next.txt': 'Next' } }),
      { confirmDiscard: async () => false },
    );
    await service.newDocument('Keep this');

    await expect(service.newDocument('Replacement')).resolves.toEqual({ kind: 'cancelled' });
    await expect(service.load('/next.txt')).resolves.toEqual({ kind: 'cancelled' });
    expect(service.getState().document).toMatchObject({ content: 'Keep this', dirty: true });
  });

  test('supports a destructured save method', async () => {
    const adapter = new InMemoryTextDocumentAdapter({ savePath: '/note.txt' });
    const service = createDocumentService(adapter);
    await service.newDocument('Text');
    const { save } = service;

    await expect(save()).resolves.toMatchObject({ kind: 'success', document: { path: '/note.txt' } });
  });

  test('keeps a newer edit dirty when an earlier save completes', async () => {
    const write = deferred<void>();
    const adapter: TextDocumentAdapter = {
      chooseOpenPath: async () => null,
      chooseSavePath: async () => '/note.txt',
      readText: async () => '',
      writeText: async () => write.promise,
    };
    const service = createDocumentService(adapter);
    await service.newDocument('Saved value');

    const saving = service.save();
    service.updateContent('Newer edit');
    write.resolve();
    await saving;

    expect(service.getState().document).toMatchObject({ content: 'Newer edit', dirty: true, path: null });
  });

  test('cancels superseded and explicitly cancelled asynchronous loads', async () => {
    const firstRead = deferred<string>();
    const secondRead = deferred<string>();
    const adapter: TextDocumentAdapter = {
      chooseOpenPath: async () => null,
      chooseSavePath: async () => null,
      readText: async (path) => path === '/first.txt' ? firstRead.promise : secondRead.promise,
      writeText: async () => undefined,
    };
    const service = createDocumentService(adapter);

    const first = service.load('/first.txt');
    const second = service.load('/second.txt');
    secondRead.resolve('Second');
    await expect(second).resolves.toMatchObject({ kind: 'success', document: { path: '/second.txt' } });
    firstRead.resolve('First');
    await expect(first).resolves.toEqual({ kind: 'cancelled' });
    expect(service.getState().currentPath).toBe('/second.txt');

    const third = service.load('/third.txt');
    service.cancel();
    await expect(third).resolves.toEqual({ kind: 'cancelled' });
    expect(service.getState().currentPath).toBe('/second.txt');
  });
});
