# Phase 6: Labels

## Overview

Implement node labels with LOD (level of detail), positioning, and styling options.

---

## Task 6.1: Label Renderer Infrastructure

### Overview
Create the label rendering system with BitmapText for performance.

### Dependencies
- Phase 5 complete

### Acceptance Criteria
- [ ] Labels render with node positions
- [ ] BitmapFont for performance
- [ ] Regular Text fallback for quality
- [ ] LOD: hide labels at low zoom

### Implementation Steps

**Note:** LabelRenderer works with `GraphModel` interface, NOT graphology directly.

```typescript
// packages/core/src/labels/LabelRenderer.ts
import { Container, Text, BitmapText, BitmapFont, TextStyle } from 'pixi.js';
import type { GraphModel } from '../model/GraphModel';  // Uses GraphModel, NOT Graph
import type { Viewport } from '../renderer/Viewport';

export interface LabelConfig {
  visible?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  padding?: number;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: number;
  useBitmapText?: boolean;  // For performance at scale
}

export interface LabelLODConfig {
  minZoomToShow?: number;     // Hide labels below this zoom
  minZoomForDetail?: number;  // Switch to detailed text above this
}

const DEFAULT_LABEL_CONFIG: Required<LabelConfig> = {
  visible: true,
  fontSize: 12,
  fontFamily: 'Arial',
  color: '#333333',
  backgroundColor: '',
  padding: 4,
  position: 'bottom',
  maxWidth: 100,
  useBitmapText: true,
};

export class LabelRenderer {
  private container: Container;
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  private viewport: Viewport;
  private config: Required<LabelConfig>;
  private lodConfig: LabelLODConfig;
  
  private labels: Map<string, Container> = new Map();
  private bitmapFontReady = false;
  
  constructor(
    container: Container,
    model: GraphModel,
    viewport: Viewport,
    config?: LabelConfig,
    lodConfig?: LabelLODConfig
  ) {
    this.container = container;
    this.model = model;
    this.viewport = viewport;
    this.config = { ...DEFAULT_LABEL_CONFIG, ...config };
    this.lodConfig = {
      minZoomToShow: lodConfig?.minZoomToShow ?? 0.3,
      minZoomForDetail: lodConfig?.minZoomForDetail ?? 1.0,
    };
    
    this.initBitmapFont();
  }
  
  private async initBitmapFont(): Promise<void> {
    // Create bitmap font from style
    BitmapFont.install({
      name: 'GraphonLabel',
      style: {
        fontFamily: this.config.fontFamily,
        fontSize: this.config.fontSize,
        fill: this.config.color,
      },
    });
    this.bitmapFontReady = true;
  }
  
  /**
   * Render label for a node
   * Uses GraphModel.getNode() instead of graphology
   */
  renderLabel(nodeId: string): void {
    if (!this.config.visible) return;
    
    // Use GraphModel instead of graphology
    const node = this.model.getNode(nodeId);
    if (!node) return;
    
    const labelText = (node.data?.label as string) ?? '';
    
    if (!labelText) {
      this.removeLabel(nodeId);
      return;
    }
    
    let labelContainer = this.labels.get(nodeId);
    
    if (!labelContainer) {
      labelContainer = this.createLabel(labelText);
      this.labels.set(nodeId, labelContainer);
      this.container.addChild(labelContainer);
    } else {
      // Update text if changed
      this.updateLabelText(labelContainer, labelText);
    }
    
    // Position relative to node - use GraphModel properties
    const nodeX = node.x;
    const nodeY = node.y;
    const nodeSize = (node.data?.size as number) ?? 10;
    
    const position = this.calculateLabelPosition(nodeSize);
    labelContainer.position.set(nodeX + position.x, nodeY + position.y);
  }
  
  /**
   * Update visibility based on zoom level
   */
  updateLOD(zoom: number): void {
    const visible = zoom >= (this.lodConfig.minZoomToShow ?? 0);
    
    for (const label of this.labels.values()) {
      label.visible = visible;
    }
    
    // If we want to switch between BitmapText and Text based on zoom:
    // const useDetail = zoom >= (this.lodConfig.minZoomForDetail ?? 1);
    // This would require recreating labels, which is expensive
    // So for now, just show/hide
  }
  
  /**
   * Set visible nodes (for culling)
   */
  setVisibleNodes(nodeIds: Set<string>): void {
    // Hide labels for non-visible nodes
    for (const [nodeId, label] of this.labels) {
      label.visible = nodeIds.has(nodeId);
    }
    
    // Render labels for newly visible nodes
    for (const nodeId of nodeIds) {
      if (!this.labels.has(nodeId)) {
        this.renderLabel(nodeId);
      }
    }
  }
  
  private createLabel(text: string): Container {
    const container = new Container();
    
    // Create text (BitmapText or regular Text)
    let textObj: Text | BitmapText;
    
    if (this.config.useBitmapText && this.bitmapFontReady) {
      textObj = new BitmapText({
        text,
        style: {
          fontFamily: 'GraphonLabel',
          fontSize: this.config.fontSize,
        },
      });
    } else {
      textObj = new Text({
        text,
        style: new TextStyle({
          fontSize: this.config.fontSize,
          fontFamily: this.config.fontFamily,
          fill: this.config.color,
        }),
      });
    }
    
    textObj.anchor.set(0.5);
    
    // Optional background
    if (this.config.backgroundColor) {
      const bg = this.createBackground(textObj.width, textObj.height);
      container.addChild(bg);
    }
    
    container.addChild(textObj);
    
    return container;
  }
  
  private updateLabelText(container: Container, text: string): void {
    const textObj = container.children[container.children.length - 1] as Text | BitmapText;
    if (textObj) {
      textObj.text = text;
    }
  }
  
  private createBackground(width: number, height: number): import('pixi.js').Graphics {
    const { Graphics } = require('pixi.js');
    const padding = this.config.padding;
    const bg = new Graphics();
    bg.roundRect(
      -width / 2 - padding,
      -height / 2 - padding,
      width + padding * 2,
      height + padding * 2,
      4
    );
    bg.fill({ color: parseInt(this.config.backgroundColor.slice(1), 16) });
    return bg;
  }
  
  private calculateLabelPosition(nodeSize: number): { x: number; y: number } {
    const offset = nodeSize + this.config.fontSize / 2 + 4;
    
    switch (this.config.position) {
      case 'top':
        return { x: 0, y: -offset };
      case 'bottom':
        return { x: 0, y: offset };
      case 'left':
        return { x: -offset, y: 0 };
      case 'right':
        return { x: offset, y: 0 };
      case 'center':
      default:
        return { x: 0, y: 0 };
    }
  }
  
  private removeLabel(nodeId: string): void {
    const label = this.labels.get(nodeId);
    if (label) {
      this.container.removeChild(label);
      label.destroy({ children: true });
      this.labels.delete(nodeId);
    }
  }
  
  /**
   * Update all labels
   * Uses GraphModel iterator instead of graphology
   */
  render(): void {
    for (const node of this.model.nodes()) {
      this.renderLabel(node.id);
    }
  }
  
  destroy(): void {
    for (const label of this.labels.values()) {
      label.destroy({ children: true });
    }
    this.labels.clear();
  }
}
```

