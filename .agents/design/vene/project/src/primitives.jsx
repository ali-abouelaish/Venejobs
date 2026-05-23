// Primitives — Logo, Button, Avatar, Card, Icon, Badge.
// Adapted from the design system's Primitives.jsx with extensions:
//  * Icon: added attach, upload, download, file, image, dollar, clock, alert,
//    info, refresh, x, trash, menu, filter, externalLink, lock, sparkle
//  * Badge: promoted from preview HTML to a real component with a `tone` prop
//  * IconButton: small icon-only button for table rows
//  * Stars: rating display
//
// Theme: the active brand color comes from a `theme-client` or
// `theme-freelancer` class on an ancestor (or via the `tone` prop on a
// component). Both expose `--brand`, `--brand-hover`, `--brand-soft`,
// `--brand-tint` so the same component renders in either color.

function Icon({ name, size = 20, color = "currentColor", strokeWidth = 1.8, style, className }) {
  const props = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round",
    style, className,
  };
  const paths = {
    user:        <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    users:       <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    briefcase:   <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></>,
    search:      <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
    bell:        <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
    help:        <><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></>,
    chevronDown: <path d="M6 9l6 6 6-6"/>,
    chevronRight:<path d="M9 6l6 6-6 6"/>,
    chevronLeft: <path d="M15 6l-6 6 6 6"/>,
    arrowRight:  <><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></>,
    arrowLeft:   <><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></>,
    arrowUpRight:<><path d="M7 17L17 7"/><path d="M9 7h8v8"/></>,
    eye:         <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
    mapPin:      <><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    tag:         <><path d="M20.59 13.41L13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></>,
    calendar:    <><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M8 3v3M16 3v3"/></>,
    check:       <path d="M5 12l5 5L20 6"/>,
    checkCircle: <><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></>,
    star:        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21l1.18-6.88-5-4.87 6.91-1.01L12 2z" fill={color} stroke={color}/>,
    shield:      <><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"/><path d="M9 12l2 2 4-4"/></>,
    handshake:   <><path d="M2 13l4-4 4 4-4 4-4-4z"/><path d="M14 13l4-4 4 4-4 4-4-4z"/><path d="M8 17l3 3 3-3"/></>,
    fileCheck:   <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 14l2 2 4-4"/></>,
    file:        <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>,
    image:       <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></>,
    plus:        <><path d="M12 5v14M5 12h14"/></>,
    minus:       <path d="M5 12h14"/>,
    moreH:       <><circle cx="5" cy="12" r="1" fill={color}/><circle cx="12" cy="12" r="1" fill={color}/><circle cx="19" cy="12" r="1" fill={color}/></>,
    moreV:       <><circle cx="12" cy="5" r="1" fill={color}/><circle cx="12" cy="12" r="1" fill={color}/><circle cx="12" cy="19" r="1" fill={color}/></>,
    edit:        <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash:       <><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>,
    close:       <><path d="M18 6L6 18"/><path d="M6 6l12 12"/></>,
    x:           <><path d="M18 6L6 18"/><path d="M6 6l12 12"/></>,
    upload:      <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></>,
    download:    <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></>,
    attach:      <path d="M21.44 11.05l-9.19 9.19a6 6 0 1 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49"/>,
    clock:       <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
    alert:       <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>,
    info:        <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></>,
    refresh:     <><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>,
    menu:        <><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></>,
    filter:      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>,
    externalLink:<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></>,
    lock:        <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    sparkle:     <><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/></>,
    dollar:      <><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    creditCard:  <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></>,
    settings:    <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
    home:        <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></>,
    shoppingBag: <><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></>,
    flag:        <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>,
    package:     <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    rotate:      <><path d="M3 12a9 9 0 1 0 9-9 9.7 9.7 0 0 0-6.4 2.6L3 8"/><path d="M3 3v5h5"/></>,
    list:        <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
  };
  return <svg {...props} aria-hidden="true">{paths[name] || null}</svg>;
}

