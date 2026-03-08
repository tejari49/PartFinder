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

export function validateCategoryInput(rawValue, existingCategories = []) {
  const value = rawValue.trim();

  if (!value) {
    return {
      ok: false,
      reason: 'Please enter a category.',
      isExisting: false,
    };
  }

  if (value.length < 3 || value.length > 40) {
    return {
      ok: false,
      reason: 'Category must be between 3 and 40 characters.',
      isExisting: false,
    };
  }

  if (!/^[\p{L}\p{N}][\p{L}\p{N} +&/.\-]*$/u.test(value)) {
    return {
      ok: false,
      reason: 'Category may only contain letters, numbers, spaces, and + - & / .',
      isExisting: false,
    };
  }

  const normalizedValue = normalize(value);
  const existingNormalized = existingCategories.map((entry) => normalize(entry));
  const isExisting = existingNormalized.includes(normalizedValue);

  if (bannedFragments.some((fragment) => normalizedValue.includes(fragment))) {
    return {
      ok: false,
      reason: 'Category contains inappropriate terms.',
      isExisting,
    };
  }

  if (!isExisting) {
    const hasAutomotiveKeyword = automotiveKeywords.some((keyword) => normalizedValue.includes(keyword));

    if (!hasAutomotiveKeyword) {
      return {
        ok: false,
        reason: 'New categories must clearly relate to vehicle parts or automotive technology.',
        isExisting: false,
      };
    }
  }

  return {
    ok: true,
    reason: isExisting
      ? 'Existing category selected.'
      : 'New automotive category is valid.',
    isExisting,
  };
}
