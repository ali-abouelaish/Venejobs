import PasswordInput from "./PasswordInput";

export default function LoginFormFields({
    register,
    errors,
    isVisible,
    toggleVisibility,
}) {
    return (
        <>
            <div>
                <div className="relative h-12">
                    <input
                        type="email"
                        placeholder="Email Address"
                        {...register("email", {
                            required: "Email is required",
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: "Enter a valid email address",
                            },
                        })}
                        className="block py-2.5 px-1 w-full h-full text-sm lg:text-base border-b border-neutral-300 
                        focus:border-primary focus:outline-none text-heading tracking-wide placeholder:text-sm"
                    />
                </div>

                {/* ERROR WRAPPER WITH FIXED HEIGHT */}
                <div className="min-h-5">
                    {errors.email?.message && (
                        <span className="text-sm text-red-500 mt-2 block">
                            {errors.email.message}
                        </span>
                    )}
                </div>
            </div>



            <PasswordInput
                register={register}
                errors={errors}
                isVisible={isVisible}
                toggleVisibility={toggleVisibility}
            />
        </>
    );
}
