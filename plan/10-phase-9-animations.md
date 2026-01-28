# Phase 9: Animations

## Overview

Create a robust animation system for smooth transitions, property animations, and layout animations.

---

## Task 9.1: Animation Engine

### Overview
Create core animation engine with tweening support.

### Dependencies
- Phase 8 complete

### Acceptance Criteria
- [ ] Tween class for value interpolation
- [ ] Multiple easing functions
- [ ] Animation manager for coordination
- [ ] Cancelable animations

### Implementation Steps

```typescript
// packages/core/src/animation/easings.ts
export type EasingFn = (t: number) => number;

export const easings = {
  linear: (t: number) => t,
  
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  
  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - (--t) * t * t * t,
  
  easeInExpo: (t: number) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  
  easeInElastic: (t: number) => {
    if (t === 0 || t === 1) return t;
    return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
  },
  easeOutElastic: (t: number) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
  },
  
  easeOutBounce: (t: number) => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  },
} as const;

export type EasingName = keyof typeof easings;
```

```typescript
// packages/core/src/animation/Tween.ts
import type { EasingFn, EasingName } from './easings';
import { easings } from './easings';

export interface TweenOptions {
  duration: number;
  easing?: EasingName | EasingFn;
  delay?: number;
  onUpdate?: (value: number, progress: number) => void;
  onComplete?: () => void;
}

export class Tween {
  private startValue: number;
  private endValue: number;
  private duration: number;
  private delay: number;
  private easing: EasingFn;
  private onUpdate?: (value: number, progress: number) => void;
  private onComplete?: () => void;
  
  private startTime: number = 0;
  private isRunning: boolean = false;
  private isCanceled: boolean = false;
  
  constructor(
    startValue: number,
    endValue: number,
    options: TweenOptions
  ) {
    this.startValue = startValue;
    this.endValue = endValue;
    this.duration = options.duration;
    this.delay = options.delay ?? 0;
    this.easing = typeof options.easing === 'function'
      ? options.easing
      : easings[options.easing ?? 'easeOutQuad'];
    this.onUpdate = options.onUpdate;
    this.onComplete = options.onComplete;
  }
  
  start(): this {
    this.startTime = performance.now();
    this.isRunning = true;
    this.isCanceled = false;
    return this;
  }
  
  cancel(): void {
    this.isCanceled = true;
    this.isRunning = false;
  }
  
  /**
   * Update tween, returns true if still running
   */
  update(currentTime: number = performance.now()): boolean {
    if (!this.isRunning || this.isCanceled) return false;
    
    const elapsed = currentTime - this.startTime - this.delay;
    
    if (elapsed < 0) {
      // Still in delay
      return true;
    }
    
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
}
```

```typescript
// packages/core/src/animation/AnimationManager.ts
import { Tween, type TweenOptions } from './Tween';

interface Animation {
  id: string;
  tween: Tween;
}

export class AnimationManager {
  private animations: Map<string, Animation> = new Map();
  private rafId: number | null = null;
  private idCounter: number = 0;
  
  /**
   * Create and start a tween
   */
  animate(
    startValue: number,
    endValue: number,
    options: TweenOptions
  ): string {
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
  
  /**
   * Animate multiple values together
   */
  animateValues<T extends Record<string, number>>(
    from: T,
    to: T,
    options: Omit<TweenOptions, 'onUpdate'> & {
      onUpdate: (values: T) => void;
    }
  ): string {
    const keys = Object.keys(from) as (keyof T)[];
    const currentValues = { ...from };
    
    return this.animate(0, 1, {
      ...options,
      onUpdate: (_, progress) => {
        for (const key of keys) {
          const startVal = from[key] as number;
          const endVal = to[key] as number;
          (currentValues[key] as number) = startVal + (endVal - startVal) * progress;
        }
        options.onUpdate(currentValues);
      },
    });
  }
  
  /**
   * Cancel animation by ID
   */
  cancel(id: string): void {
    const anim = this.animations.get(id);
    if (anim) {
      anim.tween.cancel();
      this.animations.delete(id);
    }
  }
  
  /**
   * Cancel all animations
   */
  cancelAll(): void {
    for (const anim of this.animations.values()) {
      anim.tween.cancel();
    }
    this.animations.clear();
    this.stopLoop();
  }
  
  /**
   * Check if any animations are running
   */
  get isAnimating(): boolean {
    return this.animations.size > 0;
  }
  
  private startLoop(): void {
    if (this.rafId !== null) return;
    
    const loop = (time: number) => {
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
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  
  destroy(): void {
    this.cancelAll();
  }
}
```

