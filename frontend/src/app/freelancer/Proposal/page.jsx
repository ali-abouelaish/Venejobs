import Button from "@/app/components/button/Button";
import ProposalWrapper from "@/app/components/Freelancer/Proposal/ProposalWrapper";
import SelectInput from "@/app/components/Utility/SelectInput";
import SvgIcon from "@/app/components/Utility/SvgIcon";
import FreelancerLayout from "@/app/layout/FreelancerLayout";

export default function page() {
  const skills = [
    "Landing Page",
    "Web Design",
    "User Flow",
    "Prototype",
    "UX/UI Design",
  ];
  return (
    <>
      <FreelancerLayout>
        <div className="w-full max-w-[90%] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1240px] 2xl:max-w-[1400px] mx-auto my-10 lg:my-20">
          <ProposalWrapper>
            <div className="border-b border-gray-200">
              <h2 className="font-semibold text-[32px] lg:text-[44px] mb-10 text-heading">
                Submit a proposal
              </h2>
            </div>

            <div className="flex flex-col ">
              <div>
                <h2 className="font-semibold text-2xl lg:text-[32px] mb-10 text-heading">
                  Interactive Website Design in Figma
                </h2>
              </div>

              <div className="flex flex-col gap-4 border-b border-gray-200">
                <h2 className="font-semibold text-base lg:text-lg text-heading">
                  Project Type:
                </h2>
                <p className="text-paragraph  lg:text-base">
                  We are seeking a talented UI designer to join our team. As a
                  UI designer, you will be responsible for creating visually
                  appealing and user-friendly interfaces for our web and mobile
                  applications. Your main tasks will include wireframing,
                  prototyping, and designing interfaces that align with our
                  brand guidelines and user expectations. You should have a
                  strong understanding of user-centered design principles and be
                  able to translate user requirements into intuitive and
                  aesthetically pleasing designs.
                </p>
                <div className="text-paragraph text-base mt-10 flex flex-col gap-2 mb-10">
                  <h3>Skills Needed :</h3>
                  <div className="flex flex-col gap-2">
                    <p>
                      - Proficiency in UI design tools such as Sketch, Figma, or
                      Adobe XD
                    </p>
                    <p>
                      - Strong knowledge of UX principles and best practices
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-10 border-b border-gray-200 ">
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-44 mb-10">
                <div className="flex gap-8 items-center">
                  <SvgIcon name="PriceTag" />
                  <div className="flex flex-col gap-2">
                    <h2 className="lg:text-lg">$33.00</h2>
                    <p className="text-paragraph text-sm lg:text-base">
                      Fixed Price
                    </p>
                  </div>
                </div>

                <div className="flex gap-8 items-center ">
                  <SvgIcon name="PersonWSetting" />
                  <div className="flex flex-col gap-2">
                    <h2 className="lg:text-lg">Entry level</h2>
                    <p className="text-paragraph text-sm lg:text-base">
                      I am looking for freelancers with the lowest rates
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-10 border-b border-gray-200 ">
              <div className="flex flex-col gap-6">
                <h2 className="font-semibold text-base lg:text-lg text-heading">
                  Skills and Expertise
                </h2>
                <div className="flex items-center gap-3 flex-wrap mb-4 md:mb-10">
                  {skills.map((item) => (
                    <p
                      className="relative overflow-hidden
                    bg-[#FAFAFA] p-3 font-medium text-paragraph rounded-2xl
                    transition-all duration-300
                    before:content-[''] before:absolute before:inset-0
                    before:bg-gray-200 before:-translate-x-full before:transition-transform before:duration-300
                    before:-z-10
                    hover:before:translate-x-0
                    z-10  text-base"
                      key={item}
                    >
                      {item.split(" ,")}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-10 border-b border-gray-200 ">
              <div>
                <h2 className="font-semibold text-2xl lg:text-[32px]  text-heading">
                  Terms
                </h2>
              </div>
              <div className="flex flex-col gap-8 ">
                <h2 className="font-semibold text-lg lg:text-2xl  text-heading">
                  How do you want to be paid?
                </h2>
                <label
                  htmlFor="paidfor"
                  className="flex gap-3 items-center p-4 border  border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                >
                  <input
                    type="radio"
                    id="paidfor"
                    name="paymentType"
                    className="
                     h-5 w-5 accent-green -900"
                  />
                  <div className="flex flex-col">
                    <p className="font-semibold text-gray-900">By project</p>
                    <p className="lg:text-sm text-gray-600 text-xs">
                      Get your entire payment at the end, when all work has been
                      delivered.
                    </p>
                  </div>
                </label>

                <div className="flex flex-wrap xl:flex-nowrap gap-9 mb-10">
                  <div className="flex flex-col gap-6 w-full   lg:w-[450px]">
                    <h2 className="text-lg lg:text-2xl font-semibold text-heading">
                      Project Price
                    </h2>
                    <input
                      type="text"
                      placeholder="$150.00"
                      className="border border-gray-200 px-3 py-3 rounded"
                    />
                  </div>
                  <div className="flex flex-col gap-6 w-full lg:w-[450px]">
                    <h2 className="text-lg lg:text-2xl font-semibold text-heading">
                      10% Freelancer Service Fee
                    </h2>
                    <input
                      type="text"
                      placeholder="$15.00"
                      className="border border-gray-200 px-3 py-3 rounded"
                    />
                  </div>
                  <div className="flex flex-col gap-6 w-full lg:w-[450px]">
                    <h2 className="text-lg lg:text-2xl font-semibold text-heading">
                      You’ll Receive
                    </h2>
                    <input
                      type="text"
                      placeholder="$135.00"
                      className="border border-gray-200 px-3 py-3 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <h2 className="font-semibold text-lg lg:text-2xl text-heading">
                How long will this project take?
              </h2>
              <SelectInput value={"Select a duration"} options={[]} />
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-lg lg:text-2xl font-semibold">
                Cover Letter
              </h2>
              <textarea
                name=""
                id=""
                cols="30"
                rows="9"
                placeholder="Select a duration"
                className="border border-gray-200 px-5 py-5"
              ></textarea>
            </div>

            <div className="flex flex-col gap-6 border-b border-gray-200 ">
              <h2 className="font-semibold text-lg lg:text-2xl">Attachments</h2>
              <div className="flex flex-col gap-3.5 w-full xl:w-[233px]">
                <label className="flex justify-center items-center gap-4 text-secondary border px-10 py-2 rounded cursor-pointer hover:bg-gray-50 ">
                  <SvgIcon name="AttachLink" />{" "}
                  <p className="text-lg">Attach file</p>
                  <input type="file" className="hidden" />
                </label>

                <p className="text-paragraph mb-10">
                  Up to 10 files (max 25 MB each)
                </p>
              </div>
            </div>

            <div className="flex gap-8">
              <Button className="bg-secondary text-white px-3 py-4 font-semibold flex items-center gap-2">
                Submit Proposal <SvgIcon name="NextArrow" />
              </Button>
              <Button className="shadow text-paragraph px-3 py-4">
                Cancel
              </Button>
            </div>
          </ProposalWrapper>
        </div>
      </FreelancerLayout>
    </>
  );
}
