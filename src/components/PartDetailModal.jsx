import ModalShell from './ModalShell';
import Avatar from './Avatar';
import { currencyFormatter, formatDateTime, normalizePhone } from '../utils/format';

export default function PartDetailModal({
  part,
  sellerProfile,
  currentUser,
  onClose,
  onStartChat,
  onEditPart,
  onDeletePart,
}) {
  if (!part) {
    return null;
  }

  const sellerName = sellerProfile?.displayName || part.sellerDisplayName || part.sellerEmail || 'Unbekannt';
  const whatsappNumber = currentUser ? sellerProfile?.whatsappNumber || '' : '';
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${normalizePhone(whatsappNumber)}?text=${encodeURIComponent(`Hallo ${sellerName}, ich interessiere mich für dein Teil \"${part.title}\" auf PartFinder.`)}`
    : '';
  const canChat = currentUser && part.sellerUid !== currentUser.uid && sellerProfile?.chatEnabled !== false;
  const isOwn = part.sellerUid === currentUser?.uid;

  return (
    <ModalShell title="Inserat-Details" onClose={onClose} maxWidth="max-w-6xl">
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="border-b pf-divider bg-black/10 lg:border-b-0 lg:border-r">
          <img src={part.imageBase64} alt={part.title} className="h-full min-h-[20rem] w-full object-cover" />
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="pf-badge px-3 py-1 text-xs font-semibold">{part.category}</span>
              <h2 className="mt-4 text-3xl font-black text-[var(--pf-text)]">{part.title}</h2>
              <p className="mt-2 text-sm uppercase tracking-[0.2em] text-[var(--pf-muted)]">
                {part.brand} • {part.model}
              </p>
            </div>

            <div className="rounded-3xl bg-[var(--pf-primary)] px-5 py-4 text-right text-[#04111a]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">Preis</p>
              <p className="mt-1 text-2xl font-black">{currencyFormatter.format(Number(part.price || 0))}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3">
              <p className="text-sm text-[var(--pf-muted)]">Zustand</p>
              <p className="mt-1 font-semibold text-[var(--pf-text)]">{part.condition}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3">
              <p className="text-sm text-[var(--pf-muted)]">Erstellt</p>
              <p className="mt-1 font-semibold text-[var(--pf-text)]">{formatDateTime(part.createdAt)}</p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-5">
            <h3 className="text-lg font-bold text-[var(--pf-text)]">Beschreibung</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--pf-muted)]">{part.description}</p>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={sellerName} src={sellerProfile?.avatarBase64 || ''} size="lg" />
                <div>
                  <h3 className="text-lg font-bold text-[var(--pf-text)]">Verkäufer kontaktieren</h3>
                  <p className="mt-1 text-sm text-[var(--pf-muted)]">
                    Verkäufer: <span className="font-semibold text-[var(--pf-text)]">{sellerName}</span>
                  </p>
                  <p className="mt-1 text-sm text-[var(--pf-muted)]">E-Mail: {part.sellerEmail || 'Nicht hinterlegt'}</p>
                </div>
              </div>
              {isOwn ? (
                <span className="rounded-full border border-[color:var(--pf-border)] bg-[var(--pf-surface)] px-3 py-2 text-sm text-[var(--pf-muted)]">
                  Dein Inserat
                </span>
              ) : null}
            </div>

            {whatsappNumber ? (
              <div className="mt-4 rounded-2xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-3)] px-4 py-3 text-sm text-[var(--pf-muted)]">
                WhatsApp-Nummer: <span className="font-semibold text-[var(--pf-text)]">{whatsappNumber}</span>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:brightness-105"
                >
                  WhatsApp öffnen
                </a>
              ) : null}

              {canChat ? (
                <button type="button" onClick={() => onStartChat(part)} className="pf-button-primary px-4 py-3">
                  In-App Chat starten
                </button>
              ) : null}

              {isOwn ? (
                <>
                  <button type="button" onClick={() => onEditPart(part)} className="pf-button-secondary px-4 py-3">
                    Inserat bearbeiten
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePart(part)}
                    className="pf-button-danger px-4 py-3"
                  >
                    Inserat löschen
                  </button>
                </>
              ) : null}

              {!whatsappHref && !canChat && !isOwn ? (
                <div className="rounded-2xl border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-3)] px-4 py-3 text-sm text-[var(--pf-muted)]">
                  Aktuell ist nur Kontakt per E-Mail möglich.
                </div>
              ) : null}
            </div>

            <p className="mt-4 text-xs text-[var(--pf-muted)]">
              WhatsApp-Daten werden nur registrierten Nutzern angezeigt. In-App Chat ist nur verfügbar, wenn der Verkäufer ihn im Dashboard aktiviert hat.
            </p>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
