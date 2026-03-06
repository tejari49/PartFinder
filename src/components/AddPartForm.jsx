import { useRef, useState } from 'react';

const initialState = {
  category: '',
  brand: '',
  model: '',
  title: '',
  price: '',
  condition: 'Gebraucht - gut',
  description: '',
  imageBase64: '',
  imageName: '',
};

const conditions = [
  'Neu',
  'Wie neu',
  'Gebraucht - sehr gut',
  'Gebraucht - gut',
  'Gebraucht - akzeptabel',
  'Defekt / Bastlerware',
];

const resizeImageToBase64 = (file, maxWidth = 800, quality = 0.7) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const ratio = image.width > maxWidth ? maxWidth / image.width : 1;
        const canvas = document.createElement('canvas');
        const width = Math.round(image.width * ratio);
        const height = Math.round(image.height * ratio);
        const context = canvas.getContext('2d');

        canvas.width = width;
        canvas.height = height;

        if (!context) {
          reject(new Error('Canvas-Kontext konnte nicht erstellt werden.'));
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      image.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
    reader.readAsDataURL(file);
  });

export default function AddPartForm({ categories, onSubmit, onToast }) {
  const [form, setForm] = useState(initialState);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

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
      const imageBase64 = await resizeImageToBase64(file);
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.imageBase64) {
      onToast('Ein Originalfoto ist Pflicht.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(form);
      setForm(initialState);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Teil anbieten</h2>
          <p className="mt-1 text-sm text-slate-300">Neue Kategorien werden automatisch gespeichert.</p>
        </div>
        <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
          Verkäufer-Formular
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-slate-200">Originalfoto *</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full rounded-2xl border border-dashed border-white/15 bg-slate-950/70 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-semibold file:text-slate-950 hover:file:bg-cyan-300"
            required
          />
          <p className="mt-2 text-xs text-slate-400">
            Upload wird clientseitig via Canvas auf max. 800px Breite und JPEG Qualität 0.7 komprimiert.
          </p>
        </label>

        {form.imageBase64 && (
          <div className="md:col-span-2 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 p-3">
            <img
              src={form.imageBase64}
              alt="Vorschau"
              className="h-56 w-full rounded-2xl object-cover"
            />
            <p className="mt-3 truncate text-sm text-slate-300">{form.imageName}</p>
          </div>
        )}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">Kategorie *</span>
          <input
            list="category-options"
            value={form.category}
            onChange={(event) => updateField('category', event.target.value)}
            placeholder="z. B. Turbolader"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
            required
          />
          <datalist id="category-options">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">Marke *</span>
          <input
            type="text"
            value={form.brand}
            onChange={(event) => updateField('brand', event.target.value)}
            placeholder="BMW, Audi, VW …"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">Modell *</span>
          <input
            type="text"
            value={form.model}
            onChange={(event) => updateField('model', event.target.value)}
            placeholder="A4 B8, Golf 7 …"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">Titel *</span>
          <input
            type="text"
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            placeholder="Original Stoßstange vorne"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">Preis in € *</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(event) => updateField('price', event.target.value)}
            placeholder="149.99"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
            required
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-slate-200">Zustand *</span>
          <select
            value={form.condition}
            onChange={(event) => updateField('condition', event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60"
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
          <span className="mb-2 block text-sm font-medium text-slate-200">Beschreibung *</span>
          <textarea
            rows="5"
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder="Details, Zustand, Teilenummer, Versand, Abholung …"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
            required
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isProcessingImage}
        className="mt-5 w-full rounded-2xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isProcessingImage
          ? 'Bild wird verarbeitet…'
          : isSubmitting
            ? 'Wird gespeichert…'
            : 'Teil veröffentlichen'}
      </button>
    </form>
  );
}
