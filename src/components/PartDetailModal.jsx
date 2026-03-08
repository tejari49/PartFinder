import { useEffect, useMemo, useState } from 'react';
import Avatar from './Avatar';
import ModalShell from './ModalShell';
import {
  currencyFormatter,
  formatDateTime,
  getConditionLabel,
  normalizePhone,
} from '../utils/format';

const text = {
  en: {
    details: 'Listing details',
    spam: 'Spam',
    duplicate: 'Duplicate listing',
    fraud: 'Fraud',
    offensive: 'Offensive content',
    wrongCategory: 'Wrong category',
    other: 'Other',
    shipping: 'Shipping',
    pickup: 'Pickup',
    notSpecified: 'Not specified',
    sold: 'Sold',
    reserved: 'Reserved',
    active: 'Active',
    from: 'from',
    until: 'until',
    price: 'Price',
    soldHint: 'This item is currently marked as sold.',
    reservedHint: 'This item is currently reserved.',
    condition: 'Condition',
    location: 'Location',
    shippingPickup: 'Shipping / Pickup',
    compatibility: 'Compatibility',
    years: 'Years',
    generation: 'Generation',
    description: 'Description',
    seller: 'Seller',
    created: 'Created',
    verified: 'Verified',
    noRatings: 'No ratings yet',
    successfulSales: (count) => `${count} successful sales`,
    inAppChat: 'In-app chat',
    save: 'Save',
    saved: 'Saved',
    rateSeller: 'Rate seller',
    reportListing: 'Report listing',
    edit: 'Edit',
    setActive: 'Set active',
    setReserved: 'Set reserved',
    markSold: 'Mark sold',
    delete: 'Delete',
    noWhatsapp: 'No WhatsApp number set. Use in-app chat instead.',
    rateTitle: 'Rate this seller',
    stars5: '5 stars',
    stars4: '4 stars',
    stars3: '3 stars',
    stars2: '2 stars',
    stars1: '1 star',
    optionalComment: 'Optional comment...',
    saving: 'Saving...',
    submitRating: 'Submit rating',
    reportTitle: 'Report this listing',
    reportDetails: 'Details for moderation...',
    sending: 'Sending...',
    submitReport: 'Submit report',
    noImage: 'No image',
  },
  de: {
    details: 'Inserat Details',
    spam: 'Spam',
    duplicate: 'Duplikat',
    fraud: 'Betrug',
    offensive: 'Unangemessen',
    wrongCategory: 'Falsche Kategorie',
    other: 'Sonstiges',
    shipping: 'Versand',
    pickup: 'Abholung',
    notSpecified: 'Keine Angabe',
    sold: 'Verkauft',
    reserved: 'Reserviert',
    active: 'Aktiv',
    from: 'ab',
    until: 'bis',
    price: 'Preis',
    soldHint: 'Dieses Teil ist aktuell als verkauft markiert.',
    reservedHint: 'Dieses Teil ist aktuell reserviert.',
    condition: 'Zustand',
    location: 'Standort',
    shippingPickup: 'Versand / Abholung',
    compatibility: 'Kompatibilitaet',
    years: 'Baujahr',
    generation: 'Generation',
    description: 'Beschreibung',
    seller: 'Verkaeufer',
    created: 'Erstellt',
    verified: 'Verifiziert',
    noRatings: 'Noch keine Bewertungen',
    successfulSales: (count) => `${count} erfolgreiche Verkaeufe`,
    inAppChat: 'In-App Chat',
    save: 'Merken',
    saved: 'Gespeichert',
    rateSeller: 'Bewerten',
    reportListing: 'Melden',
    edit: 'Bearbeiten',
    setActive: 'Aktiv',
    setReserved: 'Reservieren',
    markSold: 'Als verkauft',
    delete: 'Loeschen',
    noWhatsapp: 'Keine WhatsApp-Nummer hinterlegt. Nutze den In-App Chat.',
    rateTitle: 'Verkaeufer bewerten',
    stars5: '5 Sterne',
    stars4: '4 Sterne',
    stars3: '3 Sterne',
    stars2: '2 Sterne',
    stars1: '1 Stern',
    optionalComment: 'Optionaler Kommentar...',
    saving: 'Speichert...',
    submitRating: 'Bewertung senden',
    reportTitle: 'Inserat melden',
    reportDetails: 'Details fuer Moderation...',
    sending: 'Sendet...',
    submitReport: 'Meldung senden',
    noImage: 'Kein Bild',
  },
};

