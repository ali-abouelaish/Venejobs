// Public + shared screens: /services, /services/[id], /services/[id]/checkout/return.

// ───────────────────────── /services (browse) ─────────────────────────
function ServicesBrowsePage({ demoState, onNavigate }) {
  const [category, setCategory] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [priceBand, setPriceBand] = React.useState("any");
  const [delivery, setDelivery] = React.useState("any");
  const [sort, setSort] = React.useState("popular");
  const [page, setPage] = React.useState(1);

  if (demoState === "loading") return <BrowseSkeleton/>;
  if (demoState === "error") return <ErrorState onRetry={() => {}}/>;

  const published = SERVICES.filter(s => s.status === "published");
  let filtered = published;
  if (category !== "all") filtered = filtered.filter(s => s.category === category);
  if (priceBand !== "any") {
    if (priceBand === "under100")    filtered = filtered.filter(s => s.basePrice < 10000);
    if (priceBand === "100to250")    filtered = filtered.filter(s => s.basePrice >= 10000 && s.basePrice < 25000);
    if (priceBand === "over250")     filtered = filtered.filter(s => s.basePrice >= 25000);
  }
  if (delivery !== "any") {
    const n = parseInt(delivery, 10);
    filtered = filtered.filter(s => s.deliveryDays <= n);
  }
  if (search) filtered = filtered.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));
  if (sort === "priceLow")  filtered = [...filtered].sort((a, b) => a.basePrice - b.basePrice);
  if (sort === "priceHigh") filtered = [...filtered].sort((a, b) => b.basePrice - a.basePrice);
  if (sort === "rating")    filtered = [...filtered].sort((a, b) => b.rating - a.rating);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: "var(--fg-1)" }}>Find a service</h1>
        <p style={{ color: "var(--fg-4)", fontSize: 15, marginTop: 4 }}>Fixed-price work, delivered on a deadline. Pay once, get the file.</p>
      </div>

      {/* Search + sort */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240, maxWidth: 480 }}>
          <TextInput icon="search" value={search} onChange={setSearch} placeholder="Search services by keyword"/>
        </div>
        <Select value={sort} onChange={setSort} options={[
          { value: "popular",   label: "Most popular" },
          { value: "rating",    label: "Highest rated" },
          { value: "priceLow",  label: "Price: low to high" },
          { value: "priceHigh", label: "Price: high to low" },
        ]} style={{ width: 200 }}/>
      </div>

      {/* Category chips */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="no-scrollbar">
        <FilterChip label="All categories" active={category === "all"} onClick={() => setCategory("all")} count={published.length}/>
        {CATEGORIES.map(c => (
          <FilterChip key={c} label={c} active={category === c} onClick={() => setCategory(c)}
            count={published.filter(s => s.category === c).length}/>
        ))}
      </div>

      {/* Secondary filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: "12px 16px", background: "var(--bg-subtle)", borderRadius: 10, border: "1px solid var(--border-2)" }}>
        <FilterRow label="Price">
          {[{ v: "any", l: "Any" }, { v: "under100", l: "Under $100" }, { v: "100to250", l: "$100–$250" }, { v: "over250", l: "Over $250" }].map(x =>
            <FilterChip key={x.v} label={x.l} active={priceBand === x.v} onClick={() => setPriceBand(x.v)}/>)}
        </FilterRow>
        <FilterRow label="Delivery">
          {[{ v: "any", l: "Any" }, { v: "2", l: "≤ 2d" }, { v: "5", l: "≤ 5d" }, { v: "7", l: "≤ 7d" }].map(x =>
            <FilterChip key={x.v} label={x.l} active={delivery === x.v} onClick={() => setDelivery(x.v)}/>)}
        </FilterRow>
      </div>

      {filtered.length === 0
        ? <EmptyState icon="search" title="No services match your filters" body="Try widening price or delivery, or clear a chip." action={<Button variant="secondary" onClick={() => { setCategory("all"); setPriceBand("any"); setDelivery("any"); setSearch(""); }}>Clear filters</Button>}/>
        : <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {filtered.slice((page - 1) * 6, page * 6).map(s => <ServiceCard key={s.id} service={s} onClick={() => onNavigate(`/services/${s.id}`)}/>)}
            </div>
            <Pagination page={page} total={filtered.length} perPage={6} onChange={setPage}/>
          </>}
    </div>
  );
}

function FilterRow({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, color: "var(--fg-4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginRight: 4 }}>{label}</span>
      {children}
    </div>
  );
}

function ServiceCard({ service, onClick }) {
  const f = getPerson(service.freelancerId);
  return (
    <Card hoverable onClick={onClick} padding={0} style={{ overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ height: 160, background: service.cover || "var(--bg-image-ph)" }}/>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar name={f.name} size={28} tone="freelancer"/>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-2)" }}>{f.name}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 40 }}>
          {service.title}
        </div>
        <Stars value={service.rating} count={service.reviews}/>
        <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--border-2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "var(--fg-4)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>Starting at</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: "var(--fg-1)" }}>{formatPrice(service.basePrice)}</span>
        </div>
      </div>
    </Card>
  );
}

function BrowseSkeleton() {
  return <div>
    <Skeleton width={240} height={32} style={{ marginBottom: 20 }}/>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
      {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i}/>)}
    </div>
  </div>;
}

// ───────────────────────── /services/[id] (detail) ─────────────────────────
function ServiceDetailPage({ id, signedInRole, onNavigate }) {
  const service = getService(id) || SERVICES[0];
  const freelancer = getPerson(service.freelancerId);
  const [qty, setQty] = React.useState({});  // { [addonId]: qty }
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const toast = useToast();

  const addonsSubtotal = (service.addons || []).reduce((sum, a) => sum + (qty[a.id] || 0) * a.price, 0);
  const total = service.basePrice + addonsSubtotal;

  const onBuy = () => {
    if (!signedInRole) {
      toast.push("Please log in to continue.", { tone: "info" });
      return;
    }
    setCheckoutOpen(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Breadcrumbs items={[{ label: "All services", to: "/services" }, { label: service.category, to: "/services" }, { label: service.title }]} onNavigate={onNavigate}/>

      <div className="two-col">
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* hero image */}
          <div style={{ height: 320, background: service.cover || "var(--bg-image-ph)", borderRadius: 16 }} className="detail-hero"/>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
              <Badge tone="brand" dot={false}>{service.category}</Badge>
              <Stars value={service.rating} count={service.reviews}/>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 700, color: "var(--fg-1)", lineHeight: 1.25 }}>{service.title}</h1>
          </div>

          {/* seller */}
          <Card padding={20}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar name={freelancer.name} size={52} tone="freelancer"/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--fg-1)" }}>{freelancer.name}</div>
                <div style={{ fontSize: 13, color: "var(--fg-4)", marginTop: 2, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <span><Icon name="mapPin" size={12} style={{ verticalAlign: "-1px" }}/> {freelancer.country}</span>
                  <span>Top-rated</span>
                  <span>Responds within 1h</span>
                </div>
              </div>
              <Button variant="outline" size="sm" icon="info">Contact</Button>
            </div>
          </Card>

          {/* about */}
          <Card padding={28}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--fg-1)", marginBottom: 12 }}>About this service</h3>
            <p style={{ fontSize: 15, color: "var(--fg-3)", lineHeight: 1.75 }}>{service.description}</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border-2)" }}>
              <Stat label="Delivery" value={`${service.deliveryDays} days`} icon="clock"/>
              <Stat label="Revisions" value={service.revisionsIncluded} icon="refresh"/>
              <Stat label="Orders completed" value="84" icon="checkCircle"/>
              <Stat label="On-time rate" value="98%" icon="shield"/>
            </div>
          </Card>

          {/* reviews preview */}
          <Card padding={28}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--fg-1)", marginBottom: 16 }}>What clients are saying</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { who: "Maya Chen",   text: "Delivered ahead of schedule and the design is sharper than what I briefed. Will work with again." },
                { who: "Theo Nakamura", text: "Communicates clearly, asks the right questions, and the deliverables are clean Figma files." },
              ].map((r, i) => (
                <div key={i} style={{ paddingBottom: 16, borderBottom: i === 0 ? "1px solid var(--border-2)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={r.who} size={32}/>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)" }}>{r.who}</div>
                    <div style={{ marginLeft: "auto" }}><Stars value={5}/></div>
                  </div>
                  <p style={{ fontSize: 14, color: "var(--fg-3)", lineHeight: 1.6, marginTop: 8 }}>{r.text}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right rail: pricing + addons */}
        <div style={{ position: "sticky", top: 88 }}>
          <Card padding={20}>
            <div style={{ fontSize: 12, color: "var(--fg-4)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>Starting at</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "var(--fg-1)", marginTop: 2 }}>{formatPrice(service.basePrice)}</div>
            <div style={{ fontSize: 13, color: "var(--fg-4)", marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
              <Icon name="clock" size={13}/> {service.deliveryDays}-day delivery
              <span>·</span>
              <Icon name="refresh" size={13}/> {service.revisionsIncluded} revision{service.revisionsIncluded === 1 ? "" : "s"}
            </div>

            {service.addons && service.addons.length > 0 && (
              <>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)", margin: "20px 0 10px" }}>Add-ons</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {service.addons.map(a => (
                    <AddonRow key={a.id} addon={a}
                      quantity={qty[a.id] || 0}
                      onQuantityChange={n => setQty(q => ({ ...q, [a.id]: n }))}/>
                  ))}
                </div>
              </>
            )}

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--fg-4)" }}>
                <span>Base service</span>
                <span>{formatPrice(service.basePrice)}</span>
              </div>
              {addonsSubtotal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--fg-4)", marginTop: 6 }}>
                  <span>Add-ons</span>
                  <span>{formatPrice(addonsSubtotal)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-2)" }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--fg-1)" }}>Total today</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: "var(--fg-1)" }}>{formatPrice(total)}</span>
              </div>
            </div>

            <Button fullWidth size="lg" iconRight="arrowRight" style={{ marginTop: 16 }} onClick={onBuy}>
              Continue to checkout
            </Button>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 12, color: "var(--fg-4)", justifyContent: "center" }}>
              <Icon name="lock" size={12}/> Secure payment via Stripe
            </div>
          </Card>
        </div>
      </div>

      <CheckoutDialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} service={service} qty={qty} total={total} onNavigate={onNavigate}/>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fg-4)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        <Icon name={icon} size={12}/>{label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--fg-1)", marginTop: 4 }}>{value}</div>
    </div>
  );
}

