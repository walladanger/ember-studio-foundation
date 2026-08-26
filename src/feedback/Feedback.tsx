import { AlertTriangle, CheckCircle2, FileWarning, LoaderCircle } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import './feedback.css';

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return <div className="feedback feedback--loading" role="status" aria-label={label}><LoaderCircle aria-hidden="true" size={18} /><span>{label}</span></div>;
}

export function ProgressState({ label, value }: { label: string; value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return <div className="feedback feedback--progress"><span>{label}</span><div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue}><i style={{ width: `${safeValue}%` }} /></div><strong>{safeValue}%</strong></div>;
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return <div className="feedback feedback--empty"><FileWarning aria-hidden="true" size={20} /><div><strong>{title}</strong>{description ? <p>{description}</p> : null}</div></div>;
}

export function SuccessState({ title, description }: { title: string; description?: string }) {
  return <div className="feedback feedback--success"><CheckCircle2 aria-hidden="true" size={18} /><div><strong>{title}</strong>{description ? <p>{description}</p> : null}</div></div>;
}

export function WarningState({ title, description }: { title: string; description?: string }) {
  return <div className="feedback feedback--warning"><AlertTriangle aria-hidden="true" size={18} /><div><strong>{title}</strong>{description ? <p>{description}</p> : null}</div></div>;
}

export function InlineValidation({ id, children }: PropsWithChildren<{ id?: string }>) {
  return <p className="inline-validation" id={id} role="alert">{children}</p>;
}
