// Feedback components — Dialog, Toast, Skeleton, EmptyState, ErrorState,
// Tabs, Pagination, Breadcrumbs, FilterChip.
//
// Everything below uses inherited --brand vars from .theme-* on an ancestor.

// ───────────────────────── Dialog ─────────────────────────
function Dialog({ open, onClose, title, subtitle, children, footer, maxWidth = 480 }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === "Escape") onClose?.(); };
    document.body.classList.add("no-scroll");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("no-scroll");
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={title}
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 90,
        background: "rgba(0,0,0,0.45)",
        display: "grid", placeItems: "center", padding: 20,
        animation: "vj-fade 160ms var(--ease-out)",
      }}>
      <div style={{
        background: "white", borderRadius: 16, width: "100%", maxWidth,
        padding: 28, boxShadow: "var(--shadow-elev)",
        animation: "vj-rise 200ms var(--ease-out)",
        maxHeight: "calc(100vh - 40px)", overflow: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: subtitle ? 8 : 16 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--fg-1)", margin: 0 }}>{title}</h3>
          <IconButton icon="close" title="Close" onClick={onClose} />
        </div>
        {subtitle && <p style={{ color: "var(--fg-4)", fontSize: 14, lineHeight: 1.55, margin: "0 0 20px" }}>{subtitle}</p>}
        <div style={{ marginBottom: footer ? 24 : 0 }}>{children}</div>
        {footer && <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>{footer}</div>}
      </div>
    </div>
  );
}

// ───────────────────────── Toast ─────────────────────────
const ToastCtx = React.createContext({ push: () => {} });

function ToastProvider({ children }) {
  const [items, setItems] = React.useState([]);
  const push = React.useCallback((msg, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    setItems(xs => [...xs, { id, msg, tone: opts.tone || "info", ttl: opts.ttl || 4000 }]);
    setTimeout(() => setItems(xs => xs.filter(x => x.id !== id)), opts.ttl || 4000);
  }, []);
  const dismiss = id => setItems(xs => xs.filter(x => x.id !== id));
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="toast-host">
        {items.map(t => <Toast key={t.id} {...t} onClose={() => dismiss(t.id)} />)}
      </div>
    </ToastCtx.Provider>
  );
}

function Toast({ msg, tone, onClose }) {
  const tones = {
    success: { bg: "white", border: "var(--status-success)", color: "var(--freelancer-primary-deep)", icon: "checkCircle" },
    info:    { bg: "white", border: "var(--client-primary)", color: "var(--client-primary)", icon: "info" },
    warning: { bg: "white", border: "var(--status-warning)", color: "#7a5a00", icon: "alert" },
    error:   { bg: "white", border: "var(--status-error)", color: "#8a2828", icon: "alert" },
  }[tone] || { bg: "white", border: "var(--border-3)", color: "var(--fg-2)", icon: "info" };
  return (
    <div style={{
      background: tones.bg, color: tones.color, fontSize: 14, fontWeight: 500,
      borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10,
      boxShadow: "var(--shadow-elev)", borderLeft: `3px solid ${tones.border}`,
      minWidth: 240, maxWidth: 360,
      animation: "vj-rise 200ms var(--ease-out)",
    }}>
      <Icon name={tones.icon} size={18} color={tones.border}/>
      <span style={{ flex: 1, color: "var(--fg-2)" }}>{msg}</span>
      <IconButton icon="close" title="Dismiss" onClick={onClose} size={24}/>
    </div>
  );
}

const useToast = () => React.useContext(ToastCtx);

// ───────────────────────── Skeleton ─────────────────────────
function Skeleton({ width = "100%", height = 14, radius = 6, style }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }}/>;
}

function SkeletonRow({ lines = 3 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? "60%" : "100%"} height={14}/>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card>
      <Skeleton width={56} height={56} radius={28} style={{ marginBottom: 16 }}/>
      <Skeleton width="80%" height={18} style={{ marginBottom: 10 }}/>
      <Skeleton width="60%" height={14} style={{ marginBottom: 16 }}/>
      <SkeletonRow lines={3}/>
    </Card>
  );
}

