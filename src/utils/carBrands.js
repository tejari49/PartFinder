const brandTaxonomy = [
  {
    key: 'europe',
    label: { en: 'Europe', de: 'Europa' },
    groups: [
      {
        key: 'germany',
        label: { en: 'Germany', de: 'Deutschland' },
        brands: [
          'Alpina',
          'Apollo Automobil',
          'Artega',
          'Audi',
          'BMW',
          'Borgward',
          'Brabus',
          'Gumpert',
          'Isdera',
          'MAN',
          'Maybach',
          'Mercedes-Benz',
          'Opel',
          'Porsche',
          'Ruf',
          'Smart',
          'Volkswagen',
          'Wiesmann',
        ],
      },
      {
        key: 'france',
        label: { en: 'France', de: 'Frankreich' },
        brands: [
          'Aixam',
          'Alpine',
          'Bugatti',
          'Citroen',
          'DS Automobiles',
          'Delage',
          'Delahaye',
          'Ligier',
          'Matra',
          'Panhard',
          'Peugeot',
          'Renault',
          'Simca',
          'Talbot',
          'Venturi',
        ],
      },
      {
        key: 'italy',
        label: { en: 'Italy', de: 'Italien' },
        brands: [
          'Abarth',
          'Alfa Romeo',
          'Autobianchi',
          'Bizzarrini',
          'De Tomaso',
          'DR Automobiles',
          'Ferrari',
          'Fiat',
          'Innocenti',
          'Iso Rivolta',
          'Iveco',
          'Lamborghini',
          'Lancia',
          'Maserati',
          'Pagani',
          'Piaggio',
          'Siata',
          'Zagato',
        ],
      },
      {
        key: 'uk_ireland',
        label: { en: 'UK & Ireland', de: 'UK & Irland' },
        brands: [
          'Ariel',
          'Aston Martin',
          'BAC',
          'Bentley',
          'Caterham',
          'DeLorean',
          'Ginetta',
          'Gordon Murray Automotive',
          'Jaguar',
          'Jensen',
          'Land Rover',
          'LEVC',
          'Lotus',
          'LTI',
          'McLaren',
          'MG',
          'Mini',
          'Morgan',
          'Noble',
          'Rolls-Royce',
          'TVR',
          'Vauxhall',
          'Westfield',
        ],
      },
      {
        key: 'spain_portugal',
        label: { en: 'Spain & Portugal', de: 'Spanien & Portugal' },
        brands: [
          'AJP',
          'Cupra',
          'GTA Motor',
          'Hispano Suiza',
          'Hurtan',
          'Santana',
          'SEAT',
          'Tauro Sport Auto',
          'UMM',
        ],
      },
      {
        key: 'nordics',
        label: { en: 'Nordics', de: 'Nordics' },
        brands: [
          'Koenigsegg',
          'Polestar',
          'Saab',
          'Scania',
          'Sisu',
          'Think',
          'Valmet',
          'Volvo',
          'Zenvo',
        ],
      },
      {
        key: 'benelux',
        label: { en: 'Benelux', de: 'Benelux' },
        brands: [
          'Burton',
          'DAF',
          'Donkervoort',
          'Gillet',
          'Imperia',
          'Minerva',
          'Spyker',
          'Vencer',
        ],
      },
      {
        key: 'central_europe',
        label: { en: 'Central Europe', de: 'Mitteleuropa' },
        brands: [
          'Kaipan',
          'Praga',
          'Skoda',
          'Tatra',
          'Wikov',
        ],
      },
      {
        key: 'alps',
        label: { en: 'Alps (AT/CH)', de: 'Alpen (AT/CH)' },
        brands: [
          'KTM',
          'Magna Steyr',
          'Monteverdi',
          'Pic-Pic',
          'Puch',
          'Rinspeed',
          'Sbarro',
        ],
      },
      {
        key: 'eastern_europe',
        label: { en: 'Eastern Europe', de: 'Osteuropa' },
        brands: [
          'Arrinera',
          'Aurus',
          'FSO',
          'GAZ',
          'Lada',
          'LuAZ',
          'Moskvitch',
          'Oltcit',
          'Syrena',
          'UAZ',
          'Warszawa',
          'ZAZ',
          'ZIL',
        ],
      },
    ],
  },
  {
    key: 'balkan',
    label: { en: 'Balkans', de: 'Balkan' },
    groups: [
      {
        key: 'romania_bulgaria',
        label: { en: 'Romania & Bulgaria', de: 'Rumaenien & Bulgarien' },
        brands: [
          'ARO',
          'Bulgaralpine',
          'DAC',
          'Dacia',
          'Litex Motors',
          'Oltcit',
          'Roman',
          'SIN Cars',
        ],
      },
      {
        key: 'ex_yugoslavia',
        label: { en: 'Ex-Yugoslavia', de: 'Ex-Jugoslawien' },
        brands: [
          'DOK-ING',
          'IMV',
          'Rimac',
          'TAM',
          'Tushek',
          'Yugo',
          'Zastava',
        ],
      },
      {
        key: 'greece_cyprus',
        label: { en: 'Greece & Cyprus', de: 'Griechenland & Zypern' },
        brands: [
          'Enfield',
          'Korres',
          'Namco',
        ],
      },
      {
        key: 'turkey',
        label: { en: 'Turkey (SE Europe)', de: 'Tuerkei (SE Europa)' },
        brands: [
          'Anadol',
          'BMC',
          'Karsan',
          'Otokar',
          'TEMSA',
          'Tofas',
          'TOGG',
        ],
      },
    ],
  },
];

