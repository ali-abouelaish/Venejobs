import Image from "next/image";

export default function HeroImage() {
    return (
        <div className="relative flex items-center justify-center">
            <div className="w-full max-w-[500px] md:max-w-[600px] lg:max-w-[600px] 2xl:max-w-[700px]">
                <Image
                    src="/heroSectionImage.png"
                    alt="person working"
                    width={1200}
                    height={800}
                    className="w-full h-auto object-contain"
                    priority
                />
            </div>

            {/* Floating Card 1 - Proof of Quality */}
            <div className="absolute left-[-60px] bottom-5 bg-white shadow-lg rounded-2xl px-5 py-3 hidden lg:flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center">
                    <img src="/icons/medal.png" className="w-6 h-6" alt="medal icon"/>
                </div>
                <div className="flex flex-col gap-1">
                    <h4 className="text-start font-semibold text-sm text-gray-800 tracking-wide">Proof of quality</h4>
                    <p className="text-xs text-gray-600 tracking-wide font-normal">Lorem Ipsum Dolor Amet</p>
                </div>
            </div>

            {/* Floating Card 2 - Safe & Secure */}
            <div className="absolute lg:right-0 xl:-right-24 bottom-25 bg-white shadow-lg rounded-2xl  px-5 py-3 hidden lg:flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center ">
                    <img src="/icons/security.png" className="w-6 h-6" alt="security icon"/>
                </div>
                <div className="flex flex-col gap-1">
                    <h4 className="text-start font-semibold text-sm text-gray-800 tracking-wide">Safe & secure</h4>
                    <p className="text-xs text-gray-600 tracking-wide font-normal">Lorem Ipsum Dolor Amet</p>
                </div>
            </div>

        </div>
    );
}
