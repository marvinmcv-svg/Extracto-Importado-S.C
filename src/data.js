// Content sourced from @extractoimportado_sc (Instagram), scraped Nov 2026.
// All fragrances are Extracto Importado's own versions *inspired by* the
// referenced originals ("equivalencias"); brand names are used only as reference.

export const WHATSAPP = '59165907181';
export const WHATSAPP_DISPLAY = '659 071 81';
export const INSTAGRAM = 'https://www.instagram.com/extractoimportado_sc/';

export const waLink = (msg) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

export const fragrances = [
  {
    id: 'yara',
    name: 'Yara',
    house: 'Lattafa',
    family: 'dulce',
    familyLabel: 'Dulce · Cremoso',
    tagline: '¿Amas los aromas dulces, suaves y cremosos? Este es para ti.',
    notes: {
      salida: ['Frutas tropicales', 'Mandarina'],
      corazon: ['Orquídea', 'Heliotropo'],
      fondo: ['Vainilla', 'Almizcle', 'Sándalo'],
    },
    color: '#f2a7b8',
    deep: '#7a2c44',
    mood: 'Para el día · Suave · Femenino',
    keyword: 'YARA',
  },
  {
    id: 'yara-candy',
    name: 'Yara Candy',
    house: 'Lattafa',
    family: 'dulce',
    familyLabel: 'Frutal · Gourmand',
    tagline: 'Tu lado dulce tiene una nueva tentación.',
    notes: {
      salida: ['Fresa', 'Frutos rojos'],
      corazon: ['Caramelo', 'Flores blancas'],
      fondo: ['Vainilla', 'Almizcle suave'],
    },
    color: '#ff6f91',
    deep: '#8a1538',
    mood: 'Juvenil · Dulce · Coqueto',
    keyword: 'CANDY',
    isNew: true,
  },
  {
    id: 'yara-moi',
    name: 'Yara Moi',
    house: 'Lattafa',
    family: 'floral',
    familyLabel: 'Floral · Sofisticado',
    tagline: 'Tu lado dulce también tiene un toque sofisticado.',
    notes: {
      salida: ['Jazmín', 'Melocotón'],
      corazon: ['Flores blancas', 'Caramelo'],
      fondo: ['Maderas', 'Ámbar', 'Almizcle'],
    },
    color: '#f4e1d2',
    deep: '#8c6a52',
    mood: 'Elegante · Luminoso',
    keyword: 'YARA MOI',
  },
  {
    id: 'asad',
    name: 'Asad',
    house: 'Lattafa',
    family: 'especiado',
    familyLabel: 'Especiado · Café',
    tagline: 'Tu próxima salida merece un aroma con carácter.',
    notes: {
      salida: ['Pimienta negra', 'Piña'],
      corazon: ['Café', 'Iris', 'Pachulí'],
      fondo: ['Vainilla', 'Ámbar', 'Benjuí'],
    },
    color: '#c98a3c',
    deep: '#3d1f0b',
    mood: 'Nocturno · Intenso · Masculino',
    keyword: 'ASAD',
  },
  {
    id: 'asad-bourbon',
    name: 'Asad Bourbon',
    house: 'Lattafa',
    family: 'especiado',
    familyLabel: 'Cálido · Licoroso',
    tagline: 'Si te gustan los perfumes cálidos y dulces, conoce tu próxima tentación.',
    notes: {
      salida: ['Bourbon', 'Lavanda'],
      corazon: ['Canela', 'Davana'],
      fondo: ['Vainilla', 'Ámbar', 'Maderas'],
    },
    color: '#b5651d',
    deep: '#2e1405',
    mood: 'Cálido · Seductor',
    keyword: 'BOURBON',
  },
  {
    id: 'angel-nova',
    name: 'Angel Nova',
    house: 'Mugler',
    family: 'floral',
    familyLabel: 'Frutal · Rosa',
    tagline: 'Dale a tu próxima salida un aroma tan vibrante como tú.',
    notes: {
      salida: ['Frambuesa', 'Lichi'],
      corazon: ['Rosa de Damasco', 'Acerola'],
      fondo: ['Maderas', 'Benjuí', 'Vainilla'],
    },
    color: '#ff8fb1',
    deep: '#6b0f33',
    mood: 'Vibrante · Romántico',
    keyword: 'ANGEL NOVA',
  },
  {
    id: 'paradoxe',
    name: 'Paradoxe',
    house: 'Prada',
    family: 'floral',
    familyLabel: 'Floral · Ámbar',
    tagline: 'Ese toque de elegancia que completa tu look.',
    notes: {
      salida: ['Pera', 'Bergamota', 'Mandarina'],
      corazon: ['Neroli', 'Jazmín'],
      fondo: ['Ámbar', 'Almizcle blanco', 'Vainilla Bourbon'],
    },
    color: '#e8c39e',
    deep: '#5a3a24',
    mood: 'Moderno · Elegante',
    keyword: 'PARADOXE',
  },
  {
    id: 'ombre-nomade',
    name: 'Ombré Nomade',
    house: 'Louis Vuitton',
    family: 'amaderado',
    familyLabel: 'Oud · Ahumado',
    tagline: 'Un aroma con presencia para noches especiales.',
    notes: {
      salida: ['Frambuesa', 'Geranio'],
      corazon: ['Rosa', 'Incienso'],
      fondo: ['Oud', 'Benjuí', 'Maderas profundas'],
    },
    color: '#8b2f3a',
    deep: '#1a0508',
    mood: 'Lujo · Nocturno · Unisex',
    keyword: 'OMBRE',
    isNew: true,
  },
  {
    id: 'arabians-tonka',
    name: 'Arabians Tonka',
    house: 'Montale',
    family: 'amaderado',
    familyLabel: 'Tonka · Especiado',
    tagline: 'Dulzura envolvente, matices especiados y un fondo amaderado.',
    notes: {
      salida: ['Azafrán', 'Bergamota'],
      corazon: ['Rosa', 'Haba tonka'],
      fondo: ['Oud', 'Azúcar', 'Almizcle'],
    },
    color: '#d4a24c',
    deep: '#3a2408',
    mood: 'Con carácter · Unisex',
    keyword: 'TONKA',
    soon: true,
  },
];