### Files to Create
- `packages/core/src/animation/easings.ts`
- `packages/core/src/animation/Tween.ts`
- `packages/core/src/animation/AnimationManager.ts`
- `packages/core/src/animation/index.ts`

### Tests Required
- Unit: All easing functions
- Unit: Tween interpolation
- Unit: Animation cancellation
- Unit: Multiple concurrent animations

### Demo Addition
None yet (Task 9.4)

---

## Task 9.2: Node Animations

### Overview
Animate node properties (position, size, color, opacity).

### Dependencies
- Task 9.1

### Acceptance Criteria
- [ ] Animate node position
- [ ] Animate node size
- [ ] Animate node color (interpolate HSL)
- [ ] Animate opacity

### Implementation Steps

**Note:** NodeAnimator works with `GraphModel` interface, NOT graphology directly.

```typescript
// packages/core/src/animation/NodeAnimator.ts
import type { GraphModel } from '../model/GraphModel';  // Uses GraphModel, NOT Graph
import type { AnimationManager } from './AnimationManager';
import type { EasingName } from './easings';

export interface NodeAnimationOptions {
  duration?: number;
  easing?: EasingName;
  delay?: number;
}

export class NodeAnimator {
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  private animationManager: AnimationManager;
  private activeAnimations: Map<string, string[]> = new Map();  // nodeId -> animationIds
  
  constructor(model: GraphModel, animationManager: AnimationManager) {
    this.model = model;
    this.animationManager = animationManager;
  }
  
  /**
   * Animate node to new position
   */
  moveTo(
    nodeId: string,
    x: number,
    y: number,
    options?: NodeAnimationOptions
  ): void {
    this.cancelNode(nodeId);
    
    const node = this.model.getNode(nodeId);  // Use GraphModel
    if (!node) return;
    
    const startX = node.x;
    const startY = node.y;
    
    const animId = this.animationManager.animateValues(
      { x: startX, y: startY },
      { x, y },
      {
        duration: options?.duration ?? 300,
        easing: options?.easing ?? 'easeOutQuad',
        delay: options?.delay,
        onUpdate: (values) => {
          this.model.updateNode(nodeId, { x: values.x, y: values.y });  // Use GraphModel
        },
      }
    );
    
    this.trackAnimation(nodeId, animId);
  }
  
  /**
   * Animate multiple nodes to new positions
   */
  moveMany(
    positions: Map<string, { x: number; y: number }>,
    options?: NodeAnimationOptions
  ): void {
    for (const [nodeId, pos] of positions) {
      this.moveTo(nodeId, pos.x, pos.y, options);
    }
  }
  
  /**
   * Animate node size
   * Uses GraphModel instead of graphology
   */
  resizeTo(
    nodeId: string,
    size: number,
    options?: NodeAnimationOptions
  ): void {
    const node = this.model.getNode(nodeId);
    const startSize = (node?.data?.size as number) ?? 10;
    
    const animId = this.animationManager.animate(startSize, size, {
      duration: options?.duration ?? 200,
      easing: options?.easing ?? 'easeOutQuad',
      delay: options?.delay,
      onUpdate: (value) => {
        // Use GraphModel.updateNode() instead of graphology
        this.model.updateNode(nodeId, { size: value });
      },
    });
    
    this.trackAnimation(nodeId, animId);
  }
  
  /**
   * Fade node opacity
   * Uses GraphModel instead of graphology
   */
  fadeTo(
    nodeId: string,
    opacity: number,
    options?: NodeAnimationOptions
  ): void {
    const node = this.model.getNode(nodeId);
    const startOpacity = (node?.data?.opacity as number) ?? 1;
    
    const animId = this.animationManager.animate(startOpacity, opacity, {
      duration: options?.duration ?? 200,
      easing: options?.easing ?? 'easeOutQuad',
      delay: options?.delay,
      onUpdate: (value) => {
        // Use GraphModel.updateNode() instead of graphology
        this.model.updateNode(nodeId, { opacity: value });
      },
    });
    
    this.trackAnimation(nodeId, animId);
  }
  
  /**
   * Cancel all animations for a node
   */
  cancelNode(nodeId: string): void {
    const animIds = this.activeAnimations.get(nodeId) ?? [];
    for (const animId of animIds) {
      this.animationManager.cancel(animId);
    }
    this.activeAnimations.delete(nodeId);
  }
  
  /**
   * Cancel all node animations
   */
  cancelAll(): void {
    for (const nodeId of this.activeAnimations.keys()) {
      this.cancelNode(nodeId);
    }
  }
  
  private trackAnimation(nodeId: string, animId: string): void {
    if (!this.activeAnimations.has(nodeId)) {
      this.activeAnimations.set(nodeId, []);
    }
    this.activeAnimations.get(nodeId)!.push(animId);
  }
}
```

