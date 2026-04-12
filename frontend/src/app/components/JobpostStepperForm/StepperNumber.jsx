export default function StepperNumber({ currstep }) {
  return (
    <div className="flex items-center justify-around md:max-w-[350px] w-full">
      {[...Array(5)].map((_, i) => (
        <div className="flex items-center w-full" key={i}>
          {/* Circle */}
          <span
            className={`
              ${
                i + 1 <= currstep
                  ? "bg-primary text-white"
                  : "bg-white text-black"
              }
              rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center
              border border-gray-300 shrink-0
            `}
          >
            {i + 1}
          </span>

          {/* Dotted Line (only between circles) */}
          {i < 4 && (
            <div className="flex-1  border-t-2 border-dotted border-gray-200 "></div>
          )}
        </div>
      ))}
    </div>
  );
}
