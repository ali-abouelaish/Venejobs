import Button from "../../button/Button";
import Loader from "../../common/Loader";
import SvgIcon from "@/app/components/Utility/SvgIcon";

export default function SignupActions({
  isSubmitting,
  setActiveModal,
  register,
  errors,
}) {
  return (
    <div className="flex flex-col gap-10">
      {/* Terms & Conditions */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            {...register("terms", { required: "You must accept the terms" })}
            className="
              w-4 h-4 cursor-pointer appearance-none
              border border-gray-400 rounded
              flex items-center justify-center
              checked:bg-primary checked:border-primary
              relative
              checked:before:content-['✔']
              checked:before:text-white
              checked:before:text-xs
              checked:before:flex
              checked:before:items-center
              checked:before:justify-center
              checked:before:absolute
              checked:before:inset-0
              mt-1
            "
          />

          <span className="text-sm leading-6">
            <span className="text-gray-500">I agree to the </span>
            <span className="font-semibold text-heading cursor-pointer">
              Privacy Policy
            </span>
            <span className="text-gray-500"> & </span>
            <span className="font-semibold text-heading cursor-pointer">
              Terms of Use
            </span>
          </span>
        </div>

        {errors.terms && (
          <p className="text-red-500 text-sm">{errors.terms.message}</p>
        )}
      </div>

      {/* Sign Up Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primaryOutlined"
        >
          {isSubmitting ? (
            <Loader size={18} border={3} color="white" />
          ) : (
            <>
              Sign Up
              <SvgIcon name="RightArrWhite" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
