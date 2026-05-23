'use client';

import * as React from 'react';
import { Icon, IconName } from './Icon';
import { Button, Card, IconButton } from './Primitives';

// ---------------------------- Dialog ----------------------------
export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
  /** 'center' (default) renders a centered modal. 'right' renders a slide-in drawer from the right. */
  placement?: 'center' | 'right';
}
export function Dialog({ open, onClose, title, subtitle, children, footer, maxWidth = 480, placement = 'center' }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    document.body.classList.add('vj-no-scroll');
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('vj-no-scroll');
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  if (!open) return null;

  const isDrawer = placement === 'right';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 90,
        background: 'rgba(0,0,0,0.45)',
        display: isDrawer ? 'block' : 'grid',
        placeItems: isDrawer ? undefined : 'center',
        padding: isDrawer ? 0 : 20,
        animation: 'vj-fade 160ms var(--ease-out)',
      }}
    >
      <div
        style={
          isDrawer
            ? {
                position: 'absolute', top: 0, right: 0, bottom: 0,
                background: '#fff', width: '100%', maxWidth,
                padding: 28, boxShadow: 'var(--shadow-elev)',
                overflow: 'auto',
                animation: 'vj-slide-in-right 220ms var(--ease-out)',
                display: 'flex', flexDirection: 'column',
              }
            : {
                background: '#fff', borderRadius: 16, width: '100%', maxWidth,
                padding: 28, boxShadow: 'var(--shadow-elev)',
                animation: 'vj-rise 200ms var(--ease-out)',
                maxHeight: 'calc(100vh - 40px)', overflow: 'auto',
              }
        }
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: subtitle ? 8 : 16 }}>
          {title && <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg-1)', margin: 0 }}>{title}</h3>}
          {onClose && <IconButton icon="close" title="Close" onClick={onClose} />}
        </div>
        {subtitle && <p style={{ color: 'var(--fg-4)', fontSize: 14, lineHeight: 1.55, margin: '0 0 20px' }}>{subtitle}</p>}
        <div style={{ flex: isDrawer ? 1 : undefined, marginBottom: footer ? 24 : 0 }}>{children}</div>
        {footer && <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>{footer}</div>}
      </div>
    </div>
  );
}

// ---------------------------- ConfirmDialog ----------------------------
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}
export function ConfirmDialog({
  open, onClose, onConfirm, title, body,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger,
}: ConfirmDialogProps) {
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => { if (!open) setBusy(false); }, [open]);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      subtitle={body}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{cancelLabel}</Button>
          <Button
            variant="primary" loading={busy} danger={danger}
            onClick={async () => {
              setBusy(true);
              try { await onConfirm(); } finally { setBusy(false); }
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}

// ---------------------------- Toast ----------------------------
type ToastTone = 'success' | 'info' | 'warning' | 'error';
interface ToastItem { id: string; msg: React.ReactNode; tone: ToastTone; ttl: number }
interface ToastCtxValue { push: (msg: React.ReactNode, opts?: { tone?: ToastTone; ttl?: number }) => void }
const ToastCtx = React.createContext<ToastCtxValue>({ push: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const push = React.useCallback((msg: React.ReactNode, opts: { tone?: ToastTone; ttl?: number } = {}) => {
    const id = Math.random().toString(36).slice(2);
    const ttl = opts.ttl ?? 4000;
    setItems(xs => [...xs, { id, msg, tone: opts.tone || 'info', ttl }]);
    setTimeout(() => setItems(xs => xs.filter(x => x.id !== id)), ttl);
  }, []);
  const dismiss = (id: string) => setItems(xs => xs.filter(x => x.id !== id));
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="vj-toast-host">
        {items.map(t => <Toast key={t.id} {...t} onClose={() => dismiss(t.id)} />)}
      </div>
    </ToastCtx.Provider>
  );
}

function Toast({ msg, tone, onClose }: ToastItem & { onClose: () => void }) {
  const tones: Record<ToastTone, { border: string; color: string; icon: IconName }> = {
    success: { border: 'var(--status-success)', color: 'var(--freelancer-primary-deep)', icon: 'checkCircle' },
    info:    { border: 'var(--client-primary)', color: 'var(--client-primary)',          icon: 'info' },
    warning: { border: 'var(--status-warning)', color: '#7a5a00',                        icon: 'alert' },
    error:   { border: 'var(--status-error)',   color: '#8a2828',                        icon: 'alert' },
  };
  const t = tones[tone];
  return (
    <div
      style={{
        background: '#fff', color: t.color, fontSize: 14, fontWeight: 500,
        borderRadius: 10, padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: 'var(--shadow-elev)', borderLeft: `3px solid ${t.border}`,
        minWidth: 240, maxWidth: 360,
        animation: 'vj-rise 200ms var(--ease-out)',
      }}
    >
      <Icon name={t.icon} size={18} color={t.border} />
      <span style={{ flex: 1, color: 'var(--fg-2)' }}>{msg}</span>
      <IconButton icon="close" title="Dismiss" onClick={onClose} size={24} />
    </div>
  );
}

export function useToast() {
  return React.useContext(ToastCtx);
}

// ---------------------------- Skeleton ----------------------------
export function Skeleton({ width = '100%', height = 14, radius = 6, style }: { width?: number | string; height?: number; radius?: number; style?: React.CSSProperties }) {
  return <div className="vj-skeleton" style={{ width, height, borderRadius: radius, ...style }} />;
}
export function SkeletonRow({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} height={14} />
      ))}
    </div>
  );
}
export function SkeletonCard() {
  return (
    <Card>
      <Skeleton width={56} height={56} radius={28} style={{ marginBottom: 16 }} />
      <Skeleton width="80%" height={18} style={{ marginBottom: 10 }} />
      <Skeleton width="60%" height={14} style={{ marginBottom: 16 }} />
      <SkeletonRow lines={3} />
    </Card>
  );
}

