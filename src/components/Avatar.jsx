import { getInitials } from '../utils/format';

const sizeClasses = {
  sm: 'h-10 w-10 text-xs',
  md: 'h-14 w-14 text-sm',
  lg: 'h-20 w-20 text-lg',
};

export default function Avatar({ name, src, size = 'md' }) {
  const classes = sizeClasses[size] || sizeClasses.md;

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Profilbild'}
        className={`${classes} rounded-2xl border border-[color:var(--pf-border)] object-cover shadow-lg`}
      />
    );
  }

  return (
    <div
      className={`${classes} flex items-center justify-center rounded-2xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] font-black tracking-[0.18em] text-[var(--pf-text)] shadow-lg`}
      aria-label={name || 'Profilbild'}
    >
      {getInitials(name)}
    </div>
  );
}
