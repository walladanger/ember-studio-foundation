import type { RefCallback } from 'react';

export interface DetailPopoverProps {
  id: string;
  title?: string;
  description?: string;
  guidance?: string;
  shortcut?: string;
  status?: string;
  warning?: string;
  compact?: boolean;
  placement: 'top' | 'bottom';
  align: 'start' | 'center' | 'end';
  panelRef?: RefCallback<HTMLElement>;
}

export function DetailPopover({ id, title, description, guidance, shortcut, status, warning, compact = false, placement, align, panelRef }: DetailPopoverProps) {
  if (compact) {
    return <span ref={panelRef} className="info-tooltip__panel info-tooltip__panel--compact" data-placement={placement} data-align={align} id={id} role="tooltip">{title}</span>;
  }
  return (
    <section ref={panelRef} className="info-tooltip__panel info-tooltip__panel--detail" data-placement={placement} data-align={align} id={id} role="tooltip">
      {title ? <strong>{title}</strong> : null}
      {description ? <p>{description}</p> : null}
      {guidance ? <p className="info-tooltip__guidance">{guidance}</p> : null}
      {(shortcut || status) ? <div className="info-tooltip__meta">{shortcut ? <kbd>{shortcut}</kbd> : null}{status ? <span>{status}</span> : null}</div> : null}
      {warning ? <p className="info-tooltip__warning">{warning}</p> : null}
    </section>
  );
}
