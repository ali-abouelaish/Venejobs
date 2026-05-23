// Layouts — one shell per audience.
//  PublicLayout    — public browse / detail / checkout return. Light nav, client tone.
//  FreelancerLayout— signed-in freelancer chrome. Green tone.
//  ClientLayout    — signed-in client chrome. Navy tone.
//  AdminLayout     — admin chrome with sidebar (new, did not exist).
//  OrderLayout     — wraps client or freelancer chrome based on viewerRole.
//
// All four share the same mobile nav drawer.

// ───────────────────────── NavLinks data ─────────────────────────
const FREELANCER_NAV = [
  { key: "fhome",     label: "Home",       icon: "home",        route: "/freelancer/home" },
  { key: "fbrowse",   label: "Find Work",  icon: "search",      route: "/services" },
  { key: "fservices", label: "My Services",icon: "briefcase",   route: "/freelancer/services" },
  { key: "forders",   label: "Orders",     icon: "shoppingBag", route: "/freelancer/orders" },
  { key: "fmessages", label: "Messages",   icon: "info",        route: "/messages" },
];
const CLIENT_NAV = [
  { key: "chome",     label: "Home",         icon: "home",        route: "/client/home" },
  { key: "cbrowse",   label: "Find Services",icon: "search",      route: "/services" },
  { key: "ccontracts",label: "Contracts",    icon: "fileCheck",   route: "/contracts" },
  { key: "corders",   label: "Orders",       icon: "shoppingBag", route: "/client/orders" },
  { key: "cmessages", label: "Messages",     icon: "info",        route: "/messages" },
];
const ADMIN_NAV = [
  { key: "asvc",     label: "Services Queue", icon: "list",        route: "/admin/services" },
  { key: "adisputes",label: "Disputes",       icon: "flag",        route: "/admin/disputes" },
  { key: "ausers",   label: "Users",          icon: "users",       route: "/admin/users",     disabled: true },
  { key: "aorders",  label: "All Orders",     icon: "shoppingBag", route: "/admin/orders",    disabled: true },
];

