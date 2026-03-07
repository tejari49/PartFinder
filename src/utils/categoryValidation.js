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
  'scheiße',
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
  'achse',
  'anlasser',
  'antenne',
  'auspuff',
  'batterie',
  'blinker',
  'bremse',
  'brems',
  'cockpit',
  'dichtung',
  'dpf',
  'drosselklappe',
  'feder',
  'felge',
  'filter',
  'frontscheibe',
  'getriebe',
  'heckklappe',
  'heckleuchte',
  'haube',
  'injektor',
  'kardan',
  'katalysator',
  'kofferraum',
  'kolben',
  'kotfluegel',
  'kotflügel',
  'kuehler',
  'kühler',
  'kupplung',
  'ladung',
  'lichtmaschine',
  'lenkrad',
  'llk',
  'motor',
  'nabe',
  'oelfilter',
  'ölfilter',
  'querlenker',
  'rad',
  'reifen',
  'riemen',
  'scheinwerfer',
  'schloss',
  'schweller',
  'sensor',
  'servo',
  'sitz',
  'spiegel',
  'spoiler',
  'stabilisator',
  'steuergeraet',
  'steuergerät',
  'stossdaempfer',
  'stoßdämpfer',
  'stossstange',
  'stoßstange',
  'tank',
  'tacho',
  'thermostat',
  'turbo',
  'turbolader',
  'tuer',
  'tür',
  'ventil',
  'wasserpumpe',
  'zahnriemen',
  'zierleiste',
  'zuendspule',
  'zündspule',
  'zündkerze',
  'zuendkerze',
];

const normalize = (value = '') =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss');

export function validateCategoryInput(rawValue, existingCategories = []) {
  const value = rawValue.trim();

  if (!value) {
    return {
      ok: false,
      reason: 'Bitte eine Kategorie eingeben.',
      isExisting: false,
    };
  }

  if (value.length < 3 || value.length > 40) {
    return {
      ok: false,
      reason: 'Kategorie muss zwischen 3 und 40 Zeichen lang sein.',
      isExisting: false,
    };
  }

  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ0-9][A-Za-zÀ-ÖØ-öø-ÿ0-9 +&/.\-]*$/.test(value)) {
    return {
      ok: false,
      reason: 'Kategorie darf nur Buchstaben, Zahlen, Leerzeichen sowie + - & / . enthalten.',
      isExisting: false,
    };
  }

  const normalizedValue = normalize(value);
  const existingNormalized = existingCategories.map((entry) => normalize(entry));
  const isExisting = existingNormalized.includes(normalizedValue);

  if (bannedFragments.some((fragment) => normalizedValue.includes(fragment))) {
    return {
      ok: false,
      reason: 'Kategorie enthält ungeeignete Begriffe.',
      isExisting,
    };
  }

  if (!isExisting) {
    const hasAutomotiveKeyword = automotiveKeywords.some((keyword) => normalizedValue.includes(keyword));

    if (!hasAutomotiveKeyword) {
      return {
        ok: false,
        reason: 'Neue Kategorien müssen klar mit Autoteilen oder Fahrzeugtechnik zu tun haben.',
        isExisting: false,
      };
    }
  }

  return {
    ok: true,
    reason: isExisting
      ? 'Bestehende Kategorie ausgewählt.'
      : 'Neue Autoteile-Kategorie ist gültig.',
    isExisting,
  };
}
