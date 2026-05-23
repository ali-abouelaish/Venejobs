// Freelancer-side screens.

// ───────────────────────── /freelancer/onboarding ─────────────────────────
function FreelancerOnboardingPage({ demoState, onNavigate }) {
  // Three states the page can be in: not_started, pending (Connect created but
  // requirements outstanding), ready.
  const [stage, setStage] = React.useState(demoState === "loading" ? "loading" : demoState === "error" ? "error" : "not_started");
  const [starting, setStarting] = React.useState(false);
  const toast = useToast();

  // Status flags shown to the user, mirroring the prod Connect status endpoint.
  const flags = {
    not_started: { details: false, charges: false, payouts: false },
    pending:     { details: true,  charges: false, payouts: false },
    ready:       { details: true,  charges: true,  payouts: true  },
  }[stage] || { details: false, charges: false, payouts: false };

  if (stage === "loading") {
    return <Card><SkeletonRow lines={4}/></Card>;
  }
  if (stage === "error") {
    return <ErrorState title="Couldn't load onboarding status" body="We couldn't reach Stripe. Your Connect account may still be set up correctly." onRetry={() => setStage("not_started")}/>;
  }

  const startOnboarding = () => {
    setStarting(true);
    setTimeout(() => {
      setStarting(false);
      setStage("ready");
      toast.push("Onboarding complete. You can now publish services.", { tone: "success" });
    }, 1400);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720, margin: "0 auto" }}>
      <div>
        <Breadcrumbs items={[{ label: "Home", to: "/freelancer/home" }, { label: "Onboarding" }]} onNavigate={onNavigate}/>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--fg-1)", marginBottom: 6 }}>Set up payouts</h1>
        <p className="vj-p" style={{ fontSize: 15 }}>Connect a Stripe account so we can transfer your earnings when clients accept your deliveries. This takes about three minutes.</p>
      </div>

      <Card padding={28}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--freelancer-primary-tint)", color: "var(--freelancer-primary)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="creditCard" size={22}/>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--fg-1)" }}>Stripe Connect account</h3>
            <p style={{ fontSize: 14, color: "var(--fg-4)", marginTop: 4 }}>
              You will be redirected to Stripe to verify your identity and link a bank account. We never see your account number.
            </p>
          </div>
          {stage === "ready" && <Badge tone="success">Active</Badge>}
          {stage === "pending" && <Badge tone="warning">Pending</Badge>}
          {stage === "not_started" && <Badge tone="neutral">Not started</Badge>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "16px 0", borderTop: "1px solid var(--border-2)" }}>
          <StatusLine label="Account details submitted" ok={flags.details} hint={flags.details ? "Verified by Stripe" : "Required to continue"}/>
          <StatusLine label="Charges enabled"            ok={flags.charges} hint={flags.charges ? "Buyers can pay" : "Pending Stripe approval"}/>
          <StatusLine label="Payouts enabled"            ok={flags.payouts} hint={flags.payouts ? "Funds will transfer to your bank" : "Add a bank account in Stripe"}/>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
          {stage !== "ready" && (
            <Button loading={starting} onClick={startOnboarding} iconRight="arrowRight">
              {stage === "pending" ? "Continue with Stripe" : "Start onboarding"}
            </Button>
          )}
          {stage === "ready" && (
            <Button variant="primary" onClick={() => onNavigate("/freelancer/services/new")} iconRight="arrowRight">
              Create your first service
            </Button>
          )}
          <Button variant="outline" onClick={() => setStage(s => s === "ready" ? "ready" : "pending")} icon="refresh">
            Refresh status
          </Button>
        </div>
      </Card>

      <Card padding={20} style={{ background: "var(--bg-subtle)", boxShadow: "none", border: "1px solid var(--border-2)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Icon name="info" size={18} color="var(--fg-4)" style={{ marginTop: 2, flexShrink: 0 }}/>
          <div style={{ fontSize: 13, color: "var(--fg-4)", lineHeight: 1.6 }}>
            <b style={{ color: "var(--fg-2)" }}>Why we need this.</b> Payouts run on Stripe Transfers from our platform balance to your Connect account. Until charges and payouts are both enabled, your services cannot be published. Reviewers see this on the approval page.
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatusLine({ label, ok, hint }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
        background: ok ? "var(--status-success-bg)" : "var(--bg-muted)",
        color: ok ? "var(--status-success)" : "var(--fg-5)",
        display: "grid", placeItems: "center",
      }}>
        <Icon name={ok ? "check" : "clock"} size={12} strokeWidth={3}/>
      </div>
      <div style={{ flex: 1, fontSize: 14, color: "var(--fg-2)", fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 12, color: "var(--fg-4)" }}>{hint}</div>
    </div>
  );
}

