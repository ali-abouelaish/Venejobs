import { Eye } from "@/svgIcons";

export default function NewPasswordInput({
    register,
    error,
    placeholder,
    isVisible,
    toggleVisibility,
}) {
    return (
        <div>
            <div className="relative h-12">
                <input
                    type={isVisible ? "text" : "password"}
                    placeholder={placeholder}
                    {...register}
                    className="block py-2.5 pr-10 px-1 w-full h-full text-sm lg:text-base border-b border-neutral-300
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

            {error && (
                <span className="text-red-500 text-sm block mt-1">
                    {error.message}
                </span>
            )}
        </div>
    );
}