function Logo({ inverted = false, tone = "client", size = 36, withWord = true }) {
  const brand = tone === "freelancer" ? "var(--freelancer-primary)" : "var(--client-primary)";
  const mark = (
    <div style={{
      width: size, height: size, borderRadius: 13, display: "grid", placeItems: "center",
      background: inverted ? "white" : brand,
      color: inverted ? brand : "white",
      fontFamily: "Emblema One, serif", fontSize: size * 0.45, lineHeight: 1, flexShrink: 0,
    }}>VJ</div>
  );
  if (!withWord) return mark;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {mark}
      <span style={{
        fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: 18,
        color: inverted ? "white" : "var(--fg-1)",
      }}>Venejobs</span>
    </div>
  );
}

function Button({
  children, variant = "primary", size = "md",
  icon, iconRight, onClick, style, disabled, type = "button",
  loading, fullWidth, tone, danger, as,
}) {
  // tone overrides the inherited theme. Otherwise we use the inherited --brand.
  const toneVars = tone === "freelancer"
    ? { "--btn-brand": "var(--freelancer-primary)", "--btn-hover": "var(--freelancer-primary-hover)", "--btn-soft": "var(--freelancer-primary-soft)" }
    : tone === "client"
    ? { "--btn-brand": "var(--client-primary)", "--btn-hover": "var(--client-primary-hover)", "--btn-soft": "var(--client-primary-soft)" }
    : tone === "ink"
    ? { "--btn-brand": "var(--brand-ink)", "--btn-hover": "#000000", "--btn-soft": "#f5f5f5" }
    : { "--btn-brand": "var(--brand, var(--client-primary))", "--btn-hover": "var(--brand-hover, var(--client-primary-hover))", "--btn-soft": "var(--brand-soft, var(--client-primary-soft))" };

  const dangerVars = danger
    ? { "--btn-brand": "var(--status-error)", "--btn-hover": "#e85555", "--btn-soft": "var(--status-error-bg)" }
    : {};

  const sizes = {
    sm: { padY: 8,  padX: 14, fs: 13, radius: 8 },
    md: { padY: 11, padX: 20, fs: 14, radius: 8 },
    lg: { padY: 14, padX: 26, fs: 15, radius: 8 },
  }[size];

  const base = {
    fontFamily: "DM Sans, sans-serif",
    fontWeight: variant === "primary" ? 600 : 500,
    fontSize: sizes.fs, lineHeight: 1,
    padding: `${sizes.padY}px ${sizes.padX}px`,
    borderRadius: sizes.radius,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    transition: "background 120ms var(--ease-out), color 120ms var(--ease-out), border-color 120ms var(--ease-out), box-shadow 120ms var(--ease-out)",
    opacity: disabled ? 0.5 : 1,
    whiteSpace: "nowrap",
    width: fullWidth ? "100%" : undefined,
  };

  const variants = {
    primary:  { background: "var(--btn-brand)", color: "white",            border: "1px solid var(--btn-brand)" },
    secondary:{ background: "white",            color: "var(--btn-brand)", border: "1px solid var(--btn-brand)" },
    ghost:    { background: "transparent",      color: "var(--fg-2)",      border: "1px solid transparent" },
    soft:     { background: "var(--btn-soft)",  color: "var(--btn-brand)", border: "1px solid transparent" },
    outline:  { background: "white",            color: "var(--fg-2)",      border: "1px solid var(--border-3)" },
  };

  const handleOver = e => {
    if (disabled || loading) return;
    if (variant === "primary") e.currentTarget.style.background = "var(--btn-hover)";
    else if (variant === "secondary" || variant === "soft") e.currentTarget.style.background = "var(--btn-soft)";
    else if (variant === "outline" || variant === "ghost") e.currentTarget.style.background = "var(--bg-muted)";
  };
  const handleOut = e => {
    e.currentTarget.style.background = variants[variant].background;
  };

  const Comp = as || "button";

  return (
    <Comp type={Comp === "button" ? type : undefined} disabled={disabled || loading}
      onClick={loading ? undefined : onClick}
      onMouseEnter={handleOver}
      onMouseLeave={handleOut}
      style={{ ...toneVars, ...dangerVars, ...base, ...variants[variant], ...style }}>
      {loading
        ? <span className="spinner" style={{
            width: 14, height: 14, border: "2px solid currentColor",
            borderTopColor: "transparent", borderRadius: "50%",
            animation: "vj-spin 0.8s linear infinite",
          }}/>
        : icon && <Icon name={icon} size={16} />}
      {children}
      {iconRight && !loading && <Icon name={iconRight} size={16} />}
    </Comp>
  );
}

