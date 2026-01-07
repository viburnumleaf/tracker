import { useEffect, useRef, useState } from "react";

type SwipeDirection = "left" | "right" | "up" | "down";

interface UseSwipeOptions {
  onSwipe?: (direction: SwipeDirection) => void;
  threshold?: number; // Minimum distance in pixels to trigger swipe
  preventDefault?: boolean;
}

export function useSwipe({
  onSwipe,
  threshold = 50,
  preventDefault = true,
}: UseSwipeOptions = {}) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null
  );
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    if (!onSwipe) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      setIsSwiping(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Don't prevent default to allow normal scrolling
      // Only prevent if we detect a significant horizontal movement
      if (preventDefault && touchStartRef.current) {
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
        
        // Only prevent default if horizontal movement is significant
        // This allows vertical scrolling to work normally
        if (deltaX > 20 && deltaX > deltaY) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Only trigger swipe if:
      // 1. Fast enough (less than 300ms)
      // 2. Far enough (more than threshold)
      // 3. For vertical swipes, prefer upward swipes (deltaY < 0 means up)
      // 4. For horizontal swipes, movement should be more horizontal than vertical
      if (deltaTime < 300) {
        if (absX > absY && absX > threshold) {
          // Horizontal swipe
          onSwipe(deltaX > 0 ? "right" : "left");
        } else if (absY > absX && absY > threshold && deltaY < 0) {
          // Vertical swipe up only
          onSwipe("up");
        }
      }

      touchStartRef.current = null;
      setIsSwiping(false);
    };

    const element = document.body;
    element.addEventListener("touchstart", handleTouchStart, { passive: false });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onSwipe, threshold, preventDefault]);

  return { isSwiping };
}
