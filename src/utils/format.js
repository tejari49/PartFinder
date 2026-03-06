export const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

export const formatDateTime = (timestamp, fallback = 'Gerade eben') => {
  const date = timestamp?.toDate?.() || (timestamp instanceof Date ? timestamp : null);

  if (!date) {
    return fallback;
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const formatShortDateTime = (timestamp, fallback = 'Gerade eben') => {
  const date = timestamp?.toDate?.() || (timestamp instanceof Date ? timestamp : null);

  if (!date) {
    return fallback;
  }

  return new Intl.DateTimeFormat('de-DE', {
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
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const getFallbackDisplayName = (user) => {
  if (!user) {
    return 'Nutzer';
  }

  if (user.displayName?.trim()) {
    return user.displayName.trim();
  }

  if (user.email?.includes('@')) {
    return user.email.split('@')[0];
  }

  return 'Nutzer';
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
