import { useEffect } from "react";

function useEscapeKey(isActive, onEscape) {
  useEffect(() => {
    if (!isActive) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onEscape();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isActive, onEscape]);
}

export default useEscapeKey;