const normalize = (value = '') => value.toString().trim().toLowerCase();

const uniqueSorted = (brands = []) =>
  [...new Set(brands.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

const findMainCategory = (mainCategoryKey) =>
  brandTaxonomy.find((entry) => entry.key === normalize(mainCategoryKey)) || brandTaxonomy[0];

export const getBrandMainCategories = (language = 'en') =>
  brandTaxonomy.map((entry) => ({
    key: entry.key,
    label: language === 'de' ? entry.label.de : entry.label.en,
  }));

export const getBrandGroups = (mainCategoryKey = 'europe', language = 'en') => {
  const mainCategory = findMainCategory(mainCategoryKey);
  return mainCategory.groups.map((group) => ({
    key: group.key,
    label: language === 'de' ? group.label.de : group.label.en,
    brandCount: uniqueSorted(group.brands).length,
  }));
};

export const getBrandsBySelection = (mainCategoryKey = 'europe', groupKey = 'all') => {
  const mainCategory = findMainCategory(mainCategoryKey);
  const normalizedGroup = normalize(groupKey);

  if (!normalizedGroup || normalizedGroup === 'all') {
    return uniqueSorted(mainCategory.groups.flatMap((group) => group.brands));
  }

  const group = mainCategory.groups.find((entry) => entry.key === normalizedGroup);
  return uniqueSorted(group?.brands || []);
};

export const getBrandMainCategoryLabel = (mainCategoryKey, language = 'en') => {
  const mainCategory = brandTaxonomy.find((entry) => entry.key === normalize(mainCategoryKey));
  if (!mainCategory) return '';
  return language === 'de' ? mainCategory.label.de : mainCategory.label.en;
};

export const getBrandGroupLabel = (mainCategoryKey, groupKey, language = 'en') => {
  const mainCategory = brandTaxonomy.find((entry) => entry.key === normalize(mainCategoryKey));
  if (!mainCategory) return '';
  const group = mainCategory.groups.find((entry) => entry.key === normalize(groupKey));
  if (!group) return '';
  return language === 'de' ? group.label.de : group.label.en;
};

export const findBrandSelection = (brand) => {
  const needle = normalize(brand);
  if (!needle) {
    return {
      mainCategory: 'europe',
      group: 'all',
    };
  }

  for (const mainCategory of brandTaxonomy) {
    for (const group of mainCategory.groups) {
      if (group.brands.some((entry) => normalize(entry) === needle)) {
        return {
          mainCategory: mainCategory.key,
          group: group.key,
        };
      }
    }
  }

  return {
    mainCategory: 'europe',
    group: 'all',
  };
};