### Files to Create
- `packages/core/src/labels/LabelRenderer.ts`
- `packages/core/src/labels/index.ts`
- `packages/core/src/labels/__tests__/LabelRenderer.test.ts`

### Tests Required
- Unit: Label creation
- Unit: Position calculation
- Unit: LOD visibility

### Demo Addition
None yet (Task 6.3)

---

## Task 6.2: Label Configuration & Styling

### Overview
Add label styling configuration to node/edge styles.

### Dependencies
- Task 6.1

### Acceptance Criteria
- [ ] Labels configurable per-node
- [ ] Data-driven label text
- [ ] Label styling (font, color, background)

### Implementation Steps

Update types:
```typescript
// packages/core/src/types/styles.ts (add)
export interface NodeLabelConfig {
  text?: StyleValue<string>;  // Defaults to node's label attribute
  visible?: StyleValue<boolean>;
  fontSize?: StyleValue<number>;
  color?: StyleValue<string>;
  backgroundColor?: StyleValue<string>;
  position?: StyleValue<'center' | 'top' | 'bottom' | 'left' | 'right'>;
}

export interface NodeStyleConfig {
  // ... existing properties
  label?: NodeLabelConfig | false;
}
```

Integrate into Graphon config and wire up to LabelRenderer.

### Files to Modify
- `packages/core/src/types/styles.ts`
- `packages/core/src/labels/LabelRenderer.ts`

### Tests Required
- Unit: Custom label text
- Unit: Label disabled
- Integration: Data-driven labels

---

## Task 6.3: Demo - Labels

### Overview
Demo showing label configuration options.

### Dependencies
- Task 6.2

### Acceptance Criteria
- [ ] Toggle labels on/off
- [ ] Position selector
- [ ] Font size slider
- [ ] Color picker
- [ ] Zoom to see LOD

### Implementation

