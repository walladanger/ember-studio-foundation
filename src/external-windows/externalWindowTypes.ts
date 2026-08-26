import type { FeatureDescriptor, WindowPresentation } from '../windows/windowTypes';

export interface ExternalWindowRequest {
  featureId: string;
  label: string;
  title: string;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
}

export interface ExternalWindowOperationResult { created: boolean; }

export interface ExternalWindowPort {
  create(request: ExternalWindowRequest): Promise<ExternalWindowOperationResult | void>;
  focus(label: string): Promise<void>;
  close(label: string): Promise<void>;
  onClosed(listener: (label: string) => void): () => void;
}

export interface ExternalWindowState {
  featureId: string;
  label: string;
  status: 'open' | 'focused' | 'closed';
}

export interface FeaturePresentationState {
  mode: WindowPresentation;
  internal: boolean;
  external: boolean;
}

export type ExternalFeatureDescriptor = Pick<FeatureDescriptor, 'id' | 'title' | 'presentation' | 'initialBounds' | 'minimum'>;