export const families = [
  { id: 'all', label: 'Todas' },
  { id: 'dulce', label: 'Dulces' },
  { id: 'floral', label: 'Florales' },
  { id: 'especiado', label: 'Especiadas' },
  { id: 'amaderado', label: 'Amaderadas' },
];

export const bottlePrices = [
  { qty: 1, price: 410, label: '1 perfume', note: 'Tu firma diaria' },
  { qty: 2, price: 690, label: '2 perfumes', note: 'Día & noche', save: 130, featured: true },
  { qty: 4, price: 1260, label: '4 perfumes', note: 'La colección', save: 380 },
];

export const decants = [
  { ml: 5, single: 50, pack: { qty: 3, price: 135 } },
  { ml: 10, single: 90, pack: { qty: 3, price: 240 } },
  { ml: 30, single: 210, pack: { qty: 2, price: 370 } },
];

// Fragrance finder — scores the full catalog by accord groups (see catalog.js)
export const quiz = [
  {
    q: '¿Para quién es?',
    key: 'gender',
    options: [
      { label: 'Para ella', icon: '♀', gender: ['femenino', 'unisex'] },
      { label: 'Para él', icon: '♂', gender: ['masculino', 'unisex'] },
      { label: 'Me da igual', icon: '∞', gender: ['femenino', 'masculino', 'unisex'] },
    ],
  },
  {
    q: '¿Qué te atrae más?',
    options: [
      { label: 'Vainilla & caramelo', icon: '◍', tags: { dulce: 3 } },
      { label: 'Flores', icon: '❀', tags: { floral: 3 } },
      { label: 'Cítricos & mar', icon: '≈', tags: { fresco: 3 } },
      { label: 'Frutas jugosas', icon: '●', tags: { frutal: 3 } },
      { label: 'Especias & café', icon: '◆', tags: { especiado: 3 } },
      { label: 'Maderas & cuero', icon: '▲', tags: { amaderado: 3 } },
    ],
  },
  {
    q: '¿Cuándo lo vas a usar?',
    options: [
      { label: 'De día, a diario', icon: '☀', tags: { fresco: 2, floral: 1 } },
      { label: 'De noche', icon: '☾', tags: { especiado: 2, dulce: 1, amaderado: 1 } },
      { label: 'Ocasiones especiales', icon: '✦', tags: { amaderado: 2, floral: 1, dulce: 1 } },
    ],
  },
];

export const badges = [
  { t: 'Productos originales', d: 'Distribuidor autorizado' },
  { t: 'Alta concentración', d: 'Extracto · Parfum' },
  { t: 'Aromas exclusivos', d: '+150 fragancias' },
  { t: 'Compra 100% segura', d: 'Atención por WhatsApp' },
];

export const posts = [
  {
    title: 'Tu aroma habla de vos',
    body: 'Elegí uno que deja huella. Más de 8 horas de duración y opciones para cada ocasión.',
    date: '10 Nov 2026',
    url: 'https://instagram.com/p/DfkG8wUR0Rz',
    tint: ['#2a1a10', '#c9a46a'],
  },
  {
    title: 'Arabians Tonka — próximamente',
    body: 'Dulzura envolvente, matices especiados y un fondo amaderado. Para quienes disfrutan perfumes con carácter.',
    date: '03 Nov 2026',
    url: 'https://instagram.com/p/DfSs-vuv2-j',
    tint: ['#3a2408', '#d4a24c'],
  },
  {
    title: 'Yara Candy',
    body: 'Frutas, un toque de caramelo y suavidad avainillada. Tu lado dulce tiene una nueva tentación.',
    date: '03 Nov 2026',
    url: 'https://instagram.com/p/DfSstczvrdn',
    tint: ['#8a1538', '#ff6f91'],
  },
  {
    title: 'Ombré Nomade',
    body: 'Maderas profundas, matices ahumados. Un aroma con presencia para noches especiales.',
    date: '03 Nov 2026',
    url: 'https://instagram.com/p/DfSsjwvPrKw',
    tint: ['#1a0508', '#8b2f3a'],
  },
  {
    title: 'Asad',
    body: 'Especias, matices de café y un fondo cálido de vainilla. Tu salida merece carácter.',
    date: '30 Oct 2026',
    url: 'https://instagram.com/p/DfIhR0xvZ9L',
    tint: ['#3d1f0b', '#c98a3c'],
  },
  {
    title: 'Prada Paradoxe',
    body: 'Floral, frutal y cálido. Ese toque de elegancia que completa tu look.',
    date: '30 Oct 2026',
    url: 'https://instagram.com/p/DfIf8sUPeW_',
    tint: ['#5a3a24', '#e8c39e'],
  },
];
