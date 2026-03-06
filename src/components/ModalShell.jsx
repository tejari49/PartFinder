import { useEffect } from 'react';

export default function ModalShell({ title, children, onClose, maxWidth = 'max-w-5xl' }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={onClose}
      />

      <div className={`relative z-10 max-h-[92vh] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl ${maxWidth}`}>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Schließen
          </button>
        </div>

        <div className="max-h-[calc(92vh-4.5rem)] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
