import type { ComponentType } from 'react';

export type WindowPresentation = 'internal' | 'external' | 'dual';
export type WindowState = 'normal' | 'minimized' | 'maximized';
export type ResizeEdge = 'north' | 'south' | 'east' | 'west' | 'north-east' | 'north-west' | 'south-east' | 'south-west';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowDimensions {
  width: number;
  height: number;
}

export interface WindowDescriptor {
  id: string;
  title: string;
  bounds: WindowBounds;
  minimum: WindowDimensions;
  state: WindowState;
  zIndex: number;
  normalBounds?: WindowBounds;
  preserveState?: boolean;
}

export interface FeatureDescriptor {
  id: string;
  title: string;
  presentation: WindowPresentation;
  initialBounds: WindowBounds;
  minimum: WindowDimensions;
  preserveState?: boolean;
  InternalContent?: ComponentType;
  ExternalContent?: ComponentType;
}

export interface WindowManagerState {
  windows: WindowDescriptor[];
  activeId: string | null;
  workspace: WindowDimensions;
}

export interface WindowManagerApi {
  state: WindowManagerState;
  open: (featureId: string) => void;
  close: (id: string) => void;
  minimize: (id: string) => void;
  restore: (id: string) => void;
  toggleMaximize: (id: string) => void;
  focus: (id: string) => void;
  move: (id: string, bounds: WindowBounds) => void;
  resize: (id: string, bounds: WindowBounds, edge?: ResizeEdge) => void;
  setWorkspace: (workspace: WindowDimensions) => void;
  openExternal: (featureId: string) => Promise<void>;
  closeExternal: (featureId: string) => Promise<void>;
  getPresentationState: (featureId: string) => { mode: WindowPresentation; internal: boolean; external: boolean } | null;
}

export type WindowManagerAction =
  | { type: 'open'; descriptor: Omit<WindowDescriptor, 'state' | 'zIndex'> }
  | { type: 'close'; id: string }
  | { type: 'minimize'; id: string }
  | { type: 'restore'; id: string }
  | { type: 'toggleMaximize'; id: string }
  | { type: 'focus'; id: string }
  | { type: 'move'; id: string; bounds: WindowBounds }
  | { type: 'resize'; id: string; bounds: WindowBounds; edge?: ResizeEdge }
  | { type: 'setWorkspace'; workspace: WindowDimensions };
