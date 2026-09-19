interface Option {
  label: string;
  value: string;
}

interface SegmentedToggleProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedToggle({ options, value, onChange }: SegmentedToggleProps) {
  return (
    <div className="cuba-segment">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          data-active={opt.value === value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
