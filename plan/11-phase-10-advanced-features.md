# Phase 10: Advanced Features

## Overview

Implement advanced features: context menu, export, mini-map, search/filter, and undo/redo.

---

## Task 10.1: Context Menu

### Overview
Right-click context menu for nodes, edges, and canvas.

### Dependencies
- Phase 9 complete

### Acceptance Criteria
- [ ] Context menu on right-click
- [ ] Different menus for node/edge/canvas
- [ ] Keyboard shortcut support
- [ ] Customizable menu items

### Implementation Steps

```typescript
// packages/core/src/features/contextmenu/types.ts
export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
  children?: MenuItem[];
  action?: () => void;
}

export interface ContextMenuEvent {
  type: 'node' | 'edge' | 'canvas';
  position: { x: number; y: number };
  screenPosition: { x: number; y: number };
  nodeId?: string;
  edgeId?: string;
}

export type ContextMenuCallback = (
  event: ContextMenuEvent
) => MenuItem[] | null;
```

```typescript
// packages/core/src/features/contextmenu/ContextMenuManager.ts
import type { MenuItem, ContextMenuEvent, ContextMenuCallback } from './types';

export interface ContextMenuConfig {
  enabled: boolean;
  onContextMenu: ContextMenuCallback;
}

export class ContextMenuManager {
  private config: ContextMenuConfig;
  private menuElement: HTMLDivElement | null = null;
  private activeEvent: ContextMenuEvent | null = null;
  
  constructor(config: Partial<ContextMenuConfig>) {
    this.config = {
      enabled: config.enabled ?? true,
      onContextMenu: config.onContextMenu ?? (() => null),
    };
  }
  
  /**
   * Show context menu at position
   */
  show(event: ContextMenuEvent): void {
    if (!this.config.enabled) return;
    
    const items = this.config.onContextMenu(event);
    if (!items || items.length === 0) return;
    
    this.activeEvent = event;
    this.renderMenu(items, event.screenPosition);
  }
  
  /**
   * Hide context menu
   */
  hide(): void {
    if (this.menuElement) {
      this.menuElement.remove();
      this.menuElement = null;
    }
    this.activeEvent = null;
  }
  
  private renderMenu(items: MenuItem[], position: { x: number; y: number }): void {
    this.hide();
    
    const menu = document.createElement('div');
    menu.className = 'graphon-context-menu';
    menu.style.cssText = `
      position: fixed;
      left: ${position.x}px;
      top: ${position.y}px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      min-width: 160px;
      padding: 4px 0;
      z-index: 10000;
      font-family: system-ui, sans-serif;
      font-size: 13px;
    `;
    
    for (const item of items) {
      if (item.separator) {
        const sep = document.createElement('div');
        sep.style.cssText = 'height: 1px; background: #e5e7eb; margin: 4px 8px;';
        menu.appendChild(sep);
        continue;
      }
      
      const menuItem = document.createElement('div');
      menuItem.className = 'graphon-menu-item';
      menuItem.style.cssText = `
        padding: 8px 12px;
        cursor: ${item.disabled ? 'not-allowed' : 'pointer'};
        opacity: ${item.disabled ? '0.5' : '1'};
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;
      
      const label = document.createElement('span');
      label.textContent = item.label;
      menuItem.appendChild(label);
      
      if (item.shortcut) {
        const shortcut = document.createElement('span');
        shortcut.textContent = item.shortcut;
        shortcut.style.cssText = 'color: #9ca3af; font-size: 11px; margin-left: 16px;';
        menuItem.appendChild(shortcut);
      }
      
      if (!item.disabled && item.action) {
        menuItem.addEventListener('click', () => {
          item.action!();
          this.hide();
        });
        
        menuItem.addEventListener('mouseenter', () => {
          menuItem.style.background = '#f3f4f6';
        });
        menuItem.addEventListener('mouseleave', () => {
          menuItem.style.background = 'transparent';
        });
      }
      
      menu.appendChild(menuItem);
    }
    
    document.body.appendChild(menu);
    this.menuElement = menu;
    
    // Close on click outside
    const closeHandler = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        this.hide();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);
    
    // Close on escape
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.hide();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    
    // Adjust position if off-screen
    requestAnimationFrame(() => {
      const rect = menu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        menu.style.left = `${window.innerWidth - rect.width - 8}px`;
      }
      if (rect.bottom > window.innerHeight) {
        menu.style.top = `${window.innerHeight - rect.height - 8}px`;
      }
    });
  }
  
  destroy(): void {
    this.hide();
  }
}
```

```tsx
// packages/react/src/useContextMenu.ts
import { useCallback, useMemo } from 'react';
import type { MenuItem, ContextMenuEvent } from '@graphon/core';