// Stripe Embedded Checkout placeholder.
function CheckoutDialog({ open, onClose, service, qty, total, onNavigate }) {
  const [stage, setStage] = React.useState("mount");  // mount → paying → success
  const toast = useToast();
  React.useEffect(() => { if (open) setStage("mount"); }, [open]);

  return (
    <Dialog open={open} onClose={onClose} title="Secure checkout" subtitle="Stripe Embedded Checkout is mounted below. In test mode, use 4242 4242 4242 4242."
      maxWidth={560}
      footer={stage === "mount" ? <>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => {
          setStage("paying");
          setTimeout(() => {
            setStage("success");
            setTimeout(() => {
              onClose();
              onNavigate(`/services/${service.id}/checkout/return?session_id=cs_test_demo`);
            }, 900);
          }, 1100);
        }} loading={stage === "paying"}>Pay {formatPrice(total)}</Button>
      </> : null}>

      {stage !== "success" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ background: "var(--bg-subtle)", boxShadow: "none", border: "1px solid var(--border-2)" }} padding={16}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)", marginBottom: 8 }}>You are buying</div>
            <div style={{ fontSize: 14, color: "var(--fg-3)", marginBottom: 12, lineHeight: 1.5 }}>{service.title}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--fg-4)" }}>
              <span>Base</span><span>{formatPrice(service.basePrice)}</span>
            </div>
            {(service.addons || []).filter(a => qty[a.id]).map(a => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--fg-4)", marginTop: 4 }}>
                <span>{a.name} {qty[a.id] > 1 && `× ${qty[a.id]}`}</span>
                <span>{formatPrice(a.price * qty[a.id])}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-2)", paddingTop: 8, marginTop: 8, fontWeight: 600, color: "var(--fg-1)" }}>
              <span>Total</span><span>{formatPrice(total)}</span>
            </div>
          </Card>
          {/* mock embedded checkout */}
          <div style={{ border: "1px solid var(--border-2)", borderRadius: 10, padding: 16, background: "white", display: "flex", flexDirection: "column", gap: 10 }}>
            <FormField label="Card number"><TextInput value="4242 4242 4242 4242" onChange={() => {}}/></FormField>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <FormField label="Expiry"><TextInput value="12 / 28" onChange={() => {}}/></FormField>
              <FormField label="CVC"><TextInput value="123" onChange={() => {}}/></FormField>
            </div>
            <div style={{ fontSize: 11, color: "var(--fg-4)", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              <Icon name="lock" size={11}/> Embedded Stripe Checkout
            </div>
          </div>
        </div>
      )}

      {stage === "success" && (
        <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--status-success-bg)", color: "var(--status-success)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <Icon name="check" size={28} strokeWidth={3}/>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--fg-1)" }}>Payment received</h3>
          <p style={{ fontSize: 14, color: "var(--fg-4)", marginTop: 4 }}>Redirecting to your order…</p>
        </div>
      )}
    </Dialog>
  );
}

