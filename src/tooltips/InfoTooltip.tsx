import { cloneElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import { DetailPopover } from './DetailPopover';
import './tooltips.css';

export interface InfoTooltipProps {
  children: ReactElement<{ 'aria-describedby'?: string }>;
  label?: string;
  title?: string;
  description?: string;
  guidance?: string;
  shortcut?: string;
  status?: string;
  warning?: string;
  delay?: number;
}

export function InfoTooltip({ children, label, title, description, guidance, shortcut, status, warning, delay = 400 }: InfoTooltipProps) {
  const id = useId();
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = useState(false);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');
  const [align, setAlign] = useState<'start' | 'center' | 'end'>('center');
  const detailed = Boolean(description || guidance || shortcut || status || warning);
  const panelTitle = title ?? label;

  const clearDelay = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);
  const refinePlacement = useCallback(() => {
    const trigger = wrapperRef.current?.getBoundingClientRect();
    const panel = panelRef.current?.getBoundingClientRect();
    if (!trigger) return;
    const panelWidth = panel?.width || 160;
    const panelHeight = panel?.height || 120;
    const margin = 8;
    const spaceBelow = window.innerHeight - trigger.bottom;
    const spaceAbove = trigger.top;
    setPlacement(spaceBelow >= panelHeight + margin || spaceBelow >= spaceAbove ? 'bottom' : 'top');
    const triggerWidth = trigger.width || trigger.right - trigger.left;
    const centeredLeft = trigger.left + (triggerWidth / 2) - (panelWidth / 2);
    setAlign(centeredLeft < margin ? 'start' : centeredLeft + panelWidth > window.innerWidth - margin ? 'end' : 'center');
  }, []);
  const show = () => {
    clearDelay();
    timeoutRef.current = setTimeout(() => { setVisible(true); }, delay);
  };
  const hide = () => { clearDelay(); setVisible(false); };

  useEffect(() => () => clearDelay(), [clearDelay]);
  useLayoutEffect(() => { if (visible) refinePlacement(); }, [refinePlacement, visible]);
  useEffect(() => {
    if (!visible) return undefined;
    window.addEventListener('resize', refinePlacement);
    return () => window.removeEventListener('resize', refinePlacement);
  }, [refinePlacement, visible]);

  return (
    <span className="info-tooltip" ref={wrapperRef} onPointerEnter={show} onPointerLeave={hide} onFocus={show} onBlur={hide}>
      {cloneElement(children, { 'aria-describedby': visible ? id : undefined })}
      {visible ? <DetailPopover id={id} panelRef={(element) => { panelRef.current = element; }} title={panelTitle} description={description} guidance={guidance} shortcut={shortcut} status={status} warning={warning} compact={!detailed} placement={placement} align={align} /> : null}
    </span>
  );
}
