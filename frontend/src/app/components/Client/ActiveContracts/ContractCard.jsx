"use client";
import { useRouter } from "next/navigation";
import Avatar from "@/app/components/Avatar";
import Button from "../../button/Button";

const STATUS_STYLES = {
  draft: { label: "Draft", bg: "bg-gray-100", text: "text-gray-600" },
  pending_review: { label: "Pending Review", bg: "bg-yellow-100", text: "text-yellow-800" },
  revision_requested: { label: "Revision Requested", bg: "bg-blue-100", text: "text-blue-800" },
  accepted: { label: "Active Contract", bg: "bg-secondary", text: "text-white" },
  declined: { label: "Declined", bg: "bg-red-100", text: "text-red-800" },
  cancelled: { label: "Cancelled", bg: "bg-red-100", text: "text-red-800" },
};

function formatDate(iso) {
  if (!iso) return "-";
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

export default function ContractCard({ contract }) {
  const router = useRouter();
  const style = STATUS_STYLES[contract?.status] ?? STATUS_STYLES.draft;

  return (
    <div className="border-b border-[rgba(68,68,68,0.08)] p-5 lg:p-6 xl:p-8">
      <div className="w-full flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left Section */}
        <div className="flex items-center gap-6 w-full lg:w-auto">
          <Avatar
            id={contract?.other_id}
            name={contract?.other_name}
            size={64}
          />
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-row items-center gap-2 lg:gap-4">
              <h3 className="text-xl lg:text-2xl text-heading font-semibold">
                {contract?.other_name ?? "Unknown"}
              </h3>
              <p
                className={`${style.bg} ${style.text} rounded-3xl px-4 py-1 text-xs lg:text-sm w-fit font-medium`}
              >
                {style.label}
              </p>
            </div>

            <p className="text-paragraph text-base font-medium">
              {contract?.title ?? "Untitled contract"}
            </p>

            {contract?.job_title && contract.job_title !== "Direct contract" && (
              <p className="text-paragraph text-sm font-medium">
                {contract.job_title}
              </p>
            )}

            <div className="flex flex-row items-center">
              <p className="text-paragraph text-sm lg:text-base font-medium">
                Started Date:&nbsp;
              </p>
              <p className="text-paragraph text-base font-medium">
                {formatDate(contract?.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Amounts */}
        <div className="flex flex-row items-start sm:items-center gap-5 lg:gap-8 w-full lg:w-auto">
          <div className="flex flex-col gap-2">
            <h3 className="text-heading font-semibold text-sm md:text-lg">
              Contract Amount :
            </h3>
            <p className="text-paragraph font-medium text-base">
              {formatPrice(contract?.price, contract?.currency)}
            </p>
          </div>

          {contract?.deadline && (
            <div className="flex flex-col gap-2">
              <h3 className="text-heading font-semibold text-sm md:text-lg">
                Deadline :
              </h3>
              <p className="text-paragraph font-medium text-base">
                {formatDate(contract.deadline)}
              </p>
            </div>
          )}
        </div>

        {/* View Button */}
        <Button
          onClick={() => router.push(`/messages?contract=${contract?.id}`)}
          className="bg-primary text-white rounded w-full sm:w-auto"
        >
          View contract
        </Button>
      </div>
    </div>
  );
}
