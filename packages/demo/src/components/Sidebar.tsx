import type { Node } from '@graphon/react';
import type { NodeData } from '../generator';

interface SidebarProps {
  nodes: Node<NodeData>[];
  edges: { id: string }[];
  avgDegree: string | number;
  communityCount: number;
  hoveredNode: Node<NodeData> | undefined;
  selectedNode: Node<NodeData> | undefined;
  getCommunityColor: (community: number) => string;
}

export function Sidebar({
  nodes,
  edges,
  avgDegree,
  communityCount,
  hoveredNode,
  selectedNode,
  getCommunityColor,
}: SidebarProps) {
  return (
    <div style={{ width: 250 }}>
      <h3>Network Stats</h3>
      <p>Nodes: {nodes.length}</p>
      <p>Edges: {edges.length}</p>
      <p>Avg degree: {avgDegree}</p>
      <p>Communities: {communityCount}</p>

      <Legend communityCount={communityCount} getCommunityColor={getCommunityColor} />

      <p style={{ fontSize: 12, color: '#666', marginTop: 16 }}>
        Drag nodes to see spring physics!
      </p>

      {hoveredNode && (
        <NodeCard title="Hovered" node={hoveredNode} getCommunityColor={getCommunityColor} />
      )}
      {selectedNode && (
        <NodeCard
          title="Selected"
          node={selectedNode}
          getCommunityColor={getCommunityColor}
          showId
        />
      )}
    </div>
  );
}

interface LegendProps {
  communityCount: number;
  getCommunityColor: (community: number) => string;
}

function Legend({ communityCount, getCommunityColor }: LegendProps) {
  return (
    <div style={{ marginTop: 16 }}>
      <strong>Legend:</strong>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {Array.from({ length: communityCount }, (_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: getCommunityColor(i),
              }}
            />
            <span style={{ fontSize: 12 }}>C{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface NodeCardProps {
  title: string;
  node: Node<NodeData>;
  getCommunityColor: (community: number) => string;
  showId?: boolean;
}

function NodeCard({ title, node, getCommunityColor, showId }: NodeCardProps) {
  const color = getCommunityColor(node.data.community);
  return (
    <div
      style={{
        marginTop: 16,
        padding: 12,
        background: `${color}20`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 4,
      }}
    >
      <strong>{title}:</strong>
      <br />
      {node.data.label}
      <br />
      {showId && (
        <>
          <small>ID: {node.id}</small>
          <br />
        </>
      )}
      <small>Community {node.data.community + 1}</small>
    </div>
  );
}
