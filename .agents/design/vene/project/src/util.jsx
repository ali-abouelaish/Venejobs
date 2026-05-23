// Shared utilities for the VeneJobs Services prototype.
// All money is integer pence (the production rule). formatPrice is the single
// place we turn pence into a string. Never render Number(pence)/100 elsewhere.

function formatPrice(pence, { currency = "USD", showZeroCents = false } = {}) {
  if (pence == null || isNaN(pence)) return "";
  const amount = pence / 100;
  const opts = {
    style: "currency",
    currency,
    minimumFractionDigits: showZeroCents || amount % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  };
  return new Intl.NumberFormat("en-US", opts).format(amount);
}

// Parse a dollar string back to integer pence (used by PriceInput).
function parsePrice(str) {
  if (str == null) return 0;
  const cleaned = String(str).replace(/[^0-9.]/g, "");
  if (!cleaned) return 0;
  const n = Number(cleaned);
  if (isNaN(n)) return 0;
  return Math.round(n * 100);
}

function relTime(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  if (diff < 86400 * 7) return Math.floor(diff / 86400) + "d ago";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function shortDate(ts) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// Mime to glyph hint
function mimeKind(mime) {
  if (!mime) return "file";
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.includes("zip") || mime.includes("rar")) return "archive";
  return "file";
}

// Order state machine display info. Pulled directly from SERVICES_HANDOFF.md.
const ORDER_STATE = {
  paid:               { label: "Paid",               tone: "info",    desc: "Funds received. Freelancer can start work." },
  in_progress:        { label: "In Progress",        tone: "info",    desc: "Work has started." },
  delivered:          { label: "Delivered",          tone: "info",    desc: "Awaiting client review." },
  revision_requested: { label: "Revision Requested", tone: "warning", desc: "Client requested changes." },
  accepted:           { label: "Accepted",           tone: "success", desc: "Awaiting payout transfer." },
  auto_accepted:      { label: "Auto Accepted",      tone: "success", desc: "Review window elapsed." },
  disputed:           { label: "Disputed",           tone: "error",   desc: "Under admin review." },
  cancelled:          { label: "Cancelled",          tone: "error",   desc: "Order cancelled. Refund pending." },
  refunded:           { label: "Refunded",           tone: "neutral", desc: "Client has been refunded." },
  completed:          { label: "Completed",          tone: "success", desc: "Funds transferred to freelancer." },
};

const SERVICE_STATUS = {
  draft:          { label: "Draft",          tone: "neutral" },
  pending_review: { label: "Pending Review", tone: "warning" },
  published:      { label: "Published",      tone: "success" },
  rejected:       { label: "Rejected",       tone: "error"   },
};

// Allowed transitions (read-only, mirrors lib/orders.ts VALID_TRANSITIONS).
const VALID_TRANSITIONS = {
  paid:               ["in_progress", "delivered", "cancelled"],
  in_progress:        ["delivered", "cancelled"],
  delivered:          ["revision_requested", "accepted", "auto_accepted", "disputed"],
  revision_requested: ["in_progress", "disputed"],
  accepted:           ["completed"],
  auto_accepted:      ["completed"],
  cancelled:          ["refunded"],
  disputed:           ["completed", "refunded"],
  completed:          [],
  refunded:           [],
};

Object.assign(window, {
  formatPrice, parsePrice, relTime, shortDate, fileSize, mimeKind,
  ORDER_STATE, SERVICE_STATUS, VALID_TRANSITIONS,
});
