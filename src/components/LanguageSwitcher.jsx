const options = [
  { value: 'en', label: 'EN' },
  { value: 'de', label: 'DE' },
];

export default function LanguageSwitcher({ value, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              active
                ? 'bg-[var(--pf-primary)] text-[#04111a]'
                : 'text-[var(--pf-text)] hover:bg-[var(--pf-surface-3)]'
            }`}
            aria-label={`Switch language to ${option.label}`}
            title={`Switch language to ${option.label}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
