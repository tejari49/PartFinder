const options = [
  {
    value: 'amoled',
    title: 'AMOLED Black',
    description: 'Tiefschwarz, kontrastreich, OLED-freundlich.',
  },
  {
    value: 'light',
    title: 'Smooth Light',
    description: 'Helles, ruhiges UI mit weichen Flächen.',
  },
];

export default function ThemeSwitcher({ value, onChange, compact = false }) {
  return (
    <div className={`grid gap-3 ${compact ? 'sm:grid-cols-2' : 'md:grid-cols-2'}`}>
      {options.map((option) => {
        const active = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
              active ? 'pf-card-selected' : 'pf-card-muted hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[var(--pf-text)]">{option.title}</p>
                <p className="mt-1 text-sm text-[var(--pf-muted)]">{option.description}</p>
              </div>
              <span className={`h-4 w-4 rounded-full border ${active ? 'border-[var(--pf-primary)] bg-[var(--pf-primary)]' : 'border-[color:var(--pf-border)] bg-transparent'}`} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
