import Image from "next/image";
import Link from "next/link";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import ReadMoreBtn from "../../button/ReadMoreBtn";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

function avatarSrc(profilePicture) {
  if (!profilePicture) return null;
  if (profilePicture.startsWith("http")) return profilePicture;
  return `${BASE_URL}${profilePicture.replace(/^\//, "")}`;
}

export default function FreelancerCard({ freelancer, index, total }) {
  const user = freelancer.User ?? {};
  const skills = (freelancer.skills ?? []).map((s) => s.skill_name);
  const profileUrl = `/client/FreelancerProfile/${freelancer.user_id}`;
  const avatar = avatarSrc(user.profile_picture);

  return (
    <div className="flex flex-col gap-4">
      {/* title and image */}
      <div className="flex items-center gap-6 w-full lg:w-auto justify-between">
        <Link href={profileUrl} className="flex items-center gap-3 md:gap-6 w-full md:w-auto">
          <div className="rounded-full w-15 h-15 md:w-16 md:h-16 overflow-hidden bg-gray-200 flex items-center justify-center shrink-0">
            {avatar ? (
              <Image
                src={avatar}
                alt={user.name ?? "Freelancer"}
                width={60}
                height={60}
                className="rounded-full w-15 h-15 md:w-16 md:h-16 object-cover"
                unoptimized
              />
            ) : (
              <span className="text-lg font-semibold text-gray-500">
                {(user.name ?? "?").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-row items-center gap-2 lg:gap-4">
              <h3 className="text-lg lg:text-2xl text-heading font-semibold">
                {user.name ?? "Freelancer"}
              </h3>
            </div>
            <p className="text-paragraph text-sm lg:text-base font-normal">
              {freelancer.professional_title ?? ""}
            </p>
            {(freelancer.hourly_rate != null) && (
              <p className="text-heading text-sm lg:text-base font-semibold">
                ${freelancer.hourly_rate}/hr
              </p>
            )}
          </div>
        </Link>
        <div className="hidden md:flex items-center gap-6 w-full md:w-auto">
          <button
            className="border border-[#FAFAFA] bg-white p-1 md:p-2 rounded-full text-primary text-xs md:text-base flex items-center gap-4 float-right"
            style={{ boxShadow: "2px 2px 50px 6px #0000000D" }}
          >
            <SvgIcon name="Heart" />
          </button>
          <Link
            href={profileUrl}
            className="bg-primary p-2 md:px-8 md:py-2 rounded text-white text-xs md:text-base font-semibold cursor-pointer"
          >
            View Profile
          </Link>
        </div>
      </div>

      {/* overview */}
      {freelancer.overview && (
        <div className="flex flex-col gap-3 lg:mt-2">
          <ReadMoreBtn
            text={freelancer.overview}
            font="text-primary text-normal"
          />
        </div>
      )}

      {/* skills */}
      {skills.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap mt-2">
          {skills.map((skill) => (
            <p
              className="text-sm lg:text-base cursor-pointer
                relative overflow-hidden
                bg-[#FAFAFA] px-4 py-2 font-medium text-paragraph rounded-full
                transition-all duration-300
                before:content-[''] before:absolute before:inset-0
                before:bg-gray-200 before:-translate-x-full before:transition-transform before:duration-300
                before:-z-10
                hover:before:translate-x-0
                z-10"
              key={skill}
            >
              {skill}
            </p>
          ))}
        </div>
      )}

      {/* mobile buttons */}
      <div className="pt-4 flex md:hidden items-center gap-6 w-full">
        <Link
          href={profileUrl}
          className="bg-primary px-8 py-2 rounded text-white text-sm md:text-base font-semibold cursor-pointer"
        >
          View Profile
        </Link>
        <button
          className="border border-[#FAFAFA] bg-white p-1 md:p-2 rounded-full text-primary text-xs md:text-base flex items-center gap-4 float-right"
          style={{ boxShadow: "2px 2px 50px 6px #0000000D" }}
        >
          <SvgIcon name="Heart" />
        </button>
      </div>

      {index !== total - 1 && (
        <hr className="border-[#44444414] mt-4 lg:mt-6" />
      )}
    </div>
  );
}
