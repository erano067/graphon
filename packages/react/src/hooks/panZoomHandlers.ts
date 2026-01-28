import type { PixiRenderer, Position } from '@graphon/core';
import type { GraphonRefs } from './useGraphonRefs';

export interface ZoomConfig {
  minZoom: number;
  maxZoom: number;
}

export function handlePanStart<N, E>(
  pos: Position,
  renderer: PixiRenderer<N, E>,
  refs: GraphonRefs<N, E>
): boolean {
  const hit = renderer.hitTest(pos.x, pos.y);
  if (hit.type !== 'canvas') return false;

  const viewport = renderer.getViewport();
  refs.panState.current = {
    startX: pos.x,
    startY: pos.y,
    viewportX: viewport.x,
    viewportY: viewport.y,
  };
  refs.isPanning.current = true;
  refs.isInteracting.current = true;
  return true;
}

export function handlePanMove<N, E>(
  pos: Position,
  renderer: PixiRenderer<N, E>,
  refs: GraphonRefs<N, E>
): void {
  const pan = refs.panState.current;
  if (!pan) return;

  const viewport = renderer.getViewport();
  const dx = pos.x - pan.startX;
  const dy = pos.y - pan.startY;

  renderer.setViewport({
    x: pan.viewportX + dx,
    y: pan.viewportY + dy,
    scale: viewport.scale,
  });
}

export function handlePanEnd<N, E>(refs: GraphonRefs<N, E>): void {
  refs.panState.current = undefined;
  refs.isPanning.current = false;
  refs.isInteracting.current = false;
}

/** Encapsulates zoom timeout state to avoid module-level mutable variable. */
function createZoomTimeoutManager() {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return {
    scheduleEnd(isInteracting: { current: boolean }, delay: number): void {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        isInteracting.current = false;
        timeoutId = undefined;
      }, delay);
    },
    clear(): void {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    },
  };
}

const zoomTimeout = createZoomTimeoutManager();

export interface ZoomOptions<N, E> {
  config: ZoomConfig;
  refs?: GraphonRefs<N, E>;
  onZoomChange?: (zoom: number) => void;
}

export function handleZoom<N, E>(
  event: WheelEvent,
  renderer: PixiRenderer<N, E>,
  options: ZoomOptions<N, E>
): void {
  event.preventDefault();

  const target = event.currentTarget;
  if (!(target instanceof HTMLElement)) return;

  const rect = target.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const viewport = renderer.getViewport();
  const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
  const { minZoom, maxZoom } = options.config;
  const newScale = Math.max(minZoom, Math.min(maxZoom, viewport.scale * zoomFactor));

  // Zoom toward mouse position
  const worldX = (mouseX - viewport.x) / viewport.scale;
  const worldY = (mouseY - viewport.y) / viewport.scale;
  const newX = mouseX - worldX * newScale;
  const newY = mouseY - worldY * newScale;

  renderer.setViewport({ x: newX, y: newY, scale: newScale });

  // Mark as interacting during zoom, clear after 150ms of no wheel events
  if (options.refs) {
    options.refs.isInteracting.current = true;
    zoomTimeout.scheduleEnd(options.refs.isInteracting, 150);
  }

  // Notify callback of zoom change
  options.onZoomChange?.(newScale);
}
