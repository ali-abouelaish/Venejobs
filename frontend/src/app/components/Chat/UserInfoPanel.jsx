import React from "react";
import SvgIcon from "../Utility/SvgIcon";

const UserInfoPanel = () => {
  return (
    <div>
      <div className="border border-gray-200 rounded-2xl shadow-2xs  flex flex-col  py-3 md:mt-5 ">
        <div className="flex  items-center justify-start gap-24">
          <div className="flex justify-start  px-5 gap-3 mt-2 ">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              className="size-12 rounded-full bg-gray-800 outline -outline-offset-1 outline-white/10 mb-4"
            />
            <div className="flex flex-col md:w-[650px] lg:w-[850px] xl:w-[400px]">
              <div className="flex justify-between gap-24 ">
                <div className="flex flex-col">
                  <h2 className="font-semibold text-base text-heading">
                    Giacomo Chaparro
                  </h2>
                  <p className="text-paragraph text-xs flex gap-1">
                    <SvgIcon name="Star" /> 5.0 (1 Review)
                  </p>
                </div>

                <div>
                  <SvgIcon name="CrossButton" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start px-5 gap-2 mt-3">
          <p className="text-paragraph text-xs flex items-center gap-2">
            <SvgIcon name="Clock" /> 7:19 AM GMT+1 (4 h behind)
          </p>
          <p className="text-primary text-sm font-medium flex items-center gap-2">
            <SvgIcon name="Eye2" size={18} /> View Contract
          </p>
        </div>

        <div className="flex px-5 mt-6 flex-col gap-10">
          <div className="flex gap-2">
            <div className="rounded-full size-10 flex justify-center items-center bg-gray-200">
              <SvgIcon name="Check" />
            </div>

            <div className="flex flex-col">
              <h2 className="text-heading text-sm font-semibold">
                Contract started
              </h2>
              <p className="text-paragraph text-sm">December 19</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="rounded-full size-10 flex justify-center items-center bg-gray-200">
              <SvgIcon name="Check" />
            </div>

            <div className="flex flex-col">
              <h2 className="text-heading text-sm font-semibold">
                Milestone 1 completed
              </h2>
              <p className="text-paragraph text-sm">Approved: December 20</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="rounded-full size-10 flex justify-center items-center bg-gray-200">
              <SvgIcon name="Check" />
            </div>

            <div className="flex flex-col">
              <h2 className="text-heading text-sm font-semibold">
                Milestone 1 completed
              </h2>
              <p className="text-paragraph text-sm">Approved: December 20</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfoPanel;