// ───────────────────────── /freelancer/services ─────────────────────────
function FreelancerServicesPage({ demoState, onNavigate }) {
  const [tab, setTab] = React.useState("all");
  const all = servicesForFreelancer(ME.freelancer.id);

  if (demoState === "loading") {
    return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
      {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i}/>)}
    </div>;
  }

  const filtered = tab === "all" ? all : all.filter(s => s.status === tab);
  const counts = all.reduce((acc, s) => ({ ...acc, [s.status]: (acc[s.status] || 0) + 1 }), {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        title="My services"
        subtitle="Manage your service listings, addons, and review status."
        action={<Button onClick={() => onNavigate("/freelancer/services/new")} icon="plus">New service</Button>}
      />

      <Tabs value={tab} onChange={setTab} items={[
        { key: "all",            label: "All",           count: all.length },
        { key: "published",      label: "Published",     count: counts.published || 0 },
        { key: "pending_review", label: "Pending review",count: counts.pending_review || 0 },
        { key: "draft",          label: "Drafts",        count: counts.draft || 0 },
        { key: "rejected",       label: "Rejected",      count: counts.rejected || 0 },
      ]}/>

      {filtered.length === 0
        ? <EmptyState icon="briefcase" title="No services here yet" body="Create your first service to start receiving orders from clients." action={<Button onClick={() => onNavigate("/freelancer/services/new")} icon="plus">New service</Button>}/>
        : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {filtered.map(s => (
              <Card key={s.id} hoverable onClick={() => onNavigate(`/freelancer/services/${s.id}/edit`)} padding={0} style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ height: 120, background: s.cover || "var(--bg-image-ph)", position: "relative" }}>
                  <div style={{ position: "absolute", top: 12, left: 12 }}>
                    <Badge tone={SERVICE_STATUS[s.status].tone}>{SERVICE_STATUS[s.status].label}</Badge>
                  </div>
                </div>
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {s.title || "Untitled service"}
                  </div>
                  {s.status === "rejected" && s.rejectionReason && (
                    <div style={{ fontSize: 12, color: "var(--status-error)", background: "var(--status-error-bg)", padding: "8px 10px", borderRadius: 8, lineHeight: 1.5 }}>
                      <b>Reason:</b> {s.rejectionReason}
                    </div>
                  )}
                  <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--border-2)" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--fg-1)" }}>{s.basePrice ? formatPrice(s.basePrice) : "No price set"}</span>
                    <span style={{ fontSize: 12, color: "var(--fg-4)" }}>{s.deliveryDays}d delivery</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>}
    </div>
  );
}

// ───────────────────────── /freelancer/services/new ─────────────────────────
function FreelancerServiceNewPage({ onNavigate }) {
  const [form, setForm] = React.useState({
    title: "",
    category: "",
    description: "",
    basePrice: 0,
    deliveryDays: 5,
    revisionsIncluded: 1,
  });
  const [errors, setErrors] = React.useState({});
  const [busy, setBusy] = React.useState(false);
  const toast = useToast();

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (form.title.trim().length < 15) e.title = "Use at least 15 characters so the listing is searchable.";
    if (!form.category) e.category = "Pick a category.";
    if (form.description.trim().length < 80) e.description = "Describe the deliverable in at least 80 characters.";
    if (form.basePrice < 500) e.basePrice = "Minimum base price is $5.00.";
    if (form.deliveryDays < 1 || form.deliveryDays > 90) e.deliveryDays = "Between 1 and 90 days.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (e) => {
    e?.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      toast.push("Draft created. Add at least one addon then submit for review.", { tone: "success" });
      onNavigate("/freelancer/services/svc_draft_01/edit");
    }, 700);
  };

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 760, margin: "0 auto" }}>
      <div>
        <Breadcrumbs items={[{ label: "Services", to: "/freelancer/services" }, { label: "New service" }]} onNavigate={onNavigate}/>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--fg-1)" }}>Create a new service</h1>
        <p style={{ color: "var(--fg-4)", fontSize: 14, marginTop: 4 }}>Save as draft, then add addons, then submit for review.</p>
      </div>

      <Card padding={28}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <FormField label="Title" required error={errors.title} hint='Start with "I will…" for best results.'>
            <TextInput
              value={form.title}
              onChange={v => setField("title", v)}
              placeholder="I will design a high-converting landing page in Figma"
              error={errors.title}
            />
          </FormField>

          <FormField label="Category" required error={errors.category}>
            <Select value={form.category} onChange={v => setField("category", v)} placeholder="Pick a category" options={CATEGORIES} error={errors.category}/>
          </FormField>

          <FormField label="Description" required hint="Cover what's included, what's not, and what you need from the client." error={errors.description}>
            <Textarea value={form.description} rows={5} onChange={v => setField("description", v)}
              placeholder="Hand-crafted Figma design tailored to your brand. Mobile first, responsive at three breakpoints. Includes…"
              error={errors.description}/>
          </FormField>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            <FormField label="Base price" required hint="In USD. Stored as pence." error={errors.basePrice}>
              <PriceInput value={form.basePrice} onChange={v => setField("basePrice", v)} error={errors.basePrice}/>
            </FormField>
            <FormField label="Delivery days" required error={errors.deliveryDays}>
              <NumberInput value={form.deliveryDays} onChange={v => setField("deliveryDays", v)} min={1} max={90}/>
            </FormField>
            <FormField label="Revisions included">
              <NumberInput value={form.revisionsIncluded} onChange={v => setField("revisionsIncluded", v)} min={0} max={10}/>
            </FormField>
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <Button variant="outline" onClick={() => onNavigate("/freelancer/services")}>Cancel</Button>
        <Button type="submit" loading={busy} iconRight="arrowRight">Save draft and continue</Button>
      </div>
    </form>
  );
}

