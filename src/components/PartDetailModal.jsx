import ModalShell from './ModalShell';

const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

const formatDate = (timestamp) => {
  const date = timestamp?.toDate?.();

  if (!date) {
    return 'Gerade eben';
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const normalizePhone = (value = '') => value.replace(/[^\d]/g, '');

export default function PartDetailModal({
  part,
  sellerProfile,
  currentUser,
  onClose,
  onStartChat,
}) {
  if (!part) {
    return null;
  }

  const sellerName =
    sellerProfile?.displayName ||
    part.sellerDisplayName ||
    part.sellerEmail ||
    'Unbekannt';
  const whatsappNumber = sellerProfile?.whatsappNumber || '';
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${normalizePhone(whatsappNumber)}?text=${encodeURIComponent(`Hallo ${sellerName}, ich interessiere mich für dein Teil \"${part.title}\" auf PartFinder.`)}`
    : '';
  const canChat = currentUser && part.sellerUid !== currentUser.uid && sellerProfile?.chatEnabled !== false;

  return (
    <ModalShell title="Inserat-Details" onClose={onClose} maxWidth="max-w-6xl">
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="border-b border-white/10 bg-slate-950/70 lg:border-b-0 lg:border-r">
          <img src={part.imageBase64} alt={part.title} className="h-full min-h-[20rem] w-full object-cover" />
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                {part.category}
              </span>
              <h2 className="mt-4 text-3xl font-black text-white">{part.title}</h2>
              <p className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-400">
                {part.brand} • {part.model}
              </p>
            </div>

            <div className="rounded-3xl bg-cyan-400 px-5 py-4 text-right text-slate-950">
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">Preis</p>
              <p className="mt-1 text-2xl font-black">{currencyFormatter.format(Number(part.price || 0))}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-sm text-slate-400">Zustand</p>
              <p className="mt-1 font-semibold text-white">{part.condition}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-sm text-slate-400">Erstellt</p>
              <p className="mt-1 font-semibold text-white">{formatDate(part.createdAt)}</p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
            <h3 className="text-lg font-bold text-white">Beschreibung</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">{part.description}</p>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">Verkäufer kontaktieren</h3>
                <p className="mt-1 text-sm text-slate-300">
                  Verkäufer: <span className="font-semibold text-white">{sellerName}</span>
                </p>
                <p className="mt-1 text-sm text-slate-400">E-Mail: {part.sellerEmail || 'Nicht hinterlegt'}</p>
              </div>
              {part.sellerUid === currentUser?.uid ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                  Dein Inserat
                </span>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {currentUser && whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  WhatsApp öffnen
                </a>
              ) : null}

              {canChat ? (
                <button
                  type="button"
                  onClick={() => onStartChat(part)}
                  className="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  In-App Chat starten
                </button>
              ) : null}

              {!whatsappHref && !canChat && part.sellerUid !== currentUser?.uid ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                  Aktuell ist nur Kontakt per E-Mail möglich.
                </div>
              ) : null}
            </div>

            <p className="mt-4 text-xs text-slate-400">
              WhatsApp-Daten werden nur registrierten Nutzern angezeigt. In-App Chat ist nur verfügbar, wenn der Verkäufer ihn im Dashboard aktiviert hat.
            </p>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
