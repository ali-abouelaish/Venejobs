import PasswordInput from "../login/PasswordInput";
import RoleSelection from "./RoleSelection";

export default function SignupFormFields({
    register,
    errors,
    isVisible,
    toggleVisibility,
}) {
    return (
        <div className="space-y-5">

            {/* Role Selection */}
            <RoleSelection register={register} errors={errors} />

            {/* Full Name */}
            <div>
                <div className="relative h-12">
                    <input
                        type="text"
                        placeholder="Full Name"
                        {...register("name", { required: "Name is required" })}
                        className="block w-full h-full py-2.5 px-1 text-sm lg:text-base border-b border-[#D0D5DD]
                        focus:border-primary focus:outline-none text-heading tracking-wide placeholder:text-sm"
                    />
                </div>

                <div className="min-h-5">
                    {errors.name && (
                        <p className="text-red-500 text-sm mt-2">
                            {errors.name.message}
                        </p>
                    )}
                </div>
            </div>

            {/* Username */}
            {/* <div>
                <div className="relative h-12">
                    <input
                        type="text"
                        placeholder="Username"
                        {...register("username", { required: "Username is required" })}
                        className="block w-full h-full py-2.5 px-1 text-base border-b border-[#D0D5DD]
                        focus:border-primary focus:outline-none text-heading tracking-wide placeholder:text-sm"
                    />
                </div>

                <div className="min-h-5">
                    {errors.username && (
                        <p className="text-red-500 text-sm mt-2">
                            {errors.username.message}
                        </p>
                    )}
                </div>
            </div> */}

            {/* Email */}
            <div>
                <div className="relative h-12">
                    <input
                        type="email"
                        placeholder="Email Address"
                        {...register("email", {
                            required: "Email is required",
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: "Invalid email address",
                            },
                        })}
                        className="block w-full h-full py-2.5 px-1 text-sm lg:text-base border-b border-[#D0D5DD]
                        focus:border-primary focus:outline-none text-heading tracking-wide placeholder:text-sm"
                    />
                </div>

                <div className="min-h-5">
                    {errors.email && (
                        <p className="text-red-500 text-sm mt-2">
                            {errors.email.message}
                        </p>
                    )}
                </div>
            </div>

            {/* Password */}
            <PasswordInput
                register={register}
                errors={errors}
                isVisible={isVisible}
                toggleVisibility={toggleVisibility}
            />
        </div>
    );
}