// ───────────────────────── /freelancer/services/[id]/edit ─────────────────────────
function FreelancerServiceEditPage({ id, onNavigate }) {
  const original = getService(id) || SERVICES[0];
  const [form, setForm] = React.useState({ ...original });
  const [addons, setAddons] = React.useState(original.addons || []);
  const [tab, setTab] = React.useState("details");
  const [addonOpen, setAddonOpen] = React.useState(null);
  const [submitOpen, setSubmitOpen] = React.useState(false);
  const toast = useToast();
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const editable = form.status === "draft" || form.status === "rejected";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Breadcrumbs items={[{ label: "Services", to: "/freelancer/services" }, { label: "Edit" }]} onNavigate={onNavigate}/>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--fg-1)" }}>Edit service</h1>
          <p style={{ color: "var(--fg-4)", fontSize: 14, marginTop: 4 }}>
            <Badge tone={SERVICE_STATUS[form.status].tone}>{SERVICE_STATUS[form.status].label}</Badge>
            {!editable && <span style={{ marginLeft: 10 }}>This service is locked for editing while {form.status === "pending_review" ? "under review" : "live"}.</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="outline" onClick={() => onNavigate("/freelancer/services")}>Back</Button>
          {(form.status === "draft" || form.status === "rejected") && (
            <Button onClick={() => setSubmitOpen(true)} iconRight="arrowRight">Submit for review</Button>
          )}
        </div>
      </div>

      {form.status === "rejected" && form.rejectionReason && (
        <Card style={{ borderLeft: "3px solid var(--status-error)" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <Icon name="alert" size={20} color="var(--status-error)"/>
            <div>
              <b style={{ color: "var(--fg-1)" }}>Reviewer feedback</b>
              <p style={{ fontSize: 14, color: "var(--fg-3)", marginTop: 6, lineHeight: 1.5 }}>{form.rejectionReason}</p>
            </div>
          </div>
        </Card>
      )}

      <Tabs value={tab} onChange={setTab} items={[
        { key: "details", label: "Details", icon: "edit" },
        { key: "addons",  label: "Addons",  icon: "plus", count: addons.length },
        { key: "preview", label: "Preview", icon: "eye" },
      ]}/>

      {tab === "details" && (
        <Card padding={28}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <FormField label="Title" required>
              <TextInput value={form.title} onChange={v => setField("title", v)} disabled={!editable}/>
            </FormField>
            <FormField label="Category">
              <Select value={form.category} onChange={v => setField("category", v)} options={CATEGORIES} disabled={!editable}/>
            </FormField>
            <FormField label="Description">
              <Textarea value={form.description} onChange={v => setField("description", v)} rows={5} disabled={!editable}/>
            </FormField>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              <FormField label="Base price">
                <PriceInput value={form.basePrice} onChange={v => setField("basePrice", v)}/>
              </FormField>
              <FormField label="Delivery days">
                <NumberInput value={form.deliveryDays} onChange={v => setField("deliveryDays", v)} min={1} max={90}/>
              </FormField>
              <FormField label="Revisions included">
                <NumberInput value={form.revisionsIncluded} onChange={v => setField("revisionsIncluded", v)} min={0} max={10}/>
              </FormField>
            </div>
          </div>
        </Card>
      )}

      {tab === "addons" && (
        <Card padding={20}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Service addons</h3>
            {editable && <Button size="sm" icon="plus" variant="secondary" onClick={() => setAddonOpen({ id: null, type: "revision", name: "", price: 0, description: "" })}>Add addon</Button>}
          </div>
          {addons.length === 0
            ? <EmptyState icon="plus" title="No addons yet" body="Addons let clients upgrade scope (extras), shorten delivery, or buy more revisions. At least one revision-type addon is required to receive revision requests after the included allowance is used up." />
            : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {addons.map(a => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, border: "1px solid var(--border-2)", borderRadius: 10 }}>
                    <Badge tone={a.type === "revision" ? "info" : a.type === "faster_delivery" ? "warning" : "neutral"} dot={false}>{a.type.replace("_", " ")}</Badge>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>{a.name}</div>
                      {a.description && <div style={{ fontSize: 12, color: "var(--fg-4)" }}>{a.description}</div>}
                    </div>
                    <div style={{ fontWeight: 700, color: "var(--fg-1)", minWidth: 70, textAlign: "right" }}>{formatPrice(a.price)}</div>
                    {editable && <>
                      <IconButton icon="edit" title="Edit" onClick={() => setAddonOpen(a)}/>
                      <IconButton icon="trash" title="Remove" danger onClick={() => { setAddons(addons.filter(x => x.id !== a.id)); toast.push("Addon removed", { tone: "info" }); }}/>
                    </>}
                  </div>
                ))}
              </div>}
        </Card>
      )}

      {tab === "preview" && <ServicePreviewCard service={{ ...form, addons }}/>}

      {/* Addon edit dialog */}
      <AddonEditorDialog
        open={!!addonOpen} addon={addonOpen} onClose={() => setAddonOpen(null)}
        onSave={(saved) => {
          if (saved.id) setAddons(addons.map(a => a.id === saved.id ? saved : a));
          else setAddons([...addons, { ...saved, id: "new_" + Math.random().toString(36).slice(2, 6) }]);
          toast.push("Addon saved", { tone: "success" });
          setAddonOpen(null);
        }}
      />

      {/* Submit confirmation */}
      <ConfirmDialog
        open={submitOpen} onClose={() => setSubmitOpen(false)}
        title="Submit for review?"
        body="Reviewers check titles, descriptions, and pricing. You will not be able to edit while under review. Average turnaround is under 24 hours."
        confirmLabel="Submit for review"
        onConfirm={() => new Promise(r => setTimeout(() => {
          setSubmitOpen(false);
          setField("status", "pending_review");
          toast.push("Submitted for review", { tone: "success" });
          r();
        }, 700))}
      />
    </div>
  );
}

