import HeroButtons from "./HeroButtons";
import HeroImage from "./HeroImage";

export default function HeroSection() {
    return (
        <div className="flex flex-col xl:flex-row items-center  gap-10">

            {/* LEFT CONTENT */}
            <div className="flex-1 flex flex-col gap-6 lg:gap-7">
                <h1 className="text-white font-bold text-3xl lg:text-4xl xl:text-5xl leading-10 lg:leading-[60px] tracking-normal">
                    Effortless hiring, inspired work with Venejobs.
                </h1>

                <p className="text-white text-base 2xl:text-lg w-full lg:max-w-[83%]">
                    Work with talented people at the most affordable price to get the most
                    out of your time and cost.
                </p>

                <HeroButtons />
            </div>

            {/* RIGHT IMAGE */}
            <HeroImage />
        </div>
    );
}