// ───────────────────────── Shared top bar ─────────────────────────
function TopBar({ tone = "client", nav = [], user, currentRoute, onNavigate, onOpenMenu }) {
  const isFr = tone === "freelancer";
  return (
    <header style={{
      background: "white", borderBottom: "1px solid var(--border-2)",
      position: "sticky", top: 0, zIndex: 30,
    }}>
      <div style={{
        maxWidth: 1280, margin: "0 auto", padding: "14px 24px",
        display: "flex", alignItems: "center", gap: 24,
      }}>
        <div onClick={() => onNavigate(isFr ? "/freelancer/home" : "/client/home")} style={{ cursor: "pointer", flexShrink: 0 }}>
          <Logo tone={tone}/>
        </div>

        {/* desktop nav */}
        <nav className="topnav-desktop" style={{
          display: "flex", gap: 4, flex: 1, justifyContent: "center",
        }}>
          {nav.map(n => {
            const active = currentRoute?.startsWith(n.route);
            return (
              <a key={n.key} onClick={() => !n.disabled && onNavigate(n.route)}
                style={{
                  padding: "8px 14px", borderRadius: 9999, fontSize: 14, fontWeight: 500,
                  color: active ? "var(--brand, var(--client-primary))" : (n.disabled ? "var(--fg-5)" : "var(--fg-3)"),
                  background: active ? "var(--brand-soft, var(--client-primary-soft))" : "transparent",
                  cursor: n.disabled ? "not-allowed" : "pointer",
                  textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
                  transition: "all 120ms var(--ease-out)",
                }}>
                {n.label}
              </a>
            );
          })}
        </nav>

        {/* right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
          <button title="Notifications" style={topRoundBtn}>
            <Icon name="bell" size={18} color="var(--fg-3)"/>
            <span style={{
              position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: "50%",
              background: isFr ? "var(--freelancer-primary)" : "var(--client-primary)",
            }}/>
          </button>
          <button title="Help" style={topRoundBtn} className="hide-on-mobile">
            <Icon name="help" size={18} color="var(--fg-3)"/>
          </button>
          <Avatar name={user?.name || "User"} size={32} tone={tone}/>
          <button onClick={onOpenMenu} title="Menu" style={{ ...topRoundBtn, display: "none" }} className="show-on-mobile">
            <Icon name="menu" size={20} color="var(--fg-3)"/>
          </button>
        </div>
      </div>
    </header>
  );
}
const topRoundBtn = {
  position: "relative", width: 36, height: 36, borderRadius: "50%",
  border: "1px solid var(--border-2)", background: "white",
  cursor: "pointer", display: "grid", placeItems: "center",
};

// ───────────────────────── Mobile drawer ─────────────────────────
function MobileDrawer({ open, onClose, nav, user, currentRoute, onNavigate, tone }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 80,
      animation: "vj-fade 160ms var(--ease-out)",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "85%", maxWidth: 320,
        background: "white", padding: 20, overflow: "auto",
        animation: "vj-rise 220ms var(--ease-out)",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Logo tone={tone}/>
          <IconButton icon="close" onClick={onClose} title="Close menu"/>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {nav.map(n => {
            const active = currentRoute?.startsWith(n.route);
            return (
              <a key={n.key} onClick={() => { if (!n.disabled) { onNavigate(n.route); onClose(); } }}
                style={{
                  padding: "12px 14px", borderRadius: 10, fontSize: 15, fontWeight: 500,
                  color: active ? "var(--brand, var(--client-primary))" : (n.disabled ? "var(--fg-5)" : "var(--fg-2)"),
                  background: active ? "var(--brand-soft, var(--client-primary-soft))" : "transparent",
                  cursor: n.disabled ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 12,
                  textDecoration: "none",
                }}>
                <Icon name={n.icon} size={18}/>{n.label}
              </a>
            );
          })}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--border-2)", display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={user?.name || "User"} tone={tone} size={36}/>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>{user?.name}</div>
            <div style={{ fontSize: 12, color: "var(--fg-4)" }}>{user?.email}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Footer ─────────────────────────
function MiniFooter({ tone = "client" }) {
  const dark = tone === "freelancer" ? "var(--freelancer-primary-deep)" : "var(--brand-black)";
  return (
    <footer style={{ background: dark, color: "var(--fg-on-dark-muted)", padding: "28px 24px", marginTop: 64 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo tone={tone} inverted/>
        </div>
        <div style={{ fontSize: 13 }}>© 2026 Venejobs. All rights reserved.</div>
        <div style={{ display: "flex", gap: 20, fontSize: 13 }}>
          <a style={{ color: "var(--fg-on-dark-muted)", cursor: "pointer", textDecoration: "none" }}>Terms</a>
          <a style={{ color: "var(--fg-on-dark-muted)", cursor: "pointer", textDecoration: "none" }}>Privacy</a>
          <a style={{ color: "var(--fg-on-dark-muted)", cursor: "pointer", textDecoration: "none" }}>Support</a>
        </div>
      </div>
    </footer>
  );
}

// ───────────────────────── Layouts ─────────────────────────
function _Layout({ tone, nav, user, currentRoute, onNavigate, children }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <div className={`app-root theme-${tone}`} style={{ background: "var(--bg-subtle)" }}>
      <TopBar tone={tone} nav={nav} user={user} currentRoute={currentRoute} onNavigate={onNavigate} onOpenMenu={() => setMenuOpen(true)}/>
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} tone={tone} nav={nav} user={user} currentRoute={currentRoute} onNavigate={onNavigate}/>
      <main className="app-main">
        <div className="page-pad">{children}</div>
      </main>
      <MiniFooter tone={tone}/>
    </div>
  );
}

function FreelancerLayout(p) {
  return <_Layout tone="freelancer" nav={FREELANCER_NAV} user={ME.freelancer} {...p} />;
}

function ClientLayout(p) {
  return <_Layout tone="client" nav={CLIENT_NAV} user={ME.client} {...p} />;
}

function PublicLayout({ currentRoute, onNavigate, signedInRole, children }) {
  // Light nav, client tone (buyer surface). Two CTA presentations: signed-in vs out.
  const [menuOpen, setMenuOpen] = React.useState(false);
  const user = signedInRole === "freelancer" ? ME.freelancer : signedInRole === "client" ? ME.client : null;
  return (
    <div className="app-root theme-client" style={{ background: "white" }}>
      <header style={{ background: "white", borderBottom: "1px solid var(--border-2)", position: "sticky", top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", gap: 24 }}>
          <div onClick={() => onNavigate("/services")} style={{ cursor: "pointer" }}>
            <Logo tone="client"/>
          </div>
          <nav className="topnav-desktop" style={{ display: "flex", gap: 4, flex: 1, justifyContent: "center" }}>
            <a onClick={() => onNavigate("/services")} style={publicLink(currentRoute?.startsWith("/services"))}>Find Services</a>
            <a style={publicLink(false)}>How it Works</a>
            <a style={publicLink(false)}>Become a Freelancer</a>
          </nav>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginLeft: "auto" }}>
            {user
              ? <>
                  <button style={topRoundBtn} title="Notifications"><Icon name="bell" size={18} color="var(--fg-3)"/></button>
                  <Avatar name={user.name} size={32}/>
                </>
              : <>
                  <a style={{ ...publicLink(false), cursor: "pointer" }} className="hide-on-mobile">Login</a>
                  <Button size="sm" tone="client">Sign Up</Button>
                </>}
            <button onClick={() => setMenuOpen(true)} className="show-on-mobile" title="Menu"
              style={{ ...topRoundBtn, display: "none" }}>
              <Icon name="menu" size={20}/>
            </button>
          </div>
        </div>
      </header>
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} tone="client"
        nav={[{ key: "browse", label: "Find Services", icon: "search", route: "/services" }]}
        user={user || { name: "Guest", email: "" }} currentRoute={currentRoute} onNavigate={onNavigate}/>
      <main className="app-main">
        <div className="page-pad">{children}</div>
      </main>
      <MiniFooter tone="client"/>
    </div>
  );
}
const publicLink = (active) => ({
  padding: "8px 14px", borderRadius: 9999, fontSize: 14, fontWeight: 500,
  color: active ? "var(--client-primary)" : "var(--fg-3)",
  background: active ? "var(--client-primary-soft)" : "transparent",
  cursor: "pointer", textDecoration: "none",
});

function AdminLayout({ currentRoute, onNavigate, children }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <div className="app-root" style={{ background: "var(--bg-subtle)", display: "grid", gridTemplateColumns: "240px minmax(0, 1fr)" }}>
      <aside className="admin-sidebar" style={{
        background: "#0d1119", color: "white", padding: 20,
        display: "flex", flexDirection: "column", gap: 6,
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, padding: "4px 4px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Logo tone="client" inverted/>
          <Badge tone="brand" dot={false} style={{ background: "rgba(255,255,255,0.08)", color: "white", marginLeft: "auto" }}>
            Admin
          </Badge>
        </div>
        {ADMIN_NAV.map(n => {
          const active = currentRoute?.startsWith(n.route);
          return (
            <a key={n.key} onClick={() => !n.disabled && onNavigate(n.route)}
              style={{
                padding: "10px 12px", borderRadius: 8, fontSize: 14, fontWeight: 500,
                color: active ? "white" : (n.disabled ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.7)"),
                background: active ? "rgba(255,255,255,0.08)" : "transparent",
                cursor: n.disabled ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
                transition: "background 120ms var(--ease-out)",
              }}>
              <Icon name={n.icon} size={16}/>{n.label}
              {n.disabled && <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Soon</span>}
            </a>
          );
        })}
        <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#23272f", color: "white", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 600 }}>A</div>
          <div style={{ fontSize: 13 }}>
            <div style={{ color: "white", fontWeight: 600 }}>{ME.admin.name}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{ME.admin.email}</div>
          </div>
        </div>
      </aside>

      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header className="admin-topbar" style={{
          background: "white", borderBottom: "1px solid var(--border-2)",
          padding: "14px 24px", display: "flex", alignItems: "center", gap: 12,
          position: "sticky", top: 0, zIndex: 20,
        }}>
          <button onClick={() => setMenuOpen(true)} className="show-on-mobile" style={{ ...topRoundBtn, display: "none" }}>
            <Icon name="menu" size={20}/>
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--fg-1)" }}>
            {currentRoute?.startsWith("/admin/services") && "Service Review"}
            {currentRoute?.startsWith("/admin/disputes") && "Disputes"}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <button style={topRoundBtn}><Icon name="bell" size={18} color="var(--fg-3)"/></button>
            <Avatar name={ME.admin.name} size={32}/>
          </div>
        </header>
        <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} tone="client"
          nav={ADMIN_NAV} user={ME.admin} currentRoute={currentRoute} onNavigate={onNavigate}/>
        <main className="app-main">
          <div className="page-pad">{children}</div>
        </main>
      </div>
    </div>
  );
}

// OrderLayout — picks chrome based on viewer role.
function OrderLayout({ viewerRole, currentRoute, onNavigate, children }) {
  if (viewerRole === "freelancer") return <FreelancerLayout currentRoute={currentRoute} onNavigate={onNavigate}>{children}</FreelancerLayout>;
  return <ClientLayout currentRoute={currentRoute} onNavigate={onNavigate}>{children}</ClientLayout>;
}

Object.assign(window, {
  FREELANCER_NAV, CLIENT_NAV, ADMIN_NAV,
  FreelancerLayout, ClientLayout, PublicLayout, AdminLayout, OrderLayout,
});