function AddonEditorDialog({ open, addon, onClose, onSave }) {
  const [form, setForm] = React.useState(addon || { type: "revision", name: "", description: "", price: 0, allowMulti: false });
  React.useEffect(() => { if (open) setForm(addon || { type: "revision", name: "", description: "", price: 0, allowMulti: false }); }, [open, addon]);
  return (
    <Dialog open={open} onClose={onClose} title={addon?.id ? "Edit addon" : "New addon"} maxWidth={520}
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.name || !form.price}>Save addon</Button>
      </>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FormField label="Type">
          <Select value={form.type} onChange={v => setForm({ ...form, type: v })} options={[
            { value: "revision",        label: "Revision (required to receive revision requests)" },
            { value: "extra",           label: "Extra (additional scope)" },
            { value: "faster_delivery", label: "Faster delivery (cosmetic, no delivery offset)" },
          ]}/>
        </FormField>
        <FormField label="Name" required>
          <TextInput value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="e.g. Extra revision round"/>
        </FormField>
        <FormField label="Description" hint="Optional. One short line about what the buyer gets.">
          <Textarea value={form.description} onChange={v => setForm({ ...form, description: v })} rows={2}/>
        </FormField>
        <FormField label="Price" required>
          <PriceInput value={form.price} onChange={v => setForm({ ...form, price: v })}/>
        </FormField>
        <Checkbox checked={form.allowMulti} onChange={v => setForm({ ...form, allowMulti: v })}
          label="Allow multiple quantities (e.g. buy 3 rounds at once)"/>
      </div>
    </Dialog>
  );
}

