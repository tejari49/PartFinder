import { useEffect, useRef, useState } from 'react';
import { resizeImageToBase64 } from '../utils/image';

const initialState = {
  category: '',
  brand: '',
  model: '',
  title: '',
  price: '',
  condition: 'Gebraucht',
  description: '',
  imageBase64: '',
  imageName: '',
};

const conditions = ['Neu', 'Neuwertig', 'Gebraucht', 'Defekt / Bastler', 'Generalüberholt'];

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
      imageBase64: editingPart.imageBase64 || '',
      imageName: editingPart.title || 'Vorhandenes Bild',
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [editingPart]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      onToast('Bitte eine Bilddatei auswählen.', 'error');
      return;
    }

    setIsProcessingImage(true);

    try {
      const imageBase64 = await resizeImageToBase64(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.7,
      });

      setForm((prev) => ({
        ...prev,
        imageBase64,
        imageName: file.name,
      }));
      onToast('Bild wurde auf max. 800px komprimiert.', 'success');
    } catch (error) {
      console.error(error);
      onToast('Bildverarbeitung fehlgeschlagen.', 'error');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const resetForm = () => {
    setForm(initialState);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.imageBase64) {
      onToast('Ein Originalfoto ist Pflicht.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(form, editingPart || null);
      if (editingPart) {
        onCancelEdit();
      }
      resetForm();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] pf-card p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--pf-text)]">
            {editingPart ? 'Inserat bearbeiten' : 'Teil anbieten'}
          </h2>
          <p className="mt-1 text-sm text-[var(--pf-muted)]">
            {editingPart
              ? 'Ändere Text, Preis oder Bild und speichere das Inserat neu.'
              : 'Neue Kategorien werden automatisch gespeichert.'}
          </p>
        </div>
        <span className="pf-badge px-3 py-1 text-xs font-semibold">
          {editingPart ? 'Edit-Modus' : 'Verkäufer-Formular'}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Originalfoto *</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full rounded-2xl border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-3)] px-4 py-3 text-sm text-[var(--pf-muted)] file:mr-4 file:rounded-xl file:border-0 file:bg-[var(--pf-primary)] file:px-4 file:py-2 file:font-semibold file:text-[#04111a]"
            required={!form.imageBase64}
          />
          <p className="mt-2 text-xs text-[var(--pf-muted)]">
            Upload wird clientseitig via Canvas auf max. 800px Breite und JPEG Qualität 0.7 komprimiert.
          </p>
        </label>

        {form.imageBase64 ? (
          <div className="md:col-span-2 overflow-hidden rounded-2xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-3)] p-3">
            <img src={form.imageBase64} alt="Vorschau" className="h-56 w-full rounded-2xl object-cover" />
            <p className="mt-3 truncate text-sm text-[var(--pf-muted)]">{form.imageName}</p>
          </div>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Kategorie *</span>
          <input
            list="category-options"
            value={form.category}
            onChange={(event) => updateField('category', event.target.value)}
            placeholder="z. B. Turbolader"
            className="pf-input px-4 py-3"
            required
          />
          <datalist id="category-options">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Marke *</span>
          <input
            type="text"
            value={form.brand}
            onChange={(event) => updateField('brand', event.target.value)}
            placeholder="BMW, Audi, VW …"
            className="pf-input px-4 py-3"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Modell *</span>
          <input
            type="text"
            value={form.model}
            onChange={(event) => updateField('model', event.target.value)}
            placeholder="A4 B8, Golf 7 …"
            className="pf-input px-4 py-3"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Titel *</span>
          <input
            type="text"
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            placeholder="Original Stoßstange vorne"
            className="pf-input px-4 py-3"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Preis in € *</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(event) => updateField('price', event.target.value)}
            placeholder="149.99"
            className="pf-input px-4 py-3"
            required
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Zustand *</span>
          <select
            value={form.condition}
            onChange={(event) => updateField('condition', event.target.value)}
            className="pf-select px-4 py-3"
            required
          >
            {conditions.map((condition) => (
              <option key={condition} value={condition}>
                {condition}
              </option>
            ))}
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Beschreibung *</span>
          <textarea
            rows="5"
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder="Details, Zustand, Teilenummer, Versand, Abholung …"
            className="pf-textarea px-4 py-3"
            required
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={isSubmitting || isProcessingImage}
          className="pf-button-primary flex-1 px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isProcessingImage
            ? 'Bild wird verarbeitet…'
            : isSubmitting
              ? editingPart
                ? 'Wird aktualisiert…'
                : 'Wird gespeichert…'
              : editingPart
                ? 'Inserat aktualisieren'
                : 'Teil veröffentlichen'}
        </button>

        {editingPart ? (
          <button type="button" onClick={onCancelEdit} className="pf-button-secondary px-4 py-3">
            Bearbeiten abbrechen
          </button>
        ) : null}
      </div>
    </form>
  );
}