### Files to Create
- `packages/core/src/animation/NodeAnimator.ts`

### Tests Required
- Unit: Position animation
- Unit: Size animation
- Unit: Animation cancellation

---

## Task 9.3: Layout Transitions

### Overview
Animate between layout positions for smooth transitions.

### Dependencies
- Task 9.2
- Phase 7 (Layouts)

### Acceptance Criteria
- [ ] Smooth transition from current to new layout
- [ ] Staggered animation option
- [ ] Progress callback

### Implementation Steps

**Note:** LayoutTransition works with `GraphModel` interface, NOT graphology directly.

```typescript
// packages/core/src/animation/LayoutTransition.ts
import type { GraphModel } from '../model/GraphModel';  // Uses GraphModel, NOT Graph
import type { AnimationManager } from './AnimationManager';
import type { EasingName } from './easings';

export interface LayoutTransitionOptions {
  duration?: number;
  easing?: EasingName;
  stagger?: number;  // Delay between node starts
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export class LayoutTransition {
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  private animationManager: AnimationManager;
  
  constructor(model: GraphModel, animationManager: AnimationManager) {
    this.model = model;
    this.animationManager = animationManager;
  }
  
  /**
   * Transition to new positions
   */
  transition(
    newPositions: Map<string, { x: number; y: number }>,
    options?: LayoutTransitionOptions
  ): Promise<void> {
    return new Promise((resolve) => {
      const nodes = Array.from(newPositions.entries());
      const duration = options?.duration ?? 500;
      const stagger = options?.stagger ?? 0;
      
      let completed = 0;
      const total = nodes.length;
      
      nodes.forEach(([nodeId, targetPos], index) => {
        const node = this.model.getNode(nodeId);  // Use GraphModel
        if (!node) return;
        
        const startX = node.x;
        const startY = node.y;
        
        this.animationManager.animateValues(
          { x: startX, y: startY },
          { x: targetPos.x, y: targetPos.y },
          {
            duration,
            easing: options?.easing ?? 'easeOutQuad',
            delay: index * stagger,
            onUpdate: (values) => {
              this.model.updateNode(nodeId, { x: values.x, y: values.y });  // Use GraphModel
            },
            onComplete: () => {
              completed++;
              options?.onProgress?.(completed / total);
              
              if (completed === total) {
                options?.onComplete?.();
                resolve();
              }
            },
          }
        );
      });
      
      // Handle empty positions
      if (nodes.length === 0) {
        resolve();
      }
    });
  }
  
  /**
   * Explode nodes from center (useful for initial animation)
   * Uses GraphModel instead of graphology
   */
  explodeFromCenter(
    targetPositions: Map<string, { x: number; y: number }>,
    options?: LayoutTransitionOptions
  ): Promise<void> {
    // Set all nodes to center first using GraphModel
    for (const nodeId of targetPositions.keys()) {
      this.model.setNodePosition(nodeId, 0, 0);
    }
    
    // Then transition to target
    return this.transition(targetPositions, {
      ...options,
      easing: options?.easing ?? 'easeOutExpo',
    });
  }
  
  /**
   * Implode nodes to center (useful for exit animation)
   */
  implodeToCenter(
    nodeIds: string[],
    options?: LayoutTransitionOptions
  ): Promise<void> {
    const centerPositions = new Map<string, { x: number; y: number }>();
    for (const nodeId of nodeIds) {
      centerPositions.set(nodeId, { x: 0, y: 0 });
    }
    
    return this.transition(centerPositions, {
      ...options,
      easing: options?.easing ?? 'easeInExpo',
    });
  }
}
```

