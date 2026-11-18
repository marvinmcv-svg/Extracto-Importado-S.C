import '../styles/base.css';
import '../styles/pages.css';
import { initLayout, card, media, tilt, toast, gsap, reduced, $, $$, WA_ICON } from '../lib/layout.js';
import {
  products, byId, similar, profileText, productUrl, GENDER, SIZES, sizeById, bestPrice, ACCORDS, PROMO, PRICE_100, LIST_100,
  addToCart, waLink, bs, esc,
} from '../lib/store.js';

initLayout('tienda');

const id = new URLSearchParams(location.search).get('id');
const p = byId[id] || byId['lattafa-yara'];
const idx = products.indexOf(p);
const prev = products[(idx - 1 + products.length) % products.length];
const next = products[(idx + 1) % products.length];
const lineParam = { femenino: 'femenino', masculino: 'masculino', unisex: 'unisex' }[p.gender];


document.title = `${p.name} (inspirado en ${p.house}) — 100 ml ${PRICE_100} Bs. · Extracto Importado`;
document.querySelector('meta[name="description"]').content = `Equivalencia de ${p.name} de ${p.house}: ${p.accords.slice(0, 4).join(', ')}. Alta concentración, +8 horas. 100 ml a ${PRICE_100} Bs. Envío gratis a toda Bolivia.`;
$('#crumbs').insertAdjacentHTML('beforeend', `<a href="/tienda?linea=${lineParam}">${GENDER[p.gender]}</a><span>${esc(p.name)}</span>`);

let size = '100', qty = 1;
const max = p.accords.length;
$('#pdp').innerHTML = `
  <div class="pdp__media">
    <div class="pdp__frame" data-tilt="5">${media(p)}<span class="pcard__glare"></span></div>
    <div class="pdp__note"><span>Izquierda: original de referencia · Derecha: Extracto Importado</span><span>N.º ${String(p.n).padStart(3, '0')}</span></div>
  </div>
  <div class="pdp__info">
    <p class="pdp__house">Inspirado en ${esc(p.house)}</p>
    <h1 class="pdp__title" id="pTitle">${esc(p.name)}</h1>
    <p class="pdp__sub">${GENDER[p.gender]} · Extracto Parfum · +8 horas${p.soon ? ' · <strong>Próximamente</strong>' : ''}</p>
    <div class="pdp__price" id="pPrice"></div>
    <p class="pdp__desc" id="detalle">${esc(p.blurb || profileText(p))}</p>

    <p class="pdp__label">Acordes principales. <small>Lo que vas a sentir.</small></p>
    <div class="accbars">${p.accords.map((a, i) => `<div class="accbar"><span style="--c:${ACCORDS[a] || '#ccc'};--w:${100 - (i * 58) / max}%"></span><em>${esc(a)}</em></div>`).join('')}</div>

    <p class="pdp__label" id="comprar">Formato. <small>¿Cuál te conviene?</small></p>
    <div class="sizes" role="radiogroup" aria-label="Formato">
      ${SIZES.map((s) => `<button role="radio" aria-checked="${s.id === size}" data-size="${s.id}"><strong>${s.label}</strong><span>${s.list && s.list !== s.unit ? `<s>${s.list}</s> ` : ''}${bs(s.unit)}</span><small>${s.packs.map((k) => `${k.qty}× ${bs(k.price)}`).join(' · ')}</small></button>`).join('')}
    </div>
    <div class="pdp__buy">
      <div class="qty"><button data-q="-1" aria-label="Menos">−</button><output id="pQty">1</output><button data-q="1" aria-label="Más">+</button></div>
      <button class="btn btn--dark" id="pAdd">Agregar al pedido · <span id="pTotal"></span></button>
    </div>
    <div class="pdp__alt">
      <a href="${waLink(`Hola Extracto Importado 👋 quiero consultar por la fragancia inspirada en ${p.name} (${p.house})`)}" target="_blank" rel="noopener">${WA_ICON} Consultar por WhatsApp</a>
      <button data-chat-open data-chat-q="¿Cómo es ${esc(p.name)}? ¿Para qué ocasión me lo recomendás y qué otros se parecen?"><span class="dock__orb" style="width:20px;height:20px" aria-hidden="true"></span> Preguntarle al asesor</button>
    </div>

    <div class="pdp__save"><strong>¿Necesitás ayuda para elegir?</strong>Contale al asesor qué te gusta y te recomienda al instante, o escribinos por WhatsApp. <button class="link" data-chat-open data-chat-q="¿Cómo es ${esc(p.name)}? ¿Para qué ocasión me lo recomendás?">Preguntar ahora</button></div>
    <div class="details">
      <details open><summary>Envío</summary><p>Enviamos a toda Bolivia. En perfumes de 100 ml el envío es gratis; para decants te confirmamos el costo según tu ciudad. En Santa Cruz podés coordinar la entrega.</p></details>
      <details><summary>Pago</summary><p>QR, transferencia bancaria o efectivo (según la ciudad). Confirmamos stock y total por WhatsApp antes de cobrar.</p></details>
      <details><summary>¿Qué es una equivalencia?</summary><p>Es nuestra versión de alta concentración inspirada en ${esc(p.name)} de ${esc(p.house)}. Reproduce su perfil olfativo a una fracción del precio. No es el perfume original ni usa su marca: el nombre es solo una referencia del aroma.</p></details>
    </div>
  </div>`;