// ───────────────────────── /services/[id]/checkout/return ─────────────────────────
// This is the page Stripe sends users back to after Embedded Checkout. It looks
// up the freshly-created order by session_id and links the user to it.
function CheckoutReturnPage({ id, sessionId, demoState, onNavigate }) {
  const [stage, setStage] = React.useState(demoState === "loading" ? "loading" : demoState === "error" ? "error" : "loading");
  const [order, setOrder] = React.useState(null);

  React.useEffect(() => {
    if (stage !== "loading") return;
    const t = setTimeout(() => {
      // mock lookup
      const o = ORDERS.find(o => o.serviceId === id) || ORDERS[0];
      setOrder(o);
      setStage("ready");
    }, 900);
    return () => clearTimeout(t);
  }, [stage, id]);

  const service = getService(id) || SERVICES[0];

  if (stage === "loading") {
    return (
      <Card padding={48} style={{ textAlign: "center", maxWidth: 520, margin: "60px auto" }}>
        <Skeleton width={72} height={72} radius={36} style={{ margin: "0 auto 20px" }}/>
        <Skeleton width="60%" height={18} style={{ margin: "0 auto 8px" }}/>
        <Skeleton width="50%" height={14} style={{ margin: "0 auto" }}/>
        <p style={{ marginTop: 24, color: "var(--fg-4)", fontSize: 13 }}>
          Verifying your payment with Stripe…
        </p>
      </Card>
    );
  }

  if (stage === "error" || !order) {
    return (
      <Card padding={40} style={{ textAlign: "center", maxWidth: 520, margin: "40px auto" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--status-warning-bg)", color: "#7a5a00", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
          <Icon name="clock" size={28}/>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--fg-1)" }}>Your payment is processing</h2>
        <p style={{ color: "var(--fg-4)", fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
          We have received the payment but the order has not been confirmed yet. This usually clears in under a minute. You can safely close this tab; we will email you as soon as your order is ready.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 20 }}>
          <Button variant="outline" onClick={() => onNavigate("/client/orders")}>View my orders</Button>
          <Button variant="secondary" icon="refresh" onClick={() => setStage("loading")}>Check again</Button>
        </div>
        <div style={{ fontSize: 11, color: "var(--fg-5)", marginTop: 16 }}>Session: <code>{sessionId || "cs_test_demo"}</code></div>
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "40px auto" }}>
      <Card padding={32} style={{ textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--status-success-bg)", color: "var(--status-success)", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
          <Icon name="check" size={32} strokeWidth={3}/>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--fg-1)" }}>Payment received</h1>
        <p style={{ color: "var(--fg-4)", fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
          Order #{order.id.slice(-4)} is now with {getPerson(order.freelancerId).name}. You will hear back inside the order page.
        </p>

        <Card style={{ background: "var(--bg-subtle)", boxShadow: "none", border: "1px solid var(--border-2)", textAlign: "left", margin: "24px 0" }} padding={16}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-2)", marginBottom: 6 }}>{service.title}</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--fg-4)" }}>
            <span>Total paid</span><b style={{ color: "var(--fg-1)" }}>{formatPrice(order.totalAmount)}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--fg-4)", marginTop: 4 }}>
            <span>Estimated delivery</span><b style={{ color: "var(--fg-1)" }}>{shortDate(order.deliveryDeadline)}</b>
          </div>
        </Card>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Button onClick={() => onNavigate(`/orders/${order.id}`)} iconRight="arrowRight">Go to order</Button>
          <Button variant="outline" onClick={() => onNavigate("/services")}>Keep browsing</Button>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { ServicesBrowsePage, ServiceDetailPage, CheckoutReturnPage, ServiceCard });
