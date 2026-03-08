import { useEffect, useMemo, useState } from 'react';
import Avatar from './Avatar';
import ModalShell from './ModalShell';
import { currencyFormatter, formatDateTime, normalizePhone } from '../utils/format';

const reportReasonOptions = [
  { value: 'spam', label: 'Spam' },
  { value: 'duplicate', label: 'Duplikat' },
  { value: 'fraud', label: 'Betrug' },
  { value: 'offensive', label: 'Unangemessen' },
  { value: 'wrong_category', label: 'Falsche Kategorie' },
  { value: 'other', label: 'Sonstiges' },
];

function deliveryLabel(part) {
  const entries = [];
  if (part.shippingAvailable) entries.push('Versand');
  if (part.pickupAvailable !== false) entries.push('Abholung');
  return entries.length > 0 ? entries.join(' • ') : 'Keine Angabe';
}

function StatusChip({ status }) {
  if (status === 'sold') {
    return (
      <span className="rounded-full bg-[var(--pf-danger)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
        Verkauft
      </span>
    );
  }

  if (status === 'reserved') {
    return (
      <span className="rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
        Reserviert
      </span>
    );
  }

  return (
    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-400">
      Aktiv
    </span>
  );
}

function compatibilityRange(from, to) {
  if (!from && !to) return 'Keine Angabe';
  if (from && to) return `${from} - ${to}`;
  return from ? `ab ${from}` : `bis ${to}`;
}

