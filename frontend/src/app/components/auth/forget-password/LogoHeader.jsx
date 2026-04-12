import Image from "next/image";

export default function LogoHeader() {
    return (
        <div className="flex items-center justify-center gap-3 mb-5">
            <Image src="/logo.png" width={40} height={40} alt="logo" />
            <h1 className="text-xl font-semibold text-gray-500">Venejobs</h1>
        </div>
    );
}