// ───────────────────────── Empty / Error states ─────────────────────────
function EmptyState({ icon = "package", title, body, action, secondaryAction }) {
  return (
    <Card style={{ textAlign: "center", padding: "56px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: "var(--brand-tint, var(--client-primary-tint))",
        color: "var(--brand, var(--client-primary))",
        display: "grid", placeItems: "center",
      }}>
        <Icon name={icon} size={28}/>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 420 }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--fg-1)", margin: 0 }}>{title}</h3>
        {body && <p style={{ color: "var(--fg-4)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{body}</p>}
      </div>
      {(action || secondaryAction) && (
        <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
          {action}
          {secondaryAction}
        </div>
      )}
    </Card>
  );
}

function ErrorState({ title = "Something went wrong", body = "We couldn't load this. Try again in a moment.", onRetry }) {
  return (
    <Card style={{ textAlign: "center", padding: "48px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: "var(--status-error-bg)", color: "var(--status-error)",
        display: "grid", placeItems: "center",
      }}>
        <Icon name="alert" size={24}/>
      </div>
      <div style={{ maxWidth: 420 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--fg-1)", margin: "0 0 4px" }}>{title}</h3>
        <p style={{ color: "var(--fg-4)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{body}</p>
      </div>
      {onRetry && <Button variant="secondary" icon="refresh" onClick={onRetry}>Try again</Button>}
    </Card>
  );
}

// ───────────────────────── Tabs ─────────────────────────
// items: [{ key, label, count?, icon? }]
function Tabs({ items, value, onChange, fullWidth, style }) {
  return (
    <div role="tablist" style={{
      display: "flex", gap: 4, borderBottom: "1px solid var(--border-2)",
      overflowX: "auto", ...style,
    }} className="no-scrollbar">
      {items.map(t => {
        const active = t.key === value;
        return (
          <button key={t.key} role="tab" aria-selected={active}
            onClick={() => onChange(t.key)}
            style={{
              padding: "12px 16px", background: "transparent", border: "none",
              borderBottom: `2px solid ${active ? "var(--brand, var(--client-primary))" : "transparent"}`,
              color: active ? "var(--brand, var(--client-primary))" : "var(--fg-4)",
              fontSize: 14, fontWeight: 600, fontFamily: "DM Sans", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 8,
              transition: "color 120ms var(--ease-out), border-color 120ms var(--ease-out)",
              flex: fullWidth ? 1 : "0 0 auto",
              whiteSpace: "nowrap",
            }}>
            {t.icon && <Icon name={t.icon} size={16}/>}
            {t.label}
            {t.count != null && (
              <span style={{
                fontSize: 11, padding: "2px 7px", borderRadius: 9999, fontWeight: 600,
                background: active ? "var(--brand-soft, var(--client-primary-soft))" : "var(--bg-muted)",
                color: active ? "var(--brand, var(--client-primary))" : "var(--fg-4)",
              }}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ───────────────────────── FilterChip ─────────────────────────
function FilterChip({ label, active, onClick, count }) {
  return (
    <button onClick={onClick}
      onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = "var(--border-5)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = "var(--border-3)"; }}
      style={{
        padding: "8px 14px", borderRadius: 9999,
        border: `1px solid ${active ? "var(--brand, var(--client-primary))" : "var(--border-3)"}`,
        background: active ? "var(--brand, var(--client-primary))" : "white",
        color: active ? "white" : "var(--fg-2)",
        fontSize: 13, fontWeight: 500, fontFamily: "DM Sans", cursor: "pointer",
        display: "inline-flex", alignItems: "center", gap: 6,
        transition: "all 120ms var(--ease-out)",
        whiteSpace: "nowrap",
      }}>
      {label}
      {count != null && (
        <span style={{ opacity: 0.7, fontSize: 12 }}>({count})</span>
      )}
    </button>
  );
}

// ───────────────────────── Pagination ─────────────────────────
function Pagination({ page, total, perPage = 10, onChange }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;
  const go = p => onChange(Math.max(1, Math.min(pages, p)));
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
      <div style={{ fontSize: 13, color: "var(--fg-4)" }}>
        Showing <b style={{ color: "var(--fg-2)" }}>{Math.min(total, (page - 1) * perPage + 1)} – {Math.min(total, page * perPage)}</b> of {total}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <IconButton icon="chevronLeft" title="Previous" onClick={() => go(page - 1)} />
        {Array.from({ length: pages }).map((_, i) => {
          const n = i + 1;
          if (pages > 7 && n !== 1 && n !== pages && Math.abs(n - page) > 1) {
            if (n === 2 || n === pages - 1) return <span key={n} style={{ color: "var(--fg-5)" }}>…</span>;
            return null;
          }
          const active = n === page;
          return (
            <button key={n} onClick={() => go(n)}
              style={{
                width: 32, height: 32, borderRadius: 8, border: "1px solid transparent",
                background: active ? "var(--brand, var(--client-primary))" : "transparent",
                color: active ? "white" : "var(--fg-3)",
                fontFamily: "DM Sans", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>{n}</button>
          );
        })}
        <IconButton icon="chevronRight" title="Next" onClick={() => go(page + 1)} />
      </div>
    </div>
  );
}

// ───────────────────────── Breadcrumbs ─────────────────────────
function Breadcrumbs({ items, onNavigate }) {
  return (
    <nav aria-label="Breadcrumb" style={{
      display: "flex", alignItems: "center", gap: 8,
      fontSize: 13, color: "var(--fg-4)", marginBottom: 16,
    }}>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Icon name="chevronRight" size={14} color="var(--fg-5)"/>}
          {it.to && i < items.length - 1
            ? <a onClick={() => onNavigate?.(it.to)}
                style={{ color: "var(--fg-4)", textDecoration: "none", cursor: "pointer" }}
                onMouseEnter={e => e.target.style.color = "var(--brand, var(--client-primary))"}
                onMouseLeave={e => e.target.style.color = "var(--fg-4)"}>
                {it.label}
              </a>
            : <span style={{ color: i === items.length - 1 ? "var(--fg-2)" : "var(--fg-4)", fontWeight: i === items.length - 1 ? 600 : 400 }}>{it.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}

// ───────────────────────── ConfirmDialog convenience ─────────────────────────
function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel = "Confirm", danger }) {
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => { if (!open) setBusy(false); }, [open]);
  return (
    <Dialog open={open} onClose={onClose} title={title} subtitle={body}
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={busy} danger={danger}
          onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }}>
          {confirmLabel}
        </Button>
      </>}
    />
  );
}

Object.assign(window, {
  Dialog, ConfirmDialog,
  ToastProvider, useToast,
  Skeleton, SkeletonRow, SkeletonCard,
  EmptyState, ErrorState,
  Tabs, FilterChip, Pagination, Breadcrumbs,
});
