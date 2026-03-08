const LANGUAGE_KEY = 'partfinder-language';

const getStoredLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  const value = window.localStorage.getItem(LANGUAGE_KEY);
  return value === 'de' ? 'de' : 'en';
};

const getLocale = (language = getStoredLanguage()) => (language === 'de' ? 'de-DE' : 'en-GB');

export const currencyFormatter = {
  format(value, language = getStoredLanguage()) {
    return new Intl.NumberFormat(getLocale(language), {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  },
};

export const formatDateTime = (timestamp, fallback = null, language = getStoredLanguage()) => {
  const date = timestamp?.toDate?.() || (timestamp instanceof Date ? timestamp : null);

  if (!date) {
    if (fallback) return fallback;
    return language === 'de' ? 'Gerade eben' : 'Just now';
  }

  return new Intl.DateTimeFormat(getLocale(language), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const formatShortDateTime = (timestamp, fallback = null, language = getStoredLanguage()) => {
  const date = timestamp?.toDate?.() || (timestamp instanceof Date ? timestamp : null);

  if (!date) {
    if (fallback) return fallback;
    return language === 'de' ? 'Gerade eben' : 'Just now';
  }

  return new Intl.DateTimeFormat(getLocale(language), {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

export const normalizeCategoryName = (value = '') =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

export const slugify = (value = '') =>
  value
    .trim()
    .toLowerCase()
    .replace(/\u00DF/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const getFallbackDisplayName = (user, language = getStoredLanguage()) => {
  if (!user) {
    return language === 'de' ? 'Nutzer' : 'User';
  }

  if (user.displayName?.trim()) {
    return user.displayName.trim();
  }

  if (user.email?.includes('@')) {
    return user.email.split('@')[0];
  }

  return language === 'de' ? 'Nutzer' : 'User';
};

export const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return 'PF';
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('');
};

export const normalizePhone = (value = '') => value.replace(/[^\d]/g, '');

const conditionMap = {
  new: 'New',
  like_new: 'Like new',
  used: 'Used',
  defective: 'Defective / DIY',
  refurbished: 'Refurbished',
  neu: 'New',
  neuwertig: 'Like new',
  gebraucht: 'Used',
  'defekt / bastler': 'Defective / DIY',
  generaluberholt: 'Refurbished',
  generalueberholt: 'Refurbished',
};

export const normalizeConditionValue = (value = '') => {
  const key = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

  if (conditionMap[key]) {
    return conditionMap[key];
  }

  return value.trim() || 'Used';
};

export const getConditionLabel = (condition, language = getStoredLanguage()) => {
  const normalized = normalizeConditionValue(condition);
  if (language !== 'de') return normalized;

  const map = {
    New: 'Neu',
    'Like new': 'Neuwertig',
    Used: 'Gebraucht',
    'Defective / DIY': 'Defekt / Bastler',
    Refurbished: 'Generalueberholt',
  };
  return map[normalized] || normalized;
};