### Files to Create
- `packages/core/src/animation/LayoutTransition.ts`

### Tests Required
- Unit: All nodes reach target positions
- Unit: Staggered delay works
- Unit: Progress callback accuracy

---

## Task 9.4: Animation Demo

### Overview
Create demo showcasing animation capabilities.

### Dependencies
- Task 9.3

### Acceptance Criteria
- [ ] Demo shows property animations
- [ ] Demo shows layout transitions
- [ ] Easing visualizer
- [ ] Animation controls

### Implementation Steps

**Note:** Demo uses `GraphonProvider` + `useGraph()` + `useAnimation()` hooks. NO graphology imports!

```tsx
// apps/demo/src/demos/Animations.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { 
  GraphonProvider, 
  Graphon, 
  useGraph, 
  useAnimation 
} from '@graphon/react';  // NO graphology import!
import type { EasingName } from '@graphon/core';

const EASINGS: EasingName[] = [
  'linear',
  'easeInQuad',
  'easeOutQuad',
  'easeInOutQuad',
  'easeOutElastic',
  'easeOutBounce',
];

// Hook to create circle graph using useGraph()
function useCreateCircleGraph(count: number) {
  const { addNode, addEdge, batch } = useGraph();
  
  useEffect(() => {
    batch(() => {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        addNode(`n${i}`, Math.cos(angle) * 200, Math.sin(angle) * 200, {
          size: 15,
          label: `Node ${i}`,
        });
        
        if (i > 0) {
          addEdge(`n${i - 1}`, `n${i}`);
        }
      }
      addEdge(`n${count - 1}`, 'n0');
    });
  }, [addNode, addEdge, batch, count]);
}

export function Animations() {
  return (
    <GraphonProvider>
      <AnimationsContent />
    </GraphonProvider>
  );
}

function AnimationsContent() {
  const NODE_COUNT = 12;
  useCreateCircleGraph(NODE_COUNT);
  const { moveTo, resizeTo } = useAnimation();  // Animation hooks from context
  
  const [selectedEasing, setSelectedEasing] = useState<EasingName>('easeOutQuad');
  const [duration, setDuration] = useState(500);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Animation: Pulse all nodes - uses GraphModel from context
  const pulseNodes = useCallback(async () => {
    if (!graphonRef.current) return;
    setIsAnimating(true);
    
    const animator = graphonRef.current.getNodeAnimator();
    
    // Use GraphModel iterator from context
    for (const node of model.nodes()) {
      animator.resizeTo(node.id, 25, { duration: duration / 2, easing: selectedEasing });
    }
    
    await new Promise((r) => setTimeout(r, duration / 2 + 50));
    
    // Shrink
    for (const node of model.nodes()) {
      animator.resizeTo(node.id, 15, { duration: duration / 2, easing: selectedEasing });
    }
    
    await new Promise((r) => setTimeout(r, duration / 2));
    setIsAnimating(false);
  }, [model, duration, selectedEasing]);
  
  // Animation: Scramble positions - uses GraphModel from context
  const scramblePositions = useCallback(async () => {
    if (!graphonRef.current) return;
    setIsAnimating(true);
    
    const animator = graphonRef.current.getNodeAnimator();
    
    // Use GraphModel iterator from context
    for (const node of model.nodes()) {
      const x = (Math.random() - 0.5) * 400;
      const y = (Math.random() - 0.5) * 400;
      animator.moveTo(node.id, x, y, { duration, easing: selectedEasing });
    }
    
    await new Promise((r) => setTimeout(r, duration + 50));
    setIsAnimating(false);
  }, [model, duration, selectedEasing]);
  
  // Animation: Reset to circle - uses GraphModel from context
  const resetToCircle = useCallback(async () => {
    if (!graphonRef.current) return;
    setIsAnimating(true);
    
    const count = model.nodeCount;
    const transition = graphonRef.current.getLayoutTransition();
    const positions = new Map<string, { x: number; y: number }>();
    
    // Use GraphModel iterator from context
    let i = 0;
    for (const node of model.nodes()) {
      const angle = (i / count) * Math.PI * 2;
      positions.set(node.id, {
        x: Math.cos(angle) * 200,
        y: Math.sin(angle) * 200,
      });
      i++;
    }
    
    await transition.transition(positions, { duration, easing: selectedEasing });
    setIsAnimating(false);
  }, [model, duration, selectedEasing]);
  
  // Animation: Staggered entrance - uses GraphModel from context
  const staggeredEntrance = useCallback(async () => {
    if (!graphonRef.current) return;
    setIsAnimating(true);
    
    const transition = graphonRef.current.getLayoutTransition();
    
    // Save current positions using GraphModel iterator
    const targetPositions = new Map<string, { x: number; y: number }>();
    for (const node of model.nodes()) {
      targetPositions.set(node.id, { x: node.x, y: node.y });
    }
    
    await transition.explodeFromCenter(targetPositions, {
      duration,
      easing: selectedEasing,
      stagger: 30,
    });
    
    setIsAnimating(false);
  }, [model, duration, selectedEasing]);
  
  return (
    <div className="demo-page">
      <header className="demo-header">
        <h1>Animations</h1>
        <p>Smooth transitions and property animations with customizable easing.</p>
      </header>
      
      <div className="demo-controls">
        <div className="control-group">
          <label>Easing:</label>
          <select
            value={selectedEasing}
            onChange={(e) => setSelectedEasing(e.target.value as EasingName)}
          >
            {EASINGS.map((easing) => (
              <option key={easing} value={easing}>{easing}</option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>Duration: {duration}ms</label>
          <input
            type="range"
            min={100}
            max={2000}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>
        
        <button onClick={pulseNodes} disabled={isAnimating}>Pulse Nodes</button>
        <button onClick={scramblePositions} disabled={isAnimating}>Scramble</button>
        <button onClick={resetToCircle} disabled={isAnimating}>Reset Circle</button>
        <button onClick={staggeredEntrance} disabled={isAnimating}>Staggered</button>
      </div>
      
      <div className="demo-canvas">
        <Graphon
          ref={graphonRef}
          graph={graph}
          nodeStyle={{ color: '#6366f1', label: { visible: true } }}
          edgeStyle={{ width: 2, color: '#94a3b8' }}
          onReady={() => graphonRef.current?.fitToView()}
        />
      </div>
      
      <div className="demo-description">
        <h3>Animation Types</h3>
        <ul>
          <li><strong>Pulse</strong> - Animate node size</li>
          <li><strong>Scramble</strong> - Move to random positions</li>
          <li><strong>Reset Circle</strong> - Smooth layout transition</li>
          <li><strong>Staggered</strong> - Sequential entrance animation</li>
        </ul>
        
        <h3>Easing Functions</h3>
        <p>Try different easing functions to see how they affect the animation feel.</p>
      </div>
    </div>
  );
}
```

