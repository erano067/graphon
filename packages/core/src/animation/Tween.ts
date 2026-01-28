import { type EasingFn, type EasingName, getEasing } from './easings';

export interface TweenOptions {
  /** Duration in milliseconds */
  duration: number;
  /** Easing function name or custom function */
  easing?: EasingName | EasingFn;
  /** Delay before starting in milliseconds */
  delay?: number;
  /** Called each frame with current value and progress (0-1) */
  onUpdate?: (value: number, progress: number) => void;
  /** Called when animation completes */
  onComplete?: () => void;
}

/**
 * Interpolates a single numeric value over time with easing.
 */
export class Tween {
  private readonly startValue: number;
  private readonly endValue: number;
  private readonly duration: number;
  private readonly delay: number;
  private readonly easing: EasingFn;
  private readonly onUpdate: ((value: number, progress: number) => void) | null;
  private readonly onComplete: (() => void) | null;

  private startTime = 0;
  private isRunning = false;
  private isCanceled = false;

  constructor(startValue: number, endValue: number, options: TweenOptions) {
    this.startValue = startValue;
    this.endValue = endValue;
    this.duration = options.duration;
    this.delay = options.delay ?? 0;
    this.easing = getEasing(options.easing);
    this.onUpdate = options.onUpdate ?? null;
    this.onComplete = options.onComplete ?? null;
  }

  /** Start the tween */
  start(currentTime: number = performance.now()): this {
    this.startTime = currentTime;
    this.isRunning = true;
    this.isCanceled = false;
    return this;
  }

  /** Cancel the tween */
  cancel(): void {
    this.isCanceled = true;
    this.isRunning = false;
  }

  /** Update tween, returns true if still running */
  update(currentTime: number = performance.now()): boolean {
    if (!this.isRunning || this.isCanceled) return false;

    const elapsed = currentTime - this.startTime - this.delay;

    if (elapsed < 0) return true; // Still in delay

    const progress = Math.min(1, elapsed / this.duration);
    const easedProgress = this.easing(progress);
    const value = this.startValue + (this.endValue - this.startValue) * easedProgress;

    this.onUpdate?.(value, progress);

    if (progress >= 1) {
      this.isRunning = false;
      this.onComplete?.();
      return false;
    }

    return true;
  }

  get running(): boolean {
    return this.isRunning;
  }

  get canceled(): boolean {
    return this.isCanceled;
  }
}
