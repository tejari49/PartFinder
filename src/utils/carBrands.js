const brandTaxonomy = [
  {
    key: 'europe',
    label: { en: 'Europe (common use)', de: 'Europa (haeufig genutzt)' },
    groups: [
      {
        key: 'europe_top_volume',
        label: { en: 'Top used (volume)', de: 'Am haeufigsten genutzt' },
        brands: [
          'Audi',
          'Citroen',
          'Dacia',
          'Fiat',
          'Ford',
          'Hyundai',
          'Kia',
          'Nissan',
          'Opel',
          'Peugeot',
          'Renault',
          'SEAT',
          'Skoda',
          'Toyota',
          'Volkswagen',
        ],
      },
      {
        key: 'europe_premium',
        label: { en: 'Premium frequently seen', de: 'Premium haeufig im Verkehr' },
        brands: [
          'Alfa Romeo',
          'Audi',
          'BMW',
          'Jaguar',
          'Land Rover',
          'Lexus',
          'Mercedes-Benz',
          'Porsche',
          'Tesla',
          'Volvo',
        ],
      },
      {
        key: 'europe_asian_common',
        label: { en: 'Asian brands common in Europe', de: 'Asiatische Marken in Europa haeufig' },
        brands: [
          'Honda',
          'Hyundai',
          'Kia',
          'Mazda',
          'Mitsubishi',
          'Nissan',
          'Subaru',
          'Suzuki',
          'Toyota',
        ],
      },
      {
        key: 'europe_ev_hybrid',
        label: { en: 'EV/Hybrid common', de: 'EV/Hybrid haeufig' },
        brands: [
          'Audi',
          'BMW',
          'BYD',
          'Hyundai',
          'Kia',
          'Mercedes-Benz',
          'MG',
          'Nissan',
          'Peugeot',
          'Renault',
          'Tesla',
          'Toyota',
          'Volkswagen',
          'Volvo',
        ],
      },
      {
        key: 'europe_vans_lcv',
        label: { en: 'Vans & LCV common', de: 'Transporter haeufig' },
        brands: [
          'Citroen',
          'Fiat',
          'Ford',
          'Iveco',
          'MAN',
          'Mercedes-Benz',
          'Nissan',
          'Opel',
          'Peugeot',
          'Renault',
          'Toyota',
          'Volkswagen',
        ],
      },
    ],
  },
  {
    key: 'balkan',
    label: { en: 'Balkans (common use)', de: 'Balkan (haeufig genutzt)' },
    groups: [
      {
        key: 'balkan_top_used',
        label: { en: 'Most used overall', de: 'Insgesamt am haeufigsten' },
        brands: [
          'Audi',
          'BMW',
          'Citroen',
          'Dacia',
          'Fiat',
          'Ford',
          'Hyundai',
          'Kia',
          'Mercedes-Benz',
          'Opel',
          'Peugeot',
          'Renault',
          'SEAT',
          'Skoda',
          'Toyota',
          'Volkswagen',
        ],
      },
      {
        key: 'balkan_budget_practical',
        label: { en: 'Budget & practical common', de: 'Budget & alltagstauglich haeufig' },
        brands: [
          'Chevrolet',
          'Citroen',
          'Dacia',
          'Fiat',
          'Ford',
          'Hyundai',
          'Kia',
          'Opel',
          'Peugeot',
          'Renault',
          'Skoda',
          'Suzuki',
          'Toyota',
        ],
      },
      {
        key: 'balkan_premium_suv',
        label: { en: 'Premium & SUV often seen', de: 'Premium & SUV haeufig' },
        brands: [
          'Audi',
          'BMW',
          'Jeep',
          'Land Rover',
          'Lexus',
          'Mercedes-Benz',
          'Porsche',
          'Tesla',
          'Volkswagen',
          'Volvo',
        ],
      },
      {
        key: 'balkan_vans_lcv',
        label: { en: 'Vans & LCV common', de: 'Transporter haeufig' },
        brands: [
          'Citroen',
          'Fiat',
          'Ford',
          'Iveco',
          'MAN',
          'Mercedes-Benz',
          'Opel',
          'Peugeot',
          'Renault',
          'Toyota',
          'Volkswagen',
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

