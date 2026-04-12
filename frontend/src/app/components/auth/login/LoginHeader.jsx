import Image from "next/image";

export default function LoginHeader({ setActiveModal }) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <Image src="/logo.png" alt="logo" width={40} height={40} />
        <h1 className="text-xl font-semibold text-gray-500">Venejobs</h1>
      </div>

      {/* Title */}
      <h2 className="mt-10 mb-3 text-3xl font-extrabold leading-tight text-center text-heading">
        Sign In
      </h2>

      {/* Sign up redirect */}
      <div className="text-sm text-center text-gray-500 tracking-wide">
        Do you have an account yet?{" "}
        <button
          onClick={() => setActiveModal("signup")}
          className="font-semibold text-heading tracking-wide cursor-pointer hover:text-primary"
        >
          Sign Up
        </button>
      </div>
    </>
  );
}
