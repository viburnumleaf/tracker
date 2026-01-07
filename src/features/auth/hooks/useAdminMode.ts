import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// Constants
const LONG_PRESS_DURATION_MS = 1000; // 1 second long press required
const TOGGLE_DEBOUNCE_MS = 1000; // Minimum time between toggles
const REQUIRED_TOUCHES = 2; // Number of fingers for long press
const MAX_MOVEMENT_PX = 10; // Maximum allowed movement during long press

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
 * Calculates distance between two points
 */
const getDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.hypot(x2 - x1, y2 - y1);
};

/**
 * Hook for managing admin mode toggle
 * 
 * Desktop: Toggles when CapsLock is pressed
 * Mobile: Toggles on long press with two fingers simultaneously (hold for 1 second)
 * 
 * @returns {boolean} Current admin mode state
 */
export const useAdminMode = (): boolean => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  // Refs for gesture tracking
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPositionsRef = useRef<Array<{ x: number; y: number }> | null>(null);
  const lastToggleTimeRef = useRef(0);
  const isGestureActiveRef = useRef(false);

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

  // Clear long press timer
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Reset gesture state
  const resetGestureState = useCallback(() => {
    clearLongPressTimer();
    touchStartPositionsRef.current = null;
    isGestureActiveRef.current = false;
  }, [clearLongPressTimer]);

  // Desktop: CapsLock detection handlers
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isMobile) return;
      
      // Check if CapsLock key was pressed
      if (e.key === "CapsLock" || e.code === "CapsLock") {
        // For CapsLock, state changes after keydown, so check with a small delay
        setTimeout(() => {
          // Get fresh state after toggle
          const freshState = e.getModifierState?.("CapsLock") ?? false;
          setIsAdminMode(freshState);
        }, 10);
      } else {
        // For other keys, check current CapsLock state
        setIsAdminMode(e.getModifierState?.("CapsLock") ?? false);
      }
    },
    [isMobile]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (isMobile) return;
      
      // Always check CapsLock state on keyup
      setIsAdminMode(e.getModifierState?.("CapsLock") ?? false);
    },
    [isMobile]
  );
  
  // Additional check: monitor any keyboard activity to catch CapsLock state changes
  useEffect(() => {
    if (isMobile) return;
    
    const handleAnyKey = (e: KeyboardEvent) => {
      // Check CapsLock state on any key press
      const capsLockState = e.getModifierState?.("CapsLock") ?? false;
      setIsAdminMode(capsLockState);
    };
    
    window.addEventListener("keydown", handleAnyKey);
    window.addEventListener("keyup", handleAnyKey);
    
    return () => {
      window.removeEventListener("keydown", handleAnyKey);
      window.removeEventListener("keyup", handleAnyKey);
    };
  }, [isMobile]);

  // Mobile: Long press with two fingers handlers
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!isMobile || e.touches.length !== REQUIRED_TOUCHES) {
        resetGestureState();
        return;
      }

      // Store initial touch positions
      touchStartPositionsRef.current = Array.from(e.touches).map((touch) => ({
        x: touch.clientX,
        y: touch.clientY,
      }));
      isGestureActiveRef.current = true;

      // Start long press timer
      clearLongPressTimer();
      longPressTimerRef.current = setTimeout(() => {
        if (isGestureActiveRef.current && touchStartPositionsRef.current) {
          toggleAdminMode();
          resetGestureState();
        }
      }, LONG_PRESS_DURATION_MS);
    },
    [isMobile, resetGestureState, clearLongPressTimer, toggleAdminMode]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (
        !isMobile ||
        !isGestureActiveRef.current ||
        e.touches.length !== REQUIRED_TOUCHES ||
        !touchStartPositionsRef.current
      ) {
        return;
      }

      // Check if fingers moved too much (cancel gesture)
      const currentTouches = Array.from(e.touches);
      const movedTooMuch = currentTouches.some((touch, index) => {
        const startPos = touchStartPositionsRef.current![index];
        if (!startPos) return true;
        
        const distance = getDistance(
          startPos.x,
          startPos.y,
          touch.clientX,
          touch.clientY
        );
        return distance > MAX_MOVEMENT_PX;
      });

      if (movedTooMuch) {
        resetGestureState();
      }
    },
    [isMobile, resetGestureState]
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
        resetGestureState();
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
  }, [isMobile, handleKeyDown, handleKeyUp, handleTouchStart, handleTouchMove, handleTouchEnd, resetGestureState]);

  return isAdminMode;
};