**Note:** Demo uses `GraphonProvider` + `useGraph()` pattern. NO graphology imports!

```tsx
// apps/demo/src/demos/Labels.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { GraphonProvider, Graphon, useGraph, type NodeStyleConfig } from '@graphon/react';  // NO graphology import!

const NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];

// Hook to generate demo graph using useGraph()
function useGenerateGraph() {
  const { addNode, addEdge, batch } = useGraph();
  
  useEffect(() => {
    const addedEdges = new Set<string>();
    
    batch(() => {
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        const radius = 150 + Math.random() * 50;
        addNode(`node-${i}`, 
          Math.cos(angle) * radius, 
          Math.sin(angle) * radius, 
          {
            label: NAMES[i % NAMES.length] + ` ${i}`,
            importance: Math.random(),
          }
        );
      }
      
      for (let i = 0; i < 40; i++) {
        const source = `node-${Math.floor(Math.random() * 30)}`;
        const target = `node-${Math.floor(Math.random() * 30)}`;
        const edgeKey = `${source}-${target}`;
        if (source !== target && !addedEdges.has(edgeKey)) {
          addEdge(source, target);
          addedEdges.add(edgeKey);
        }
      }
    });
  }, [addNode, addEdge, batch]);
}

type LabelPosition = 'center' | 'top' | 'bottom' | 'left' | 'right';

export function Labels() {
  return (
    <GraphonProvider>
      <LabelsContent />
    </GraphonProvider>
  );
}

function LabelsContent() {
  useGenerateGraph();
  
  const [showLabels, setShowLabels] = useState(true);
  const [position, setPosition] = useState<LabelPosition>('bottom');
  const [fontSize, setFontSize] = useState(12);
  const [labelColor, setLabelColor] = useState('#333333');
  const [backgroundColor, setBackgroundColor] = useState('');
  const [useDataDriven, setUseDataDriven] = useState(false);
  
  const nodeStyle: NodeStyleConfig = useMemo(() => ({
    size: 12,
    color: '#6366f1',
    label: showLabels ? {
      visible: true,
      position,
      fontSize,
      color: labelColor,
      backgroundColor: backgroundColor || undefined,
      text: useDataDriven
        ? (node) => `${node.attributes.label} (${((node.attributes.importance as number) * 100).toFixed(0)}%)`
        : undefined,
    } : false,
  }), [showLabels, position, fontSize, labelColor, backgroundColor, useDataDriven]);
  
  return (
    <div className="demo-page">
      <header className="demo-header">
        <h1>Labels</h1>
        <p>Node labels with LOD (zoom out to see labels disappear).</p>
      </header>
      
      <div className="demo-controls">
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
            />
            Show Labels
          </label>
        </div>
        
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={useDataDriven}
              onChange={(e) => setUseDataDriven(e.target.checked)}
            />
            Data-Driven Text
          </label>
        </div>
        
        {showLabels && (
          <>
            <div className="control-group">
              <label>Position:</label>
              <select value={position} onChange={(e) => setPosition(e.target.value as LabelPosition)}>
                <option value="center">Center</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
            
            <div className="control-group">
              <label>Font Size: {fontSize}</label>
              <input
                type="range"
                min="8"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              />
            </div>
            
            <div className="control-group">
              <label>Color:</label>
              <input
                type="color"
                value={labelColor}
                onChange={(e) => setLabelColor(e.target.value)}
              />
            </div>
            
            <div className="control-group">
              <label>Background:</label>
              <input
                type="color"
                value={backgroundColor || '#ffffff'}
                onChange={(e) => setBackgroundColor(e.target.value)}
              />
              <button onClick={() => setBackgroundColor('')}>Clear</button>
            </div>
          </>
        )}
        
        <button onClick={() => fitToView()}>Fit to View</button>
      </div>
      
      <div className="demo-info">
        <p><strong>LOD:</strong> Zoom out to see labels automatically hide at low zoom levels.</p>
      </div>
      
      <div className="demo-canvas">
        <Graphon
          ref={ref}
          graph={graph}
          nodeStyle={nodeStyle}
          onReady={() => fitToView(false)}
        />
      </div>
    </div>
  );
}
```

### Files to Create
- `apps/demo/src/demos/Labels.tsx`

### Tests Required
- Visual: Labels visible
- Visual: Labels hidden at low zoom
- Visual: Different positions

---

## Phase 6 Checklist

- [ ] Labels render at node positions
- [ ] BitmapText for performance
- [ ] LOD hides labels at low zoom
- [ ] Label styling configurable
- [ ] Demo shows all options
- [ ] All tests pass

**Estimated time:** 1 day
