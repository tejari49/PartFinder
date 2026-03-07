import { useEffect, useMemo, useRef, useState } from 'react';
import { validateCategoryInput } from '../utils/categoryValidation';
import { resizeImageToBase64 } from '../utils/image';

const initialState = {
  category: '',
  brand: '',
  model: '',
  title: '',
  price: '',
  condition: 'Gebraucht',
  description: '',
  imagesBase64: [],
  location: '',
  shippingAvailable: false,
  pickupAvailable: true,
};

const conditions = ['Neu', 'Neuwertig', 'Gebraucht', 'Defekt / Bastler', 'Generalüberholt'];
const MAX_IMAGES = 3;
const MAX_TOTAL_BASE64_CHARS = 950000;

export default function AddPartForm({ categories, onSubmit, onToast, editingPart, onCancelEdit }) {
  const [form, setForm] = useState(initialState);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!editingPart) {
      setForm(initialState);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setForm({
      category: editingPart.category || '',
      brand: editingPart.brand || '',
      model: editingPart.model || '',
      title: editingPart.title || '',
      price: editingPart.price ?? '',
      condition: editingPart.condition || 'Gebraucht',
      description: editingPart.description || '',
      imagesBase64:
        editingPart.imagesBase64?.length > 0
          ? editingPart.imagesBase64
          : editingPart.imageBase64
            ? [editingPart.imageBase64]
            : [],
      location: editingPart.location || '',
      shippingAvailable: Boolean(editingPart.shippingAvailable),
      pickupAvailable: editingPart.pickupAvailable !== false,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [editingPart]);

  const categoryValidation = useMemo(() => {
    if (!form.category.trim()) {
      return null;
    }

    return validateCategoryInput(form.category, categories);
  }, [categories, form.category]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, MAX_IMAGES);

    if (files.length === 0) {
      return;
    }

    setIsProcessingImage(true);

    try {
      const nextImages = await Promise.all(
        files.map((file) =>
          resizeImageToBase64(file, {
            maxWidth: 720,
            maxHeight: 720,
            quality: 0.6,
          }),
        ),
      );

      const totalSize = nextImages.reduce((sum, image) => sum + image.length, 0);

      if (totalSize > MAX_TOTAL_BASE64_CHARS) {
        onToast('Bilder sind zusammen zu groß. Bitte kleinere Bilder wählen.', 'error');
        return;
      }

      setForm((prev) => ({
        ...prev,
        imagesBase64: nextImages,
      }));

      onToast(`${nextImages.length} Bild${nextImages.length > 1 ? 'er' : ''} vorbereitet.`, 'success');
    } catch (error) {
      console.error(error);
      onToast('Bilder konnten nicht verarbeitet werden.', 'error');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!categoryValidation?.ok) {
      onToast(categoryValidation?.reason || 'Kategorie ist ungültig.', 'error');
      return;
    }

    if (form.imagesBase64.length === 0) {
      onToast('Mindestens ein Bild ist Pflicht.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(
        {
          ...form,
          price: Number(form.price),
        },
        editingPart,
      );

      if (!editingPart) {
        setForm(initialState);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-[1.65rem] pf-card p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--pf-text)]">
            {editingPart ? 'Inserat bearbeiten' : 'Teil einstellen'}
          </h2>
          <p className="mt-1 text-sm text-[var(--pf-muted)]">
            Neue Kategorien werden nur akzeptiert, wenn sie klar zu Autoteilen passen.
          </p>
        </div>
        {editingPart ? (
          <button type="button" onClick={onCancelEdit} className="pf-button-secondary px-3 py-2 text-sm">
            Abbrechen
          </button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Kategorie</span>
            <input
              list="partfinder-categories"
              value={form.category}
              onChange={(event) => updateField('category', event.target.value)}
              placeholder="z. B. Turbolader"
              className="pf-input px-4 py-3"
              required
            />
            <datalist id="partfinder-categories">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
            <p
              className={`mt-2 text-xs ${
                categoryValidation?.ok
                  ? 'text-emerald-400'
                  : categoryValidation
                    ? 'text-rose-400'
                    : 'text-[var(--pf-muted)]'
              }`}
            >
              {categoryValidation
                ? categoryValidation.reason
                : 'Bestehende Kategorie wählen oder eine neue Autoteile-Kategorie eingeben.'}
            </p>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Zustand</span>
            <select
              value={form.condition}
              onChange={(event) => updateField('condition', event.target.value)}
              className="pf-select px-4 py-3"
            >
              {conditions.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Preis (€)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => updateField('price', event.target.value)}
              placeholder="199.00"
              className="pf-input px-4 py-3"
              required
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Marke</span>
            <input
              type="text"
              value={form.brand}
              onChange={(event) => updateField('brand', event.target.value)}
              placeholder="BMW"
              className="pf-input px-4 py-3"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Modell</span>
            <input
              type="text"
              value={form.model}
              onChange={(event) => updateField('model', event.target.value)}
              placeholder="320d E90"
              className="pf-input px-4 py-3"
              required
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Titel</span>
          <input
            type="text"
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            placeholder="Original BMW Turbolader 320d"
            className="pf-input px-4 py-3"
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Standort</span>
            <input
              type="text"
              value={form.location}
              onChange={(event) => updateField('location', event.target.value)}
              placeholder="Zürich / Winterthur / Bern"
              className="pf-input px-4 py-3"
            />
          </label>

          <div className="rounded-[1.15rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4">
            <p className="mb-3 text-sm font-semibold text-[var(--pf-text)]">Versand / Abholung</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 text-sm text-[var(--pf-text)]">
                <input
                  type="checkbox"
                  checked={form.shippingAvailable}
                  onChange={(event) => updateField('shippingAvailable', event.target.checked)}
                />
                Versand möglich
              </label>
              <label className="flex items-center gap-3 text-sm text-[var(--pf-text)]">
                <input
                  type="checkbox"
                  checked={form.pickupAvailable}
                  onChange={(event) => updateField('pickupAvailable', event.target.checked)}
                />
                Abholung möglich
              </label>
            </div>
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Beschreibung</span>
          <textarea
            rows="4"
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder="Details, Kompatibilität, Mängel, Versandhinweise …"
            className="pf-textarea px-4 py-3"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Bilder</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="pf-input px-4 py-3"
          />
          <p className="mt-2 text-xs text-[var(--pf-muted)]">
            Maximal {MAX_IMAGES} Bilder. Das erste Bild wird als Vorschau genutzt.
          </p>
        </label>

        {form.imagesBase64.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {form.imagesBase64.map((image, index) => (
              <div
                key={`${image.slice(0, 30)}-${index}`}
                className="overflow-hidden rounded-[1rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-3)]"
              >
                <img src={image} alt={`Vorschau ${index + 1}`} className="h-24 w-full object-cover" />
              </div>
            ))}
          </div>
        ) : null}

        {editingPart?.status === 'sold' ? (
          <div className="rounded-[1rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            Dieses Inserat ist aktuell als verkauft markiert. Den Status kannst du im Detailfenster oder Dashboard wieder auf aktiv setzen.
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || isProcessingImage}
          className="pf-button-primary w-full px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isProcessingImage
            ? 'Bilder werden verarbeitet…'
            : isSubmitting
              ? 'Speichert…'
              : editingPart
                ? 'Inserat aktualisieren'
                : 'Inserat veröffentlichen'}
        </button>
      </form>
    </section>
  );
}
