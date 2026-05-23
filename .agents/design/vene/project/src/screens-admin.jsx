// Admin screens: /admin/services + /admin/disputes.
// Both replace prompt() / confirm() with real Dialogs.

// ───────────────────────── /admin/services ─────────────────────────
function AdminServicesPage({ demoState }) {
  const queue = SERVICES.filter(s => s.status === "pending_review" || s.status === "rejected" || s.status === "published");
  const [tab, setTab] = React.useState("pending_review");
  const [search, setSearch] = React.useState("");
  const [rejectTarget, setRejectTarget] = React.useState(null);
  const [approveTarget, setApproveTarget] = React.useState(null);
  const [reason, setReason] = React.useState("");
  const toast = useToast();

  if (demoState === "loading") return <AdminTableSkeleton/>;
  if (demoState === "empty") return <EmptyState icon="checkCircle" title="No services awaiting review" body="Pending services will appear here as soon as freelancers submit them."/>;

  let rows = queue.filter(s => s.status === tab);
  if (search) rows = rows.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));

  // Mock: pretend each freelancer's Connect status
  const connectStatus = (freelancerId) => freelancerId === 56 ? { ready: false, code: "connect_not_ready", reason: "Payouts disabled" } : { ready: true };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader title="Service review queue"
        subtitle={`${queue.filter(s => s.status === "pending_review").length} pending · ${queue.filter(s => s.status === "rejected").length} rejected · ${queue.filter(s => s.status === "published").length} published`}/>

      <Tabs value={tab} onChange={setTab} items={[
        { key: "pending_review", label: "Pending",   count: queue.filter(s => s.status === "pending_review").length },
        { key: "rejected",       label: "Rejected",  count: queue.filter(s => s.status === "rejected").length },
        { key: "published",      label: "Published", count: queue.filter(s => s.status === "published").length },
      ]}/>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240, maxWidth: 420 }}>
          <TextInput icon="search" value={search} onChange={setSearch} placeholder="Search by title"/>
        </div>
        <div style={{ fontSize: 13, color: "var(--fg-4)" }}>{rows.length} result{rows.length === 1 ? "" : "s"}</div>
      </div>

      {rows.length === 0
        ? <EmptyState icon="list" title={`No ${tab.replace("_", " ")} services`} body="Try a different tab."/>
        : <Card padding={0} style={{ overflow: "hidden" }}>
            <AdminTable>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Freelancer</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Submitted</th>
                  <th>Connect</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(s => {
                  const f = getPerson(s.freelancerId);
                  const c = connectStatus(s.freelancerId);
                  return (
                    <tr key={s.id}>
                      <td style={{ minWidth: 240 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)", lineHeight: 1.4 }}>{s.title}</div>
                        {s.rejectionReason && <div style={{ fontSize: 11, color: "var(--status-error)", marginTop: 2 }}>Rejection: {s.rejectionReason.slice(0, 60)}…</div>}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Avatar name={f.name} size={28}/>
                          <span style={{ fontSize: 13, color: "var(--fg-2)" }}>{f.name}</span>
                        </div>
                      </td>
                      <td><span style={{ fontSize: 13, color: "var(--fg-3)" }}>{s.category}</span></td>
                      <td><span style={{ fontSize: 13, color: "var(--fg-2)", fontWeight: 600 }}>{formatPrice(s.basePrice)}</span></td>
                      <td><span style={{ fontSize: 13, color: "var(--fg-4)" }}>{s.submittedAt ? relTime(s.submittedAt) : "—"}</span></td>
                      <td>
                        {c.ready ? <Badge tone="success" size="sm">Ready</Badge> : <Badge tone="error" size="sm">{c.reason}</Badge>}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        {s.status === "pending_review" && (
                          <div style={{ display: "inline-flex", gap: 6 }}>
                            <Button size="sm" variant="secondary" tone="client" danger onClick={() => { setRejectTarget(s); setReason(""); }}>Reject</Button>
                            <Button size="sm" tone="client" onClick={() => setApproveTarget(s)} disabled={!c.ready}>Approve</Button>
                          </div>
                        )}
                        {s.status === "rejected" && <Badge tone="error" size="sm">Rejected</Badge>}
                        {s.status === "published" && <Badge tone="success" size="sm">Live</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </AdminTable>
          </Card>}

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject service" maxWidth={520}
        subtitle="The freelancer will see the reason on their edit page. Be specific: tell them what to fix and how."
        footer={<>
          <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
          <Button danger disabled={reason.trim().length < 20} onClick={() => {
            toast.push(`Rejected "${rejectTarget.title.slice(0, 40)}…"`, { tone: "warning" });
            setRejectTarget(null);
          }}>Reject service</Button>
        </>}>
        <FormField label="Reason for rejection" required hint="Minimum 20 characters. The freelancer reads this verbatim.">
          <Textarea value={reason} onChange={setReason} rows={5}
            placeholder="Title is too generic. Please specify the deliverable format and a concrete time estimate."/>
        </FormField>
      </Dialog>

      {/* Approve confirm */}
      <ConfirmDialog open={!!approveTarget} onClose={() => setApproveTarget(null)}
        title="Approve this service?"
        body={`"${approveTarget?.title}" will be published immediately and become buyable by clients. Charges + payouts are confirmed ready on the freelancer's Connect account.`}
        confirmLabel="Approve and publish"
        onConfirm={() => new Promise(r => setTimeout(() => {
          toast.push("Service approved and published.", { tone: "success" });
          setApproveTarget(null);
          r();
        }, 600))}/>
    </div>
  );
}

// ───────────────────────── /admin/disputes ─────────────────────────
function AdminDisputesPage({ demoState }) {
  const open = openDisputes();
  const [tab, setTab] = React.useState("open");
  const [resolve, setResolve] = React.useState(null);
  const [resolution, setResolution] = React.useState("pay_freelancer");
  const [splitAmt, setSplitAmt] = React.useState(0);
  const toast = useToast();

  if (demoState === "loading") return <AdminTableSkeleton/>;
  if (demoState === "empty") return <EmptyState icon="checkCircle" title="No open disputes" body="When buyers raise a dispute, it shows up here."/>;

  const rows = tab === "open" ? open : ORDERS.filter(o => !["disputed"].includes(o.state) && o.disputes?.length);

  React.useEffect(() => {
    if (resolve) {
      setResolution("pay_freelancer");
      setSplitAmt(Math.floor(resolve.totalAmount / 2));
    }
  }, [resolve]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader title="Disputes"
        subtitle={`${open.length} open. Resolve with refund, pay freelancer, or split.`}/>

      <Tabs value={tab} onChange={setTab} items={[
        { key: "open",     label: "Open",     count: open.length },
        { key: "resolved", label: "Resolved", count: 0 },
      ]}/>

      {rows.length === 0
        ? <EmptyState icon="flag" title="No disputes in this view" body="A clean inbox is a good thing."/>
        : <Card padding={0} style={{ overflow: "hidden" }}>
            <AdminTable>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Reason</th>
                  <th>Client</th>
                  <th>Freelancer</th>
                  <th>Amount</th>
                  <th>Raised</th>
                  <th style={{ textAlign: "right" }}>Resolve</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(o => {
                  const d = o.disputes[0] || {};
                  return (
                    <tr key={o.id}>
                      <td><code style={{ fontSize: 12, color: "var(--fg-3)" }}>{o.id}</code></td>
                      <td style={{ maxWidth: 320 }}>
                        <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {d.reason}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Avatar name={getPerson(o.clientId).name} size={26}/>
                          <span style={{ fontSize: 13, color: "var(--fg-2)" }}>{getPerson(o.clientId).name}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Avatar name={getPerson(o.freelancerId).name} size={26}/>
                          <span style={{ fontSize: 13, color: "var(--fg-2)" }}>{getPerson(o.freelancerId).name}</span>
                        </div>
                      </td>
                      <td><span style={{ fontWeight: 700, color: "var(--fg-1)" }}>{formatPrice(o.totalAmount)}</span></td>
                      <td><span style={{ fontSize: 12, color: "var(--fg-4)" }}>{relTime(d.raisedAt)}</span></td>
                      <td style={{ textAlign: "right" }}>
                        <Button size="sm" tone="client" onClick={() => setResolve(o)}>Resolve</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </AdminTable>
          </Card>}

      <Dialog open={!!resolve} onClose={() => setResolve(null)} title="Resolve dispute"
        subtitle={resolve ? `Order ${resolve.id} — ${formatPrice(resolve.totalAmount)} in escrow.` : ""}
        maxWidth={560}
        footer={<>
          <Button variant="outline" onClick={() => setResolve(null)}>Cancel</Button>
          <Button onClick={() => {
            const msg = resolution === "refund_client" ? "Client refunded in full." :
                        resolution === "pay_freelancer" ? "Funds transferred to freelancer." :
                        `Split applied. Client refunded ${formatPrice(splitAmt)}.`;
            toast.push(msg, { tone: "success" });
            setResolve(null);
          }} disabled={resolution === "split" && (splitAmt <= 0 || splitAmt >= (resolve?.totalAmount || 0))}>
            Resolve
          </Button>
        </>}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <FormField label="Resolution">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <ResolveOption checked={resolution === "pay_freelancer"} onChange={() => setResolution("pay_freelancer")}
                tone="success" icon="checkCircle" label="Pay freelancer"
                hint="Transfer the full net amount. Use when delivery clearly met spec."/>
              <ResolveOption checked={resolution === "refund_client"} onChange={() => setResolution("refund_client")}
                tone="error" icon="rotate" label="Refund client"
                hint="Refund the full amount. Use when delivery clearly missed spec."/>
              <ResolveOption checked={resolution === "split"} onChange={() => setResolution("split")}
                tone="warning" icon="handshake" label="Split"
                hint="Refund part to client, transfer rest to freelancer."/>
            </div>
          </FormField>

          {resolution === "split" && resolve && (
            <FormField label="Refund amount to client" required
              hint={`Total in escrow: ${formatPrice(resolve.totalAmount)}. The remainder transfers to the freelancer (after platform fee).`}
              error={(splitAmt <= 0 || splitAmt >= resolve.totalAmount) ? "Must be between $0.01 and the total." : undefined}>
              <PriceInput value={splitAmt} onChange={setSplitAmt}/>
            </FormField>
          )}

          {resolve && (
            <Card padding={14} style={{ background: "var(--bg-subtle)", boxShadow: "none", border: "1px solid var(--border-2)" }}>
              <div style={{ fontSize: 12, color: "var(--fg-4)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Outcome preview</div>
              {resolution === "pay_freelancer" && <PreviewLine c={`Refund: $0.00`} f={`Transfer: ${formatPrice(resolve.totalAmount - resolve.platformFeePence)}`}/>}
              {resolution === "refund_client"  && <PreviewLine c={`Refund: ${formatPrice(resolve.totalAmount)}`} f={`Transfer: $0.00`}/>}
              {resolution === "split"          && <PreviewLine c={`Refund: ${formatPrice(splitAmt)}`} f={`Transfer: ${formatPrice(Math.max(0, resolve.totalAmount - splitAmt - resolve.platformFeePence))}`}/>}
            </Card>
          )}
        </div>
      </Dialog>
    </div>
  );
}

function PreviewLine({ c, f }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--fg-2)" }}>
      <span>Client {c}</span>
      <span>Freelancer {f}</span>
    </div>
  );
}

function ResolveOption({ checked, onChange, tone, icon, label, hint }) {
  const tones = {
    success: { bg: "var(--status-success-bg)", color: "var(--status-success)" },
    error:   { bg: "var(--status-error-bg)",   color: "var(--status-error)" },
    warning: { bg: "var(--status-warning-bg)", color: "var(--status-warning)" },
  }[tone];
  return (
    <label style={{
      display: "flex", gap: 12, padding: 14, borderRadius: 10, cursor: "pointer",
      border: `1px solid ${checked ? tones.color : "var(--border-2)"}`,
      background: checked ? tones.bg : "white",
      transition: "all 120ms var(--ease-out)",
    }}>
      <input type="radio" checked={checked} onChange={onChange} style={{ position: "absolute", opacity: 0 }}/>
      <div style={{
        width: 36, height: 36, borderRadius: 8, background: tones.bg, color: tones.color,
        display: "grid", placeItems: "center", flexShrink: 0,
      }}>
        <Icon name={icon} size={18}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--fg-4)", marginTop: 2, lineHeight: 1.5 }}>{hint}</div>
      </div>
      <div style={{
        width: 18, height: 18, borderRadius: "50%", marginTop: 2,
        border: `1.5px solid ${checked ? tones.color : "var(--border-4)"}`,
        display: "grid", placeItems: "center", flexShrink: 0,
      }}>
        {checked && <span style={{ width: 8, height: 8, borderRadius: "50%", background: tones.color }}/>}
      </div>
    </label>
  );
}

// ───────────────────────── Admin table primitive ─────────────────────────
function AdminTable({ children }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "DM Sans" }}>
        <style>{`
          table th, table td { text-align: left; padding: 14px 16px; border-bottom: 1px solid var(--border-2); }
          table th { font-size: 11px; font-weight: 700; color: var(--fg-5); text-transform: uppercase; letter-spacing: 0.05em; background: var(--bg-subtle); }
          table tr:last-child td { border-bottom: none; }
          table tr:hover td { background: var(--bg-subtle); }
          table td { vertical-align: middle; }
        `}</style>
        {children}
      </table>
    </div>
  );
}

function AdminTableSkeleton() {
  return (
    <Card padding={0}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-2)" }}>
        <Skeleton width="40%" height={14}/>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 16, padding: "16px", borderBottom: "1px solid var(--border-2)" }}>
          <Skeleton width={28} height={28} radius={14}/>
          <div style={{ flex: 1 }}><Skeleton width="65%" height={14} style={{ marginBottom: 6 }}/><Skeleton width="40%" height={12}/></div>
          <Skeleton width={80} height={24} radius={9999}/>
        </div>
      ))}
    </Card>
  );
}

Object.assign(window, { AdminServicesPage, AdminDisputesPage });