// ---------------------------- EmptyState / ErrorState ----------------------------
interface EmptyStateProps {
  icon?: IconName;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}
export function EmptyState({ icon = 'package', title, body, action, secondaryAction }: EmptyStateProps) {
  return (
    <Card style={{ textAlign: 'center', padding: '56px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'var(--brand-tint, var(--client-primary-tint))',
        color: 'var(--brand, var(--client-primary))',
        display: 'grid', placeItems: 'center',
      }}>
        <Icon name={icon} size={28} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 420 }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg-1)', margin: 0 }}>{title}</h3>
        {body && <p style={{ color: 'var(--fg-4)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{body}</p>}
      </div>
      {(action || secondaryAction) && (
        <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
          {action}
          {secondaryAction}
        </div>
      )}
    </Card>
  );
}

interface ErrorStateProps {
  title?: string;
  body?: React.ReactNode;
  onRetry?: () => void;
}
export function ErrorState({ title = 'Something went wrong', body = "We couldn't load this. Try again in a moment.", onRetry }: ErrorStateProps) {
  return (
    <Card style={{ textAlign: 'center', padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'var(--status-error-bg)', color: 'var(--status-error)',
        display: 'grid', placeItems: 'center',
      }}>
        <Icon name="alert" size={24} />
      </div>
      <div style={{ maxWidth: 420 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-1)', margin: '0 0 4px' }}>{title}</h3>
        <p style={{ color: 'var(--fg-4)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{body}</p>
      </div>
      {onRetry && <Button variant="secondary" icon="refresh" onClick={onRetry}>Try again</Button>}
    </Card>
  );
}

// ---------------------------- Tabs ----------------------------
export interface TabItem { key: string; label: string; count?: number; icon?: IconName }
export function Tabs({
  items, value, onChange, fullWidth, style,
}: {
  items: TabItem[]; value: string; onChange: (key: string) => void; fullWidth?: boolean; style?: React.CSSProperties;
}) {
  return (
    <div
      role="tablist"
      className="vj-no-scrollbar"
      style={{
        display: 'flex', gap: 4, borderBottom: '1px solid var(--border-2)',
        overflowX: 'auto', ...style,
      }}
    >
      {items.map(t => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            style={{
              padding: '12px 16px', background: 'transparent', border: 'none',
              borderBottom: `2px solid ${active ? 'var(--brand, var(--client-primary))' : 'transparent'}`,
              color: active ? 'var(--brand, var(--client-primary))' : 'var(--fg-4)',
              fontSize: 14, fontWeight: 600, fontFamily: 'DM Sans', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'color 120ms var(--ease-out), border-color 120ms var(--ease-out)',
              flex: fullWidth ? 1 : '0 0 auto',
              whiteSpace: 'nowrap',
            }}
          >
            {t.icon && <Icon name={t.icon} size={16} />}
            {t.label}
            {t.count != null && (
              <span style={{
                fontSize: 11, padding: '2px 7px', borderRadius: 9999, fontWeight: 600,
                background: active ? 'var(--brand-soft, var(--client-primary-soft))' : 'var(--bg-muted)',
                color: active ? 'var(--brand, var(--client-primary))' : 'var(--fg-4)',
              }}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------- FilterChip ----------------------------
export function FilterChip({ label, active, onClick, count }: { label: React.ReactNode; active?: boolean; onClick?: () => void; count?: number | null }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border-5)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border-3)'; }}
      style={{
        padding: '8px 14px', borderRadius: 9999,
        border: `1px solid ${active ? 'var(--brand, var(--client-primary))' : 'var(--border-3)'}`,
        background: active ? 'var(--brand, var(--client-primary))' : '#fff',
        color: active ? '#fff' : 'var(--fg-2)',
        fontSize: 13, fontWeight: 500, fontFamily: 'DM Sans',
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        transition: 'all 120ms var(--ease-out)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      {count != null && <span style={{ opacity: 0.7, fontSize: 12 }}>({count})</span>}
    </button>
  );
}

// ---------------------------- Pagination ----------------------------
export function Pagination({
  page, total, perPage = 10, onChange,
}: {
  page: number; total: number; perPage?: number; onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;
  const go = (p: number) => onChange(Math.max(1, Math.min(pages, p)));
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
      <div style={{ fontSize: 13, color: 'var(--fg-4)' }}>
        Showing <b style={{ color: 'var(--fg-2)' }}>{Math.min(total, (page - 1) * perPage + 1)}&nbsp;to&nbsp;{Math.min(total, page * perPage)}</b> of {total}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <IconButton icon="chevronLeft" title="Previous" onClick={() => go(page - 1)} />
        {Array.from({ length: pages }).map((_, i) => {
          const n = i + 1;
          if (pages > 7 && n !== 1 && n !== pages && Math.abs(n - page) > 1) {
            if (n === 2 || n === pages - 1) return <span key={n} style={{ color: 'var(--fg-5)' }}>...</span>;
            return null;
          }
          const active = n === page;
          return (
            <button
              key={n}
              type="button"
              onClick={() => go(n)}
              style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid transparent',
                background: active ? 'var(--brand, var(--client-primary))' : 'transparent',
                color: active ? '#fff' : 'var(--fg-3)',
                fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {n}
            </button>
          );
        })}
        <IconButton icon="chevronRight" title="Next" onClick={() => go(page + 1)} />
      </div>
    </div>
  );
}

// ---------------------------- Breadcrumbs ----------------------------
export interface Crumb { label: string; to?: string }
export function Breadcrumbs({ items, onNavigate }: { items: Crumb[]; onNavigate?: (to: string) => void }) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13, color: 'var(--fg-4)', marginBottom: 16, flexWrap: 'wrap',
      }}
    >
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Icon name="chevronRight" size={14} color="var(--fg-5)" />}
          {it.to && i < items.length - 1 ? (
            <a
              onClick={() => onNavigate?.(it.to!)}
              style={{ color: 'var(--fg-4)', textDecoration: 'none', cursor: 'pointer' }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = 'var(--brand, var(--client-primary))')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = 'var(--fg-4)')}
            >
              {it.label}
            </a>
          ) : (
            <span style={{ color: i === items.length - 1 ? 'var(--fg-2)' : 'var(--fg-4)', fontWeight: i === items.length - 1 ? 600 : 400 }}>
              {it.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
