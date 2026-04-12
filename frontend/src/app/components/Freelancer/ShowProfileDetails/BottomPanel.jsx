import React, { useState, useEffect } from "react";
import PaginationFreelance from "../../Pagination/PaginationFreelance";
import ExperienceEditModal from "../EditProfileModals/ExperienceEditModal";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import freelancerApiStore from "@/app/store/freelancerApiStore";
import { DeleteConfirmation } from "@/app/components/common/DeleteConfirmation";
import Swal from "sweetalert2";
import WorkHistoryPageSkeleton from "../../Skeletons/WorkHistorSkeleton";

const BottomPanel = () => {
  const [showExperienceModal, setExperienceModal] = useState(false);
  const [editExperience, setEditExperience] = useState(null);

  const {
    freelancerExperience,
    getExperience,
    deleteExperience,
    freelancerExperienceLoading,
  } = freelancerApiStore();

  useEffect(() => {
    getExperience();
  }, [getExperience]);

  const formatMonthYear = (month, year) => {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const handleDelete = async (deleteFn, id) => {
    const isConfirmed = await DeleteConfirmation();
    if (!isConfirmed) return;

    try {
      const res = await deleteFn(id);
      if (res?.success) {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: res.message || "Deleted successfully",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error?.response?.data?.message ||
          "Something went wrong",
      });
    }
  };

  return (
    <div className="flex flex-col gap-10">

      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg sm:text-xl lg:text-[22px] font-semibold text-heading">
          Employment history
        </h2>

        <button
          onClick={() => {
            setEditExperience(null);
            setExperienceModal(true);
          }}
          className="text-[14px] sm:text-[15px] font-medium text-secondary hover:underline cursor-pointer"
        >
          + Add
        </button>
      </div>

      {/* ===== CONTENT / SKELETON ===== */}
      {freelancerExperienceLoading ? (
        <div className="flex flex-col gap-6">
          {[...Array(3)].map((_, i) => (
            <WorkHistoryPageSkeleton key={i} />
          ))}
        </div>
      ) : (
        freelancerExperience?.map((item, index) => (
          <div key={index} className="flex flex-col gap-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-base sm:text-lg lg:text-[20px] font-medium text-heading">
                  {item.job_title}
                </h3>
                <p className="text-sm sm:text-base text-heading font-medium">
                  {formatMonthYear(item.start_month, item.start_year)} –{" "}
                  {item.is_current
                    ? "Present"
                    : formatMonthYear(item.end_month, item.end_year)}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setEditExperience({ ...item, index });
                    setExperienceModal(true);
                  }}
                >
                  <SvgIcon
                    name="Editing"
                    className="w-4 h-4 lg:w-5 lg:h-5 text-secondary"
                  />
                </button>

                <button
                  onClick={() =>
                    handleDelete(deleteExperience, item.id)
                  }
                >
                  <SvgIcon
                    name="Delete1"
                    className="w-4 h-4 lg:w-5 lg:h-5 text-red-500"
                  />
                </button>
              </div>
            </div>

            <p className="text-sm sm:text-base leading-relaxed text-paragraph">
              {item.description}
            </p>

            <hr className="text-gray-200" />
          </div>
        ))
      )}

      {/* ===== PAGINATION ===== */}
      {freelancerExperience?.length > 2 && (
        <div className="flex justify-end">
          <PaginationFreelance totalPages={5} />
        </div>
      )}

      {/* ===== MODAL ===== */}
      {showExperienceModal && (
        <ExperienceEditModal
          item={editExperience}
          setExperienceModal={setExperienceModal}
          showExperienceModal={showExperienceModal}
        />
      )}
    </div>
  );
};

export default BottomPanel;
