const SYNONYM_GROUPS = [
  ['engine', 'motor'],
  ['gearbox', 'transmission', 'getriebe'],
  ['clutch', 'kupplung'],
  ['brake', 'bremse'],
  ['brake disc', 'brake rotor', 'bremsscheibe'],
  ['brake pad', 'bremsbelag'],
  ['alternator', 'lichtmaschine'],
  ['starter', 'anlasser'],
  ['radiator', 'kuehler', 'kühler'],
  ['water pump', 'wasserpumpe'],
  ['timing belt', 'zahnriemen'],
  ['timing chain', 'steuerkette'],
  ['spark plug', 'zuendkerze', 'zündkerze'],
  ['fuel pump', 'kraftstoffpumpe', 'benzinpumpe'],
  ['injector', 'einspritzduese', 'einspritzdüse'],
  ['turbo', 'turbocharger', 'turbolader'],
  ['intercooler', 'ladeluftkuehler', 'ladeluftkühler'],
  ['headlight', 'scheinwerfer'],
  ['taillight', 'rueckleuchte', 'rückleuchte'],
  ['bumper', 'stossstange', 'stoßstange'],
  ['hood', 'bonnet', 'motorhaube'],
  ['fender', 'kotfluegel', 'kotflügel'],
  ['mirror', 'spiegel'],
  ['door', 'tuer', 'tür'],
  ['window regulator', 'fensterheber'],
  ['wheel', 'rim', 'rad', 'felge'],
  ['tire', 'tyre', 'reifen'],
  ['suspension', 'fahrwerk'],
  ['shock absorber', 'stossdaempfer', 'stoßdämpfer'],
  ['spring', 'feder'],
  ['axle', 'achse'],
  ['differential', 'differenzial'],
  ['driveshaft', 'antriebswelle'],
  ['catalytic converter', 'katalysator'],
  ['dpf', 'particle filter', 'partikelfilter'],
  ['battery', 'batterie'],
  ['ac compressor', 'klimakompressor'],
  ['condenser', 'kondensator'],
  ['wiper blade', 'scheibenwischer'],
  ['oil filter', 'oelfilter', 'ölfilter'],
  ['air filter', 'luftfilter'],
  ['fuel filter', 'kraftstofffilter'],
  ['cabin filter', 'innenraumfilter', 'pollenfilter'],
  ['ecu', 'steuergeraet', 'steuergerät', 'motorsteuergeraet', 'motorsteuergerät'],
];

export const normalizeSearchText = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const addVariantToTokenSet = (tokenSet, variant) => {
  const normalized = normalizeSearchText(variant);
  if (!normalized) return;
  tokenSet.add(normalized);
  normalized.split(' ').forEach((token) => {
    if (token) tokenSet.add(token);
  });
};

export const buildPartSearchText = (part = {}) => {
  const source = [
    part.brand,
    part.model,
    part.title,
    part.category,
    part.description,
    part.oemNumber,
    part.engineCode,
    part.vehicleGeneration,
    part.location,
  ]
    .filter(Boolean)
    .join(' ');

  const normalizedSource = normalizeSearchText(source);
  if (!normalizedSource) return '';

  const tokenSet = new Set(normalizedSource.split(' '));

  SYNONYM_GROUPS.forEach((group) => {
    const normalizedVariants = group.map((variant) => normalizeSearchText(variant));
    const hasMatch = normalizedVariants.some((variant) => {
      if (!variant) return false;
      return normalizedSource.includes(variant);
    });

    if (!hasMatch) return;

    normalizedVariants.forEach((variant) => addVariantToTokenSet(tokenSet, variant));
  });

  return `${normalizedSource} ${Array.from(tokenSet).join(' ')}`.trim();
};

export const matchesSearchQuery = (searchText = '', query = '') => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const haystack = normalizeSearchText(searchText);
  if (!haystack) return false;

  if (haystack.includes(normalizedQuery)) return true;

  const tokens = normalizedQuery.split(' ').filter(Boolean);
  return tokens.every((token) => haystack.includes(token));
};