function ServicePreviewCard({ service }) {
  return (
    <Card>
      <div style={{ height: 160, background: service.cover || "var(--bg-image-ph)", borderRadius: 12, marginBottom: 16 }}/>
      <h2 style={{ fontSize: 22, fontWeight: 700 }}>{service.title || "Untitled service"}</h2>
      <p style={{ color: "var(--fg-4)", marginTop: 8, fontSize: 14, lineHeight: 1.65 }}>{service.description || "No description yet."}</p>
      <div style={{ display: "flex", gap: 16, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-2)", flexWrap: "wrap" }}>
        <div><div className="meta">Base price</div><div style={{ fontSize: 18, fontWeight: 700 }}>{formatPrice(service.basePrice)}</div></div>
        <div><div className="meta">Delivery</div><div style={{ fontSize: 18, fontWeight: 700 }}>{service.deliveryDays}d</div></div>
        <div><div className="meta">Revisions</div><div style={{ fontSize: 18, fontWeight: 700 }}>{service.revisionsIncluded}</div></div>
        <div style={{ marginLeft: "auto" }}><div className="meta">Addons</div><div style={{ fontSize: 18, fontWeight: 700 }}>{service.addons?.length || 0}</div></div>
      </div>
    </Card>
  );
}

// ───────────────────────── /freelancer/orders ─────────────────────────
function FreelancerOrdersPage({ demoState, onNavigate }) {
  const orders = ordersForFreelancer(ME.freelancer.id);
  const [tab, setTab] = React.useState("active");

  if (demoState === "loading") return <OrdersSkeleton/>;
  if (demoState === "empty")   return <EmptyState icon="shoppingBag" title="No orders yet" body="When clients purchase your services, they will appear here. Make sure at least one is published." action={<Button onClick={() => onNavigate("/freelancer/services")} variant="secondary">View my services</Button>}/>;

  const isActive = o => !["completed", "refunded", "cancelled"].includes(o.state);
  const filtered = tab === "active" ? orders.filter(isActive) : tab === "history" ? orders.filter(o => !isActive(o)) : orders;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader
        title="Incoming orders"
        subtitle="Orders clients have placed on your services."
      />
      <Tabs value={tab} onChange={setTab} items={[
        { key: "active",  label: "Active",  count: orders.filter(isActive).length },
        { key: "history", label: "History", count: orders.length - orders.filter(isActive).length },
      ]}/>
      {filtered.length === 0
        ? <EmptyState icon="shoppingBag" title="Nothing here yet" body="Active orders show up here once a client checks out."/>
        : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(o => <OrderListRow key={o.id} order={o} viewerRole="freelancer" onNavigate={onNavigate}/>)}
          </div>}
    </div>
  );
}

// shared row used on both /freelancer/orders and /client/orders
function OrderListRow({ order, viewerRole, onNavigate }) {
  const service = getService(order.serviceId) || { title: "(deleted service)" };
  const otherParty = viewerRole === "freelancer" ? getPerson(order.clientId) : getPerson(order.freelancerId);
  return (
    <Card hoverable onClick={() => onNavigate(`/orders/${order.id}`)} padding={16}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <Avatar name={otherParty.name} size={44} tone={viewerRole === "freelancer" ? "freelancer" : "client"}/>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 12, color: "var(--fg-4)", marginBottom: 2 }}>
            {viewerRole === "freelancer" ? "From" : "By"} {otherParty.name} · #{order.id.slice(-4)}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {service.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, fontSize: 12, color: "var(--fg-4)" }}>
            <span><Icon name="calendar" size={11} style={{ verticalAlign: "-1px" }}/> Due {shortDate(order.deliveryDeadline)}</span>
            <span>•</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
        <Badge tone={ORDER_STATE[order.state].tone === "neutral" ? "neutral" : ORDER_STATE[order.state].tone}>
          {ORDER_STATE[order.state].label}
        </Badge>
        <Icon name="chevronRight" size={18} color="var(--fg-4)" className="hide-on-mobile"/>
      </div>
    </Card>
  );
}

function OrdersSkeleton() {
  return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    {Array.from({ length: 4 }).map((_, i) => (
      <Card key={i} padding={16}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Skeleton width={44} height={44} radius={22}/>
          <div style={{ flex: 1 }}><Skeleton width="60%" height={14} style={{ marginBottom: 8 }}/><Skeleton width="40%" height={12}/></div>
          <Skeleton width={80} height={24} radius={9999}/>
        </div>
      </Card>
    ))}
  </div>;
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--fg-1)" }}>{title}</h1>
        {subtitle && <p style={{ color: "var(--fg-4)", fontSize: 14, marginTop: 4 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

Object.assign(window, {
  FreelancerOnboardingPage, FreelancerServicesPage,
  FreelancerServiceNewPage, FreelancerServiceEditPage,
  FreelancerOrdersPage, OrderListRow, PageHeader,
});
