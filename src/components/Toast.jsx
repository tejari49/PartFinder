const toastStyles = {
  success: {
    borderColor: 'color-mix(in srgb, var(--pf-success) 35%, transparent)',
    background: 'color-mix(in srgb, var(--pf-success) 12%, var(--pf-surface))',
  },
  error: {
    borderColor: 'color-mix(in srgb, var(--pf-danger) 35%, transparent)',
    background: 'color-mix(in srgb, var(--pf-danger) 12%, var(--pf-surface))',
  },
  info: {
    borderColor: 'color-mix(in srgb, var(--pf-primary) 35%, transparent)',
    background: 'color-mix(in srgb, var(--pf-primary) 12%, var(--pf-surface))',
  },
};

export default function Toast({ toasts }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={toastStyles[toast.type] || toastStyles.info}
          className="rounded-2xl border px-4 py-3 text-[var(--pf-text)] shadow-2xl backdrop-blur-xl"
        >
          <p className="text-sm font-semibold">{toast.message}</p>
        </div>
      ))}
    </div>
  );
}
