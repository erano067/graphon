import { Tween, type TweenOptions } from './Tween';

interface Animation {
  id: string;
  tween: Tween;
}

/**
 * Manages multiple concurrent animations with requestAnimationFrame loop.
 */
export class AnimationManager {
  private animations = new Map<string, Animation>();
  private rafId: number | null = null;
  private idCounter = 0;

  /** Create and start a tween animation, returns animation ID */
  animate(startValue: number, endValue: number, options: TweenOptions): string {
    const id = `anim_${++this.idCounter}`;

    const tween = new Tween(startValue, endValue, {
      ...options,
      onComplete: () => {
        options.onComplete?.();
        this.animations.delete(id);
      },
    });

    this.animations.set(id, { id, tween });
    tween.start();
    this.startLoop();

    return id;
  }

  /** Animate multiple numeric values together */
  animateValues<T extends Record<string, number>>(
    from: T,
    to: T,
    options: Omit<TweenOptions, 'onUpdate'> & { onUpdate: (values: T) => void }
  ): string {
    const keys = Object.keys(from);
    const currentValues: Record<string, number> = { ...from };

    return this.animate(0, 1, {
      ...options,
      onUpdate: (_, progress) => {
        for (const key of keys) {
          const startVal = (from as Record<string, number>)[key] ?? 0;
          const endVal = (to as Record<string, number>)[key] ?? 0;
          currentValues[key] = startVal + (endVal - startVal) * progress;
        }
        options.onUpdate(currentValues as T);
      },
    });
  }

  /** Cancel animation by ID */
  cancel(id: string): void {
    const anim = this.animations.get(id);
    if (!anim) return;
    anim.tween.cancel();
    this.animations.delete(id);
  }

  /** Cancel all running animations */
  cancelAll(): void {
    for (const anim of this.animations.values()) {
      anim.tween.cancel();
    }
    this.animations.clear();
    this.stopLoop();
  }

  /** Check if any animations are running */
  get isAnimating(): boolean {
    return this.animations.size > 0;
  }

  /** Get count of running animations */
  get animationCount(): number {
    return this.animations.size;
  }

  private startLoop(): void {
    if (this.rafId !== null) return;

    const loop = (time: number): void => {
      for (const anim of this.animations.values()) {
        anim.tween.update(time);
      }

      // Clean up completed animations
      for (const [id, anim] of this.animations) {
        if (!anim.tween.running) {
          this.animations.delete(id);
        }
      }

      if (this.animations.size > 0) {
        this.rafId = requestAnimationFrame(loop);
      } else {
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(loop);
  }

  private stopLoop(): void {
    if (this.rafId === null) return;
    cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  /** Clean up and stop all animations */
  destroy(): void {
    this.cancelAll();
  }
}
