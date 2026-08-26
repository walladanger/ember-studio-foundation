import { createContext, useContext, type ReactNode } from 'react';
import { TitleBar } from '../shell/TitleBar';
import type { FeatureDescriptor } from '../windows/windowTypes';

const ExternalWindowHostContext = createContext(false);

export function selectExternalFeature(search: string, registry: Readonly<Record<string, FeatureDescriptor>>): FeatureDescriptor | null {
  const query = new URLSearchParams(search);
  if (query.get('window') !== 'external') return null;
  const feature = registry[query.get('feature') ?? ''];
  return feature && feature.presentation !== 'internal' && (feature.ExternalContent ?? feature.InternalContent) ? feature : null;
}

export function useExternalWindowHost(): boolean { return useContext(ExternalWindowHostContext); }

export interface ExternalWindowRouteProps { feature: FeatureDescriptor; children?: ReactNode; }

export function ExternalWindowRoute({ feature, children }: ExternalWindowRouteProps) {
  const Content = feature.ExternalContent ?? feature.InternalContent;
  return <ExternalWindowHostContext.Provider value>
    <div className="external-window-host" data-feature-id={feature.id}>
      <TitleBar />
      <main className="external-window-host__content">{children ?? (Content ? <Content /> : null)}</main>
    </div>
  </ExternalWindowHostContext.Provider>;
}
