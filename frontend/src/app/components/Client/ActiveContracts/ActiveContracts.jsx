"use client";
import { useEffect, useState } from "react";
import ContractCard from "./ContractCard";
import Pagination from "@/app/components/Pagination/Pagination";

const PAGE_SIZE = 5;

export default function ActiveContracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function fetchContracts() {
      try {
        const res = await fetch("/api/contracts/my");
        if (!res.ok) throw new Error("Failed to load contracts");
        const data = await res.json();
        if (!cancelled) {
          setContracts(data.contracts ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchContracts();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalPage = Math.max(1, Math.ceil(contracts.length / PAGE_SIZE));
  const pageContracts = contracts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectPage = (p) => {
    if (p >= 1 && p <= totalPage) setPage(p);
  };

  if (loading) {
    return (
      <div className="rounded-[20px] border border-[rgba(68,68,68,0.08)] w-full py-16 flex justify-center">
        <p className="text-gray-500 text-sm">Loading contracts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[20px] border border-[rgba(68,68,68,0.08)] w-full py-16 flex justify-center">
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="rounded-[20px] border border-[rgba(68,68,68,0.08)] w-full py-16 flex justify-center">
        <p className="text-gray-500 text-sm">No active contracts yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-[rgba(68,68,68,0.08)] w-full">
      {pageContracts.map((contract) => (
        <ContractCard key={contract.id} contract={contract} />
      ))}

      {totalPage > 1 && (
        <Pagination page={page} totalPages={totalPage} onPageChange={selectPage} />
      )}
    </div>
  );
}