export interface UseContextMenuProps {
  onNodeContextMenu?: (nodeId: string, event: ContextMenuEvent) => MenuItem[] | null;
  onEdgeContextMenu?: (edgeId: string, event: ContextMenuEvent) => MenuItem[] | null;
  onCanvasContextMenu?: (event: ContextMenuEvent) => MenuItem[] | null;
}

export function useContextMenu(props: UseContextMenuProps) {
  const handleContextMenu = useCallback((event: ContextMenuEvent): MenuItem[] | null => {
    switch (event.type) {
      case 'node':
        return props.onNodeContextMenu?.(event.nodeId!, event) ?? null;
      case 'edge':
        return props.onEdgeContextMenu?.(event.edgeId!, event) ?? null;
      case 'canvas':
        return props.onCanvasContextMenu?.(event) ?? null;
      default:
        return null;
    }
  }, [props.onNodeContextMenu, props.onEdgeContextMenu, props.onCanvasContextMenu]);
  
  return useMemo(() => ({ handleContextMenu }), [handleContextMenu]);
}
```

### Files to Create
- `packages/core/src/features/contextmenu/types.ts`
- `packages/core/src/features/contextmenu/ContextMenuManager.ts`
- `packages/react/src/useContextMenu.ts`

### Tests Required
- Unit: Menu shows at correct position
- Unit: Items are clickable
- Unit: Menu closes on click outside

### Demo Addition

```tsx
// apps/demo/src/demos/ContextMenu.tsx
export function ContextMenu() {
  const handleNodeContextMenu = useCallback((nodeId: string) => {
    return [
      { id: 'edit', label: 'Edit Node', shortcut: 'E' },
      { id: 'delete', label: 'Delete', shortcut: '⌫', action: () => graph.dropNode(nodeId) },
      { id: 'sep', separator: true },
      { id: 'expand', label: 'Expand Neighbors' },
      { id: 'hide', label: 'Hide Node' },
    ];
  }, [graph]);
  
  // ...
}
```

---

## Task 10.2: Export

### Overview
Export graph as PNG, SVG, or JSON.

### Dependencies
- Task 10.1

### Acceptance Criteria
- [ ] Export to PNG with configurable resolution
- [ ] Export to SVG
- [ ] Export graph data as JSON
- [ ] Export visible viewport or full graph

### Implementation Steps

**Note:** ExportManager works with `GraphModel` interface, NOT graphology directly.

```typescript
// packages/core/src/features/export/ExportManager.ts
import * as PIXI from 'pixi.js';
import type { GraphModel } from '../../model/GraphModel';  // Uses GraphModel, NOT Graph

export interface ExportPNGOptions {
  scale?: number;
  background?: string;
  padding?: number;
  viewportOnly?: boolean;
}

export interface ExportSVGOptions {
  background?: string;
  padding?: number;
  viewportOnly?: boolean;
}

export class ExportManager {
  private app: PIXI.Application;
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  
  constructor(app: PIXI.Application, model: GraphModel) {
    this.app = app;
    this.model = model;
  }
  
