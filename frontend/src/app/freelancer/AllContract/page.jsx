

import ContractsData from "@/app/components/Freelancer/AllContractFreelancer/ContractsData";
import HeaderSection from "@/app/components/Freelancer/AllContractFreelancer/HeaderSection";
import FreelancerLayout from "@/app/layout/FreelancerLayout";

export default function page() {
  return (
    <>
      <FreelancerLayout>
        <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
          <HeaderSection />

          <ContractsData />
        </div>
      </FreelancerLayout>
    </>
  );
}
