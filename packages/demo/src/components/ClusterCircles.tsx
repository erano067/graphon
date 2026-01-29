import { useRef } from 'react';
import { getCommunityColor } from '../styleConfig';

interface ClusterPosition {
  x: number;
  y: number;
  radius: number;
}

interface ClusterCirclesProps {
  expandedClusters: Set<number>;
  clusterPositions: Map<number, ClusterPosition>;
  viewport: { scale: number; x: number; y: number };
  onCircleDoubleClick: (community: number) => void;
}

const DOUBLE_CLICK_THRESHOLD_MS = 300;

interface ClickState {
  community: number;
  time: number;
}

export function ClusterCircles({
  expandedClusters,
  clusterPositions,
  viewport,
  onCircleDoubleClick,
}: ClusterCirclesProps): React.ReactElement | null {
  const lastClickRef = useRef<ClickState | null>(null);

  if (expandedClusters.size === 0) return null;

  const handleCircleClick = (community: number): void => {
    const now = Date.now();
    const last = lastClickRef.current;

    if (last?.community === community && now - last.time < DOUBLE_CLICK_THRESHOLD_MS) {
      lastClickRef.current = null;
      onCircleDoubleClick(community);
      return;
    }

    lastClickRef.current = { community, time: now };
  };

  const circles = Array.from(expandedClusters).map((community) => {
    const pos = clusterPositions.get(community);
    if (!pos) return null;

    const screenX = 400 + pos.x * viewport.scale;
    const screenY = 300 + pos.y * viewport.scale;
    const screenRadius = pos.radius * viewport.scale;

    const hexColor = getCommunityColor(community);

    return (
      <g key={community}>
        <circle
          cx={screenX}
          cy={screenY}
          r={screenRadius}
          fill="none"
          stroke={hexColor}
          strokeWidth={3}
          strokeDasharray="10,5"
          opacity={0.7}
          style={{ cursor: 'pointer' }}
          onClick={() => handleCircleClick(community)}
        />
        <CircleLabel
          x={screenX}
          y={screenY - screenRadius - 10}
          community={community}
          hexColor={hexColor}
          onClick={() => handleCircleClick(community)}
        />
      </g>
    );
  });

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 800,
        height: 600,
        pointerEvents: 'none',
      }}
    >
      <g style={{ pointerEvents: 'auto' }}>{circles}</g>
    </svg>
  );
}

function CircleLabel({
  x,
  y,
  community,
  hexColor,
  onClick,
}: {
  x: number;
  y: number;
  community: number;
  hexColor: string;
  onClick: () => void;
}): React.ReactElement {
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect x={x - 60} y={y - 12} width={120} height={24} rx={4} fill={hexColor} opacity={0.9} />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fill="white"
        fontSize={12}
        fontWeight="bold"
        style={{ pointerEvents: 'none' }}
      >
        Community {community} (dbl-click)
      </text>
    </g>
  );
}
