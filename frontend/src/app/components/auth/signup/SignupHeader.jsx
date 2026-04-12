import Image from "next/image";

export default function SignupHeader({ setActiveModal }) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <Image src="/logo.png" width={40} height={40} alt="logo" />
        <h1 className="text-xl font-semibold text-gray-500">Venejobs</h1>
      </div>

      {/* Title */}
      <h2 className="mt-10 mb-3 text-3xl font-extrabold leading-tight text-center text-heading">
        Sign Up
      </h2>

      {/* Sign In redirect */}
      <p className="text-sm text-center text-gray-500 tracking-wide">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => setActiveModal("signin")}
          className="font-semibold text-heading tracking-wide cursor-pointer hover:text-primary"
        >
          Sign In
        </button>
      </p>
    </>
  );
}
