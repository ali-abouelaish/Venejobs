// App shell — small in-memory router that maps a route string to a screen.
// Also owns the floating "Screen dock" so you can jump between the 13 screens
// without going through user flows. The dock collapses into a select on mobile.

const ROUTES = [
  // Freelancer
  { route: "/freelancer/onboarding",         layout: "freelancer", group: "Freelancer", label: "Onboarding",           render: p => <FreelancerOnboardingPage {...p}/> },
  { route: "/freelancer/services",           layout: "freelancer", group: "Freelancer", label: "My services",          render: p => <FreelancerServicesPage {...p}/> },
  { route: "/freelancer/services/new",       layout: "freelancer", group: "Freelancer", label: "New service",          render: p => <FreelancerServiceNewPage {...p}/> },
  { route: "/freelancer/services/svc_01/edit", layout: "freelancer", group: "Freelancer", label: "Edit service (published)",     render: p => <FreelancerServiceEditPage id="svc_01" {...p}/> },
  { route: "/freelancer/services/svc_rejected_01/edit", layout: "freelancer", group: "Freelancer", label: "Edit service (rejected)", render: p => <FreelancerServiceEditPage id="svc_rejected_01" {...p}/> },
  { route: "/freelancer/services/svc_draft_01/edit", layout: "freelancer", group: "Freelancer", label: "Edit service (draft)", render: p => <FreelancerServiceEditPage id="svc_draft_01" {...p}/> },
  { route: "/freelancer/orders",             layout: "freelancer", group: "Freelancer", label: "Incoming orders",      render: p => <FreelancerOrdersPage {...p}/> },

  // Public + client browse / detail / checkout
  { route: "/services",                      layout: "public", group: "Browse",   label: "Browse services",          render: p => <ServicesBrowsePage {...p}/> },
  { route: "/services/svc_01",               layout: "public", group: "Browse",   label: "Service detail",           render: p => <ServiceDetailPage id="svc_01" {...p}/> },
  { route: "/services/svc_01/checkout/return", layout: "public", group: "Browse", label: "Checkout return",          render: p => <CheckoutReturnPage id="svc_01" sessionId="cs_test_demo" {...p}/> },

  // Client orders
  { route: "/client/orders",                 layout: "client", group: "Client",  label: "My orders",                 render: p => <ClientOrdersPage {...p}/> },

  // Order detail — shared, role-aware. We render with viewerRole derived from tweak.
  { route: "/orders/ord_a1",                 layout: "order",  group: "Order",   label: "Order: delivered",          render: p => <OrderDetailPage id="ord_a1" {...p}/> },
  { route: "/orders/ord_a2",                 layout: "order",  group: "Order",   label: "Order: in progress",        render: p => <OrderDetailPage id="ord_a2" {...p}/> },
  { route: "/orders/ord_a5",                 layout: "order",  group: "Order",   label: "Order: revision requested", render: p => <OrderDetailPage id="ord_a5" {...p}/> },
  { route: "/orders/ord_a6",                 layout: "order",  group: "Order",   label: "Order: disputed",           render: p => <OrderDetailPage id="ord_a6" {...p}/> },
  { route: "/orders/ord_a4",                 layout: "order",  group: "Order",   label: "Order: completed",          render: p => <OrderDetailPage id="ord_a4" {...p}/> },
  { route: "/orders/ord_a5/buy-revisions",   layout: "order",  group: "Order",   label: "Buy revisions",             render: p => <BuyRevisionsPage id="ord_a5" {...p}/> },

  // Admin
  { route: "/admin/services",                layout: "admin",  group: "Admin",   label: "Services queue",            render: p => <AdminServicesPage {...p}/> },
  { route: "/admin/disputes",                layout: "admin",  group: "Admin",   label: "Disputes",                  render: p => <AdminDisputesPage {...p}/> },
];

function matchRoute(target) {
  // exact, then prefix
  return ROUTES.find(r => r.route === target)
      || ROUTES.find(r => target.startsWith(r.route + "/") || target.startsWith(r.route + "?"))
      || ROUTES[0];
}