  /**
   * Export to PNG
   */
  async toPNG(options?: ExportPNGOptions): Promise<Blob> {
    const scale = options?.scale ?? 2;
    const padding = options?.padding ?? 20;
    
    // Create temporary renderer
    const bounds = this.getGraphBounds();
    const width = (bounds.width + padding * 2) * scale;
    const height = (bounds.height + padding * 2) * scale;
    
    // Use PixiJS extract
    const renderer = this.app.renderer;
    const extract = renderer.extract;
    
    // Get canvas from stage
    const canvas = extract.canvas(this.app.stage) as HTMLCanvasElement;
    
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, 'image/png');
    });
  }
  
  /**
   * Download PNG
   */
  async downloadPNG(filename: string = 'graph.png', options?: ExportPNGOptions): Promise<void> {
    const blob = await this.toPNG(options);
    this.downloadBlob(blob, filename);
  }
  
  /**
   * Export to SVG
   */
  toSVG(options?: ExportSVGOptions): string {
    const padding = options?.padding ?? 20;
    const bounds = this.getGraphBounds();
    
    const width = bounds.width + padding * 2;
    const height = bounds.height + padding * 2;
    const offsetX = -bounds.minX + padding;
    const offsetY = -bounds.minY + padding;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    
    if (options?.background) {
      svg += `<rect width="100%" height="100%" fill="${options.background}"/>`;
    }
    
    // Draw edges using GraphModel iterator
    svg += '<g class="edges">';
    for (const edge of this.model.edges()) {
      const sourceNode = this.model.getNode(edge.source);
      const targetNode = this.model.getNode(edge.target);
      
      if (!sourceNode || !targetNode) continue;
      
      const x1 = sourceNode.x + offsetX;
      const y1 = sourceNode.y + offsetY;
      const x2 = targetNode.x + offsetX;
      const y2 = targetNode.y + offsetY;
      
      const color = (edge.data?.color as string) ?? '#94a3b8';
      const width = (edge.data?.width as number) ?? 1;
      
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
    }
    svg += '</g>';
    
    // Draw nodes using GraphModel iterator
    svg += '<g class="nodes">';
    for (const node of this.model.nodes()) {
      const x = node.x + offsetX;
      const y = node.y + offsetY;
      const size = (node.data?.size as number) ?? 10;
      const color = (node.data?.color as string) ?? '#6366f1';
      const label = node.data?.label as string | undefined;
      
      svg += `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}"/>`;
      
      if (label) {
        svg += `<text x="${x}" y="${y + size + 12}" text-anchor="middle" font-size="12" font-family="sans-serif">${label}</text>`;
      }
    }
    svg += '</g>';
    
    svg += '</svg>';
    return svg;
  }
  
  /**
   * Download SVG
   */
  downloadSVG(filename: string = 'graph.svg', options?: ExportSVGOptions): void {
    const svg = this.toSVG(options);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    this.downloadBlob(blob, filename);
  }
  
  /**
   * Export graph data as JSON
   * Uses GraphModel iterator instead of graphology
   */
  toJSON(): string {
    const data = {
      nodes: [] as Array<{ id: string; x: number; y: number; data: Record<string, unknown> }>,
      edges: [] as Array<{ id: string; source: string; target: string; data: Record<string, unknown> }>,
    };
    
    // Use GraphModel iterators
    for (const node of this.model.nodes()) {
      data.nodes.push({ id: node.id, x: node.x, y: node.y, data: { ...node.data } });
    }
    
    for (const edge of this.model.edges()) {
      data.edges.push({ id: edge.id, source: edge.source, target: edge.target, data: { ...edge.data } });
    }
    
    return JSON.stringify(data, null, 2);
  }
  
  /**
   * Download JSON
   */
  downloadJSON(filename: string = 'graph.json'): void {
    const json = this.toJSON();
    const blob = new Blob([json], { type: 'application/json' });
    this.downloadBlob(blob, filename);
  }
  
  // Uses GraphModel iterator instead of graphology
  private getGraphBounds(): { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number } {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    for (const node of this.model.nodes()) {
      const size = (node.data?.size as number) ?? 10;
      
      minX = Math.min(minX, node.x - size);
      maxX = Math.max(maxX, node.x + size);
      minY = Math.min(minY, node.y - size);
      maxY = Math.max(maxY, node.y + size);
    }
    
    return {
      minX, maxX, minY, maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
  
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

### Files to Create
- `packages/core/src/features/export/ExportManager.ts`
- `packages/core/src/features/export/index.ts`

### Tests Required
- Unit: SVG output is valid
- Unit: JSON contains all graph data

### Demo Addition
Add export buttons to demo toolbar.

---

## Task 10.3: Mini-Map

### Overview
Thumbnail overview showing full graph and current viewport.

### Dependencies
- Task 10.2

### Acceptance Criteria
- [ ] Renders thumbnail of graph
- [ ] Shows viewport rectangle
- [ ] Click to navigate
- [ ] Drag viewport rectangle
- [ ] Configurable size and position

### Implementation Steps

**Note:** MiniMap works with `GraphModel` interface, NOT graphology directly.

```typescript
// packages/core/src/features/minimap/MiniMap.ts
import * as PIXI from 'pixi.js';
import type { GraphModel } from '../../model/GraphModel';  // Uses GraphModel, NOT Graph
import type { ViewportController } from '../../viewport/ViewportController';

export interface MiniMapConfig {
  width: number;
  height: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  margin: number;
  backgroundColor: number;
  viewportColor: number;
  nodeColor: number;
}

const DEFAULT_CONFIG: MiniMapConfig = {
  width: 150,
  height: 100,
  position: 'bottom-right',
  margin: 10,
  backgroundColor: 0xffffff,
  viewportColor: 0x6366f1,
  nodeColor: 0x94a3b8,
};

export class MiniMap {
  private container: PIXI.Container;
  private background: PIXI.Graphics;
  private nodesGraphics: PIXI.Graphics;
  private viewportRect: PIXI.Graphics;
  private config: MiniMapConfig;
  
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  private viewport: ViewportController;
  private graphBounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  
  private isDragging = false;
  
  constructor(
    parentContainer: PIXI.Container,
    model: GraphModel,
    viewport: ViewportController,
    canvasSize: { width: number; height: number },
    config?: Partial<MiniMapConfig>
  ) {
    this.model = model;
    this.viewport = viewport;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.container = new PIXI.Container();
    this.container.label = 'minimap';
    this.container.eventMode = 'static';
    
    // Position based on config
    this.updatePosition(canvasSize);
    
    // Background
    this.background = new PIXI.Graphics();
    this.drawBackground();
    this.container.addChild(this.background);
    
    // Nodes layer
    this.nodesGraphics = new PIXI.Graphics();
    this.container.addChild(this.nodesGraphics);
    
    // Viewport indicator
    this.viewportRect = new PIXI.Graphics();
    this.container.addChild(this.viewportRect);
    
    // Interaction
    this.setupInteraction();
    
    parentContainer.addChild(this.container);
  }
  
  /**
   * Update minimap (call on graph or viewport changes)
   */
  update(): void {
    this.updateGraphBounds();
    this.drawNodes();
    this.drawViewportRect();
  }
  
  /**
   * Update position when canvas resizes
   */
  updatePosition(canvasSize: { width: number; height: number }): void {
    const { width, height, margin, position } = this.config;
    
    switch (position) {
      case 'top-left':
        this.container.position.set(margin, margin);
        break;
      case 'top-right':
        this.container.position.set(canvasSize.width - width - margin, margin);
        break;
      case 'bottom-left':
        this.container.position.set(margin, canvasSize.height - height - margin);
        break;
      case 'bottom-right':
        this.container.position.set(
          canvasSize.width - width - margin,
          canvasSize.height - height - margin
        );
        break;
    }
  }
  
  private drawBackground(): void {
    this.background.clear();
    this.background
      .roundRect(0, 0, this.config.width, this.config.height, 4)
      .fill({ color: this.config.backgroundColor, alpha: 0.9 })
      .stroke({ color: 0xe5e7eb, width: 1 });
  }
  
  private drawNodes(): void {
    this.nodesGraphics.clear();
    
    const { minX, maxX, minY, maxY } = this.graphBounds;
    const graphWidth = maxX - minX || 1;
    const graphHeight = maxY - minY || 1;
    
    const scaleX = (this.config.width - 10) / graphWidth;
    const scaleY = (this.config.height - 10) / graphHeight;
    const scale = Math.min(scaleX, scaleY);
    
    const offsetX = 5 + (this.config.width - 10 - graphWidth * scale) / 2;
    const offsetY = 5 + (this.config.height - 10 - graphHeight * scale) / 2;
    
    // Use GraphModel iterator instead of graphology
    for (const node of this.model.nodes()) {
      const x = (node.x - minX) * scale + offsetX;
      const y = (node.y - minY) * scale + offsetY;
      
      this.nodesGraphics.circle(x, y, 2).fill({ color: this.config.nodeColor });
    }
  }
  
  private drawViewportRect(): void {
    this.viewportRect.clear();
    
    const { minX, maxX, minY, maxY } = this.graphBounds;
    const graphWidth = maxX - minX || 1;
    const graphHeight = maxY - minY || 1;
    
    const scaleX = (this.config.width - 10) / graphWidth;
    const scaleY = (this.config.height - 10) / graphHeight;
    const scale = Math.min(scaleX, scaleY);
    
    const offsetX = 5 + (this.config.width - 10 - graphWidth * scale) / 2;
    const offsetY = 5 + (this.config.height - 10 - graphHeight * scale) / 2;
    
    // Get viewport bounds in graph coordinates
    const vpBounds = this.viewport.getVisibleBounds();
    
    const rectX = (vpBounds.minX - minX) * scale + offsetX;
    const rectY = (vpBounds.minY - minY) * scale + offsetY;
    const rectW = (vpBounds.maxX - vpBounds.minX) * scale;
    const rectH = (vpBounds.maxY - vpBounds.minY) * scale;
    
    this.viewportRect
      .rect(rectX, rectY, rectW, rectH)
      .stroke({ color: this.config.viewportColor, width: 2, alpha: 0.8 })
      .fill({ color: this.config.viewportColor, alpha: 0.1 });
  }
  
  // Uses GraphModel iterator instead of graphology
  private updateGraphBounds(): void {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    for (const node of this.model.nodes()) {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    }
    
    // Add padding
    const padding = 50;
    this.graphBounds = {
      minX: minX - padding,
      maxX: maxX + padding,
      minY: minY - padding,
      maxY: maxY + padding,
    };
  }
  
  private setupInteraction(): void {
    this.container.on('pointerdown', this.onPointerDown.bind(this));
    this.container.on('pointermove', this.onPointerMove.bind(this));
    this.container.on('pointerup', this.onPointerUp.bind(this));
    this.container.on('pointerupoutside', this.onPointerUp.bind(this));
  }
  
  private onPointerDown(event: PIXI.FederatedPointerEvent): void {
    this.isDragging = true;
    this.navigateToPoint(event);
  }
  
  private onPointerMove(event: PIXI.FederatedPointerEvent): void {
    if (this.isDragging) {
      this.navigateToPoint(event);
    }
  }
  
  private onPointerUp(): void {
    this.isDragging = false;
  }
  
  private navigateToPoint(event: PIXI.FederatedPointerEvent): void {
    const local = this.container.toLocal(event.global);
    
    const { minX, maxX, minY, maxY } = this.graphBounds;
    const graphWidth = maxX - minX || 1;
    const graphHeight = maxY - minY || 1;
    
    const scaleX = (this.config.width - 10) / graphWidth;
    const scaleY = (this.config.height - 10) / graphHeight;
    const scale = Math.min(scaleX, scaleY);
    
    const offsetX = 5 + (this.config.width - 10 - graphWidth * scale) / 2;
    const offsetY = 5 + (this.config.height - 10 - graphHeight * scale) / 2;
    
    const graphX = (local.x - offsetX) / scale + minX;
    const graphY = (local.y - offsetY) / scale + minY;
    
    this.viewport.centerOn(graphX, graphY);
  }
  
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
```

### Files to Create
- `packages/core/src/features/minimap/MiniMap.ts`
- `packages/core/src/features/minimap/index.ts`

### Tests Required
- Unit: Click navigates correctly
- Visual: Viewport rect matches actual viewport

---

## Task 10.4: Search & Filter

### Overview
Search nodes by label/attributes and filter graph visibility.

### Dependencies
- Task 10.3

### Acceptance Criteria
- [ ] Search by label (fuzzy match)
- [ ] Search by attributes
- [ ] Highlight matching nodes
- [ ] Filter to show only matches
- [ ] Keyboard navigation through results

### Implementation Steps

**Note:** SearchManager works with `GraphModel` interface, NOT graphology directly.

```typescript
// packages/core/src/features/search/SearchManager.ts
import type { GraphModel } from '../../model/GraphModel';  // Uses GraphModel, NOT Graph

export interface SearchResult {
  nodeId: string;
  label: string;
  matchScore: number;
}

export interface SearchOptions {
  caseSensitive?: boolean;
  fuzzy?: boolean;
  attributes?: string[];
  limit?: number;
}

export class SearchManager {
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  
  constructor(model: GraphModel) {
    this.model = model;
  }
  
  /**
   * Search nodes by query
   */
  search(query: string, options?: SearchOptions): SearchResult[] {
    if (!query) return [];
    
    const caseSensitive = options?.caseSensitive ?? false;
    const fuzzy = options?.fuzzy ?? true;
    const attributes = options?.attributes ?? ['label', 'id'];
    const limit = options?.limit ?? 50;
    
    const normalizedQuery = caseSensitive ? query : query.toLowerCase();
    const results: SearchResult[] = [];
    
    // Use GraphModel iterator
    for (const node of this.model.nodes()) {
      let bestScore = 0;
      
      for (const attr of attributes) {
        const value = attr === 'id' ? node.id : (node.data?.[attr] as string);
        if (!value) continue;
        
        const normalizedValue = caseSensitive ? value : value.toLowerCase();
        const score = fuzzy
          ? this.fuzzyMatch(normalizedQuery, normalizedValue)
          : this.exactMatch(normalizedQuery, normalizedValue);
        
        bestScore = Math.max(bestScore, score);
      }
      
      if (bestScore > 0) {
        results.push({
          nodeId,
          label: (attrs.label as string) ?? nodeId,
          matchScore: bestScore,
        });
      }
    });
    
    // Sort by score descending
    results.sort((a, b) => b.matchScore - a.matchScore);
    
    return results.slice(0, limit);
  }
  
  /**
   * Filter graph to show only matching nodes
   */
  filter(query: string, options?: SearchOptions): Set<string> {
    const results = this.search(query, { ...options, limit: Infinity });
    return new Set(results.map((r) => r.nodeId));
  }
  
  private exactMatch(query: string, value: string): number {
    if (value.includes(query)) {
      return query.length / value.length;
    }
    return 0;
  }
  
  private fuzzyMatch(query: string, value: string): number {
    // Simple fuzzy match: check if all characters appear in order
    let queryIndex = 0;
    let consecutiveMatches = 0;
    let maxConsecutive = 0;
    let prevMatchIndex = -2;
    
    for (let i = 0; i < value.length && queryIndex < query.length; i++) {
      if (value[i] === query[queryIndex]) {
        if (i === prevMatchIndex + 1) {
          consecutiveMatches++;
          maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
        } else {
          consecutiveMatches = 1;
        }
        prevMatchIndex = i;
        queryIndex++;
      }
    }
    
    if (queryIndex !== query.length) return 0;
    
    // Score based on match quality
    const coverageScore = query.length / value.length;
    const consecutiveBonus = maxConsecutive / query.length;
    
    return coverageScore * 0.6 + consecutiveBonus * 0.4;
  }
}
```

**Note:** useSearch hook gets GraphModel from context - NO graphology in public API.

```tsx
// packages/react/src/useSearch.ts
import { useState, useCallback, useMemo } from 'react';
import { SearchManager, type SearchResult, type SearchOptions } from '@graphon/core';
import { useGraphonContext } from './GraphonProvider';

/**
 * Hook for search functionality.
 * Gets GraphModel from context - users never see graphology.
 */
export function useSearch(options?: SearchOptions) {
  const { model } = useGraphonContext();  // Get model from context
  const searchManager = useMemo(() => new SearchManager(model), [model]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const search = useCallback((q: string) => {
    setQuery(q);
    const newResults = searchManager.search(q, options);
    setResults(newResults);
    setSelectedIndex(0);
  }, [searchManager, options]);
  
  const selectNext = useCallback(() => {
    setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
  }, [results.length]);
  
  const selectPrev = useCallback(() => {
    setSelectedIndex((i) => Math.max(i - 1, 0));
  }, []);
  
  const selectedResult = results[selectedIndex] ?? null;
  
  return {
    query,
    setQuery: search,
    results,
    selectedIndex,
    selectedResult,
    selectNext,
    selectPrev,
  };
}
```

### Files to Create
- `packages/core/src/features/search/SearchManager.ts`
- `packages/react/src/useSearch.ts`

### Tests Required
- Unit: Exact match works
- Unit: Fuzzy match works
- Unit: Results sorted by score

---

## Task 10.5: Undo/Redo

### Overview
Command pattern for undoable graph operations.

### Dependencies
- Task 10.4

### Acceptance Criteria
- [ ] Undo/redo for node add/remove
- [ ] Undo/redo for edge add/remove
- [ ] Undo/redo for attribute changes
- [ ] Undo/redo for selections
- [ ] Keyboard shortcuts (⌘Z, ⌘⇧Z)

### Implementation Steps

```typescript
// packages/core/src/features/history/types.ts
export interface Command {
  execute(): void;
  undo(): void;
  description: string;
}

export interface HistoryConfig {
  maxSize: number;
  enableKeyboardShortcuts: boolean;
}
```

```typescript
// packages/core/src/features/history/HistoryManager.ts
import type { Command, HistoryConfig } from './types';

const DEFAULT_CONFIG: HistoryConfig = {
  maxSize: 100,
  enableKeyboardShortcuts: true,
};

export class HistoryManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private config: HistoryConfig;
  private listeners: Set<() => void> = new Set();
  
  constructor(config?: Partial<HistoryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.enableKeyboardShortcuts) {
      this.setupKeyboardShortcuts();
    }
  }
  
  /**
   * Execute a command and add to history
   */
  execute(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = [];  // Clear redo on new action
    
    // Trim history if too large
    while (this.undoStack.length > this.config.maxSize) {
      this.undoStack.shift();
    }
    
    this.notifyListeners();
  }
  
  /**
   * Undo last command
   */
  undo(): boolean {
    const command = this.undoStack.pop();
    if (!command) return false;
    
    command.undo();
    this.redoStack.push(command);
    this.notifyListeners();
    return true;
  }
  
  /**
   * Redo last undone command
   */
  redo(): boolean {
    const command = this.redoStack.pop();
    if (!command) return false;
    
    command.execute();
    this.undoStack.push(command);
    this.notifyListeners();
    return true;
  }
  
  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }
  
  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
  
  /**
   * Get undo stack descriptions
   */
  getUndoStack(): string[] {
    return this.undoStack.map((c) => c.description);
  }
  
  /**
   * Get redo stack descriptions
   */
  getRedoStack(): string[] {
    return this.redoStack.map((c) => c.description);
  }
  
  /**
   * Subscribe to history changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Clear all history
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.notifyListeners();
  }
  
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
  
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          this.redo();
        } else {
          this.undo();
        }
        e.preventDefault();
      }
    });
  }
  
  destroy(): void {
    this.listeners.clear();
  }
}
```

**Note:** Command implementations use `GraphModel` interface, NOT graphology directly.

```typescript
// packages/core/src/features/history/commands.ts
import type { GraphModel } from '../../model/GraphModel';  // Uses GraphModel, NOT Graph
import type { Command } from './types';

export class AddNodeCommand implements Command {
  constructor(
    private model: GraphModel,
    private nodeId: string,
    private x: number,
    private y: number,
    private data?: Record<string, unknown>
  ) {}
  
  description = `Add node ${this.nodeId}`;
  
  execute(): void {
    this.model.addNode(this.nodeId, this.x, this.y, this.data);
  }
  
  undo(): void {
    this.model.removeNode(this.nodeId);
  }
}

export class RemoveNodeCommand implements Command {
  private x: number;
  private y: number;
  private edges: Array<{ id: string; source: string; target: string; data?: Record<string, unknown> }> = [];
  
  constructor(
    private model: GraphModel,
    private nodeId: string,
    private data?: Record<string, unknown>
  ) {
    // Store node position and connected edges using GraphModel
    const node = this.model.getNode(nodeId);
    this.x = node?.x ?? 0;
    this.y = node?.y ?? 0;
    
    for (const edge of this.model.getNodeEdges(nodeId)) {
      this.edges.push({ id: edge.id, source: edge.source, target: edge.target, data: { ...edge.data } });
    }
  }
  
  description = `Remove node ${this.nodeId}`;
  
  execute(): void {
    this.model.removeNode(this.nodeId);
  }
  
  undo(): void {
    // Use GraphModel to restore node and edges
    this.model.addNode(this.nodeId, this.x, this.y, this.data);
    for (const edge of this.edges) {
      this.model.addEdge(edge.id, edge.source, edge.target, edge.data);
    }
  }
}

export class MoveNodeCommand implements Command {
  constructor(
    private model: GraphModel,
    private nodeId: string,
    private oldX: number,
    private oldY: number,
    private newX: number,
    private newY: number
  ) {}
  
  description = `Move node ${this.nodeId}`;
  
  execute(): void {
    // Use GraphModel.setNodePosition() instead of graphology
    this.model.setNodePosition(this.nodeId, this.newX, this.newY);
  }
  
  undo(): void {
    this.model.setNodePosition(this.nodeId, this.oldX, this.oldY);
  }
}

export class BatchCommand implements Command {
  constructor(
    private commands: Command[],
    public description: string
  ) {}
  
  execute(): void {
    for (const cmd of this.commands) {
      cmd.execute();
    }
  }
  
  undo(): void {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }
}
```

### Files to Create
- `packages/core/src/features/history/types.ts`
- `packages/core/src/features/history/HistoryManager.ts`
- `packages/core/src/features/history/commands.ts`
- `packages/core/src/features/history/index.ts`

### Tests Required
- Unit: Undo reverts command
- Unit: Redo re-applies command
- Unit: History size limit enforced
- Unit: Batch commands work

---

## Task 10.6: Advanced Features Demo

### Overview
Demo page showcasing all advanced features.

### Dependencies
- Task 10.5

### Acceptance Criteria
- [ ] Demo shows context menu
- [ ] Demo shows export options
- [ ] Demo shows mini-map
- [ ] Demo shows search
- [ ] Demo shows undo/redo

### Implementation Steps

**Note:** Demo uses `GraphonProvider` + hooks pattern. NO graphology imports!

```tsx
// apps/demo/src/demos/AdvancedFeatures.tsx
import React, { useCallback } from 'react';
import { 
  GraphonProvider, 
  Graphon, 
  useSearch, 
  useExport, 
  useHistory 
} from '@graphon/react';  // NO graphology import!
import type { MenuItem } from '@graphon/core';

export function AdvancedFeatures() {
  return (
    <GraphonProvider>
      <AdvancedFeaturesContent />
    </GraphonProvider>
  );
}

function AdvancedFeaturesContent() {
  // Hooks get model from context - no graph prop needed
  const { query, setQuery, results, selectedResult } = useSearch();
  
  const handleNodeContextMenu = useCallback((nodeId: string): MenuItem[] => {
    return [
      { id: 'info', label: `Node: ${nodeId}` },
      { id: 'sep1', separator: true },
      { id: 'delete', label: 'Delete Node', shortcut: '⌫' },
      { id: 'hide', label: 'Hide Node', shortcut: 'H' },
      { id: 'sep2', separator: true },
      { id: 'expand', label: 'Expand Neighbors' },
      { id: 'focus', label: 'Focus on Node', shortcut: 'F' },
    ];
  }, []);
  
  const handleExport = useCallback((format: 'png' | 'svg' | 'json') => {
    const exporter = graphonRef.current?.getExporter();
    if (!exporter) return;
    
    switch (format) {
      case 'png':
        exporter.downloadPNG('graph.png', { scale: 2 });
        break;
      case 'svg':
        exporter.downloadSVG('graph.svg');
        break;
      case 'json':
        exporter.downloadJSON('graph.json');
        break;
    }
  }, []);
  
  // Focus on selected search result
  React.useEffect(() => {
    if (selectedResult && graphonRef.current) {
      graphonRef.current.focusOnNode(selectedResult.nodeId);
    }
  }, [selectedResult]);
  
  return (
    <div className="demo-page">
      <header className="demo-header">
        <h1>Advanced Features</h1>
        <p>Context menu, export, mini-map, search, and undo/redo.</p>
      </header>
      
      <div className="demo-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search nodes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {results.length > 0 && (
            <div className="search-results">
              {results.slice(0, 5).map((r) => (
                <div key={r.nodeId} className="search-result">
                  {r.label}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="export-buttons">
          <button onClick={() => handleExport('png')}>Export PNG</button>
          <button onClick={() => handleExport('svg')}>Export SVG</button>
          <button onClick={() => handleExport('json')}>Export JSON</button>
        </div>
        
        <div className="history-buttons">
          <button onClick={() => graphonRef.current?.undo()}>Undo</button>
          <button onClick={() => graphonRef.current?.redo()}>Redo</button>
        </div>
      </div>
      
      <div className="demo-canvas">
        <Graphon
          ref={graphonRef}
          graph={graph}
          miniMap={{ enabled: true, position: 'bottom-right' }}
          onNodeContextMenu={handleNodeContextMenu}
          onReady={() => graphonRef.current?.fitToView()}
        />
      </div>
      
      <div className="demo-tips">
        <p><strong>Right-click</strong> on nodes for context menu</p>
        <p><strong>⌘Z</strong> to undo, <strong>⌘⇧Z</strong> to redo</p>
        <p><strong>Mini-map</strong> shows overview, click to navigate</p>
      </div>
    </div>
  );
}

/**
 * Hook to initialize sample graph data using GraphModel
 * NO graphology imports!
 */
function useSampleGraph() {
  const { addNode, addEdge, clear } = useGraph();
  
  const initialize = useCallback(() => {
    clear();
    
    // Create labeled nodes for search demo
    const labels = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
    
    labels.forEach((label, i) => {
      const angle = (i / labels.length) * Math.PI * 2;
      addNode(`n${i}`, Math.cos(angle) * 200, Math.sin(angle) * 200, { label });
      
      if (i > 0) {
        addEdge(`e${i}`, `n${i - 1}`, `n${i}`);
      }
    });
    addEdge(`e-close`, `n${labels.length - 1}`, 'n0');
  }, [addNode, addEdge, clear]);
  
  return { initialize };
}
```

### Files to Create
- `apps/demo/src/demos/AdvancedFeatures.tsx`

### Tests Required
- E2E: Context menu appears
- E2E: Export downloads file
- E2E: Search finds nodes

---

## Phase 10 Checklist

- [ ] Context menu works
- [ ] Export PNG/SVG/JSON works
- [ ] Mini-map navigation works
- [ ] Search finds nodes
- [ ] Undo/redo works
- [ ] Keyboard shortcuts work
- [ ] Demo showcases all features
- [ ] All tests pass

**Estimated time:** 4-5 days
