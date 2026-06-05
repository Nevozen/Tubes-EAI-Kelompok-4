export const PRODUCTS = [
  {
    id: 1,
    name: 'White Decade',
    category: 'Gentle',
    series: 'MODERN SERIES',
    price: 'IDR 12.450.000',
    description: 'A definitive statement in industrial minimalism. The White Decade features a monolithic surgical-grade steel casing paired with a stark, void-white dial. Engineered for precision and designed for the timeless professional, it represents the pinnacle of our modern chronometry philosophy.',
    mainImage: '/assets/images/hero_watch.png',
    thumbnails: [
      '/assets/images/hero_watch.png',
      '/assets/images/minimalist_watch.png'
    ],
    specs: {
      movement: 'Swiss-made caliber automatic movement with 42-hour power reserve.',
      waterResistance: '10 ATM',
      crystal: 'Sapphire',
      lugWidth: '20mm',
      caseMaterial: '316L Surgical Grade Brushed Stainless Steel'
    }
  },
  {
    id: 2,
    name: 'Couple Decade',
    category: 'Couple',
    series: 'GIFT SERIES',
    price: 'IDR 1.450.000',
    description: 'Designed to be shared. The Couple Decade represents timeless connection with a matching pair of exquisite timepieces, offering luxury and durability to withstand the test of time together.',
    mainImage: '/assets/images/couple_watch.png',
    thumbnails: [
      '/assets/images/couple_watch.png'
    ],
    specs: {
      movement: 'High-precision Japanese quartz movement.',
      waterResistance: '5 ATM',
      crystal: 'Mineral',
      lugWidth: '18mm & 20mm',
      caseMaterial: 'Premium Stainless Steel'
    }
  },
  {
    id: 3,
    name: 'Cool Decade',
    category: 'Modern',
    series: 'SPORT SERIES',
    price: 'IDR 1.100.000',
    description: 'For the active and the bold. A dark, moody aesthetic combined with red contrast stitching on a premium leather band makes this the perfect companion for every modern adventure.',
    mainImage: '/assets/images/cool_watch.png',
    thumbnails: [
      '/assets/images/cool_watch.png'
    ],
    specs: {
      movement: 'Advanced Chronograph movement.',
      waterResistance: '20 ATM',
      crystal: 'Sapphire coating',
      lugWidth: '22mm',
      caseMaterial: 'Matte Black Stainless Steel'
    }
  },
  {
    id: 4,
    name: 'Minimalist Decade',
    category: 'Gentle',
    series: 'CLASSIC SERIES',
    price: 'IDR 850.000',
    description: 'Simplicity is the ultimate sophistication. A clean white dial, ultra-thin profile, and a timeless black leather strap make this an essential piece for any gentleman\'s wardrobe.',
    mainImage: '/assets/images/minimalist_watch.png',
    thumbnails: [
      '/assets/images/minimalist_watch.png'
    ],
    specs: {
      movement: 'Ultra-slim quartz movement.',
      waterResistance: '3 ATM',
      crystal: 'Hardened Mineral',
      lugWidth: '20mm',
      caseMaterial: 'Polished Stainless Steel'
    }
  }
];

export const getProductsByCategory = (categoryName) => {
  if (!categoryName || categoryName.toLowerCase() === 'all products' || categoryName === 'all') {
    return PRODUCTS;
  }
  return PRODUCTS.filter(p => p.category.toLowerCase() === categoryName.toLowerCase());
};

export const getProductById = (id) => {
  return PRODUCTS.find(p => p.id === parseInt(id));
};
