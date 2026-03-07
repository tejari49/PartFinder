import { useEffect, useMemo, useState } from 'react';
import Avatar from './Avatar';
import ModalShell from './ModalShell';
import { currencyFormatter, formatDateTime, normalizePhone } from '../utils/format';

function deliveryLabel(part) {
  const entries = [];
  if (part.shippingAvailable) entries.push('Versand');
  if (part.pickupAvailable !== false) entries.push('Abholung');
  return entries.length > 0 ? entries.join(' • ') : 'Keine Angabe';
}

function StatusChip({ status }) {
  return status === 'sold' ? (
    <span className="rounded-full bg-[var(--pf-danger)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
      Verkauft
    </span>
  ) : (
    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-400">
      Aktiv
    </span>
  );
}

export default function PartDetailModal({
  part,
  sellerProfile,
  currentUser,
  onClose,
  onStartChat,
  onEditPart,
  onDeletePart,
  onSetPartStatus,
  isFavorite,
  onToggleFavorite,
}) {
  const images = useMemo(() => {
    if (part.imagesBase64?.length > 0) {
      return part.imagesBase64;
    }
    return part.imageBase64 ? [part.imageBase64] : [];
  }, [part.imageBase64, part.imagesBase64]);
  const [activeImage, setActiveImage] = useState(images[0] || '');

  useEffect(() => {
    setActiveImage(images[0] || '');
  }, [images, part.id]);

  const sellerName = sellerProfile?.displayName || part.sellerDisplayName || part.sellerEmail || 'Verkäufer';
  const whatsappNumber = normalizePhone(sellerProfile?.whatsappNumber || '');
  const whatsappLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hallo, ich interessiere mich für dein Inserat "${part.title}".`)}`
    : '';
  const ownPart = currentUser?.uid === part.sellerUid;
  const isSold = (part.status || 'active') === 'sold';

  return (
    <ModalShell title="Inserat Details" onClose={onClose} maxWidth="max-w-6xl">
      <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="overflow-hidden rounded-[1.75rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)]">
            {activeImage ? (
              <img src={activeImage} alt={part.title} className="h-[18rem] w-full object-cover sm:h-[24rem]" />
            ) : (
              <div className="flex h-[18rem] items-center justify-center text-[var(--pf-muted)] sm:h-[24rem]">
                Kein Bild
              </div>
            )}
          </div>

          {images.length > 1 ? (
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((image, index) => (
                <button
                  key={`${image.slice(0, 30)}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(image)}
                  className={`overflow-hidden rounded-[1rem] border ${
                    activeImage === image ? 'border-[var(--pf-primary)]' : 'border-[color:var(--pf-border)]'
                  } bg-[var(--pf-surface-2)]`}
                >
                  <img src={image} alt={`${part.title} ${index + 1}`} className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.75rem] pf-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--pf-primary)]">{part.category}</p>
                  <StatusChip status={part.status || 'active'} />
                </div>
                <h2 className="mt-2 text-2xl font-black text-[var(--pf-text)] sm:text-3xl">{part.title}</h2>
                <p className="mt-2 text-sm text-[var(--pf-muted)]">{part.brand} • {part.model}</p>
              </div>
              <div className="rounded-[1.25rem] bg-[var(--pf-primary)] px-4 py-3 text-[#04111a]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">Preis</p>
                <p className="mt-1 text-xl font-black">{currencyFormatter.format(Number(part.price || 0))}</p>
              </div>
            </div>

            {isSold ? (
              <div className="mt-4 rounded-[1.1rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                Dieses Teil ist aktuell als verkauft markiert.
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--pf-muted)]">Zustand</p>
                <p className="mt-1 font-semibold text-[var(--pf-text)]">{part.condition}</p>
              </div>
              <div className="rounded-[1.25rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--pf-muted)]">Standort</p>
                <p className="mt-1 font-semibold text-[var(--pf-text)]">{part.location || 'Keine Angabe'}</p>
              </div>
              <div className="rounded-[1.25rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--pf-muted)]">Versand / Abholung</p>
                <p className="mt-1 font-semibold text-[var(--pf-text)]">{deliveryLabel(part)}</p>
              </div>
            </div>

            <div className="mt-4 rounded-[1.25rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--pf-muted)]">Beschreibung</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--pf-text)]">{part.description}</p>
            </div>
          </div>

          <div className="rounded-[1.75rem] pf-card p-5">
            <div className="flex items-center gap-3">
              <Avatar name={sellerName} src={sellerProfile?.avatarBase64 || ''} size="md" />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--pf-primary)]">Verkäufer</p>
                <h3 className="mt-1 text-lg font-bold text-[var(--pf-text)]">{sellerName}</h3>
                <p className="mt-1 text-sm text-[var(--pf-muted)]">Inserat erstellt: {formatDateTime(part.createdAt)}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {!ownPart ? (
                <>
                  {whatsappLink && !isSold ? (
                    <a href={whatsappLink} target="_blank" rel="noreferrer" className="pf-button-primary inline-flex px-4 py-3">
                      WhatsApp öffnen
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onStartChat(part)}
                    disabled={isSold}
                    className="pf-button-secondary px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    In-App Chat
                  </button>
                  <button type="button" onClick={() => onToggleFavorite(part)} className="pf-button-secondary px-4 py-3">
                    {isFavorite ? '★ Favorit' : '☆ Merken'}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => onEditPart(part)} className="pf-button-secondary px-4 py-3">
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetPartStatus(part, isSold ? 'active' : 'sold')}
                    className="pf-button-secondary px-4 py-3"
                  >
                    {isSold ? 'Wieder aktiv' : 'Als verkauft markieren'}
                  </button>
                  <button type="button" onClick={() => onDeletePart(part)} className="pf-button-danger px-4 py-3">
                    Löschen
                  </button>
                </>
              )}
            </div>

            {!ownPart && !whatsappLink && !isSold ? (
              <p className="mt-3 text-sm text-[var(--pf-muted)]">Keine WhatsApp-Nummer hinterlegt. Nutze den In-App Chat.</p>
            ) : null}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
