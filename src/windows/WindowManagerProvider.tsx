import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { createExternalWindowService, type ExternalWindowService } from '../external-windows/externalWindowService';
import type { FeaturePresentationState } from '../external-windows/externalWindowTypes';
import { InternalWindow } from './InternalWindow';
import { createWindowManagerState, windowManagerReducer } from './windowManager';
import { windowRegistry } from './windowRegistry';
import type { FeatureDescriptor, ResizeEdge, WindowBounds, WindowManagerApi, WindowManagerState } from './windowTypes';
import './windows.css';

type WindowManagerContextValue = WindowManagerApi & { registry: Readonly<Record<string, FeatureDescriptor>> };

const WindowManagerContext = createContext<WindowManagerContextValue | null>(null);
const initialWorkspace = { width: 1200, height: 700 };

export interface WindowManagerProviderProps {
  children: ReactNode;
  registry?: Readonly<Record<string, FeatureDescriptor>>;
  initialState?: WindowManagerState;
  externalWindowService?: ExternalWindowService;
}

export function WindowManagerProvider({ children, registry = windowRegistry, initialState, externalWindowService }: WindowManagerProviderProps) {
  const externalServiceRef = useRef<ExternalWindowService | null>(null);
  if (!externalServiceRef.current) externalServiceRef.current = externalWindowService ?? createExternalWindowService();
  const externalService = externalServiceRef.current;
  const [state, dispatch] = useReducer(windowManagerReducer, initialState ?? createWindowManagerState(initialWorkspace));
  const [externalStates, setExternalStates] = useState<Record<string, boolean>>({});
  useEffect(() => externalService.subscribe((featureId) => {
    setExternalStates((current) => ({ ...current, [featureId]: externalService.getState(featureId).external }));
  }), [externalService]);
  const open = useCallback((featureId: string) => {
    const feature = registry[featureId];
    if (!feature || feature.presentation === 'external') return;
    dispatch({ type: 'open', descriptor: { id: feature.id, title: feature.title, bounds: feature.initialBounds, minimum: feature.minimum, preserveState: feature.preserveState } });
  }, [registry]);
  const close = useCallback((id: string) => dispatch({ type: 'close', id }), []);
  const minimize = useCallback((id: string) => dispatch({ type: 'minimize', id }), []);
  const restore = useCallback((id: string) => dispatch({ type: 'restore', id }), []);
  const toggleMaximize = useCallback((id: string) => dispatch({ type: 'toggleMaximize', id }), []);
  const focus = useCallback((id: string) => dispatch({ type: 'focus', id }), []);
  const move = useCallback((id: string, bounds: WindowBounds) => dispatch({ type: 'move', id, bounds }), []);
  const resize = useCallback((id: string, bounds: WindowBounds, edge?: ResizeEdge) => dispatch({ type: 'resize', id, bounds, edge }), []);
  const setWorkspace = useCallback((workspace: WindowManagerState['workspace']) => dispatch({ type: 'setWorkspace', workspace }), []);
  const openExternal = useCallback(async (featureId: string) => {
    const feature = registry[featureId];
    if (!feature || feature.presentation === 'internal') return;
    await externalService.openFeature(feature);
    setExternalStates((current) => ({ ...current, [featureId]: true }));
  }, [externalService, registry]);
  const closeExternal = useCallback(async (featureId: string) => {
    const feature = registry[featureId];
    if (!feature || feature.presentation === 'internal') return;
    await externalService.closeFeature(feature);
    setExternalStates((current) => ({ ...current, [featureId]: false }));
  }, [externalService, registry]);
  const getPresentationState = useCallback((featureId: string): FeaturePresentationState | null => {
    const feature = registry[featureId];
    if (!feature) return null;
    return {
      mode: feature.presentation,
      internal: state.windows.some((window) => window.id === featureId),
      external: externalStates[featureId] ?? externalService.getState(featureId, feature.presentation).external,
    };
  }, [externalStates, externalService, registry, state.windows]);
  const api = useMemo<WindowManagerApi>(() => ({
    state,
    open,
    close,
    minimize,
    restore,
    toggleMaximize,
    focus,
    move,
    resize,
    setWorkspace,
    openExternal,
    closeExternal,
    getPresentationState,
  }), [close, closeExternal, focus, getPresentationState, minimize, move, open, openExternal, resize, restore, setWorkspace, state, toggleMaximize]);

  return <WindowManagerContext.Provider value={{ ...api, registry }}>{children}</WindowManagerContext.Provider>;
}

