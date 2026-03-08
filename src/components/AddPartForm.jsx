import { useEffect, useMemo, useRef, useState } from 'react';
import { validateCategoryInput } from '../utils/categoryValidation';
import {
  findBrandSelection,
  getBrandGroups,
  getBrandMainCategories,
  getBrandsBySelection,
} from '../utils/carBrands';
import { normalizeConditionValue } from '../utils/format';
import { resizeImageToBase64 } from '../utils/image';

const initialState = {
  category: '',
  brandMainCategory: 'europe',
  brandGroup: 'all',
  brand: '',
  model: '',
  oemNumber: '',
  engineCode: '',
  yearFrom: '',
  yearTo: '',
  vehicleGeneration: '',
  title: '',
  price: '',
  condition: 'Used',
  description: '',
  imagesBase64: [],
  location: '',
  shippingAvailable: false,
  pickupAvailable: true,
};

const conditionOptions = [
  { value: 'New', en: 'New', de: 'Neu' },
  { value: 'Like new', en: 'Like new', de: 'Neuwertig' },
  { value: 'Used', en: 'Used', de: 'Gebraucht' },
  { value: 'Defective / DIY', en: 'Defective / DIY', de: 'Defekt / Bastler' },
  { value: 'Refurbished', en: 'Refurbished', de: 'Generalueberholt' },
];

const MAX_IMAGES = 3;
const MAX_TOTAL_BASE64_CHARS = 950000;

