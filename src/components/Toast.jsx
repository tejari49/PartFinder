const toastStyles = {
  success: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100',
  error: 'border-rose-400/30 bg-rose-500/15 text-rose-100',
  info: 'border-cyan-400/30 bg-cyan-500/15 text-cyan-100',
};

export default function Toast({ toasts }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${
            toastStyles[toast.type] || toastStyles.info
          }`}
        >
          <p className="text-sm font-semibold">{toast.message}</p>
        </div>
      ))}
    </div>
  );
}
