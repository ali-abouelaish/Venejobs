"use client";
import { useState, useEffect, use } from "react";
import ClientLayout from "@/app/layout/ClientLayout";
import { getPublicFreelancerProfile } from "@/app/lib/freelancer";
import Education from "@/app/components/Client/Common/Education";
import Portfolio from "@/app/components/Client/Common/Portfolio";
import WorkExperience from "@/app/components/Client/Common/WorkExperience";
import FreelancerProfileRightPanal from "@/app/components/Client/Freelancers/FreelancerProfileRightPanal";
import ProfileData from "@/app/components/Client/Freelancers/ProfileData";

export default function FreelancerProfilePage({ params }) {
  const { userId } = use(params);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await getPublicFreelancerProfile(userId);
        setProfile(res.profile);
      } catch {
        setError("Freelancer profile not found.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  if (loading) {
    return (
      <ClientLayout>
        <div className="w-full max-w-[90%] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
          <p className="text-paragraph text-sm">Loading profile...</p>
        </div>
      </ClientLayout>
    );
  }

  if (error || !profile) {
    return (
      <ClientLayout>
        <div className="w-full max-w-[90%] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
          <p className="text-paragraph text-sm">{error ?? "Profile not found."}</p>
        </div>
      </ClientLayout>
    );
  }

  const user = profile.User ?? {};
  const educations = profile.educations ?? [];
  const experiences = profile.experiences ?? [];
  const portfolios = profile.portfolios ?? [];
  const languages = profile.languages ?? [];
  const skills = (profile.skills ?? []).map((s) => s.skill_name);

  return (
    <ClientLayout>
      <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <div className="flex flex-col w-full lg:w-[73%] gap-8 ml-0 lg:ml-5">
            <ProfileData profile={profile} user={user} />

            {portfolios.length > 0 && (
              <div
                className="flex flex-col gap-6 md:gap-8 rounded-2xl px-3 pb-2 pt-8 md:p-8"
                style={{ boxShadow: "2px 2px 50px 0px #0000000D" }}
              >
                <h2 className="font-semibold text-2xl text-black">Portfolio</h2>
                <Portfolio items={portfolios} />
              </div>
            )}

            {educations.length > 0 && (
              <div
                className="flex flex-col gap-3 rounded-2xl px-3 py-8 md:p-8"
                style={{ boxShadow: "2px 2px 50px 0px #0000000D" }}
              >
                <h2 className="font-semibold text-2xl mb-3 text-heading">Education</h2>
                <Education items={educations} />
              </div>
            )}

            {experiences.length > 0 && (
              <div
                className="flex flex-col gap-3 rounded-2xl px-3 py-8 md:p-8"
                style={{ boxShadow: "2px 2px 50px 0px #0000000D" }}
              >
                <h2 className="font-semibold text-2xl mb-3 text-heading">
                  Work & Experience
                </h2>
                <WorkExperience items={experiences} />
              </div>
            )}
          </div>
          <FreelancerProfileRightPanal
            languages={languages}
            skills={skills}
            userId={userId}
          />
        </div>
      </div>
    </ClientLayout>
  );
}
