import { useState, useEffect, useRef } from "react";

const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || (window.matchMedia && window.matchMedia("(max-width: 768px)").matches);
};

export const useAdminMode = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const mobile = isMobile();

    // Desktop: CapsLock detection
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!mobile && e.getModifierState && e.getModifierState("CapsLock")) {
        setIsAdminMode(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!mobile) {
        if (e.getModifierState && e.getModifierState("CapsLock")) {
          setIsAdminMode(true);
        } else {
          setIsAdminMode(false);
        }
      }
    };

    // Mobile: Double tap detection
    const handleTouchStart = (e: TouchEvent) => {
      if (!mobile) return;

      const currentTime = Date.now();
      const tapLength = currentTime - lastTapRef.current;

      if (tapLength < 300 && tapLength > 0) {
        // Double tap detected
        setIsAdminMode((prev) => !prev);
        e.preventDefault();
      } else {
        // Clear any existing timeout
        if (tapTimeoutRef.current) {
          clearTimeout(tapTimeoutRef.current);
        }
        // Set timeout to reset if no second tap
        tapTimeoutRef.current = setTimeout(() => {
          lastTapRef.current = 0;
        }, 300);
      }

      lastTapRef.current = currentTime;
    };

    if (mobile) {
      window.addEventListener("touchstart", handleTouchStart);
    } else {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
    }

    return () => {
      if (mobile) {
        window.removeEventListener("touchstart", handleTouchStart);
        if (tapTimeoutRef.current) {
          clearTimeout(tapTimeoutRef.current);
        }
      } else {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
      }
    };
  }, []);

  return isAdminMode;
};
