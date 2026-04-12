import SvgIcon from "../Utility/SvgIcon";

export default function Pagination({ page, totalPages, onPageChange, jobs }) {
  const selectPage = (p) => {
    if (p >= 1 && p <= totalPages && p !== page) onPageChange(p);
  };

  return (
    <div className="flex justify-end py-6 px-6">
      <div className="flex flex-wrap md:flex-nowrap justify-center gap-3 md:gap-5 items-center">
        {/* Prev Button */}
        <button
          disabled={page === 1}
          onClick={() => selectPage(page - 1)}
          className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full cursor-pointer
          ${page === 1 ? "opacity-40" : "hover:-translate-x-1"}`}
          aria-label="Previous button"
        >
          <SvgIcon name="Control_prev" />
        </button>

        {/* Page Numbers */}
        {[...Array(totalPages)].map((_, idx) => {
          const active = page === idx + 1;
          return (
            <button
              key={idx}
              onClick={() => selectPage(idx + 1)}
              className={`w-8 h-8 md:w-10 md:h-10 shrink-0 flex items-center justify-center text-sm lg:text-base cursor-pointer
              rounded-full border font-semibold leading-none
              ${
                active
                  ? "bg-primary text-white"
                  : "bg-white text-paragraph hover:bg-gray-100"
              }`}
            >
              {idx + 1}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          disabled={page === totalPages}
          onClick={() => selectPage(page + 1)}
          className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full cursor-pointer
          ${page === totalPages ? "opacity-40" : "hover:translate-x-1"}`}
          aria-label="Next button"
        >
          <SvgIcon name="Control_next" />
        </button>
      </div>
    </div>
  );
}
