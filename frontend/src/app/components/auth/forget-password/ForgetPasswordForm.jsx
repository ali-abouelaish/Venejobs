import { useForm } from "react-hook-form";
import userApiStore from "@/app/store/userStore";
import toastStore from "@/app/store/toastStore";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Button from "../../button/Button";
import Loader from "../../common/Loader";

export default function ForgetPasswordForm({ setActiveModal, setUserEmail }) {
    const forgetPassword = userApiStore((s) => s.forgetPassword);
    const loading = userApiStore((s) => s.loading);
    const { showSuccess, showError } = toastStore.getState();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const onSubmit = async (data) => {
        try {
            const res = await forgetPassword(data);

            if (res.success) {
                showSuccess("Success", res.message);
                setUserEmail(data.email);
                setActiveModal("check_mail_screen");
            }
        } catch (error) {
            if (error.response) {
                showError("Error", error.response.data.message);
            }
        }
    };

    return (
        <>
            {/* Title */}
            <h2 className="mt-10 mb-3 text-3xl font-extrabold leading-tight text-center text-heading">
                Forgot password?
            </h2>


            <p className="text-sm text-center text-gray-500 tracking-wide">
                No worries, we’ll send you reset instructions.
            </p>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 mt-10 px-2 md:px-6"
            >
                <div>
                    <input
                        type="text"
                        id="email"
                        className="
                            block w-full py-3 px-1 text-base 
                            border-b border-neutral-300 
                            focus:border-primary focus:outline-none 
                            placeholder:text-sm
                           text-heading tracking-wide 
                        "
                        placeholder="Email Address"
                        {...register("email", {
                            required: "Email is required",
                            pattern: {
                                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                message: "Please enter a valid email address",
                            },
                        })}
                    />

                    {errors.email && (
                        <span className="text-red-500 font-normal text-sm tracking-wide">
                            {errors.email.message}
                        </span>
                    )}
                </div>

                {/* Button Right Aligned */}
                <div className="flex justify-end mt-10">
                    <Button
                        type="submit"
                        disabled={loading}
                        variant="primaryOutlined"
                    >
                        {loading ? (
                            <Loader size={18} border={3} color="white" />
                        ) : (
                            "Reset Password"
                        )}
                    </Button>

                </div>
            </form>

            <div className="flex justify-end mt-5 px-2 md:px-6 pb-4">
                <button
                    type="button"
                    onClick={() => setActiveModal("signin")}
                    className="
      group
      text-[#858585]
      font-semibold
      text-normal
      flex items-center gap-2
      cursor-pointer
      transition-colors duration-200
      hover:text-primary
    "
                >
                    <ArrowBackIcon
                        className="
        text-gray-500
        transition-colors duration-200
        group-hover:text-primary
      "
                        style={{ fontSize: "16px" }}
                    />
                    Back to Login
                </button>
            </div>

        </>
    );
}
