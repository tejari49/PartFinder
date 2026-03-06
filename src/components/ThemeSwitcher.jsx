const options = [
  {
    value: 'amoled',
    label: 'AMOLED Black',
    emoji: '🌙',
  },
  {
    value: 'light',
    label: 'Smooth Light',
    emoji: '☀️',
  },
];

export default function ThemeSwitcher({ value, onChange, compact = false }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-1 ${compact ? '' : ''}`}>
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition ${
              active
                ? 'bg-[var(--pf-primary)] text-[#04111a] shadow-lg'
                : 'text-[var(--pf-text)] hover:bg-[var(--pf-surface-3)]'
            }`}
            title={option.label}
            aria-label={option.label}
          >
            <span aria-hidden="true">{option.emoji}</span>
          </button>
        );
      })}
    </div>
  );
}
