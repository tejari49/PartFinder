export const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR',
});

export const formatDateTime = (timestamp, fallback = 'Just now') => {
  const date = timestamp?.toDate?.() || (timestamp instanceof Date ? timestamp : null);

  if (!date) {
    return fallback;
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const formatShortDateTime = (timestamp, fallback = 'Just now') => {
  const date = timestamp?.toDate?.() || (timestamp instanceof Date ? timestamp : null);

  if (!date) {
    return fallback;
  }

  return new Intl.DateTimeFormat('en-GB', {
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

export const getFallbackDisplayName = (user) => {
  if (!user) {
    return 'User';
  }

  if (user.displayName?.trim()) {
    return user.displayName.trim();
  }

  if (user.email?.includes('@')) {
    return user.email.split('@')[0];
  }

  return 'User';
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
    const normalized = conditionMap[key];
    return normalized;
  }

  return value.trim() || 'Used';
};
