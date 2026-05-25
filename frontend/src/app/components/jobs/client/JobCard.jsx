import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api";
import jobApiStore from "@/app/store/jobStore";
import toastStore from "@/app/store/toastStore";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import Button from "../../button/Button";
import Loader from "../../common/Loader";
import { getPostedTime } from "@/app/utils/time";

export default function JobCard({ item }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const budgetType = item?.budget_type
    ? item.budget_type.charAt(0).toUpperCase() + item.budget_type.slice(1)
    : "";

  const handleDetailsClick = () => {
    setLoading(true);
    router.push(`/client/JobDetail/${item.id}`);
  };

  const handleEdit = () => {
    router.push(`/client/jobpost/forms/?id=${item.id}`);
  };

  const handleRemove = async () => {
    if (!window.confirm("Remove this posting? It will no longer be visible to freelancers.")) return;
    try {
      await api.patch(`api/jobs/${item.id}/active`, { is_active: false });
      const { fetchJobsByUser } = jobApiStore.getState();
      if (typeof fetchJobsByUser === "function") fetchJobsByUser(1, 10);
      toastStore.getState().showSuccess?.("Posting removed");
    } catch (err) {
      const msg =
        err?.response?.data?.message || err.message || "Failed to remove posting";
      toastStore.getState().showError?.(msg);
    }
  };

  return (
    <div className="border-b border-[rgba(68,68,68,0.08)] p-5 lg:p-6 xl:p-8">
      <div className="w-full flex flex-col xl:flex-row rounded justify-between gap-5 lg:gap-3.5">
        <div className="flex flex-col gap-5 lg:gap-3.5">
          <h1 className="text-xl xl:text-2xl text-heading font-semibold tracking-normal">
            {item.title ?? "Need a UI/UX Designer for Mobile App"}
          </h1>

          <p className="text-paragraph text-sm lg:text-base font-medium">
            {getPostedTime(item.created_at)}
          </p>
        </div>

        <div className="hidden lg:flex flex-col md:flex-row justify-start md:items-center gap-5 sm:gap-20">
          <span className="hidden lg:flex text-paragraph font-semibold text-base">
            Proposals (2)
          </span>
          <span className="hidden lg:flex text-paragraph font-semibold text-base">
            Message (1)
          </span>
          <span className="hidden lg:flex text-paragraph font-semibold text-base">
            Shortlist (2)
          </span>

          <Button
            onClick={handleDetailsClick}
            disabled={loading}
            variant="primaryOutlined"
          >
            {loading ? (
              <Loader size={18} border={3} color="white" />
            ) : (
              "View details"
            )}
          </Button>

          <MoreMenu onEdit={handleEdit} onRemove={handleRemove} size={22} />
        </div>
      </div>

      <div className="flex flex-row items-center gap-3 mt-4 lg:mt-3">
        <SvgIcon name="PriceTag" size={22} />
        <div className="flex items-center gap-1">
          <p className="text-heading font-semibold">
            ${item.budget_amount}: &nbsp;
          </p>
          <p className="text-paragraph text-sm font-medium tracking-wide">
            {budgetType} Price
          </p>
        </div>
      </div>

      <div className="flex lg:hidden items-center justify-between mt-4">
        <span className="text-paragraph font-medium text-sm">
          Proposals (2)
        </span>
        <span className="text-paragraph font-medium text-sm">Message (1)</span>
        <span className="text-paragraph font-medium text-sm">
          Shortlist (2)
        </span>
      </div>

      <div className="flex lg:hidden items-center gap-10 mt-6">
        <Button
          onClick={handleDetailsClick}
          disabled={loading}
          variant="primaryOutlined"
        >
          {loading ? (
            <Loader size={18} border={3} color="white" />
          ) : (
            "View details"
          )}
        </Button>

        <MoreMenu onEdit={handleEdit} onRemove={handleRemove} size={18} />
      </div>
    </div>
  );
}

// Self-contained dropdown so each JobCard render produces its own ref/state.
// (Earlier we shared one ref across the desktop+mobile copies of the button,
// which made the outside-click handler kill the menu before the item click
// could fire.)
function MoreMenu({ onEdit, onRemove, size = 22 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex flex-col gap-2 items-center justify-center text-paragraph cursor-pointer font-medium text-sm xl:text-base"
      >
        <SvgIcon name="More" size={size} />
        More
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-md shadow-lg z-30 py-1"
          role="menu"
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="w-full text-left px-4 py-2 text-sm text-paragraph hover:bg-gray-50 cursor-pointer"
            role="menuitem"
          >
            Edit posting
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onRemove();
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 cursor-pointer"
            role="menuitem"
          >
            Remove posting
          </button>
        </div>
      )}
    </div>
  );
}
