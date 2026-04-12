"use client";

import { create } from "zustand";
import freelancerBasicProfile from "./freelancerStore/basicProfile.store";
import freelancerSkills from "@/app/store/freelancerStore/skills.store";
import freelancerPortfolio from "@/app/store/freelancerStore/portfolios.store";
import personalDetails from "@/app/store/freelancerStore/personalDetails.store";
import freelancerLanguage from "@/app/store/freelancerStore/languages.store";
import freelancerEducation from "@/app/store/freelancerStore/educationStore";
import freelancerExperience from "@/app/store/freelancerStore/experienceStore";

const freelancerApiStore = create((set) => ({
  ...personalDetails(set),
  ...freelancerBasicProfile(set),
  ...freelancerSkills(set),
  ...freelancerPortfolio(set),
  ...freelancerLanguage(set),
  ...freelancerEducation(set),
  ...freelancerExperience(set),
}));

export default freelancerApiStore;
