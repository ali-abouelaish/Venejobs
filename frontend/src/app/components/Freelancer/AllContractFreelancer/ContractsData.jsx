"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_STYLES = {
  draft: { label: "Draft", bg: "bg-gray-100", text: "text-gray-600" },
  pending_review: { label: "Pending Review", bg: "bg-yellow-100", text: "text-yellow-800" },
  revision_requested: { label: "Revision Requested", bg: "bg-blue-100", text: "text-blue-800" },
  accepted: { label: "Active", bg: "bg-green-100", text: "text-green-800" },
  declined: { label: "Declined", bg: "bg-red-100", text: "text-red-800" },
  cancelled: { label: "Cancelled", bg: "bg-red-100", text: "text-red-800" },
};

function formatDate(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function formatPrice(price, currency) {
  if (!price) return "TBD";
  return `${currency ?? "USD"} ${Number(price).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const ContractsData = ({ searchQuery = "" }) => {
  const router = useRouter();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchContracts() {
      try {
        const res = await fetch("/api/contracts/my");
        if (!res.ok) throw new Error("Failed to load contracts");
        const data = await res.json();
        setContracts(data.contracts ?? []);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchContracts();
  }, []);

  const filtered = contracts.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.title ?? "").toLowerCase().includes(q) ||
      (c.other_name ?? "").toLowerCase().includes(q) ||
      (c.job_title ?? "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 text-sm">Loading contracts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-gray-500 text-sm">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            fetch("/api/contracts/my")
              .then((r) => r.json())
              .then((d) => setContracts(d.contracts ?? []))
              .catch((e) => setError(e.message))
              .finally(() => setLoading(false));
          }}
          className="text-sm text-secondary font-medium underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 text-sm">
          {searchQuery ? "No contracts match your search." : "No contracts yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {filtered.map((contract) => {
        const style = STATUS_STYLES[contract.status] ?? STATUS_STYLES.draft;

        return (
          <div
            key={contract.id}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-gray-200 py-6 gap-4"
          >
            {/* Left: title + meta */}
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <h2 className="font-semibold text-lg text-heading truncate">
                {contract.title ?? "Untitled contract"}
              </h2>
              <p className="text-paragraph text-sm">
                With <span className="font-medium">{contract.other_name ?? "Unknown"}</span>
              </p>
              {contract.job_title && contract.job_title !== "Direct contract" && (
                <p className="text-paragraph text-xs">{contract.job_title}</p>
              )}
              <p className="text-paragraph text-xs">
                {formatDate(contract.created_at)}
                {contract.deadline && ` - Due ${formatDate(contract.deadline)}`}
              </p>
            </div>

            {/* Middle: status + price */}
            <div className="flex flex-col gap-2 shrink-0">
              <span
                className={`${style.bg} ${style.text} rounded-full px-3 py-0.5 text-xs font-semibold w-fit`}
              >
                {style.label}
              </span>
              <p className="text-heading font-semibold text-sm">
                {formatPrice(contract.price, contract.currency)}
              </p>
            </div>

            {/* Right: action */}
            <div className="shrink-0">
              <button
                onClick={() =>
                  router.push(`/messages?contract=${contract.id}`)
                }
                className="bg-secondary text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity"
              >
                View Details
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContractsData;
