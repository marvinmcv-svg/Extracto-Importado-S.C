// Store data for Extracto Importado.
// Prices and decant formats come from the official PDF catalog ("Precios y promociones").
// Every fragrance is Extracto Importado's own version *inspired by* the referenced
// original ("equivalencia"); brand names are used only as an olfactory reference.

export const WHATSAPP = '59165907181';
export const WHATSAPP_DISPLAY = '659 071 81';
export const INSTAGRAM = 'https://www.instagram.com/extractoimportado_sc/';

export const waLink = (msg) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

/**
 * Black Friday: every 100 ml bottle at 350 Bs. (list price 410).
 * Set `active: false` to go back to regular prices everywhere on the site.
 */
export const PROMO = { active: true, name: 'Black Friday', price100: 350 };
export const LIST_100 = 410;
export const PRICE_100 = PROMO.active ? PROMO.price100 : LIST_100;

/**
 * Sizes and their price ladders. `packs` are the promo bundles from the catalog:
 * the cart always picks the cheapest combination automatically.
 */
export const SIZES = [
  { id: '100', ml: 100, label: '100 ml', unit: PRICE_100, list: LIST_100, packs: [{ qty: 2, price: 690 }, { qty: 4, price: 1260 }], note: 'Frasco · envío gratis' },
  { id: '30', ml: 30, label: '30 ml', unit: 210, packs: [{ qty: 2, price: 370 }], note: 'Decant' },
  { id: '10', ml: 10, label: '10 ml', unit: 90, packs: [{ qty: 3, price: 240 }], note: 'Decant' },
  { id: '5', ml: 5, label: '5 ml', unit: 50, packs: [{ qty: 3, price: 135 }], note: 'Decant · para probar' },
];
export const sizeById = Object.fromEntries(SIZES.map((s) => [s.id, s]));

/** Cheapest price for `n` units of a size, combining singles and packs (small DP). */
export function bestPrice(sizeId, n) {
  const s = sizeById[sizeId];
  const opts = [{ qty: 1, price: s.unit }, ...s.packs];
  const dp = [0];
  for (let i = 1; i <= n; i++) {
    dp[i] = Infinity;
    for (const o of opts) if (o.qty <= i) dp[i] = Math.min(dp[i], dp[i - o.qty] + o.price);
  }
  return dp[n];
}

/** Catalog ids featured as "Más pedidos" (Instagram favourites + all-time classics). */
export const bestsellers = [
  'lattafa-yara',
  'dior-sauvage',
  'carolina-herrera-good-girl',
  'maison-francis-kurkdjian-baccarat-rouge-540',
  'lattafa-asad',
  'mugler-angel-nova',
  'paco-rabanne-1-million',
  'prada-paradoxe',
  'lattafa-khamrah',
  'lattafa-yara-moi',
  'jean-paul-gaultier-le-male-elixir',
  'lattafa-asad-bourbon',
];

/** Short editorial blurbs (from @extractoimportado_sc posts) shown in the product view. */
export const blurbs = {
  'lattafa-yara': '¿Amás los aromas dulces, suaves y cremosos? Frutas tropicales, flores y un delicado fondo avainillado.',
  'lattafa-yara-moi': 'Tu lado dulce también tiene un toque sofisticado. Flores blancas, caramelo y maderas.',
  'lattafa-asad': 'Tu próxima salida merece un aroma con carácter. Especias, matices de café y un fondo cálido de vainilla.',
  'lattafa-asad-bourbon': 'Si te gustan los perfumes cálidos y dulces, conocé tu próxima tentación.',
  'mugler-angel-nova': 'Dale a tu próxima salida un aroma tan vibrante como vos. Frutas jugosas, rosas y un fondo amaderado.',
  'prada-paradoxe': 'Ese toque de elegancia que completa tu look. Floral, frutal y cálido.',
};

/** Recent arrivals announced on Instagram that are not in the printed PDF yet (no photo). */
export const extras = [
  { gender: 'femenino', name: 'Yara Candy', house: 'Lattafa', accords: ['afrutados', 'dulce', 'caramelo', 'avainillado', 'almizclado'], isNew: true,
    blurb: 'Tu lado dulce tiene una nueva tentación. Frutas, un toque de caramelo y suavidad avainillada.' },
  { gender: 'unisex', name: 'Ombré Nomade', house: 'Louis Vuitton', accords: ['oud', 'amaderado', 'ahumado', 'rosas', 'afrutados'], isNew: true,
    blurb: 'Un aroma con presencia para noches especiales. Maderas profundas y matices ahumados.' },
  { gender: 'unisex', name: 'Arabians Tonka', house: 'Montale', accords: ['dulce', 'cálido especiado', 'amaderado', 'oud', 'rosas'], isNew: true, soon: true,
    blurb: 'Dulzura envolvente, matices especiados y un fondo amaderado. Próximamente.' },
];

export const DEPARTAMENTOS = ['Santa Cruz', 'La Paz', 'Cochabamba', 'Chuquisaca', 'Tarija', 'Oruro', 'Potosí', 'Beni', 'Pando'];

export const faqs = [
  { q: '¿Qué es una equivalencia?', a: 'Es nuestra versión de alta concentración inspirada en un perfume de diseñador o nicho. Busca reproducir su perfil olfativo — salida, corazón y fondo — a una fracción del precio. No es el perfume original ni usa su marca.' },
  { q: '¿Cuánto dura en la piel?', a: 'Nuestras fragancias son de concentración Extracto / Parfum: más de 8 horas en piel, y más aún en ropa.' },
  { q: '¿Cómo hago el pedido?', a: 'Armá tu pedido en esta página y tocá “Enviar por WhatsApp”. Te llega un mensaje listo a nuestro número (659 071 81); confirmamos stock, total y envío por ahí mismo.' },
  { q: '¿Hacen envíos?', a: 'Sí, a toda Bolivia. El envío es gratis en perfumes de 100 ml. Para decants te confirmamos el costo según tu ciudad. En Santa Cruz también podés coordinar entrega.' },
  { q: '¿Cómo pago?', a: 'Por QR, transferencia bancaria o en efectivo (según la ciudad). Te pasamos los datos al confirmar tu pedido por WhatsApp.' },
  { q: '¿Venden por mayor?', a: 'Sí. Somos distribuidor autorizado con precios por mayor y menor. Escribinos por WhatsApp y te pasamos la lista de mayorista.' },
];
