// /client/orders + /orders/[id] + /orders/[id]/buy-revisions

// ───────────────────────── /client/orders ─────────────────────────
function ClientOrdersPage({ demoState, onNavigate }) {
  const all = ordersForClient(ME.client.id);
  const [tab, setTab] = React.useState("active");

  if (demoState === "loading") return <OrdersSkeleton/>;
  if (demoState === "empty") return <EmptyState icon="shoppingBag" title="No orders yet" body="When you buy a service, it shows up here." action={<Button onClick={() => onNavigate("/services")}>Browse services</Button>}/>;

  const isActive = o => !["completed", "refunded", "cancelled"].includes(o.state);
  const filtered = tab === "active" ? all.filter(isActive) : all.filter(o => !isActive(o));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader title="My orders" subtitle="Services you have purchased."
        action={<Button onClick={() => onNavigate("/services")} variant="secondary" icon="plus">Buy a service</Button>}/>
      <Tabs value={tab} onChange={setTab} items={[
        { key: "active",  label: "Active",  count: all.filter(isActive).length },
        { key: "history", label: "History", count: all.length - all.filter(isActive).length },
      ]}/>
      {filtered.length === 0
        ? <EmptyState icon="shoppingBag" title="Nothing here" body="Active orders show up here once you check out." action={<Button onClick={() => onNavigate("/services")} variant="secondary">Browse services</Button>}/>
        : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(o => <OrderListRow key={o.id} order={o} viewerRole="client" onNavigate={onNavigate}/>)}
          </div>}
    </div>
  );
}