const text = {
  en: {
    edit: 'Edit listing',
    create: 'Create listing',
    hint: 'New categories are only accepted if they clearly match automotive parts.',
    cancel: 'Cancel',
    category: 'Category',
    categoryPlaceholder: 'e.g. Turbocharger',
    categoryHint: 'Choose an existing category or enter a new automotive one.',
    condition: 'Condition',
    price: 'Price (EUR)',
    brandPresets: 'Common brands by region (Europe + Balkans)',
    mainCategory: 'Region',
    brandGroup: 'Usage group',
    allGroups: 'All groups',
    brandHint: (count) => `${count} common brands available. You can still type your own brand.`,
    brand: 'Brand',
    brandPlaceholder: 'Select or type brand (e.g. BMW)',
    model: 'Model',
    modelPlaceholder: 'e.g. 320d E90',
    compatibility: 'Compatibility',
    oem: 'OEM number',
    oemPlaceholder: 'e.g. 11657790806',
    engineCode: 'Engine code',
    enginePlaceholder: 'e.g. N47D20C',
    yearFrom: 'Year from',
    yearTo: 'Year to',
    generation: 'Model generation',
    generationPlaceholder: 'e.g. E90 Facelift',
    title: 'Title',
    titlePlaceholder: 'Original BMW turbocharger 320d',
    location: 'Location',
    locationPlaceholder: 'Zurich / Winterthur / Bern',
    shippingPickup: 'Shipping / Pickup',
    shipping: 'Shipping available',
    pickup: 'Pickup available',
    description: 'Description',
    descriptionPlaceholder: 'Details, compatibility, issues, shipping notes...',
    images: 'Images',
    imageHint: `Up to ${MAX_IMAGES} images. The first image is used as the preview.`,
    soldHint: 'This listing is currently marked as sold. You can switch it back to active in details or dashboard.',
    processing: 'Processing images...',
    saving: 'Saving...',
    update: 'Update listing',
    publish: 'Publish listing',
    imagesTooLarge: 'Combined image size is too large. Please select smaller images.',
    imagesPrepared: (count) => `${count} image${count > 1 ? 's' : ''} prepared.`,
    imageError: 'Images could not be processed.',
    invalidCategory: 'Category is invalid.',
    atLeastOneImage: 'At least one image is required.',
    preview: (index) => `Preview ${index}`,
  },
  de: {
    edit: 'Inserat bearbeiten',
    create: 'Teil einstellen',
    hint: 'Neue Kategorien werden nur akzeptiert, wenn sie klar zu Autoteilen passen.',
    cancel: 'Abbrechen',
    category: 'Kategorie',
    categoryPlaceholder: 'z. B. Turbolader',
    categoryHint: 'Bestehende Kategorie waehlen oder neue Autoteile-Kategorie eingeben.',
    condition: 'Zustand',
    price: 'Preis (EUR)',
    brandPresets: 'Haeufige Marken nach Region (Europa + Balkan)',
    mainCategory: 'Region',
    brandGroup: 'Nutzungsgruppe',
    allGroups: 'Alle Gruppen',
    brandHint: (count) => `${count} haeufige Marken verfuegbar. Du kannst trotzdem frei tippen.`,
    brand: 'Marke',
    brandPlaceholder: 'Marke waehlen oder tippen (z. B. BMW)',
    model: 'Modell',
    modelPlaceholder: 'z. B. 320d E90',
    compatibility: 'Kompatibilitaet',
    oem: 'OEM Nummer',
    oemPlaceholder: 'z. B. 11657790806',
    engineCode: 'Motorcode',
    enginePlaceholder: 'z. B. N47D20C',
    yearFrom: 'Baujahr von',
    yearTo: 'Baujahr bis',
    generation: 'Modellgeneration',
    generationPlaceholder: 'z. B. E90 Facelift',
    title: 'Titel',
    titlePlaceholder: 'Original BMW Turbolader 320d',
    location: 'Standort',
    locationPlaceholder: 'Zurich / Winterthur / Bern',
    shippingPickup: 'Versand / Abholung',
    shipping: 'Versand moeglich',
    pickup: 'Abholung moeglich',
    description: 'Beschreibung',
    descriptionPlaceholder: 'Details, Kompatibilitaet, Maengel, Versandhinweise...',
    images: 'Bilder',
    imageHint: `Maximal ${MAX_IMAGES} Bilder. Das erste Bild wird als Vorschau genutzt.`,
    soldHint: 'Dieses Inserat ist aktuell als verkauft markiert. Du kannst es wieder auf aktiv setzen.',
    processing: 'Bilder werden verarbeitet...',
    saving: 'Speichert...',
    update: 'Inserat aktualisieren',
    publish: 'Inserat veroeffentlichen',
    imagesTooLarge: 'Bilder sind zusammen zu gross. Bitte kleinere Bilder waehlen.',
    imagesPrepared: (count) => `${count} Bild${count > 1 ? 'er' : ''} vorbereitet.`,
    imageError: 'Bilder konnten nicht verarbeitet werden.',
    invalidCategory: 'Kategorie ist ungueltig.',
    atLeastOneImage: 'Mindestens ein Bild ist Pflicht.',
    preview: (index) => `Vorschau ${index}`,
  },
};

