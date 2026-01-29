import { type RefObject, useEffect } from 'react';

/**
 * Attaches a wheel event listener with passive: false to allow preventDefault.
 * This is necessary for custom zoom handling.
 */
export function useWheelHandler(
  containerRef: RefObject<HTMLDivElement | null>,
  handleWheel: (e: WheelEvent) => void
): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [containerRef, handleWheel]);
}