// ───────────────────────── /orders/[id] ─────────────────────────
// State-aware. The action bar at the top reflects only transitions valid for
// the current state and the current viewer role.
function OrderDetailPage({ id, viewerRole, onNavigate }) {
  const initial = getOrder(id) || ORDERS[0];
  const [order, setOrder] = React.useState({ ...initial });
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [revOpen, setRevOpen] = React.useState(false);
  const [revMsg, setRevMsg] = React.useState("");
  const [disputeOpen, setDisputeOpen] = React.useState(false);
  const [disputeReason, setDisputeReason] = React.useState("");
  const [deliverOpen, setDeliverOpen] = React.useState(false);
  const toast = useToast();

  const service = getService(order.serviceId) || SERVICES[0];
  const other = getPerson(viewerRole === "freelancer" ? order.clientId : order.freelancerId);
  const canCancel = order.state === "paid" && order.deliveryDeadline < Date.now();
  const canCancelEarly = order.state === "paid" && order.deliveryDeadline >= Date.now();
  const revisionsLeft = (order.revisionsPurchased + (service.revisionsIncluded || 0)) - order.revisionsUsed;

  const transition = (toState, patch = {}) => {
    setOrder(o => ({ ...o, state: toState, ...patch }));
  };

  const requestRevision = () => {
    if (revisionsLeft <= 0) {
      sessionStorage.setItem("vj-revision-draft", JSON.stringify({ orderId: order.id, message: revMsg }));
      toast.push("You've used all your revisions. Buy more to continue.", { tone: "warning" });
      setRevOpen(false);
      onNavigate(`/orders/${order.id}/buy-revisions`);
      return;
    }
    setOrder(o => ({ ...o, state: "in_progress", revisionsUsed: o.revisionsUsed + 1, revisions: [...o.revisions, { id: "rv_" + Date.now(), message: revMsg, requestedAt: Date.now() }] }));
    setRevMsg("");
    setRevOpen(false);
    toast.push("Revision requested.", { tone: "info" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Breadcrumbs onNavigate={onNavigate} items={[
        { label: viewerRole === "freelancer" ? "Incoming orders" : "My orders", to: viewerRole === "freelancer" ? "/freelancer/orders" : "/client/orders" },
        { label: `Order #${order.id.slice(-4)}` },
      ]}/>

      {/* Header row */}
      <Card padding={20}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <Avatar name={other.name} size={56} tone={viewerRole === "freelancer" ? "client" : "freelancer"}/>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 12, color: "var(--fg-4)" }}>
              {viewerRole === "freelancer" ? "Client" : "Freelancer"} · {other.name} · Order #{order.id.slice(-4)}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--fg-1)", marginTop: 4, lineHeight: 1.3 }}>{service.title}</h2>
          </div>
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <Badge tone={ORDER_STATE[order.state].tone === "neutral" ? "neutral" : ORDER_STATE[order.state].tone}>
              {ORDER_STATE[order.state].label}
            </Badge>
            <div style={{ fontSize: 13, color: "var(--fg-4)" }}>{ORDER_STATE[order.state].desc}</div>
          </div>
        </div>

        {/* Action bar — state aware */}
        <div style={{ display: "flex", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-2)", flexWrap: "wrap" }}>
          {/* Freelancer actions */}
          {viewerRole === "freelancer" && (order.state === "paid" || order.state === "in_progress" || order.state === "revision_requested") && (
            <Button onClick={() => setDeliverOpen(true)} icon="upload">Submit delivery</Button>
          )}

          {/* Client actions on delivered */}
          {viewerRole === "client" && order.state === "delivered" && (
            <>
              <Button onClick={() => { transition("accepted", { acceptedAt: Date.now() }); toast.push("Accepted. Funds transferring to freelancer.", { tone: "success" }); }} icon="check">
                Accept delivery
              </Button>
              <Button variant="secondary" icon="refresh" onClick={() => setRevOpen(true)}>Request revision</Button>
              <Button variant="ghost" danger icon="flag" onClick={() => setDisputeOpen(true)}>Raise dispute</Button>
            </>
          )}

          {/* Client: cancel */}
          {viewerRole === "client" && order.state === "paid" && (
            <Button variant="outline" danger icon="x"
              onClick={() => setCancelOpen(true)}
              disabled={!canCancel}
              title={canCancel ? "Cancel and refund" : "Cancel is only available after the delivery deadline"}>
              {canCancel ? "Cancel order" : "Cancel available after deadline"}
            </Button>
          )}

          {/* Freelancer awaiting acceptance */}
          {viewerRole === "freelancer" && order.state === "delivered" && (
            <div style={{ fontSize: 13, color: "var(--fg-4)", display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="clock" size={14}/>
              Auto-accepts on {shortDate(order.autoAcceptDeadline || Date.now() + 86400000 * 3)}
            </div>
          )}
        </div>
      </Card>

      <div className="two-col">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Timeline */}
          <Card padding={24}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--fg-1)", marginBottom: 16 }}>Timeline</h3>
            <OrderTimeline order={order}/>
          </Card>

          {/* Deliveries */}
          {order.deliveries?.length > 0 && (
            <Card padding={24}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--fg-1)", marginBottom: 16 }}>Deliveries</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {order.deliveries.map((d, i) => (
                  <div key={d.id} style={{ paddingBottom: 16, borderBottom: i < order.deliveries.length - 1 ? "1px solid var(--border-2)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Badge tone="info" dot={false}>Delivery {i + 1}</Badge>
                      <span style={{ fontSize: 12, color: "var(--fg-4)" }}>{relTime(d.deliveredAt)}</span>
                    </div>
                    <p style={{ fontSize: 14, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>{d.message}</p>
                    {d.attachments?.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                        {d.attachments.map(a => <AttachmentItem key={a.id} file={a}/>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Revisions */}
          {order.revisions?.length > 0 && (
            <Card padding={24}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--fg-1)", marginBottom: 16 }}>Revision requests</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {order.revisions.map(r => (
                  <div key={r.id} style={{ padding: 14, borderRadius: 10, background: "var(--status-warning-bg)", borderLeft: "3px solid var(--status-warning)" }}>
                    <div style={{ fontSize: 12, color: "#7a5a00", fontWeight: 600 }}>{shortDate(r.requestedAt)}</div>
                    <p style={{ fontSize: 14, color: "var(--fg-2)", marginTop: 6, lineHeight: 1.6 }}>{r.message}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Disputes */}
          {order.disputes?.length > 0 && (
            <Card padding={24} style={{ borderLeft: "3px solid var(--status-error)" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--fg-1)", marginBottom: 12 }}>Dispute filed</h3>
              {order.disputes.map(d => (
                <div key={d.id}>
                  <div style={{ fontSize: 12, color: "var(--fg-4)", marginBottom: 6 }}>By {getPerson(d.raisedBy).name} · {shortDate(d.raisedAt)}</div>
                  <p style={{ fontSize: 14, color: "var(--fg-3)", lineHeight: 1.6 }}>{d.reason}</p>
                </div>
              ))}
            </Card>
          )}
        </div>

        {/* Right rail — order summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card padding={20}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--fg-1)", marginBottom: 12 }}>Order summary</h4>
            <SummaryLine label="Base service" value={formatPrice(order.baseAmount)}/>
            {order.addons.map(a => <SummaryLine key={a.id} label={`${a.name}${a.quantity > 1 ? ` × ${a.quantity}` : ""}`} value={formatPrice(a.price * a.quantity)}/>)}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-2)" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--fg-1)" }}>{formatPrice(order.totalAmount)}</span>
            </div>
            {viewerRole === "freelancer" && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 13, color: "var(--fg-4)" }}>
                <span>You earn (10% platform fee)</span>
                <span style={{ color: "var(--status-success)", fontWeight: 600 }}>{formatPrice(order.totalAmount - order.platformFeePence)}</span>
              </div>
            )}
          </Card>

          <Card padding={20}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--fg-1)", marginBottom: 12 }}>Details</h4>
            <SummaryLine label="Order ID" value={<code style={{ fontSize: 11 }}>{order.id}</code>}/>
            {order.paidAt && <SummaryLine label="Paid" value={shortDate(order.paidAt)}/>}
            <SummaryLine label="Delivery deadline" value={shortDate(order.deliveryDeadline)}/>
            <SummaryLine label="Revisions" value={`${order.revisionsUsed} of ${(order.revisionsPurchased + (service.revisionsIncluded || 0))} used`}/>
            {order.transferId && <SummaryLine label="Transfer" value={<code style={{ fontSize: 11 }}>{order.transferId}</code>}/>}
          </Card>
        </div>
      </div>

      {/* Cancel confirm */}
      <ConfirmDialog open={cancelOpen} onClose={() => setCancelOpen(false)}
        title="Cancel this order?"
        body="The full amount will be refunded to the client. This is final and cannot be reversed."
        confirmLabel="Cancel order" danger
        onConfirm={() => new Promise(r => setTimeout(() => {
          transition("cancelled", { cancelledAt: Date.now() });
          toast.push("Order cancelled. Refund initiated.", { tone: "warning" });
          setCancelOpen(false);
          r();
        }, 500))}/>

      {/* Revision dialog */}
      <Dialog open={revOpen} onClose={() => setRevOpen(false)} title="Request a revision"
        subtitle={revisionsLeft > 0 ? `You have ${revisionsLeft} revision${revisionsLeft === 1 ? "" : "s"} remaining.` : "You've used all included revisions. Continuing will take you to buy more."}
        maxWidth={520}
        footer={<>
          <Button variant="outline" onClick={() => setRevOpen(false)}>Cancel</Button>
          <Button onClick={requestRevision} disabled={revMsg.trim().length < 10}>
            {revisionsLeft > 0 ? "Send revision request" : "Continue to buy revisions"}
          </Button>
        </>}>
        <FormField label="What needs to change?" hint="Be specific. The freelancer will see this verbatim.">
          <Textarea value={revMsg} onChange={setRevMsg} rows={5}
            placeholder="Hero feels too quiet — try a stronger headline verb and a punchier CTA color."/>
        </FormField>
      </Dialog>

      {/* Dispute dialog */}
      <Dialog open={disputeOpen} onClose={() => setDisputeOpen(false)} title="Raise a dispute"
        subtitle="Disputes pause the auto-accept timer and go to an admin for review. Try a revision request first if possible."
        maxWidth={540}
        footer={<>
          <Button variant="outline" onClick={() => setDisputeOpen(false)}>Cancel</Button>
          <Button danger onClick={() => {
            transition("disputed", { disputes: [...order.disputes, { id: "dp_" + Date.now(), reason: disputeReason, raisedAt: Date.now(), raisedBy: ME.client.id }] });
            setDisputeOpen(false); setDisputeReason("");
            toast.push("Dispute filed. An admin will review within 24 hours.", { tone: "warning" });
          }} disabled={disputeReason.trim().length < 20}>Raise dispute</Button>
        </>}>
        <FormField label="Reason for dispute" required hint="At least 20 characters. Reviewers read this first.">
          <Textarea value={disputeReason} onChange={setDisputeReason} rows={5}
            placeholder="The delivered files do not match the brief in two specific ways: (1)…"/>
        </FormField>
      </Dialog>

      {/* Deliver dialog */}
      <DeliverDialog open={deliverOpen} onClose={() => setDeliverOpen(false)}
        onDeliver={(message, attachments) => {
          transition("delivered", {
            deliveredAt: Date.now(),
            autoAcceptDeadline: Date.now() + 86400000 * 3,
            deliveries: [...order.deliveries, { id: "del_" + Date.now(), message, deliveredAt: Date.now(), attachments }],
          });
          setDeliverOpen(false);
          toast.push("Delivery submitted. The client has been notified.", { tone: "success" });
        }}/>
    </div>
  );
}

function SummaryLine({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--fg-4)", marginTop: 6 }}>
      <span>{label}</span><span style={{ color: "var(--fg-2)" }}>{value}</span>
    </div>
  );
}

function AttachmentItem({ file, onRemove }) {
  return (
    <a style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-2)",
      background: "var(--bg-subtle)", textDecoration: "none", color: "inherit", cursor: "pointer",
    }}
    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-muted)"}
    onMouseLeave={e => e.currentTarget.style.background = "var(--bg-subtle)"}>
      <div style={{ width: 32, height: 32, borderRadius: 6, background: "white", color: "var(--fg-3)", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name={mimeKind(file.mime) === "image" ? "image" : "file"} size={14}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.filename}</div>
        <div style={{ fontSize: 11, color: "var(--fg-4)" }}>{fileSize(file.size)}</div>
      </div>
      <Icon name="download" size={16} color="var(--fg-4)"/>
    </a>
  );
}

function OrderTimeline({ order }) {
  const events = [
    { state: "paid",        label: "Order paid",      at: order.paidAt,      done: !!order.paidAt },
    { state: "in_progress", label: "Work in progress",at: order.startedAt,   done: ["in_progress", "delivered", "revision_requested", "accepted", "auto_accepted", "completed", "disputed"].includes(order.state) },
    { state: "delivered",   label: "Delivered",       at: order.deliveredAt, done: ["delivered", "revision_requested", "accepted", "auto_accepted", "completed", "disputed"].includes(order.state) },
    { state: "accepted",    label: "Accepted",        at: order.acceptedAt,  done: ["accepted", "auto_accepted", "completed"].includes(order.state) },
    { state: "completed",   label: "Funds transferred", at: order.completedAt, done: order.state === "completed" },
  ];
  if (order.state === "cancelled" || order.state === "refunded") {
    events.push({ state: order.state, label: order.state === "refunded" ? "Refunded" : "Cancelled", at: order.cancelledAt, done: true, tone: "error" });
  }
  if (order.state === "disputed") {
    events.push({ state: "disputed", label: "Dispute filed", at: order.disputes[0]?.raisedAt, done: true, tone: "error" });
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {events.map((e, i) => (
        <div key={i} style={{ display: "flex", gap: 14, alignItems: "stretch", position: "relative" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 22 }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: e.done ? (e.tone === "error" ? "var(--status-error)" : "var(--status-success)") : "var(--bg-muted)",
              color: e.done ? "white" : "var(--fg-5)",
              display: "grid", placeItems: "center", flexShrink: 0,
              border: "2px solid white", boxShadow: e.done ? "0 0 0 2px var(--status-success-bg)" : "0 0 0 2px var(--border-2)",
            }}>
              {e.done && <Icon name="check" size={11} strokeWidth={4}/>}
            </div>
            {i < events.length - 1 && <div style={{ width: 2, flex: 1, background: e.done && events[i + 1].done ? "var(--status-success)" : "var(--border-2)", margin: "2px 0" }}/>}
          </div>
          <div style={{ flex: 1, paddingBottom: i < events.length - 1 ? 18 : 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: e.done ? "var(--fg-1)" : "var(--fg-4)" }}>{e.label}</div>
            {e.at && <div style={{ fontSize: 12, color: "var(--fg-4)", marginTop: 2 }}>{shortDate(e.at)}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function DeliverDialog({ open, onClose, onDeliver }) {
  const [message, setMessage] = React.useState("");
  const [files, setFiles] = React.useState([]);

  React.useEffect(() => { if (open) { setMessage(""); setFiles([]); } }, [open]);

  // wrap onChange so the AttachmentUploader can update files via functional setter
  const updateFiles = (next) => {
    if (typeof next === "function") setFiles(next);
    else setFiles(next);
  };

  return (
    <Dialog open={open} onClose={onClose} title="Submit delivery"
      subtitle="Add a short note for the client and attach the deliverables. Files are uploaded to private object storage."
      maxWidth={620}
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onDeliver(message, files)} disabled={!message.trim() || files.some(f => f.status !== "done")}>
          {files.some(f => f.status === "uploading") ? "Uploading…" : "Submit delivery"}
        </Button>
      </>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FormField label="Note to client" hint="What did you do, and what should they look at first?">
          <Textarea value={message} onChange={setMessage} rows={4} placeholder="Final files attached. The Figma uses your brand colors and includes three breakpoints…"/>
        </FormField>
        <FormField label="Attachments">
          <AttachmentUploader files={files} onChange={updateFiles}/>
        </FormField>
      </div>
    </Dialog>
  );
}

// ───────────────────────── /orders/[id]/buy-revisions ─────────────────────────
function BuyRevisionsPage({ id, onNavigate }) {
  const order = getOrder(id) || ORDERS[0];
  const service = getService(order.serviceId) || SERVICES[0];
  const revisionAddons = (service.addons || []).filter(a => a.type === "revision");
  const [qty, setQty] = React.useState({});
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem("vj-revision-draft");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.orderId === order.id) setDraft(parsed.message || "");
      }
    } catch {}
  }, [order.id]);

  const subtotal = revisionAddons.reduce((s, a) => s + a.price * (qty[a.id] || 0), 0);
  const anySelected = Object.values(qty).some(v => v > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 760, margin: "0 auto" }}>
      <Breadcrumbs onNavigate={onNavigate} items={[
        { label: "My orders", to: "/client/orders" },
        { label: `Order #${order.id.slice(-4)}`, to: `/orders/${order.id}` },
        { label: "Buy revisions" },
      ]}/>

      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--fg-1)" }}>Buy more revisions</h1>
        <p style={{ color: "var(--fg-4)", fontSize: 14, marginTop: 4, lineHeight: 1.6 }}>
          You have used all included revisions on this order. Buy more here and we will return you to the revision request when payment clears.
        </p>
      </div>

      {draft && (
        <Card style={{ background: "var(--status-info-bg)", boxShadow: "none", border: "none" }} padding={16}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Icon name="info" size={16} color="var(--client-primary)" style={{ marginTop: 2, flexShrink: 0 }}/>
            <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.55 }}>
              <b style={{ color: "var(--client-primary)" }}>Saved revision draft.</b> We kept your message so you don't lose it: <i>"{draft.length > 100 ? draft.slice(0, 100) + "…" : draft}"</i>
            </div>
          </div>
        </Card>
      )}

      <Card padding={24}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--fg-1)", marginBottom: 16 }}>Available revision addons</h3>
        {revisionAddons.length === 0
          ? <EmptyState icon="alert" title="No revision addons on this service" body="Ask the freelancer to add one in their service settings, or use the messages thread to reach a resolution."/>
          : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {revisionAddons.map(a => (
                <AddonRow key={a.id} addon={a}
                  quantity={qty[a.id] || 0}
                  onQuantityChange={n => setQty(q => ({ ...q, [a.id]: n }))}/>
              ))}
            </div>}
      </Card>

      <Card padding={20}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--fg-4)" }}>
          <span>Subtotal</span><span style={{ color: "var(--fg-2)", fontWeight: 600 }}>{formatPrice(subtotal)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 12, borderTop: "1px solid var(--border-2)" }}>
          <span style={{ fontWeight: 600, color: "var(--fg-1)" }}>Total today</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: "var(--fg-1)" }}>{formatPrice(subtotal)}</span>
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <Button variant="outline" onClick={() => onNavigate(`/orders/${order.id}`)}>Back to order</Button>
        <Button onClick={() => setCheckoutOpen(true)} disabled={!anySelected} iconRight="arrowRight" size="lg">
          Pay {formatPrice(subtotal)}
        </Button>
      </div>

      <CheckoutDialog
        open={checkoutOpen} onClose={() => setCheckoutOpen(false)}
        service={{ ...service, basePrice: 0, addons: revisionAddons, title: `Revisions for order #${order.id.slice(-4)}` }}
        qty={qty} total={subtotal}
        onNavigate={() => { setCheckoutOpen(false); onNavigate(`/orders/${order.id}`); }}
      />
    </div>
  );
}

Object.assign(window, {
  ClientOrdersPage, OrderDetailPage, BuyRevisionsPage,
  OrderTimeline, DeliverDialog, AttachmentItem,
});
