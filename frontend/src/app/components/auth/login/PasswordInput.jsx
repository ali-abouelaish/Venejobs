import { Eye } from "@/svgIcons";

export default function PasswordInput({ register, errors, isVisible, toggleVisibility }) {
    return (
        <div>
            {/* Input + Eye Icon Wrapper */}
            <div className="relative h-12">
                <input
                    type={isVisible ? "text" : "password"}
                    placeholder="Password"
                    {...register("password", { required: "Password is required" })}
                    className="block py-2.5 pr-10 px-1 w-full h-full text-sm lg:text-base font-medium border-b border-neutral-300
                    focus:border-primary focus:outline-none text-heading tracking-wide
                    placeholder:text-sm"
                />

                <button
                    type="button"
                    onClick={toggleVisibility}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 flex items-center cursor-pointer"
                >
                    <Eye
                        size={20}
                        color={isVisible ? "var(--color-primary)" : "#858585"}
                    />
                </button>
            </div>

            {/* Error Message */}
            {errors.password && (
                <span className="text-red-500 text-sm block mt-1">
                    {errors.password.message}
                </span>
            )}
        </div>
    );
}
