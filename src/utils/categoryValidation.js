const bannedFragments = [
  'arsch',
  'asshole',
  'bastard',
  'bitch',
  'cock',
  'cunt',
  'dildo',
  'fick',
  'fuck',
  'fotze',
  'hitler',
  'hure',
  'hurensohn',
  'idiot',
  'kanake',
  'kack',
  'nazi',
  'nigger',
  'nutte',
  'penis',
  'pimmel',
  'porno',
  'pussy',
  'scheiss',
  'scheisse',
  'schlampe',
  'sex',
  'spast',
  'titte',
  'trottel',
  'vagina',
  'whore',
  'wichs',
];

const automotiveKeywords = [
  'airbag',
  'axle',
  'starter',
  'antenna',
  'exhaust',
  'battery',
  'indicator',
  'brake',
  'cockpit',
  'gasket',
  'dpf',
  'throttle',
  'spring',
  'rim',
  'filter',
  'windshield',
  'transmission',
  'tailgate',
  'headlight',
  'hood',
  'injector',
  'catalyst',
  'piston',
  'fender',
  'radiator',
  'clutch',
  'alternator',
  'steering',
  'engine',
  'hub',
  'control arm',
  'wheel',
  'tire',
  'belt',
  'lock',
  'sensor',
  'mirror',
  'spoiler',
  'stabilizer',
  'ecu',
  'tank',
  'speedometer',
  'thermostat',
  'turbo',
  'door',
  'valve',
  'water pump',
  'timing belt',
  'spark plug',
  'zundkerze',
  'zundspule',
  'turbolader',
  'scheinwerfer',
  'getriebe',
  'bremse',
  'stossstange',
  'stosstange',
  'kupplung',
  'motor',
];

const normalize = (value = '') =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u00DF/g, 'ss');

const text = {
  en: {
    enterCategory: 'Please enter a category.',
    length: 'Category must be between 3 and 40 characters.',
    charset: 'Category may only contain letters, numbers, spaces, and + - & / .',
    inappropriate: 'Category contains inappropriate terms.',
    automotiveOnly: 'New categories must clearly relate to vehicle parts or automotive technology.',
    existing: 'Existing category selected.',
    validNew: 'New automotive category is valid.',
  },
  de: {
    enterCategory: 'Bitte eine Kategorie eingeben.',
    length: 'Kategorie muss zwischen 3 und 40 Zeichen lang sein.',
    charset: 'Kategorie darf nur Buchstaben, Zahlen, Leerzeichen sowie + - & / . enthalten.',
    inappropriate: 'Kategorie enthaelt ungeeignete Begriffe.',
    automotiveOnly: 'Neue Kategorien muessen klar mit Autoteilen oder Fahrzeugtechnik zu tun haben.',
    existing: 'Bestehende Kategorie ausgewaehlt.',
    validNew: 'Neue Autoteile-Kategorie ist gueltig.',
  },
};

export function validateCategoryInput(rawValue, existingCategories = [], language = 'en') {
  const t = language === 'de' ? text.de : text.en;
  const value = rawValue.trim();

  if (!value) {
    return {
      ok: false,
      reason: t.enterCategory,
      isExisting: false,
    };
  }

  if (value.length < 3 || value.length > 40) {
    return {
      ok: false,
      reason: t.length,
      isExisting: false,
    };
  }

  if (!/^[\p{L}\p{N}][\p{L}\p{N} +&/.\-]*$/u.test(value)) {
    return {
      ok: false,
      reason: t.charset,
      isExisting: false,
    };
  }

  const normalizedValue = normalize(value);
  const existingNormalized = existingCategories.map((entry) => normalize(entry));
  const isExisting = existingNormalized.includes(normalizedValue);

  if (bannedFragments.some((fragment) => normalizedValue.includes(fragment))) {
    return {
      ok: false,
      reason: t.inappropriate,
      isExisting,
    };
  }

  if (!isExisting) {
    const hasAutomotiveKeyword = automotiveKeywords.some((keyword) => normalizedValue.includes(keyword));

    if (!hasAutomotiveKeyword) {
      return {
        ok: false,
        reason: t.automotiveOnly,
        isExisting: false,
      };
    }
  }

  return {
    ok: true,
    reason: isExisting ? t.existing : t.validNew,
    isExisting,
  };
}