function IconButton({ icon, title, onClick, size = 32, danger, style }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.background = danger ? "var(--status-error-bg)" : "var(--bg-muted)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      style={{
        width: size, height: size, borderRadius: 8, border: "1px solid transparent",
        background: "transparent", color: danger ? "var(--status-error)" : "var(--fg-3)",
        display: "inline-grid", placeItems: "center", cursor: "pointer",
        transition: "background 120ms var(--ease-out)",
        ...style,
      }}>
      <Icon name={icon} size={16} />
    </button>
  );
}

function Avatar({ name = "AN", size = 40, src, tone = "client" }) {
  const brand = tone === "freelancer" ? "var(--freelancer-primary)" : "var(--client-primary)";
  const initials = String(name).split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div title={name} style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: src ? `${brand} url(${src}) center/cover` : brand,
      display: "grid", placeItems: "center",
      color: "white", fontWeight: 600, fontSize: size * 0.36,
      fontFamily: "DM Sans, sans-serif",
      overflow: "hidden",
    }}>
      {!src && initials}
    </div>
  );
}

function Card({ children, style, onClick, hoverable, padding = 24, className }) {
  return (
    <div onClick={onClick} className={className} style={{
      background: "white", borderRadius: 12, boxShadow: "var(--shadow-card)",
      padding, cursor: onClick ? "pointer" : "default",
      transition: "box-shadow 200ms var(--ease-out)",
      ...style,
    }}
    onMouseEnter={hoverable ? e => e.currentTarget.style.boxShadow = "var(--shadow-md)" : undefined}
    onMouseLeave={hoverable ? e => e.currentTarget.style.boxShadow = "var(--shadow-card)" : undefined}>
      {children}
    </div>
  );
}

// Status / state badge. tone: success, info, warning, error, neutral, brand.
function Badge({ tone = "neutral", children, dot = true, size = "md", style }) {
  const tones = {
    success: { bg: "var(--status-success-bg)", color: "var(--freelancer-primary-deep)" },
    info:    { bg: "var(--status-info-bg)",    color: "var(--client-primary)" },
    warning: { bg: "var(--status-warning-bg)", color: "#7a5a00" },
    error:   { bg: "var(--status-error-bg)",   color: "#8a2828" },
    neutral: { bg: "var(--bg-muted)",          color: "var(--fg-3)" },
    brand:   { bg: "var(--brand-soft, var(--client-primary-soft))", color: "var(--brand, var(--client-primary))" },
  }[tone] || { bg: "var(--bg-muted)", color: "var(--fg-3)" };
  const padding = size === "sm" ? "3px 8px" : "5px 10px";
  const fs = size === "sm" ? 11 : 12;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding, borderRadius: 9999, fontSize: fs, fontWeight: 600,
      background: tones.bg, color: tones.color,
      fontFamily: "DM Sans, sans-serif", whiteSpace: "nowrap",
      ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }}/>}
      {children}
    </span>
  );
}

function Stars({ value = 5, count, size = 14, color = "var(--accent-amber)" }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--fg-2)", fontSize: 13, fontWeight: 600 }}>
      <Icon name="star" size={size} color={color}/>
      {value.toFixed(1)}
      {count != null && <span style={{ color: "var(--fg-4)", fontWeight: 400 }}>({count})</span>}
    </span>
  );
}

// Spinner keyframes (injected once)
if (!document.getElementById("vj-spinner-keyframes")) {
  const s = document.createElement("style");
  s.id = "vj-spinner-keyframes";
  s.textContent = "@keyframes vj-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }";
  document.head.appendChild(s);
}

Object.assign(window, { Icon, Logo, Button, IconButton, Avatar, Card, Badge, Stars });
