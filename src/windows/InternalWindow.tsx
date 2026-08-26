import { Maximize2, Minimize2, Undo2, X } from 'lucide-react';
import { useRef, type PointerEvent, type ReactNode } from 'react';
import type { ResizeEdge, WindowBounds, WindowDescriptor, WindowDimensions } from './windowTypes';

interface DragOperation {
  pointerId: number;
  startX: number;
  startY: number;
  bounds: WindowBounds;
  edge?: ResizeEdge;
}

export interface InternalWindowProps {
  descriptor: WindowDescriptor;
  workspace: WindowDimensions;
  active?: boolean;
  children: ReactNode;
  onFocus: (id: string) => void;
  onClose?: (id: string) => void;
  onMinimize?: (id: string) => void;
  onRestore?: (id: string) => void;
  onToggleMaximize?: (id: string) => void;
  onMove?: (id: string, bounds: WindowBounds) => void;
  onResize?: (id: string, bounds: WindowBounds, edge: ResizeEdge) => void;
}

function resizeBounds(bounds: WindowBounds, deltaX: number, deltaY: number, edge: ResizeEdge): WindowBounds {
  const west = edge.includes('west');
  const north = edge.includes('north');
  const east = edge.includes('east');
  const south = edge.includes('south');

  return {
    x: west ? bounds.x + deltaX : bounds.x,
    y: north ? bounds.y + deltaY : bounds.y,
    width: west ? bounds.width - deltaX : east ? bounds.width + deltaX : bounds.width,
    height: north ? bounds.height - deltaY : south ? bounds.height + deltaY : bounds.height,
  };
}

export function InternalWindow({
  descriptor,
  workspace,
  active = false,
  children,
  onFocus,
  onClose,
  onMinimize,
  onRestore,
  onToggleMaximize,
  onMove,
  onResize,
}: InternalWindowProps) {
  const operation = useRef<DragOperation | null>(null);
  const isMaximized = descriptor.state === 'maximized';
  const isMinimized = descriptor.state === 'minimized';

  const finishOperation = (event: PointerEvent<HTMLElement>) => {
    if (operation.current?.pointerId === event.pointerId && event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
    operation.current = null;
  };

  const startOperation = (event: PointerEvent<HTMLElement>, edge?: ResizeEdge) => {
    if (isMaximized || event.button > 0) return;
    event.stopPropagation();
    onFocus(descriptor.id);
    operation.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, bounds: descriptor.bounds, edge };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const updateOperation = (event: PointerEvent<HTMLElement>) => {
    const current = operation.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - current.startX;
    const deltaY = event.clientY - current.startY;
    if (current.edge) onResize?.(descriptor.id, resizeBounds(current.bounds, deltaX, deltaY, current.edge), current.edge);
    else onMove?.(descriptor.id, { ...current.bounds, x: current.bounds.x + deltaX, y: current.bounds.y + deltaY });
  };

  const bounds = descriptor.bounds;
  return (
    <section
      className="internal-window"
      role="dialog"
      aria-labelledby={`${descriptor.id}-title`}
      aria-modal="false"
      aria-hidden={isMinimized || undefined}
      inert={isMinimized}
      data-active={active}
      data-window-state={descriptor.state}
      onPointerDown={() => onFocus(descriptor.id)}
      style={{ left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height, zIndex: bounds ? descriptor.zIndex : 1 }}
    >
      <header
        className="internal-window__header"
        onPointerDown={(event) => startOperation(event)}
        onPointerMove={updateOperation}
        onPointerUp={finishOperation}
        onPointerCancel={finishOperation}
        onDoubleClick={() => onToggleMaximize?.(descriptor.id)}
      >
        <h2 id={`${descriptor.id}-title`}>{descriptor.title}</h2>
        <div className="internal-window__actions">
          {descriptor.state === 'minimized' ? (
            <button type="button" aria-label={`Restore ${descriptor.title}`} onPointerDown={(event) => event.stopPropagation()} onClick={() => onRestore?.(descriptor.id)}><Undo2 aria-hidden="true" size={15} /></button>
          ) : null}
          <button type="button" aria-label={`Minimize ${descriptor.title}`} onPointerDown={(event) => event.stopPropagation()} onClick={() => onMinimize?.(descriptor.id)}><Minimize2 aria-hidden="true" size={15} /></button>
          <button type="button" aria-label={`${isMaximized ? 'Restore' : 'Maximize'} ${descriptor.title}`} onPointerDown={(event) => event.stopPropagation()} onClick={() => onToggleMaximize?.(descriptor.id)}>
            {isMaximized ? <Undo2 aria-hidden="true" size={15} /> : <Maximize2 aria-hidden="true" size={15} />}
          </button>
          <button type="button" aria-label={`Close ${descriptor.title}`} onPointerDown={(event) => event.stopPropagation()} onClick={() => onClose?.(descriptor.id)}><X aria-hidden="true" size={16} /></button>
        </div>
      </header>
      <div className="internal-window__body">{children}</div>
      {!isMaximized ? (
        <div className="internal-window__resize-handles" aria-hidden="true">
          {(['north', 'south', 'east', 'west', 'north-east', 'north-west', 'south-east', 'south-west'] as ResizeEdge[]).map((edge) => (
            <div
              className={`internal-window__resize-handle internal-window__resize-handle--${edge}`}
              key={edge}
              onPointerDown={(event) => startOperation(event, edge)}
              onPointerMove={updateOperation}
              onPointerUp={finishOperation}
              onPointerCancel={finishOperation}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