export function useWindowManager(): WindowManagerApi {
  const manager = useContext(WindowManagerContext);
  if (!manager) throw new Error('useWindowManager must be used inside WindowManagerProvider.');
  return manager;
}

export function useOptionalWindowManager(): WindowManagerApi | null {
  return useContext(WindowManagerContext);
}

export interface WindowManagerWorkspaceProps {
  children: ReactNode;
  navigationKey?: string;
}

export function WindowManagerWorkspace({ children, navigationKey }: WindowManagerWorkspaceProps) {
  const manager = useContext(WindowManagerContext);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const minimizedButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingMinimizedFocus = useRef<string | null>(null);
  const setWorkspace = manager?.setWorkspace;
  const minimize = manager?.minimize;

  const handleMinimize = useCallback((id: string) => {
    pendingMinimizedFocus.current = id;
    minimize?.(id);
  }, [minimize]);

  const setMinimizedButtonRef = useCallback((id: string, button: HTMLButtonElement | null) => {
    if (!button) {
      minimizedButtonRefs.current.delete(id);
      return;
    }
    minimizedButtonRefs.current.set(id, button);
    if (pendingMinimizedFocus.current === id) {
      button.focus();
      pendingMinimizedFocus.current = null;
    }
  }, []);

  useEffect(() => {
    if (!setWorkspace || !workspaceRef.current) return undefined;
    const element = workspaceRef.current;
    const updateWorkspace = () => {
      const { width, height } = element.getBoundingClientRect();
      if (width > 0 && height > 0) {
        const nextWorkspace = { width: Math.round(width), height: Math.round(height) };
        setWorkspace(nextWorkspace);
      }
    };
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(updateWorkspace);
    observer?.observe(element);
    updateWorkspace();
    return () => observer?.disconnect();
  }, [setWorkspace]);

  if (!manager) return <>{children}</>;
  return (
    <div className="window-manager-workspace" ref={workspaceRef}>
      {children}
      <div className="window-manager-workspace__layer" aria-label="Internal windows">
        {manager.state.windows.map((window) => {
          const feature = manager.registry[window.id];
          const Content = feature?.InternalContent;
          const contentKey = window.preserveState ? window.id : `${window.id}:${navigationKey ?? 'workspace'}`;
          return (
            <InternalWindow
              descriptor={window}
              workspace={manager.state.workspace}
              active={manager.state.activeId === window.id}
              key={window.id}
              onFocus={manager.focus}
              onClose={manager.close}
              onMinimize={handleMinimize}
              onRestore={manager.restore}
              onToggleMaximize={manager.toggleMaximize}
              onMove={manager.move}
              onResize={manager.resize}
            >
              {Content ? <Content key={contentKey} /> : null}
            </InternalWindow>
          );
        })}
      </div>
      {manager.state.windows.some((window) => window.state === 'minimized') ? (
        <div className="window-manager-workspace__minimized" aria-label="Minimized windows">
          {manager.state.windows.filter((window) => window.state === 'minimized').map((window) => (
            <button
              type="button"
              key={window.id}
              ref={(button) => setMinimizedButtonRef(window.id, button)}
              data-minimized-window-id={window.id}
              onClick={() => manager.restore(window.id)}
            >
              {window.title}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
