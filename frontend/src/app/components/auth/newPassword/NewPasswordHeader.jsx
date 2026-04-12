"use client";
import Image from "next/image";

export default function NewPasswordHeader() {
    return (
        <>
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-5">
                <Image src="/logo.png" alt="logo" width={40} height={40} />
                <h1 className="text-xl font-semibold text-gray-500">Venejobs</h1>
            </div>

            {/* Title */}
            <h2 className="mt-10 mb-3 text-3xl font-extrabold leading-tight text-center text-heading">
                Set New Password
            </h2>

            <p className="text-sm text-center text-gray-500 tracking-wide">
                Your new password must be different from previously used ones.
            </p>
        </>
    );
}