function upd() {
  $('#pQty').textContent = qty;
  $('#pTotal').textContent = bs(bestPrice(size, qty));
  $$('[data-size]').forEach((b) => b.setAttribute('aria-checked', b.dataset.size === size));
  const s = sizeById[size];
  $('#pPrice').innerHTML = `<strong>${bs(s.unit)}</strong>${s.list && s.list !== s.unit ? `<s>${bs(s.list)}</s><em>${PROMO.name}</em>` : ''}<span class="muted" style="font-size:14px">${s.label}${size === '100' ? ' · envío gratis' : ''}</span>`;
}
$$('[data-size]').forEach((b) => b.addEventListener('click', () => { size = b.dataset.size; upd(); }));
$$('[data-q]').forEach((b) => b.addEventListener('click', () => { qty = Math.max(1, Math.min(20, qty + +b.dataset.q)); upd(); }));
$('#pAdd').addEventListener('click', () => {
  addToCart(p.id, size, qty);
  toast(`Agregado: ${p.name} · ${sizeById[size].label} × ${qty}`);
  if (!reduced) gsap.fromTo('#pAdd', { scale: 0.95 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
});
upd();

// similar + prev/next
$('#similar').innerHTML = similar(p, 4).map(card).join('');
$('#pnav').innerHTML = `<a href="${productUrl(prev.id)}">← Anterior<strong>${esc(prev.name)}</strong></a><a href="${productUrl(next.id)}">Siguiente →<strong>${esc(next.name)}</strong></a>`;
tilt();

// entrance
if (!reduced) {
  gsap.from('.pdp__frame', { y: 60, opacity: 0, rotateX: 10, scale: 0.96, duration: 1.4, ease: 'expo.out' });
  gsap.from('.pdp__info > *', { y: 30, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.05, delay: 0.15 });
  gsap.from('.accbar span', { scaleX: 0, duration: 1.4, ease: 'expo.out', stagger: 0.06, delay: 0.5 });
}

// Product structured data
const ld = document.createElement('script');
ld.type = 'application/ld+json';
ld.textContent = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'Product',
  name: `${p.name} — Extracto Importado (inspirado en ${p.house})`,
  image: p.img ? location.origin + p.img : undefined,
  description: profileText(p),
  brand: { '@type': 'Brand', name: 'Extracto Importado' },
  offers: { '@type': 'Offer', priceCurrency: 'BOB', price: PRICE_100, availability: p.soon ? 'https://schema.org/PreOrder' : 'https://schema.org/InStock' },
});
document.head.append(ld);
