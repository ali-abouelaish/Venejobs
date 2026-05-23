"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import { useClickOutside } from "@/hooks/useClickOutside";
import userApiStore from "@/app/store/userStore";
import { searchAll } from "@/app/lib/search";

const DEBOUNCE_MS = 300;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

function avatarSrc(profilePicture) {
  if (!profilePicture) return null;
  if (profilePicture.startsWith("http")) return profilePicture;
  return `${BASE_URL}${profilePicture.replace(/^\//, "")}`;
}

function ResultRow({ result, active, onClick }) {
  return (
    <Link
      href={result.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
        active ? "bg-gray-100" : "hover:bg-gray-50"
      }`}
    >
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
        {result.imageUrl ? (
          <Image
            src={avatarSrc(result.imageUrl) ?? result.imageUrl}
            alt=""
            width={32}
            height={32}
            className="w-8 h-8 object-cover"
            unoptimized
          />
        ) : (
          <span className="text-xs font-semibold text-gray-500">
            {(result.title ?? "?").charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800 truncate">
          {result.title}
        </p>
        {result.subtitle ? (
          <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
        ) : null}
      </div>
    </Link>
  );
}

function Section({ label, results, seeAllHref, activeId, onItemClick }) {
  if (!results.length) return null;
  return (
    <div className="py-2">
      <div className="flex items-center justify-between px-4 pb-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <Link
          href={seeAllHref}
          onClick={onItemClick}
          className="text-[11px] font-medium text-secondary hover:underline"
        >
          See all
        </Link>
      </div>
      {results.map((r) => (
        <ResultRow
          key={`${label}-${r.id}`}
          result={r}
          active={activeId === `${label}-${r.id}`}
          onClick={onItemClick}
        />
      ))}
    </div>
  );
}

export default function GlobalSearch() {
  const router = useRouter();
  const role = userApiStore((s) => s.user?.role_id);

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState({ jobs: [], freelancers: [], services: [] });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const requestIdRef = useRef(0);

  useClickOutside(containerRef, () => setOpen(false));

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    // Dropdown is hidden when debounced.length < 2 (see showDropdown
    // below), so stale results in state stay invisible — no need to
    // clear them and trigger an extra render here.
    if (debounced.length < 2) return;
    const id = ++requestIdRef.current;
    const controller = new AbortController();
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const res = await searchAll(debounced, { role, signal: controller.signal });
        if (cancelled || id !== requestIdRef.current) return;
        setResults(res);
      } finally {
        if (!cancelled && id === requestIdRef.current) setLoading(false);
      }
    };
    run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [debounced, role]);

  const flat = useMemo(() => {
    const list = [];
    results.jobs.forEach((r) => list.push({ section: "Jobs", ...r }));
    results.freelancers.forEach((r) => list.push({ section: "Freelancers", ...r }));
    results.services.forEach((r) => list.push({ section: "Services", ...r }));
    return list;
  }, [results]);

  const activeId = activeIdx >= 0 && flat[activeIdx]
    ? `${flat[activeIdx].section}-${flat[activeIdx].id}`
    : null;

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setActiveIdx(-1);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      closeDropdown();
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (flat.length === 0 ? -1 : (i + 1) % flat.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (flat.length === 0 ? -1 : (i - 1 + flat.length) % flat.length));
    } else if (e.key === "Enter") {
      if (activeIdx >= 0 && flat[activeIdx]) {
        e.preventDefault();
        router.push(flat[activeIdx].href);
        closeDropdown();
      } else if (debounced.length >= 2) {
        // No active highlight — send to a sensible default browse page.
        e.preventDefault();
        const target = role === 2
          ? `/client/freelancerList?q=${encodeURIComponent(debounced)}`
          : `/services?q=${encodeURIComponent(debounced)}`;
        router.push(target);
        closeDropdown();
      }
    }
  };

  const hasAnyResults =
    results.jobs.length || results.freelancers.length || results.services.length;
  const showDropdown = open && debounced.length >= 2;

  return (
    <div className="relative" ref={containerRef}>
      <span className="absolute inset-y-0 left-0 px-4 flex items-center pointer-events-none">
        <SvgIcon name="Search_Icon" />
      </span>
      <div className="w-full">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIdx(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search jobs, freelancers, services"
          className="w-full h-13 pl-12 pr-5 rounded-full bg-white text-[15px] font-medium text-gray-700 placeholder:text-gray-400 border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.06)] outline-none focus:border-secondary focus:shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all duration-200"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="global-search-listbox"
          aria-expanded={showDropdown}
        />
      </div>

      {showDropdown && (
        <div
          id="global-search-listbox"
          role="listbox"
          className="absolute left-0 right-0 mt-2 w-95 max-w-[90vw] origin-top rounded-xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
        >
          {loading && !hasAnyResults ? (
            <p className="px-4 py-4 text-sm text-gray-500">Searching…</p>
          ) : !hasAnyResults ? (
            <p className="px-4 py-4 text-sm text-gray-500">
              No matches for &ldquo;{debounced}&rdquo;.
            </p>
          ) : (
            <>
              <Section
                label="Jobs"
                results={results.jobs}
                seeAllHref={
                  role === 2
                    ? `/client/jobpost?q=${encodeURIComponent(debounced)}`
                    : `/freelancer/home?q=${encodeURIComponent(debounced)}`
                }
                activeId={activeId}
                onItemClick={closeDropdown}
              />
              <Section
                label="Freelancers"
                results={results.freelancers}
                seeAllHref={`/client/freelancerList?q=${encodeURIComponent(debounced)}`}
                activeId={activeId}
                onItemClick={closeDropdown}
              />
              <Section
                label="Services"
                results={results.services}
                seeAllHref={`/services?q=${encodeURIComponent(debounced)}`}
                activeId={activeId}
                onItemClick={closeDropdown}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