function deliveryLabel(part, t) {
  const entries = [];
  if (part.shippingAvailable) entries.push(t.shipping);
  if (part.pickupAvailable !== false) entries.push(t.pickup);
  return entries.length > 0 ? entries.join(' / ') : t.notSpecified;
}

function StatusChip({ status, t }) {
  if (status === 'sold') {
    return (
      <span className="rounded-full bg-[var(--pf-danger)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
        {t.sold}
      </span>
    );
  }

  if (status === 'reserved') {
    return (
      <span className="rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
        {t.reserved}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-400">
      {t.active}
    </span>
  );
}

function compatibilityRange(from, to, t) {
  if (!from && !to) return t.notSpecified;
  if (from && to) return `${from} - ${to}`;
  return from ? `${t.from} ${from}` : `${t.until} ${to}`;
}

export default function PartDetailModal({
  language = 'en',
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
  const t = language === 'de' ? text.de : text.en;
  const reportReasonOptions = [
    { value: 'spam', label: t.spam },
    { value: 'duplicate', label: t.duplicate },
    { value: 'fraud', label: t.fraud },
    { value: 'offensive', label: t.offensive },
    { value: 'wrong_category', label: t.wrongCategory },
    { value: 'other', label: t.other },
  ];
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

  const sellerName = sellerProfile?.displayName || part.sellerDisplayName || part.sellerEmail || t.seller;
  const whatsappNumber = normalizePhone(sellerProfile?.whatsappNumber || '');
  const whatsappLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I am interested in your listing "${part.title}".`)}`
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
    <ModalShell title={t.details} onClose={onClose} maxWidth="max-w-6xl">
      <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="overflow-hidden rounded-[1.75rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)]">
            {activeImage ? (
              <img src={activeImage} alt={part.title} className="h-[18rem] w-full object-cover sm:h-[24rem]" />
            ) : (
              <div className="flex h-[18rem] items-center justify-center text-[var(--pf-muted)] sm:h-[24rem]">
                {t.noImage}
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
                  <StatusChip status={status} t={t} />
                </div>
                <h2 className="mt-2 text-2xl font-black text-[var(--pf-text)] sm:text-3xl">{part.title}</h2>
                <p className="mt-2 text-sm text-[var(--pf-muted)]">{part.brand} / {part.model}</p>
              </div>
              <div className="rounded-[1.25rem] bg-[var(--pf-primary)] px-4 py-3 text-[#04111a]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">{t.price}</p>
                <p className="mt-1 text-xl font-black">{currencyFormatter.format(Number(part.price || 0), language)}</p>
              </div>
            </div>

            {isSold ? (
              <div className="mt-4 rounded-[1.1rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {t.soldHint}
              </div>
            ) : null}

            {isReserved ? (
              <div className="mt-4 rounded-[1.1rem] border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                {t.reservedHint}
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--pf-muted)]">{t.condition}</p>
                <p className="mt-1 font-semibold text-[var(--pf-text)]">{getConditionLabel(part.condition, language)}</p>
              </div>
              <div className="rounded-[1.25rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--pf-muted)]">{t.location}</p>
                <p className="mt-1 font-semibold text-[var(--pf-text)]">{part.location || t.notSpecified}</p>
              </div>
              <div className="rounded-[1.25rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--pf-muted)]">{t.shippingPickup}</p>
                <p className="mt-1 font-semibold text-[var(--pf-text)]">{deliveryLabel(part, t)}</p>
              </div>
            </div>

            <div className="mt-4 rounded-[1.25rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--pf-muted)]">{t.compatibility}</p>
              <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <p className="text-[var(--pf-muted)]">OEM: <span className="font-semibold text-[var(--pf-text)]">{part.oemNumber || t.notSpecified}</span></p>
                <p className="text-[var(--pf-muted)]">Engine: <span className="font-semibold text-[var(--pf-text)]">{part.engineCode || t.notSpecified}</span></p>
                <p className="text-[var(--pf-muted)]">{t.years}: <span className="font-semibold text-[var(--pf-text)]">{compatibilityRange(part.yearFrom, part.yearTo, t)}</span></p>
                <p className="text-[var(--pf-muted)]">{t.generation}: <span className="font-semibold text-[var(--pf-text)]">{part.vehicleGeneration || t.notSpecified}</span></p>
              </div>
            </div>

            <div className="mt-4 rounded-[1.25rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--pf-muted)]">{t.description}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--pf-text)]">{part.description}</p>
            </div>
          </div>

          <div className="rounded-[1.75rem] pf-card p-5">
            <div className="flex items-center gap-3">
              <Avatar name={sellerName} src={sellerProfile?.avatarBase64 || ''} size="md" />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--pf-primary)]">{t.seller}</p>
                <h3 className="mt-1 truncate text-lg font-bold text-[var(--pf-text)]">{sellerName}</h3>
                <p className="mt-1 text-sm text-[var(--pf-muted)]">{t.created}: {formatDateTime(part.createdAt, null, language)}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--pf-muted)]">
              {sellerTrust?.verified ? (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-300">
                  {t.verified}
                </span>
              ) : null}
              <span>
                {sellerTrust?.ratingCount
                  ? `${sellerTrust.ratingAverage.toFixed(1)} / 5 (${sellerTrust.ratingCount})`
                  : t.noRatings}
              </span>
              <span>{t.successfulSales(sellerTrust?.soldCount || 0)}</span>
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
                    {t.inAppChat}
                  </button>
                  <button type="button" onClick={() => onToggleFavorite(part)} className="pf-button-secondary px-4 py-3">
                    {isFavorite ? t.saved : t.save}
                  </button>
                  <button type="button" onClick={() => setShowRatingForm((prev) => !prev)} className="pf-button-secondary px-4 py-3">
                    {t.rateSeller}
                  </button>
                  <button type="button" onClick={() => setShowReportForm((prev) => !prev)} className="pf-button-danger px-4 py-3">
                    {t.reportListing}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => onEditPart(part)} className="pf-button-secondary px-4 py-3">
                    {t.edit}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetPartStatus(part, 'active')}
                    className="pf-button-secondary px-4 py-3"
                  >
                    {t.setActive}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetPartStatus(part, 'reserved')}
                    className="pf-button-secondary px-4 py-3"
                  >
                    {t.setReserved}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetPartStatus(part, 'sold')}
                    className="pf-button-secondary px-4 py-3"
                  >
                    {t.markSold}
                  </button>
                  <button type="button" onClick={() => onDeletePart(part)} className="pf-button-danger px-4 py-3">
                    {t.delete}
                  </button>
                </>
              )}
            </div>

            {!ownPart && !whatsappLink && canContactSeller ? (
              <p className="mt-3 text-sm text-[var(--pf-muted)]">{t.noWhatsapp}</p>
            ) : null}

            {!ownPart && showRatingForm ? (
              <form onSubmit={handleRatingSubmit} className="mt-4 space-y-3 rounded-[1.1rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4">
                <p className="text-sm font-semibold text-[var(--pf-text)]">{t.rateTitle}</p>
                <select
                  value={ratingValue}
                  onChange={(event) => setRatingValue(event.target.value)}
                  className="pf-select px-4 py-3"
                >
                  <option value="5">{t.stars5}</option>
                  <option value="4">{t.stars4}</option>
                  <option value="3">{t.stars3}</option>
                  <option value="2">{t.stars2}</option>
                  <option value="1">{t.stars1}</option>
                </select>
                <textarea
                  rows="3"
                  value={ratingComment}
                  onChange={(event) => setRatingComment(event.target.value)}
                  placeholder={t.optionalComment}
                  className="pf-textarea px-4 py-3"
                />
                <button type="submit" disabled={ratingSaving} className="pf-button-primary px-4 py-3 disabled:opacity-60">
                  {ratingSaving ? t.saving : t.submitRating}
                </button>
              </form>
            ) : null}

            {!ownPart && showReportForm ? (
              <form onSubmit={handleReportSubmit} className="mt-4 space-y-3 rounded-[1.1rem] border border-rose-500/30 bg-rose-500/10 p-4">
                <p className="text-sm font-semibold text-rose-200">{t.reportTitle}</p>
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
                  placeholder={t.reportDetails}
                  className="pf-textarea px-4 py-3"
                />
                <button type="submit" disabled={reportSaving} className="pf-button-danger px-4 py-3 disabled:opacity-60">
                  {reportSaving ? t.sending : t.submitReport}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
