import ReadMoreBtn from "@/app/components/button/ReadMoreBtn";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import Image from "next/image";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

function avatarSrc(pic) {
  if (!pic) return null;
  if (pic.startsWith("http")) return pic;
  return `${BASE_URL}${pic.replace(/^\//, "")}`;
}

export default function ProfileData({ profile, user }) {
  const avatar = avatarSrc(user?.profile_picture);

  return (
    <div
      className="flex flex-col gap-6 lg:gap-10 px-3 py-4 md:px-8 md:py-10 rounded-2xl"
      style={{ boxShadow: "2px 2px 50px 0px #0000000D" }}
    >
      {/* title and image */}
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex items-center gap-3.5 md:gap-8 w-full md:w-auto">
          <div className="rounded-full w-15 h-15 md:w-25 md:h-25 overflow-hidden bg-gray-200 flex items-center justify-center shrink-0">
            {avatar ? (
              <Image
                src={avatar}
                alt={user?.name ?? "Freelancer"}
                width={100}
                height={100}
                className="rounded-full w-15 h-15 md:w-25 md:h-25 object-cover"
                unoptimized
              />
            ) : (
              <span className="text-2xl font-semibold text-gray-500">
                {(user?.name ?? "?").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 md:gap-3">
            <h3 className="text-lg md:text-2xl text-heading font-semibold">
              {user?.name ?? "Freelancer"}
            </h3>
            <p className="text-paragraph text-sm md:text-lg font-normal">
              {profile?.professional_title ?? ""}
            </p>
            {profile?.country && (
              <p className="text-paragraph text-sm font-medium">
                {[profile.city, profile.country].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {profile?.hourly_rate != null && (
        <div className="flex gap-15">
          <div className="flex gap-6 items-center">
            <SvgIcon name="PiggyBank" size={32} color="#666666" />
            <div className="flex flex-col gap-2">
              <h6 className="text-sm md:text-lg font-semibold text-heading">
                Hourly Rate
              </h6>
              <p className="text-paragraph text-xs md:text-sm">
                ${profile.hourly_rate}/hr
              </p>
            </div>
          </div>
        </div>
      )}

      {profile?.overview && (
        <div className="flex flex-col gap-4 mt-2 md:mt-5">
          <h5 className="font-semibold text-lg md:text-2xl text-heading">
            About
          </h5>
          <ReadMoreBtn
            text={profile.overview}
            paragraphFont="font-normal leading-7 md:leading-9"
            font="text-primary font-semibold"
            clampClass="line-clamp-6 lg:line-clamp-3"
          />
        </div>
      )}
    </div>
  );
}
