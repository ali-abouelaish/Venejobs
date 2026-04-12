import { useEffect, useRef, useState } from "react";

export default function ReadMoreBtn({
  text,
  font,
  paragraphFont = " leading-relaxed",
  clampClass = "line-clamp-6 lg:line-clamp-3",
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLong, setIsLong] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    if (el.scrollHeight > el.clientHeight) {
      setIsLong(true);
    }
  }, []);

  const showClampClass = !isExpanded ? clampClass : "";

  return (
    <div>
      <p
        ref={textRef}
        className={`text-paragraph text-sm tracking-wide lg:text-base ${paragraphFont} transition-all duration-200 ${showClampClass} font-medium`}
      >
        {text}
      </p>

      {isLong && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`cursor-pointer text-left text-sm lg:text-base underline ${font}`}
        >
          {isExpanded ? "Less..." : "More..."}
        </button>
      )}
    </div>
  );
}
