const CAR_BRANDS = [
  'Abarth',
  'Acura',
  'Aixam',
  'Alfa Romeo',
  'Alpina',
  'Alpine',
  'Anadol',
  'Aro',
  'Aston Martin',
  'Audi',
  'Bentley',
  'BMW',
  'Borgward',
  'Brilliance',
  'Bugatti',
  'Buick',
  'BYD',
  'Cadillac',
  'Chery',
  'Chevrolet',
  'Chrysler',
  'Citro\u00ebn',
  'Cupra',
  'Dacia',
  'Daewoo',
  'Daihatsu',
  'Dodge',
  'DR',
  'DS Automobiles',
  'Ferrari',
  'Fiat',
  'Fisker',
  'Ford',
  'GAZ',
  'Genesis',
  'GMC',
  'Great Wall',
  'Honda',
  'Hummer',
  'Hyundai',
  'Infiniti',
  'Isuzu',
  'Iveco',
  'Jaguar',
  'Jeep',
  'Kia',
  'Koenigsegg',
  'Lada',
  'Lamborghini',
  'Lancia',
  'Land Rover',
  'Lexus',
  'Lotus',
  'Lucid',
  'Lynk & Co',
  'Maserati',
  'MAXUS',
  'Maybach',
  'Mazda',
  'McLaren',
  'Mercedes-Benz',
  'MG',
  'Mini',
  'Mitsubishi',
  'Moskwitsch',
  'Nio',
  'Nissan',
  'Opel',
  'Pagani',
  'Peugeot',
  'Polestar',
  'Pontiac',
  'Porsche',
  'Proton',
  'RAM',
  'Renault',
  'Rimac',
  'Rolls-Royce',
  'Rover',
  'Saab',
  'SEAT',
  'Seres',
  '\u0160koda',
  'Smart',
  'SsangYong',
  'Subaru',
  'Suzuki',
  'Tata',
  'Tesla',
  'Tofa\u015f',
  'Toyota',
  'Trabant',
  'TVR',
  'UAZ',
  'Vauxhall',
  'VinFast',
  'Volkswagen',
  'Volvo',
  'Voyah',
  'Wartburg',
  'Xpeng',
  'Yugo',
  'Zastava',
  'Zeekr',
];

const uniqueSortedBrands = [...new Set(CAR_BRANDS)].sort((a, b) =>
  a.localeCompare(b, 'de-CH', { sensitivity: 'base' }),
);

const TOP_CAR_BRANDS = [
  'Volkswagen',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  '\u0160koda',
  'Toyota',
  'Ford',
  'Renault',
  'Peugeot',
  'Opel',
];

const normalize = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const getAllCarBrands = () => uniqueSortedBrands;

export const getTopCarBrands = () =>
  TOP_CAR_BRANDS.filter((brand) => uniqueSortedBrands.includes(brand));

export const getBrandSuggestions = (query = '', limit = 10) => {
  const needle = normalize(query);

  if (!needle) {
    return getTopCarBrands().slice(0, limit);
  }

  const startsWith = [];
  const includes = [];

  uniqueSortedBrands.forEach((brand) => {
    const normalizedBrand = normalize(brand);
    if (!normalizedBrand.includes(needle)) return;
    if (normalizedBrand.startsWith(needle)) {
      startsWith.push(brand);
      return;
    }
    includes.push(brand);
  });

  return [...startsWith, ...includes].slice(0, limit);
};