### Files to Create/Modify
- `apps/demo/src/demos/Animations.tsx`
- `apps/demo/src/App.tsx` (add route)
- Export animation utilities from core

### Tests Required
- Visual: Animations look correct
- Integration: Multiple concurrent animations

---

## Task 9.5: Enter/Exit Animations

### Overview
Animate nodes/edges when added or removed from graph.

### Dependencies
- Task 9.4

### Acceptance Criteria
- [ ] Fade-in for new nodes
- [ ] Fade-out for removed nodes
- [ ] Scale entrance/exit
- [ ] Configurable defaults

### Implementation Steps

**Note:** EnterExitAnimator uses `GraphModel` interface, NOT graphology directly.

```typescript
// packages/core/src/animation/EnterExitAnimator.ts
import type { GraphModel } from '../model/GraphModel';  // Uses GraphModel, NOT Graph
import type { AnimationManager } from './AnimationManager';
import type { EasingName } from './easings';

export interface EnterExitConfig {
  enterDuration: number;
  exitDuration: number;
  enterEasing: EasingName;
  exitEasing: EasingName;
  enterScale: boolean;
  enterFade: boolean;
  exitScale: boolean;
  exitFade: boolean;
}

const DEFAULT_CONFIG: EnterExitConfig = {
  enterDuration: 300,
  exitDuration: 200,
  enterEasing: 'easeOutQuad',
  exitEasing: 'easeInQuad',
  enterScale: true,
  enterFade: true,
  exitScale: true,
  exitFade: true,
};

export class EnterExitAnimator {
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  private animationManager: AnimationManager;
  private config: EnterExitConfig;
  private pendingRemoval: Set<string> = new Set();
  
  constructor(
    model: GraphModel,
    animationManager: AnimationManager,
    config?: Partial<EnterExitConfig>
  ) {
    this.model = model;
    this.animationManager = animationManager;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Animate node entrance
   * Uses GraphModel instead of graphology
   */
  animateEnter(nodeId: string): void {
    const node = this.model.getNode(nodeId);
    const targetSize = (node?.data?.size as number) ?? 10;
    
    // Start with small/invisible using GraphModel
    if (this.config.enterScale) {
      this.model.updateNode(nodeId, { size: 0.1 });
    }
    if (this.config.enterFade) {
      this.model.updateNode(nodeId, { opacity: 0 });
    }
    
    // Animate to target using GraphModel
    if (this.config.enterScale) {
      this.animationManager.animate(0.1, targetSize, {
        duration: this.config.enterDuration,
        easing: this.config.enterEasing,
        onUpdate: (value) => {
          this.model.updateNode(nodeId, { size: value });
        },
      });
    }
    
    if (this.config.enterFade) {
      this.animationManager.animate(0, 1, {
        duration: this.config.enterDuration,
        easing: this.config.enterEasing,
        onUpdate: (value) => {
          this.model.updateNode(nodeId, { opacity: value });
        },
      });
    }
  }
  
  /**
   * Animate node exit (returns promise that resolves when animation completes)
   * Uses GraphModel instead of graphology
   */
  animateExit(nodeId: string): Promise<void> {
    return new Promise((resolve) => {
      if (this.pendingRemoval.has(nodeId)) {
        resolve();
        return;
      }
      
      this.pendingRemoval.add(nodeId);
      
      const node = this.model.getNode(nodeId);
      const startSize = (node?.data?.size as number) ?? 10;
      let completed = 0;
      const expectedCompletions = (this.config.exitScale ? 1 : 0) + (this.config.exitFade ? 1 : 0);
      
      const checkComplete = () => {
        completed++;
        if (completed >= expectedCompletions) {
          this.pendingRemoval.delete(nodeId);
          resolve();
        }
      };
      
      // Use GraphModel instead of graphology
      if (this.config.exitScale) {
        this.animationManager.animate(startSize, 0.1, {
          duration: this.config.exitDuration,
          easing: this.config.exitEasing,
          onUpdate: (value) => {
            if (this.model.hasNode(nodeId)) {
              this.model.updateNode(nodeId, { size: value });
            }
          },
          onComplete: checkComplete,
        });
      }
      
      if (this.config.exitFade) {
        this.animationManager.animate(1, 0, {
          duration: this.config.exitDuration,
          easing: this.config.exitEasing,
          onUpdate: (value) => {
            if (this.model.hasNode(nodeId)) {
              this.model.updateNode(nodeId, { opacity: value });
            }
          },
          onComplete: checkComplete,
        });
      }
      
      if (expectedCompletions === 0) {
        resolve();
      }
    });
  }
  
  /**
   * Check if node is pending removal
   */
  isPendingRemoval(nodeId: string): boolean {
    return this.pendingRemoval.has(nodeId);
  }
}
```

### Files to Create
- `packages/core/src/animation/EnterExitAnimator.ts`

### Tests Required
- Unit: Enter animation starts with correct values
- Unit: Exit animation completes

---

## Phase 9 Checklist

- [ ] Easing functions implemented
- [ ] Tween class works
- [ ] AnimationManager coordinates animations
- [ ] Node animations work
- [ ] Layout transitions work
- [ ] Enter/exit animations work
- [ ] Demo showcases all animations
- [ ] All tests pass

**Estimated time:** 2-3 days
