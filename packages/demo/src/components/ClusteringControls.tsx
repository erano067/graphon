interface ClusteringControlsProps {
  isClusteringEnabled: boolean;
  currentZoom: number;
  communityCount: number;
  onToggle: (checked: boolean) => void;
}

export function ClusteringControls({
  isClusteringEnabled,
  currentZoom,
  communityCount,
  onToggle,
}: ClusteringControlsProps): React.ReactElement {
  return (
    <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="checkbox"
          checked={isClusteringEnabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        Enable Clustering
      </label>
      <span style={{ color: '#666', fontSize: 14 }}>Zoom: {currentZoom.toFixed(2)}</span>
      {isClusteringEnabled && <ClusteringHelpText communityCount={communityCount} />}
    </div>
  );
}

function ClusteringHelpText({ communityCount }: { communityCount: number }): React.ReactElement {
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 4,
        backgroundColor: '#6366f1',
        color: 'white',
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {communityCount} clusters • Double-click to expand/collapse
    </span>
  );
}