// ───────────────────────── Tweaks panel ─────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "viewerRole": "freelancer",
  "demoState": "ready",
  "show404": false
}/*EDITMODE-END*/;

// ───────────────────────── App ─────────────────────────
function App() {
  // Persist current route in the hash so refresh keeps the screen.
  const [routeStr, setRouteStr] = React.useState(() => {
    return location.hash.replace(/^#/, "") || "/freelancer/onboarding";
  });
  React.useEffect(() => {
    const onHash = () => setRouteStr(location.hash.replace(/^#/, "") || "/freelancer/onboarding");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = React.useCallback((to) => {
    location.hash = to;
    setRouteStr(to);
    window.scrollTo({ top: 0 });
  }, []);

  // Tweaks state — useTweaks returns a [values, setter] tuple.
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const r = matchRoute(routeStr);
  const screenProps = { onNavigate: navigate, currentRoute: routeStr, demoState: tw.demoState, signedInRole: tw.viewerRole };

  // Admin route enforces admin role (404 for others)
  const isAdminRoute = routeStr.startsWith("/admin");
  if (isAdminRoute && tw.viewerRole !== "admin") {
    return <Wrapped404 layout="public" onNavigate={navigate} routeStr={routeStr} message="You don't have access to this admin page. Switch to Admin in Tweaks to view."/>;
  }
  if (tw.show404) {
    return <Wrapped404 layout={r.layout} onNavigate={navigate} routeStr={routeStr}/>;
  }

  const content = r.render({ ...screenProps, viewerRole: tw.viewerRole });
  let wrapped;
  if (r.layout === "freelancer") {
    wrapped = <FreelancerLayout currentRoute={routeStr} onNavigate={navigate}>{content}</FreelancerLayout>;
  } else if (r.layout === "client") {
    wrapped = <ClientLayout currentRoute={routeStr} onNavigate={navigate}>{content}</ClientLayout>;
  } else if (r.layout === "public") {
    wrapped = <PublicLayout currentRoute={routeStr} onNavigate={navigate} signedInRole={tw.viewerRole === "guest" ? null : tw.viewerRole}>{content}</PublicLayout>;
  } else if (r.layout === "admin") {
    wrapped = <AdminLayout currentRoute={routeStr} onNavigate={navigate}>{content}</AdminLayout>;
  } else if (r.layout === "order") {
    wrapped = <OrderLayout viewerRole={tw.viewerRole} currentRoute={routeStr} onNavigate={navigate}>{content}</OrderLayout>;
  } else {
    wrapped = content;
  }

  return (
    <ToastProvider>
      {wrapped}
      <ScreenDock current={routeStr} onNavigate={navigate}/>
      <TweaksPanel title="Tweaks">
        <TweakSection title="Viewer">
          <TweakRadio
            label="Role" hint="Switches chrome and which actions show on order detail. Admin routes 404 unless this is Admin."
            value={tw.viewerRole} onChange={v => setTweak("viewerRole", v)}
            options={[{ value: "freelancer", label: "Freelancer" }, { value: "client", label: "Client" }, { value: "admin", label: "Admin" }]}/>
        </TweakSection>
        <TweakSection title="Demo state">
          <TweakRadio
            label="Page state" hint="Toggles loading skeletons, empty states, and error states on list pages."
            value={tw.demoState} onChange={v => setTweak("demoState", v)}
            options={[{ value: "ready", label: "Ready" }, { value: "loading", label: "Loading" }, { value: "empty", label: "Empty" }, { value: "error", label: "Error" }]}/>
          <TweakToggle label="Force 404" value={tw.show404} onChange={v => setTweak("show404", v)}
            hint="Verifies the not-found layout."/>
        </TweakSection>
      </TweaksPanel>
    </ToastProvider>
  );
}

function Wrapped404({ layout, onNavigate, routeStr, message }) {
  const body = (
    <div style={{ maxWidth: 460, margin: "80px auto", textAlign: "center" }}>
      <div style={{ fontSize: 90, fontWeight: 700, color: "var(--brand, var(--client-primary))", lineHeight: 1, marginBottom: 8 }}>404</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--fg-1)", marginBottom: 8 }}>Page not found</h1>
      <p style={{ color: "var(--fg-4)", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
        {message || `We couldn't find ${routeStr}.`}
      </p>
      <Button onClick={() => onNavigate("/services")} variant="primary" iconRight="arrowRight">Back to home</Button>
    </div>
  );
  if (layout === "freelancer") return <FreelancerLayout currentRoute={routeStr} onNavigate={onNavigate}>{body}</FreelancerLayout>;
  if (layout === "client")     return <ClientLayout currentRoute={routeStr} onNavigate={onNavigate}>{body}</ClientLayout>;
  if (layout === "admin")      return <AdminLayout currentRoute={routeStr} onNavigate={onNavigate}>{body}</AdminLayout>;
  return <PublicLayout currentRoute={routeStr} onNavigate={onNavigate}>{body}</PublicLayout>;
}

// ───────────────────────── Screen dock ─────────────────────────
// Lets the user jump between any of the 13 screens. Collapses on mobile.
function ScreenDock({ current, onNavigate }) {
  const [open, setOpen] = React.useState(true);
  const groups = React.useMemo(() => {
    const out = {};
    ROUTES.forEach(r => { (out[r.group] ||= []).push(r); });
    return out;
  }, []);
  const currentRoute = ROUTES.find(r => r.route === current)?.label || ROUTES.find(r => current.startsWith(r.route))?.label;

  return (
    <>
      {/* Mobile: bottom select bar */}
      <div style={{
        position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 60,
        background: "white", border: "1px solid var(--border-2)", borderRadius: 12,
        boxShadow: "var(--shadow-elev)", padding: "8px 10px",
        display: "none", alignItems: "center", gap: 8,
      }} className="show-on-mobile">
        <Icon name="list" size={16} color="var(--fg-3)"/>
        <select
          value={current} onChange={e => onNavigate(e.target.value)}
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "DM Sans", fontSize: 13, fontWeight: 500, color: "var(--fg-2)" }}>
          {Object.entries(groups).map(([g, items]) => (
            <optgroup key={g} label={g}>
              {items.map(r => <option key={r.route} value={r.route}>{r.label}</option>)}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Desktop: collapsible left dock */}
      <div className="hide-on-mobile" style={{
        position: "fixed", left: 16, bottom: 16, zIndex: 60,
        background: "white", border: "1px solid var(--border-2)", borderRadius: 12,
        boxShadow: "var(--shadow-elev)",
        width: open ? 260 : 56,
        transition: "width 240ms var(--ease-out)",
        overflow: "hidden", maxHeight: "calc(100vh - 32px)", display: "flex", flexDirection: "column",
      }}>
        <button onClick={() => setOpen(o => !o)} style={{
          padding: "10px 12px", border: "none", borderBottom: open ? "1px solid var(--border-2)" : "none",
          background: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, width: "100%",
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--client-primary)", color: "white", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="list" size={16}/>
          </div>
          {open && <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "var(--fg-4)" }}>Screen</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentRoute}</div>
          </div>}
          {open && <Icon name="chevronDown" size={14} color="var(--fg-4)" style={{ transform: "rotate(180deg)" }}/>}
        </button>

        {open && (
          <div style={{ overflowY: "auto", padding: "8px 0" }} className="no-scrollbar">
            {Object.entries(groups).map(([g, items]) => (
              <div key={g}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--fg-5)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 14px 4px" }}>{g}</div>
                {items.map(r => {
                  const active = current === r.route;
                  return (
                    <button key={r.route} onClick={() => onNavigate(r.route)}
                      style={{
                        width: "100%", textAlign: "left", padding: "8px 14px",
                        border: "none", background: active ? "var(--client-primary-soft)" : "transparent",
                        color: active ? "var(--client-primary)" : "var(--fg-2)",
                        fontFamily: "DM Sans", fontSize: 13, fontWeight: active ? 600 : 500, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 8,
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--bg-subtle)"; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                      <span style={{ width: 4, height: 4, borderRadius: 2, background: active ? "var(--client-primary)" : "var(--border-4)" }}/>
                      {r.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

window.App = App;
ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
