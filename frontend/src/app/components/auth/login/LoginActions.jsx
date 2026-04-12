import Button from "../../button/Button";
import Loader from "../../common/Loader";
import SvgIcon from "@/app/components/Utility/SvgIcon";

export default function LoginActions({ setActiveModal, isSubmitting }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Remember me + Forget password */}
      <div className="flex justify-between items-center flex-wrap gap-3 my-5">
        {/* Remember Me */}
        <label className="flex items-center gap-3 text-sm text-gray-500 cursor-pointer">
          <input
            type="checkbox"
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
            "
          />
          Remember Me
        </label>

        {/* Forget Password */}
        <button
          type="button"
          onClick={() => setActiveModal("forget_password")}
          className="
            text-sm font-semibold text-heading
            hover:text-primary hover:underline
            bg-transparent p-0 cursor-pointer
          "
        >
          Forget password?
        </button>
      </div>

      {/* Sign In Button */}
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
              Sign In
              <SvgIcon name="RightArrWhite" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
