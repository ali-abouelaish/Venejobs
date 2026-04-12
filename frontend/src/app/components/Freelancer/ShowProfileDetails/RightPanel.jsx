import React, { useState, useEffect } from "react";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import PaginationFreelance from "../../Pagination/PaginationFreelance";
import TitleEditModal from "../EditProfileModals/TitleEditModal";
import PortfolioEditModal from "../EditProfileModals/PortfolioEditModal";
import SkillsEditModal from "../EditProfileModals/SkillsEditModal";
import freelancerApiStore from "@/app/store/freelancerApiStore";
import { DeleteConfirmation } from "@/app/components/common/DeleteConfirmation";
import Swal from "sweetalert2";
import RightPanelSkeleton from "../../Skeletons/RightPanelSkeleton";
import ExperienceEditModal from "../EditProfileModals/ExperienceEditModal";
import WorkHistoryPageSkeleton from "../../Skeletons/WorkHistorSkeleton";

const RightPanel = () => {
  const [showTitleModal, setshowTitleModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [selectedSkill, setselectedSkill] = useState(null);
  const [showExperienceModal, setExperienceModal] = useState(false);
  const [editExperience, setEditExperience] = useState(null);

  // 🔥 local loading for skeleton
  const [pageLoading, setPageLoading] = useState(true);
  const [skillError, setSkillError] = useState("");

  const {
    freelancerSkills,
    getSkills,
    deleteSkill,
    freelancePortfolio,
    getPortfolio,
    deletePortfolio,
    freelanceBasicprofile,
    freelancerExperience,
    getExperience,
    deleteExperience,
    freelancerExperienceLoading,
    getBasicprofile } = freelancerApiStore();

  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      await Promise.all([getSkills(), getPortfolio(), getBasicprofile(), getExperience()]);
      setPageLoading(false);
    };

    loadData();
  }, []);

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

  const formatMonthYear = (month, year) => {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-10 lg:pb-10">

      {/* ===== SKELETON ===== */}
      {pageLoading ? (
        <RightPanelSkeleton />
      ) : (
        <>
          {/* ===== PROFILE HEADER ===== */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Title + Rate */}
            <div className="flex flex-wrap justify-between items-start gap-3">
              <h2 className="text-sm sm:text-base md:text-lg font-medium text-gray-900 leading-snug">
                {freelanceBasicprofile?.professional_title}
              </h2>

              <div className="flex items-center gap-4">
                <p className="text-[14px] sm:text-[15px] md:text-[16px] 
                    font-medium text-gray-800 whitespace-nowrap">
                  ${freelanceBasicprofile?.hourly_rate}
                  <span className="text-[13px] font-normal text-gray-500 ml-1">
                    /hr
                  </span>
                </p>

                <button
                  onClick={() => setshowTitleModal(true)}
                  className="cursor-pointer transition"
                >
                  <SvgIcon
                    name="Editing"
                    className="w-4 h-4 text-gray-500 hover:text-secondary"
                  />
                </button>
              </div>
            </div>

            {/* Overview */}
            <p className="text-[14px] sm:text-[15px] md:text-[15px] 
                font-normal leading-relaxed text-gray-600">
              {freelanceBasicprofile?.overview}
            </p>
          </div>



          <hr className="text-gray-200" />

          {/* ===== PORTFOLIO ===== */}
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-sm sm:text-base md:text-lg
                   font-medium text-gray-900">
                Portfolio
              </h2>

              <button
                onClick={() => {
                  setSelectedPortfolio(null);
                  setShowPortfolioModal(true);
                }}
                className="text-[14px] sm:text-[15px] 
                 font-medium text-secondary hover:underline cursor-pointer"
              >
                + Add
              </button>
            </div>

            {/* Portfolio List */}
            <div className="flex flex-col gap-5">
              {freelancePortfolio?.map((item, index) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start gap-4"
                >
                  <div className="max-w-[85%]">
                    <h3 className="text-[14px] sm:text-[15px] 
                         font-medium text-gray-800 leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-[14px] sm:text-[15px] 
                        text-gray-500 break-all">
                      {item.project_url}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button className="cursor-pointer transition"
                      onClick={() => {
                        setSelectedPortfolio({ ...item, index });
                        setShowPortfolioModal(true);
                      }}
                    >
                      <SvgIcon
                        name="Editing"
                        className="w-4 h-4 text-gray-500 hover:text-secondary"
                      />
                    </button>

                    <button
                      className="transition cursor-pointer"
                      onClick={() => handleDelete(deletePortfolio, item.id)}
                    >
                      <SvgIcon
                        name="Delete1"
                        className="w-4 h-4 text-red-400 hover:text-red-500"
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>


          <hr className="text-gray-200" />

          {/* ===== WORK HISTORY ===== */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base md:text-lg 
                 font-medium text-gray-900">
                Work History
              </h2>

              <button
                onClick={() => {
                  setEditExperience(null);
                  setExperienceModal(true);
                }}
                className="text-[14px] sm:text-[15px] 
                 font-medium text-secondary hover:underline cursor-pointer"
              >
                + Add
              </button>
            </div>

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
                      <h3 className="text-base sm:text-lg font-medium text-heading">
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
                          className="w-4 h-4 lg:w-4.5 lg:h-4.5 text-secondary cursor-pointer"
                        />
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(deleteExperience, item.id)
                        }
                      >
                        <SvgIcon
                          name="Delete1"
                          className="w-4 h-4 lg:w-4.5 lg:h-4.5 text-red-500 cursor-pointer"
                        />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm sm:text-base leading-relaxed text-paragraph">
                    {item.description}
                  </p>

                  {/* <hr className="text-gray-200" /> */}
                </div>
              ))
            )}

          </div>

          {/* ===== PAGINATION ===== */}
          {/* <div className="flex justify-end">
            <PaginationFreelance totalPages={2} />
          </div> */}

          <hr className="text-gray-200" />

          {/* ===== SKILLS ===== */}
          <div className="flex flex-col gap-5 pb-10">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-sm sm:text-base md:text-lg 
                   font-medium text-gray-900">
                Skills
              </h2>

              <button
                onClick={() => {
                  if (freelancerSkills?.length >= 10) {
                    setSkillError("You can add only 10 skills");
                    return;
                  }
                  setSkillError("");
                  setselectedSkill(null);
                  setShowSkillModal(true);
                }}
                className="text-[14px] sm:text-[15px] 
                 font-medium text-secondary hover:underline cursor-pointer"
              >
                + Add
              </button>
            </div>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {freelancerSkills?.map((skill, index) => (
                <div
                  key={skill.id}
                  className="
          flex items-center justify-between
          rounded-md border border-gray-200
          bg-white px-3 py-2.5
          transition-colors
          hover:border-gray-300
        "
                >
                  {/* Skill Name */}
                  <p className="text-[14px] sm:text-[15px] 
                      font-normal text-gray-700 truncate">
                    {skill.skill_name}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        setselectedSkill({ ...skill, index });
                        setShowSkillModal(true);
                      }}
                      className="transition cursor-pointer"
                      aria-label="Edit Skill"
                    >
                      <SvgIcon
                        name="Editing"
                        className="w-4 h-4 text-gray-500 hover:text-secondary"
                      />
                    </button>

                    <button
                      onClick={() => handleDelete(deleteSkill, skill.id)}
                      className="transition cursor-pointer"
                      aria-label="Delete Skill"
                    >
                      <SvgIcon
                        name="Delete1"
                        className="w-4 h-4 text-red-400 hover:text-red-500"
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Error */}
            {skillError && (
              <p className="text-[13px] text-red-500 mt-1 pl-1">
                {skillError}
              </p>
            )}
          </div>

        </>
      )}

      {/* ===== MODALS ===== */}
      {
        showTitleModal && (
          <TitleEditModal
            setshowTitleModal={setshowTitleModal}
            freelanceBasicprofile={freelanceBasicprofile}
            showTitleModal={showTitleModal}
          />
        )
      }

      {
        showPortfolioModal && (
          <PortfolioEditModal
            setShowPortfolioModal={setShowPortfolioModal}
            showPortfolioModal={showPortfolioModal}
            portfolio={selectedPortfolio}
          />
        )
      }

      {
        showSkillModal && (
          <SkillsEditModal
            showSkillModal={showSkillModal}
            setShowSkillModal={setShowSkillModal}
            Selectedskill={selectedSkill}
            freelancerSkills={freelancerSkills}
          />
        )
      }


      {/* ===== MODAL ===== */}
      {showExperienceModal && (
        <ExperienceEditModal
          item={editExperience}
          setExperienceModal={setExperienceModal}
          showExperienceModal={showExperienceModal}
        />
      )}

    </div >
  );
};

export default RightPanel;
