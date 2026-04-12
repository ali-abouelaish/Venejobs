import Image from "next/image";
import SvgIcon from "../Utility/SvgIcon";
import Button from "../button/Button";

export default function FreelancerPromo() {
  return (
    <div className="w-full mx-auto flex flex-col lg:flex-row items-center text-center lg:text-left gap-10">
      <div className="lg:w-5/6">
        <Image
          src="/home/manwithphone.jpg"
          alt="man on phone"
          width={700}
          height={700}
        />
      </div>

      <div className="flex w-full justify-start md:justify-center">
        <div className="flex flex-col gap-5 md:gap-10 lg:gap-6 text-left md:text-center lg:text-left">
          <p className="text-primary text-base font-bold tracking-wide">
            #Great Freelance Marketplace
          </p>

          <h2 className="text-2xl lg:text-3xl xl:text-4xl text-heading font-bold leading-snug leading-tight">
            Empowering Freelancers to Achieve Their Career Goals
          </h2>

          <p className="text-gray-500 text-sm md:text-base text-start tracking-wide font-medium leading-6 lg:leading-8">
            Meet clients you’re excited to work with and takeyour career or
            business to new heights. Find opportunities for every stage of your
            freelance career.
          </p>

          {/* Points List */}
          {[
            {
              bold: "Kickstart Your Freelance Journey:",
              text: "Discover a variety of opportunities designed for beginners and seasoned professionals alike.",
            },
            {
              bold: "Build Meaningful Connections:",
              text: "Collaborate with clients who value your skills and are eager to work with you.",
            },
            {
              bold: "Grow Your Career with Confidence:",
              text: "Access projects that match your expertise and take your freelancing career to the next level.",
            },
          ].map((item, i) => (
            <div key={i} className="flex gap-3">
              <SvgIcon name="Checkmark" />
              <p className="text-lg">
                <b className="text-heading">{item.bold} </b>
                <span className="text-gray-500 text-sm lg:text-base font-medium tracking-wide">
                  {item.text}
                </span>
              </p>
            </div>
          ))}

          <Button className=" bg-primary text-white gap-2" variant="primary">
            Find Work
            <SvgIcon name="RightArrWhite" />
          </Button>
        </div>
      </div>
    </div>
  );
}
