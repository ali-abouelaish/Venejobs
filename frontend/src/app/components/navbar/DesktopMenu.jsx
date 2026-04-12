import Link from "next/link";

export default function DesktopMenu() {
  return (
    <nav className="hidden lg:flex">
      <ul className="flex items-center gap-6 md:gap-10">
        <li>
          <Link
            className="text-white font-medium relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:w-full"
            href=""
          >
            Find Talent
          </Link>
        </li>

        <li>
          <Link
            className="text-white font-medium relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:w-full"
            href=""
          >
            Post a Job
          </Link>
        </li>

        <li>
          <Link
            className="text-white font-medium relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:w-full"
            href=""
          >
            Find Work
          </Link>
        </li>

        <li>
          <Link
            className="text-white font-medium relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:w-full"
            href=""
          >
            About Us
          </Link>
        </li>

        <li>
          <Link
            className="text-white font-medium relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:w-full"
            href=""
          >
            Contact Us
          </Link>
        </li>
      </ul>
    </nav>
  );
}
