import Image from "next/image";

export default function CategoryCard({ src, label }) {
  return (
    <div className="relative flex-shrink-0 rounded-2xl overflow-hidden bg-gray-200 w-[250px] h-[260px]">

      {/* Black Overlay */}
      <div className="absolute inset-0 bg-black/40 z-10"></div>

      {/* Text */}
      <div className="absolute top-3 left-3 text-white text-base font-medium z-20 tracking-wide">
        {label}
      </div>

      {/* Image */}
      <Image
        src={src}
        alt={label}
        width={300}
        height={300}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
