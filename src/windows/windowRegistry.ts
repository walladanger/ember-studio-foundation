import { DataExplorerWindow } from './DataExplorerWindow';
import type { FeatureDescriptor } from './windowTypes';

export const windowRegistry: Readonly<Record<string, FeatureDescriptor>> = {
  'data-explorer': {
    id: 'data-explorer',
    title: 'Data Explorer',
    presentation: 'dual',
    initialBounds: { x: 80, y: 56, width: 720, height: 480 },
    minimum: { width: 360, height: 240 },
    preserveState: true,
    InternalContent: DataExplorerWindow,
  },
};