export default function AddPartForm({
  language = 'en',
  categories,
  onSubmit,
  onToast,
  editingPart,
  onCancelEdit,
}) {
  const t = language === 'de' ? text.de : text.en;
  const [form, setForm] = useState(initialState);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const baseMainCategoryOptions = useMemo(() => getBrandMainCategories('en'), []);

  const mainCategoryOptions = useMemo(
    () => getBrandMainCategories(language),
    [language],
  );

  const activeMainCategory = useMemo(() => {
    const valid = baseMainCategoryOptions.some((entry) => entry.key === form.brandMainCategory);
    return valid ? form.brandMainCategory : 'europe';
  }, [baseMainCategoryOptions, form.brandMainCategory]);

  const brandGroupOptions = useMemo(
    () => getBrandGroups(activeMainCategory, language),
    [activeMainCategory, language],
  );

  const activeBrandGroup = useMemo(() => {
    const valid = brandGroupOptions.some((entry) => entry.key === form.brandGroup);
    return valid ? form.brandGroup : 'all';
  }, [brandGroupOptions, form.brandGroup]);

  const availableBrands = useMemo(
    () => getBrandsBySelection(activeMainCategory, activeBrandGroup),
    [activeBrandGroup, activeMainCategory],
  );

  useEffect(() => {
    if (!editingPart) {
      setForm(initialState);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const inferredSelection = findBrandSelection(editingPart.brand || '');

    setForm({
      category: editingPart.category || '',
      brandMainCategory: editingPart.brandMainCategory || inferredSelection.mainCategory,
      brandGroup: editingPart.brandGroup || inferredSelection.group,
      brand: editingPart.brand || '',
      model: editingPart.model || '',
      oemNumber: editingPart.oemNumber || '',
      engineCode: editingPart.engineCode || '',
      yearFrom: editingPart.yearFrom ?? '',
      yearTo: editingPart.yearTo ?? '',
      vehicleGeneration: editingPart.vehicleGeneration || '',
      title: editingPart.title || '',
      price: editingPart.price ?? '',
      condition: normalizeConditionValue(editingPart.condition || 'Used'),
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
    return validateCategoryInput(form.category, categories, language);
  }, [categories, form.category, language]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, MAX_IMAGES);
    if (files.length === 0) return;

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
        onToast(t.imagesTooLarge, 'error');
        return;
      }

      setForm((prev) => ({
        ...prev,
        imagesBase64: nextImages,
      }));

      onToast(t.imagesPrepared(nextImages.length), 'success');
    } catch (error) {
      console.error(error);
      onToast(t.imageError, 'error');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!categoryValidation?.ok) {
      onToast(categoryValidation?.reason || t.invalidCategory, 'error');
      return;
    }

    if (form.imagesBase64.length === 0) {
      onToast(t.atLeastOneImage, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          ...form,
          brandMainCategory: activeMainCategory,
          brandGroup: activeBrandGroup,
          condition: normalizeConditionValue(form.condition),
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
          <h2 className="text-lg font-bold text-[var(--pf-text)]">{editingPart ? t.edit : t.create}</h2>
          <p className="mt-1 text-sm text-[var(--pf-muted)]">{t.hint}</p>
        </div>
        {editingPart ? (
          <button type="button" onClick={onCancelEdit} className="pf-button-secondary px-3 py-2 text-sm">
            {t.cancel}
          </button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">{t.category}</span>
            <input
              list="partfinder-categories"
              value={form.category}
              onChange={(event) => updateField('category', event.target.value)}
              placeholder={t.categoryPlaceholder}
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
              {categoryValidation ? categoryValidation.reason : t.categoryHint}
            </p>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">{t.condition}</span>
            <select
              value={form.condition}
              onChange={(event) => updateField('condition', event.target.value)}
              className="pf-select px-4 py-3"
            >
              {conditionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {language === 'de' ? option.de : option.en}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">{t.price}</span>
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

        <div className="rounded-[1.15rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4">
          <p className="mb-3 text-sm font-semibold text-[var(--pf-text)]">{t.brandPresets}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">{t.mainCategory}</span>
              <select
                value={activeMainCategory}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    brandMainCategory: event.target.value,
                    brandGroup: 'all',
                  }))
                }
                className="pf-select px-4 py-3"
              >
                {mainCategoryOptions.map((entry) => (
                  <option key={entry.key} value={entry.key}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">{t.brandGroup}</span>
              <select
                value={activeBrandGroup}
                onChange={(event) => updateField('brandGroup', event.target.value)}
                className="pf-select px-4 py-3"
              >
                <option value="all">{t.allGroups}</option>
                {brandGroupOptions.map((group) => (
                  <option key={group.key} value={group.key}>
                    {group.label} ({group.brandCount})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs text-[var(--pf-muted)]">{t.brandHint(availableBrands.length)}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">{t.brand}</span>
            <input
              type="text"
              list="partfinder-brands"
              value={form.brand}
              onChange={(event) => updateField('brand', event.target.value)}
              placeholder={t.brandPlaceholder}
              className="pf-input px-4 py-3"
              required
            />
            <datalist id="partfinder-brands">
              {availableBrands.map((brand) => (
                <option key={brand} value={brand} />
              ))}
            </datalist>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">{t.model}</span>
            <input
              type="text"
              value={form.model}
              onChange={(event) => updateField('model', event.target.value)}
              placeholder={t.modelPlaceholder}
              className="pf-input px-4 py-3"
              required
            />
          </label>
        </div>

        <div className="rounded-[1.15rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4">
          <p className="mb-3 text-sm font-semibold text-[var(--pf-text)]">{t.compatibility}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">{t.oem}</span>
              <input
                type="text"
                value={form.oemNumber}
                onChange={(event) => updateField('oemNumber', event.target.value)}
                placeholder={t.oemPlaceholder}
                className="pf-input px-4 py-3"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">{t.engineCode}</span>
              <input
                type="text"
                value={form.engineCode}
                onChange={(event) => updateField('engineCode', event.target.value)}
                placeholder={t.enginePlaceholder}
                className="pf-input px-4 py-3"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">{t.yearFrom}</span>
              <input
                type="number"
                min="1900"
                max="2100"
                value={form.yearFrom}
                onChange={(event) => updateField('yearFrom', event.target.value)}
                placeholder="2010"
                className="pf-input px-4 py-3"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">{t.yearTo}</span>
              <input
                type="number"
                min="1900"
                max="2100"
                value={form.yearTo}
                onChange={(event) => updateField('yearTo', event.target.value)}
                placeholder="2013"
                className="pf-input px-4 py-3"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">{t.generation}</span>
              <input
                type="text"
                value={form.vehicleGeneration}
                onChange={(event) => updateField('vehicleGeneration', event.target.value)}
                placeholder={t.generationPlaceholder}
                className="pf-input px-4 py-3"
              />
            </label>
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">{t.title}</span>
          <input
            type="text"
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            placeholder={t.titlePlaceholder}
            className="pf-input px-4 py-3"
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">{t.location}</span>
            <input
              type="text"
              value={form.location}
              onChange={(event) => updateField('location', event.target.value)}
              placeholder={t.locationPlaceholder}
              className="pf-input px-4 py-3"
            />
          </label>

          <div className="rounded-[1.15rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4">
            <p className="mb-3 text-sm font-semibold text-[var(--pf-text)]">{t.shippingPickup}</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 text-sm text-[var(--pf-text)]">
                <input
                  type="checkbox"
                  checked={form.shippingAvailable}
                  onChange={(event) => updateField('shippingAvailable', event.target.checked)}
                />
                {t.shipping}
              </label>
              <label className="flex items-center gap-3 text-sm text-[var(--pf-text)]">
                <input
                  type="checkbox"
                  checked={form.pickupAvailable}
                  onChange={(event) => updateField('pickupAvailable', event.target.checked)}
                />
                {t.pickup}
              </label>
            </div>
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">{t.description}</span>
          <textarea
            rows="4"
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder={t.descriptionPlaceholder}
            className="pf-textarea px-4 py-3"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">{t.images}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="pf-input px-4 py-3"
          />
          <p className="mt-2 text-xs text-[var(--pf-muted)]">{t.imageHint}</p>
        </label>

        {form.imagesBase64.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {form.imagesBase64.map((image, index) => (
              <div
                key={`${image.slice(0, 30)}-${index}`}
                className="overflow-hidden rounded-[1rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-3)]"
              >
                <img src={image} alt={t.preview(index + 1)} className="h-24 w-full object-cover" />
              </div>
            ))}
          </div>
        ) : null}

        {editingPart?.status === 'sold' ? (
          <div className="rounded-[1rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {t.soldHint}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || isProcessingImage}
          className="pf-button-primary w-full px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isProcessingImage
            ? t.processing
            : isSubmitting
              ? t.saving
              : editingPart
                ? t.update
                : t.publish}
        </button>
      </form>
    </section>
  );
}
