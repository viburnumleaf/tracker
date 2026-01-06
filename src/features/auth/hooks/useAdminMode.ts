import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// Constants
const PINCH_THRESHOLD = 0.3; // 30% distance reduction to trigger
const TOGGLE_DEBOUNCE_MS = 500; // Minimum time between toggles
const REQUIRED_TOUCHES = 2; // Number of fingers for pinch gesture

const MOBILE_USER_AGENTS = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

/**
 * Detects if the current device is mobile
 */
const isMobileDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  
  return (
    MOBILE_USER_AGENTS.test(navigator.userAgent) ||
    (window.matchMedia?.("(max-width: 768px)").matches ?? false)
  );
};

/**
 * Calculates Euclidean distance between two touch points
 */
const calculateTouchDistance = (touch1: Touch, touch2: Touch): number => {
  const deltaX = touch1.clientX - touch2.clientX;
  const deltaY = touch1.clientY - touch2.clientY;
  return Math.hypot(deltaX, deltaY);
};

/**
 * Hook for managing admin mode toggle
 * 
 * Desktop: Toggles when CapsLock is pressed
 * Mobile: Toggles on pinch-in gesture (two fingers moving together)
 * 
 * @returns {boolean} Current admin mode state
 */
export const useAdminMode = (): boolean => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  // Refs for gesture tracking
  const initialDistanceRef = useRef<number | null>(null);
  const gestureActiveRef = useRef(false);
  const lastToggleTimeRef = useRef(0);

  // Memoize mobile detection to avoid recalculation
  const isMobile = useMemo(() => isMobileDevice(), []);

  // Toggle admin mode with debounce
  const toggleAdminMode = useCallback(() => {
    const now = Date.now();
    if (now - lastToggleTimeRef.current > TOGGLE_DEBOUNCE_MS) {
      setIsAdminMode((prev) => !prev);
      lastToggleTimeRef.current = now;
    }
  }, []);

  // Reset gesture state
  const resetGestureState = useCallback(() => {
    initialDistanceRef.current = null;
    gestureActiveRef.current = false;
  }, []);

  // Desktop: CapsLock detection handlers
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isMobile) return;
      
      if (e.getModifierState?.("CapsLock")) {
        setIsAdminMode(true);
      }
    },
    [isMobile]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (isMobile) return;
      
      setIsAdminMode(e.getModifierState?.("CapsLock") ?? false);
    },
    [isMobile]
  );

  // Mobile: Pinch-in gesture handlers
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!isMobile || e.touches.length !== REQUIRED_TOUCHES) {
        resetGestureState();
        return;
      }

      const distance = calculateTouchDistance(e.touches[0], e.touches[1]);
      initialDistanceRef.current = distance;
      gestureActiveRef.current = true;
    },
    [isMobile, resetGestureState]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (
        !isMobile ||
        !gestureActiveRef.current ||
        e.touches.length !== REQUIRED_TOUCHES ||
        initialDistanceRef.current === null
      ) {
        return;
      }

      const currentDistance = calculateTouchDistance(e.touches[0], e.touches[1]);
      const distanceReduction = initialDistanceRef.current - currentDistance;
      const threshold = initialDistanceRef.current * PINCH_THRESHOLD;

      if (distanceReduction > threshold) {
        toggleAdminMode();
        resetGestureState();
      }
    },
    [isMobile, toggleAdminMode, resetGestureState]
  );

  const handleTouchEnd = useCallback(() => {
    resetGestureState();
  }, [resetGestureState]);

  // Setup event listeners
  useEffect(() => {
    if (isMobile) {
      const options: AddEventListenerOptions = { passive: true };
      
      window.addEventListener("touchstart", handleTouchStart, options);
      window.addEventListener("touchmove", handleTouchMove, options);
      window.addEventListener("touchend", handleTouchEnd, options);
      window.addEventListener("touchcancel", handleTouchEnd, options);

      return () => {
        window.removeEventListener("touchstart", handleTouchStart);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
        window.removeEventListener("touchcancel", handleTouchEnd);
      };
    } else {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
      };
    }
  }, [isMobile, handleKeyDown, handleKeyUp, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return isAdminMode;
};
