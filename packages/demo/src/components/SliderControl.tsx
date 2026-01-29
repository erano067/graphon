interface SliderControlProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export function SliderControl({
  label,
  min,
  max,
  step,
  value,
  onChange,
  formatValue,
}: SliderControlProps): React.ReactElement {
  const displayValue = formatValue ? formatValue(value) : String(value);
  return (
    <label>
      {label}:
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ marginLeft: 8 }}
      />
      <span style={{ marginLeft: 8 }}>{displayValue}</span>
    </label>
  );
}
