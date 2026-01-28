interface ControlsProps {
  nodeCount: number;
  communityCount: number;
  onNodeCountChange: (count: number) => void;
  onCommunityCountChange: (count: number) => void;
  onRegenerate: () => void;
}

export function Controls({
  nodeCount,
  communityCount,
  onNodeCountChange,
  onCommunityCountChange,
  onRegenerate,
}: ControlsProps) {
  return (
    <div
      style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}
    >
      <label>
        Nodes:
        <input
          type="range"
          min={20}
          max={20000}
          value={nodeCount}
          onChange={(e) => onNodeCountChange(Number(e.target.value))}
          style={{ marginLeft: 8 }}
        />
        <span style={{ marginLeft: 8 }}>{nodeCount.toLocaleString()}</span>
      </label>

      <label>
        Communities:
        <input
          type="range"
          min={2}
          max={8}
          value={communityCount}
          onChange={(e) => onCommunityCountChange(Number(e.target.value))}
          style={{ marginLeft: 8 }}
        />
        <span style={{ marginLeft: 8 }}>{communityCount}</span>
      </label>

      <button onClick={onRegenerate} style={{ padding: '4px 12px' }}>
        Regenerate
      </button>
    </div>
  );
}
