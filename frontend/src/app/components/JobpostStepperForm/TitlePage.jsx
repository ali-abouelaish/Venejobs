import { useFormContext } from "react-hook-form";
import Button from "../button/Button";
import SvgIcon from "../Utility/SvgIcon";
import StepperNumber from "./StepperNumber";
import { useState } from "react";
import Loader from "../common/Loader";

const TitlePage = ({ nextStep, currstep }) => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    formState: { errors },
    trigger,
  } = useFormContext();

  const handleNext = async () => {
    setLoading(true);
    const valid = await trigger(["title"]);

    if (valid) {
      nextStep();
    }

    setLoading(false);
  };

  return (
    <div>
      <StepperNumber currstep={currstep} />
      <div className="flex gap-10 flex-col lg:flex-row ">
        <div className="mt-6 flex flex-col gap-4  w-full  lg:px-0 lg:mt-10">
          <h2 className="text-2xl lg:text-3xl xl:text-4xl 3xl:text-5xl font-semibold leading-tight text-heading">
            Let's start with a strong title.
          </h2>
          <p className="text-gray-500 text-base xl:text-lg font-normal leading-7 lg:leading-8 tracking-wide">
            This helps your job post stand out to the right candidates. It’s the
            first thing they’ll see, so make it count!
          </p>
        </div>

        <div className="flex flex-col w-full lg:mt-10">
          <div className="flex flex-col gap-4 w-full  ">
            <h2 className="font-semibold text-heading text-lg lg:text-2xl">
              Write a title for your job post
            </h2>

            <div className="flex flex-col gap-1">
              <input
                type="text"
                name="title"
                {...register("title", {
                  required: "Title required",
                  minLength: {
                    value: 5,
                    message: "Title should be atleast 5 characters long",
                  },
                })}
                className="w-full rounded p-4 border border-gray-200"
                placeholder="Enter Your Title"
              />
              {errors.title && (
                <span className="text-sm text-red-500 font-medium">
                  {errors.title.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-5 py-3">
              <h3 className="text-[18px] ">Example titles</h3>
              <ul className="text-base flex flex-col gap-5 text-paragraph list-disc px-8">
                <li>
                  UX/UI designer to bring website mockup and prototype to life
                </li>
                <li>
                  Video editor needed to create whiteboard explainer video
                </li>
                <li>
                  Remote assistant to handle scheduling & customer support
                </li>
              </ul>
              <div className="flex justify-end mt-5">
                <Button
                  type="button"
                  onClick={handleNext}
                  className={`bg-primary text-white flex items-center gap-2 justify-center ${loading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                >
                  {loading ? (
                    <Loader size={18} border={3} color="white" />
                  ) : (
                    <>
                      Next <SvgIcon name="NextArrow" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TitlePage;
