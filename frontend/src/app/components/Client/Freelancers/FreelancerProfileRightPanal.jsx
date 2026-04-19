"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import Skills from "@/app/components/Client/Common/Skills";

const FreelancerProfileRightPanal = ({ languages = [], skills = [], userId }) => {
  const router = useRouter();
  const [contacting, setContacting] = useState(false);

  const handleContact = async () => {
    if (!userId || contacting) return;
    setContacting(true);
    try {
      const res = await fetch("/api/conversations/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freelancerId: Number(userId) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Could not start conversation");
        return;
      }
      const { conversationId } = await res.json();
      router.push(`/messages?conversation=${conversationId}`);
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setContacting(false);
    }
  };

  return (
    <div className="w-full lg:w-[27%] flex flex-col gap-10">
      <div
        className="flex flex-col gap-10 rounded-lg px-4 py-8"
        style={{ boxShadow: "0px 6px 50px 0px #404F680D" }}
      >
        {languages.length > 0 && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <SvgIcon name="Language" size={24} />
              <h2 className="font-semibold text-lg">Language</h2>
            </div>
            {languages.map((item) => (
              <div className="flex flex-col gap-8" key={item.id ?? item.language}>
                <div className="flex items-center justify-between">
                  <h2 className="font-medium text-heading">{item.language}</h2>
                  <p className="text-paragraph">{item.proficiency ?? ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-4">
          <h6 className="font-semibold text-lg text-heading">Skills</h6>
          <Skills skills={skills} />
        </div>
      </div>
      {/* Contact button */}
      <div className="flex flex-row gap-4">
        <button
          onClick={handleContact}
          disabled={contacting}
          className="bg-primary font-semibold w-full py-4 rounded text-white text-xs md:text-base cursor-pointer disabled:opacity-50"
        >
          {contacting ? "Starting conversation..." : "Contact Freelancer"}
        </button>
      </div>
    </div>
  );
};

export default FreelancerProfileRightPanal;