export default function PartDetailModal({
  part,
  sellerProfile,
  sellerTrust,
  currentUser,
  onClose,
  onStartChat,
  onEditPart,
  onDeletePart,
  onSetPartStatus,
  isFavorite,
  onToggleFavorite,
  onSubmitRating,
  onSubmitReport,
}) {
  const images = useMemo(() => {
    if (part.imagesBase64?.length > 0) {
      return part.imagesBase64;
    }
    return part.imageBase64 ? [part.imageBase64] : [];
  }, [part.imageBase64, part.imagesBase64]);
  const [activeImage, setActiveImage] = useState(images[0] || '');
  const [ratingValue, setRatingValue] = useState('5');
  const [ratingComment, setRatingComment] = useState('');
  const [reportReason, setReportReason] = useState('spam');
  const [reportDetails, setReportDetails] = useState('');
  const [ratingSaving, setRatingSaving] = useState(false);
  const [reportSaving, setReportSaving] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);

  useEffect(() => {
    setActiveImage(images[0] || '');
  }, [images, part.id]);

  const sellerName = sellerProfile?.displayName || part.sellerDisplayName || part.sellerEmail || 'Verkaeufer';
  const whatsappNumber = normalizePhone(sellerProfile?.whatsappNumber || '');
  const whatsappLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hallo, ich interessiere mich fuer dein Inserat "${part.title}".`)}`
    : '';
  const ownPart = currentUser?.uid === part.sellerUid;
  const status = part.status || 'active';
  const isSold = status === 'sold';
  const isReserved = status === 'reserved';
  const reservedForCurrentUser = !!part.reservedForUid && part.reservedForUid === currentUser?.uid;
  const canContactSeller = !isSold && (!isReserved || !part.reservedForUid || reservedForCurrentUser);

  const handleRatingSubmit = async (event) => {
    event.preventDefault();
    setRatingSaving(true);
    try {
      await onSubmitRating(part, {
        rating: Number(ratingValue),
        comment: ratingComment,
      });
      setShowRatingForm(false);
      setRatingComment('');
      setRatingValue('5');
    } catch (error) {
      console.error(error);
    } finally {
      setRatingSaving(false);
    }
  };

  const handleReportSubmit = async (event) => {
    event.preventDefault();
    setReportSaving(true);
    try {
      await onSubmitReport(part, {
        reason: reportReason,
        details: reportDetails,
      });
      setShowReportForm(false);
      setReportDetails('');
      setReportReason('spam');
    } catch (error) {
      console.error(error);
    } finally {
      setReportSaving(false);
    }
  };

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
                  <StatusChip status={status} />
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

            {isReserved ? (
              <div className="mt-4 rounded-[1.1rem] border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Dieses Teil ist aktuell reserviert.
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
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--pf-muted)]">Kompatibilitaet</p>
              <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <p className="text-[var(--pf-muted)]">OEM: <span className="font-semibold text-[var(--pf-text)]">{part.oemNumber || 'Keine Angabe'}</span></p>
                <p className="text-[var(--pf-muted)]">Motorcode: <span className="font-semibold text-[var(--pf-text)]">{part.engineCode || 'Keine Angabe'}</span></p>
                <p className="text-[var(--pf-muted)]">Baujahr: <span className="font-semibold text-[var(--pf-text)]">{compatibilityRange(part.yearFrom, part.yearTo)}</span></p>
                <p className="text-[var(--pf-muted)]">Generation: <span className="font-semibold text-[var(--pf-text)]">{part.vehicleGeneration || 'Keine Angabe'}</span></p>
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
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--pf-primary)]">Verkaeufer</p>
                <h3 className="mt-1 truncate text-lg font-bold text-[var(--pf-text)]">{sellerName}</h3>
                <p className="mt-1 text-sm text-[var(--pf-muted)]">Inserat erstellt: {formatDateTime(part.createdAt)}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--pf-muted)]">
              {sellerTrust?.verified ? (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-300">
                  Verifiziert
                </span>
              ) : null}
              <span>
                {sellerTrust?.ratingCount
                  ? `★ ${sellerTrust.ratingAverage.toFixed(1)} (${sellerTrust.ratingCount} Bewertungen)`
                  : 'Noch keine Bewertungen'}
              </span>
              <span>{`${sellerTrust?.soldCount || 0} erfolgreiche Verkaeufe`}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {!ownPart ? (
                <>
                  {whatsappLink && canContactSeller ? (
                    <a href={whatsappLink} target="_blank" rel="noreferrer" className="pf-button-primary inline-flex px-4 py-3">
                      WhatsApp
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onStartChat(part)}
                    disabled={!canContactSeller}
                    className="pf-button-secondary px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    In-App Chat
                  </button>
                  <button type="button" onClick={() => onToggleFavorite(part)} className="pf-button-secondary px-4 py-3">
                    {isFavorite ? '★ Favorit' : '☆ Merken'}
                  </button>
                  <button type="button" onClick={() => setShowRatingForm((prev) => !prev)} className="pf-button-secondary px-4 py-3">
                    Bewerten
                  </button>
                  <button type="button" onClick={() => setShowReportForm((prev) => !prev)} className="pf-button-danger px-4 py-3">
                    Melden
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => onEditPart(part)} className="pf-button-secondary px-4 py-3">
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetPartStatus(part, 'active')}
                    className="pf-button-secondary px-4 py-3"
                  >
                    Aktiv
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetPartStatus(part, 'reserved')}
                    className="pf-button-secondary px-4 py-3"
                  >
                    Reservieren
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetPartStatus(part, 'sold')}
                    className="pf-button-secondary px-4 py-3"
                  >
                    Als verkauft
                  </button>
                  <button type="button" onClick={() => onDeletePart(part)} className="pf-button-danger px-4 py-3">
                    Loeschen
                  </button>
                </>
              )}
            </div>

            {!ownPart && !whatsappLink && canContactSeller ? (
              <p className="mt-3 text-sm text-[var(--pf-muted)]">Keine WhatsApp-Nummer hinterlegt. Nutze den In-App Chat.</p>
            ) : null}

            {!ownPart && showRatingForm ? (
              <form onSubmit={handleRatingSubmit} className="mt-4 space-y-3 rounded-[1.1rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4">
                <p className="text-sm font-semibold text-[var(--pf-text)]">Verkaeufer bewerten</p>
                <select
                  value={ratingValue}
                  onChange={(event) => setRatingValue(event.target.value)}
                  className="pf-select px-4 py-3"
                >
                  <option value="5">5 Sterne</option>
                  <option value="4">4 Sterne</option>
                  <option value="3">3 Sterne</option>
                  <option value="2">2 Sterne</option>
                  <option value="1">1 Stern</option>
                </select>
                <textarea
                  rows="3"
                  value={ratingComment}
                  onChange={(event) => setRatingComment(event.target.value)}
                  placeholder="Optionaler Kommentar..."
                  className="pf-textarea px-4 py-3"
                />
                <button type="submit" disabled={ratingSaving} className="pf-button-primary px-4 py-3 disabled:opacity-60">
                  {ratingSaving ? 'Speichert...' : 'Bewertung senden'}
                </button>
              </form>
            ) : null}

            {!ownPart && showReportForm ? (
              <form onSubmit={handleReportSubmit} className="mt-4 space-y-3 rounded-[1.1rem] border border-rose-500/30 bg-rose-500/10 p-4">
                <p className="text-sm font-semibold text-rose-200">Inserat melden</p>
                <select
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  className="pf-select px-4 py-3"
                >
                  {reportReasonOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <textarea
                  rows="3"
                  value={reportDetails}
                  onChange={(event) => setReportDetails(event.target.value)}
                  placeholder="Details zur Meldung..."
                  className="pf-textarea px-4 py-3"
                />
                <button type="submit" disabled={reportSaving} className="pf-button-danger px-4 py-3 disabled:opacity-60">
                  {reportSaving ? 'Sendet...' : 'Meldung senden'}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
