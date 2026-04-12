import Link from "next/link";
import DesktopLinks from "../components/profile/ClientProfile/DesktopLinks";
import { Routes } from "../routes";
import ClientLayout from "./ClientLayout";
import SvgIcon from "../components/Utility/SvgIcon";

export default function ClientProfileLayout({ children }) {
  return (
    <>
      <ClientLayout>
        <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
          <div className="flex lg:gap-5 justify-center md:justify-start w-full">
            <DesktopLinks />

            {/* FULL WIDTH on all screens ≥ md */}
            <div className="border border-[#F2F2F2] p-7 rounded-2xl flex flex-col w-full gap-6 ">
              <div className="flex justify-start lg:hidden">
                <Link
                  href={Routes.client.profile.home}
                  className="text-paragraph flex items-center gap-3 hover:text-primary"
                >
                  <SvgIcon name="PrevButton" color="white" /> Back
                </Link>
              </div>

              {children}
            </div>
          </div>
        </div>
      </ClientLayout>
    </>
  );
}
