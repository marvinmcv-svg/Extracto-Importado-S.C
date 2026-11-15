// Shared store logic: products, search, cart (persisted across pages), pricing.
import { catalog, ACCORDS, accordGroups, groupScore } from '../catalog.js';
import { SIZES, sizeById, bestPrice, bestsellers, blurbs, extras, PROMO, PRICE_100, LIST_100, waLink } from '../data.js';

export { catalog, ACCORDS, accordGroups, groupScore, SIZES, sizeById, bestPrice, bestsellers, PROMO, PRICE_100, LIST_100, waLink };

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ');
export const bs = (n) => `${n.toLocaleString('es-BO').replace(/,/g, '.')} Bs.`;
export const slug = (s) => norm(s).trim().replace(/\s+/g, '-');
export const GENDER = { femenino: 'Para ella', masculino: 'Para él', unisex: 'Unisex' };
export const GENDER_SHORT = { femenino: 'Ella', masculino: 'Él', unisex: 'Unisex' };

export const products = [
  ...catalog.map((c) => ({ ...c, img: `/img/p/${c.id}.webp`, blurb: blurbs[c.id] })),
  ...extras.map((e, i) => ({ ...e, id: slug(`${e.house}-${e.name}`), n: catalog.length + i + 1, img: null })),
];
export const byId = Object.fromEntries(products.map((p) => [p.id, p]));
products.forEach((p) => { p._s = norm(`${p.name} ${p.house}`); });
export const houses = [...new Set(products.map((p) => p.house))].sort((a, b) => a.localeCompare(b, 'es'));
export const productUrl = (id) => `/producto?id=${encodeURIComponent(id)}`;

export function search(q, list = products) {
  const t = norm(q || '').trim();
  if (!t) return list;
  const words = t.split(/\s+/);
  return list
    .map((p) => {
      if (!words.every((w) => p._s.includes(w))) return null;
      const name = norm(p.name);
      return { p, score: name.startsWith(t) ? 3 : name.includes(t) ? 2 : 1 };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}

/** Similar fragrances: weighted overlap of accords (earlier accords weigh more). */
export function similar(p, n = 8) {
  const w = (list) => Object.fromEntries(list.map((a, i) => [a, 6 - Math.min(i, 5)]));
  const a = w(p.accords);
  return products
    .filter((q) => q.id !== p.id && q.img)
    .map((q) => {
      const b = w(q.accords);
      let s = 0;
      for (const k in a) if (b[k]) s += a[k] * b[k];
      if (q.gender === p.gender) s *= 1.15;
      return { q, s };
    })
    .sort((x, y) => y.s - x.s)
    .slice(0, n)
    .map((x) => x.q);
}

/** Human description of the scent profile, built from the catalog accords. */
export function profileText(p) {
  const [a, b, c] = p.accords;
  const mood = groupScore(p, 'fresco') > 8 ? 'ideal para el día y climas cálidos'
    : groupScore(p, 'dulce') > 8 ? 'envolvente y con estela, perfecto para la noche'
    : groupScore(p, 'amaderado') > 8 ? 'elegante, con presencia y carácter'
    : groupScore(p, 'floral') > 8 ? 'luminoso y femenino, para cualquier ocasión'
    : 'versátil para el día a día';
  return `Abre con un acorde ${a}${b ? `, se desarrolla hacia notas ${b}` : ''}${c ? ` y deja un fondo ${c}` : ''}. Un perfil ${mood}.`;
}

/* ───────── cart ───────── */
const KEY = 'ei-cart-v2';
const listeners = new Set();
export let cart = [];
try { cart = JSON.parse(localStorage.getItem(KEY) || '[]').filter((l) => byId[l.id] && sizeById[l.size]); } catch { cart = []; }

function commit() {
  try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch {}
  listeners.forEach((fn) => fn(cart));
}
export const onCart = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const inCart = (id) => cart.some((l) => l.id === id);

export function addToCart(id, size = '100', qty = 1) {
  const line = cart.find((l) => l.id === id && l.size === size);
  if (line) line.qty += qty; else cart.push({ id, size, qty });
  commit();
}
export function removeProduct(id) { cart = cart.filter((l) => l.id !== id); commit(); }
export function removeLine(i) { cart.splice(i, 1); commit(); }
export function setQty(i, qty) { if (qty < 1) cart.splice(i, 1); else cart[i].qty = qty; commit(); }
export function setSize(i, size) {
  const l = cart[i];
  const dup = cart.findIndex((x, k) => k !== i && x.id === l.id && x.size === size);
  if (dup > -1) { cart[dup].qty += l.qty; cart.splice(i, 1); } else l.size = size;
  commit();
}
// keep tabs in sync
addEventListener('storage', (e) => {
  if (e.key !== KEY) return;
  try { cart = JSON.parse(e.newValue || '[]'); } catch { cart = []; }
  listeners.forEach((fn) => fn(cart));
});

export function totals() {
  const units = {};
  cart.forEach((l) => { units[l.size] = (units[l.size] || 0) + l.qty; });
  let total = 0, regular = 0;
  const groups = SIZES.filter((s) => units[s.id]).map((s) => {
    const n = units[s.id];
    const price = bestPrice(s.id, n);
    const list = n * (s.list || s.unit);
    total += price; regular += list;
    return { size: s, n, price, list, save: list - price };
  });
  return { total, regular, save: regular - total, groups, count: cart.reduce((a, l) => a + l.qty, 0) };
}

export function nudge(t = totals()) {
  const n100 = t.groups.find((g) => g.size.id === '100')?.n || 0;
  if (n100 === 1) return `Sumá 1 perfume de 100 ml más y llevás los dos por ${bs(bestPrice('100', 2))}.`;
  if (n100 === 3) return `Con 1 más llevás 4 perfumes por ${bs(bestPrice('100', 4))}.`;
  return '';
}

export const saveLabel = PROMO.active ? `Ahorro ${PROMO.name}` : 'Ahorro por promo';
