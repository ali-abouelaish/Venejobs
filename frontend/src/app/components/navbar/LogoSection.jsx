import Image from "next/image";
import Button from "../button/Button";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

export default function LogoSection() {
  return (
    <div className="flex items-center gap-6 md:gap-10">
      <div className="flex items-center gap-3">
        <Image src="/logo.png" alt="logo" width={40} height={40} />
        <h3 className="text-gray-600 md:text-gray-600 lg:text-white! text-lg font-extrabold cursor-pointer">
          Venejobs
        </h3>
      </div>
      <button className="hidden lg:flex items-center bg-white/5 rounded-full px-6 py-2.5 text-white text-base tracking-wide">
        Categories
        <ArrowDropDownIcon className="ml-1 text-white" fontSize="small" />
      </button>
    </div>

  );
}
