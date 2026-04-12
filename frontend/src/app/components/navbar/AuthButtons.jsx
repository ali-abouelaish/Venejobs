import Button from "../button/Button";
import SvgIcon from "../Utility/SvgIcon";

export default function AuthButtons({ setActiveModal, setMenuOpen }) {
  return (
    <div className="flex items-center gap-6 md:gap-10">
      {/* LOGIN BUTTON (mobile + tablet + desktop) */}

      <div
        className="
        text-gray-600 lg:text-white 
        font-medium cursor-pointer tracking-wide 
        relative
        after:content-[''] after:absolute after:left-0 after:bottom-0 
        after:w-0 after:h-0.5 after:bg-white 
        after:transition-all after:duration-300 
        hover:after:w-full
      "
        onClick={() => setActiveModal("signin")}
      >
        Login
      </div>

      {/* SIGNUP BUTTON (only on desktop) */}

      <button
        className="hidden xl:block bg-white font-medium rounded-full px-6 py-2.5 tracking-wide cursor-pointer 
  transition-all duration-300 ease-out 
  hover:bg-[#0057ff] hover:text-white hover:shadow-lg hover:scale-[1.05]"
        onClick={() => setActiveModal("signup")}
      >
        Sign Up
      </button>

      {/* HAMBURGER (mobile + tablet only) */}
      <button
        className="block lg:hidden text-gray-600 md:text-white"
        aria-label="Toggle button"
        onClick={() => setMenuOpen(true)}
      >
        <SvgIcon name="ToggleMenu" />
      </button>
    </div>
  );
}
