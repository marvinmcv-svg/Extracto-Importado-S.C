import './style.css';
import { catalog, ACCORDS, accordGroups, groupScore } from './catalog.js';
import { PROMO, PRICE_100, LIST_100, SIZES, sizeById, bestPrice, bestsellers, blurbs, extras, waLink, DEPARTAMENTOS, faqs } from './data.js';

/* ───────── helpers ───────── */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ');
const bs = (n) => `${n.toLocaleString('es-BO').replace(/,/g, '.')} Bs.`;
const slug = (s) => norm(s).trim().replace(/\s+/g, '-');
const GENDER = { femenino: 'Para ella', masculino: 'Para él', unisex: 'Unisex' };

/* ───────── products ───────── */
const products = [
  ...catalog.map((c) => ({ ...c, img: `/img/p/${c.id}.webp`, blurb: blurbs[c.id] })),
  ...extras.map((e, i) => ({ ...e, id: slug(`${e.house}-${e.name}`), n: catalog.length + i + 1, img: null })),
];
const byId = Object.fromEntries(products.map((p) => [p.id, p]));
products.forEach((p) => { p._s = norm(`${p.name} ${p.house}`); });

function search(q, list = products) {
  const t = norm(q).trim();
  if (!t) return list;
  const words = t.split(/\s+/);
  return list
    .map((p) => {
      if (!words.every((w) => p._s.includes(w))) return null;
      const name = norm(p.name);
      const score = name.startsWith(t) ? 3 : name.includes(t) ? 2 : 1;
      return { p, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}

/* ───────── cart (shared by drawer + funnel) ───────── */
const CART_KEY = 'ei-cart-v2';
let cart = [];
try { cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]').filter((l) => byId[l.id] && sizeById[l.size]); } catch { cart = []; }
const saveCart = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {} };

function addToCart(id, size = '100', qty = 1, { silent } = {}) {
  const line = cart.find((l) => l.id === id && l.size === size);
  if (line) line.qty += qty; else cart.push({ id, size, qty });
  cartChanged();
  if (!silent) toast(`Agregado: ${byId[id].name} · ${sizeById[size].label}`);
}
const inCart = (id) => cart.some((l) => l.id === id);
function removeProduct(id) { cart = cart.filter((l) => l.id !== id); cartChanged(); }

function totals() {
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

function cartChanged() {
  saveCart();
  const t = totals();
  const badge = $('#cartCount');
  badge.hidden = !t.count;
  badge.textContent = t.count;
  badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump');
  renderCart();
  renderFunnel();
  $$('[data-add]').forEach((b) => b.classList.toggle('is-in', inCart(b.dataset.add)));
}

/* ───────── shared render bits ───────── */
function media(p, cls = '') {
  if (p.img) return `<img class="${cls}" src="${p.img}" alt="Inspirado en ${esc(p.name)} de ${esc(p.house)}: original junto al frasco Extracto Importado y sus acordes" loading="lazy" width="760" height="440" />`;
  return `<div class="label-art ${cls}" role="img" aria-label="Frasco Extracto Importado inspirado en ${esc(p.name)}">
    <div class="label-art__label"><span class="label-art__w">EXTRACTO</span><span class="label-art__s">IMPORTADO</span><span class="label-art__n">${esc(p.name)}</span><span class="label-art__p">PARFUM · 100 ML</span></div>
  </div>`;
}
const accordDots = (p, n = 4) => p.accords.slice(0, n).map((a) => `<span><i style="--c:${ACCORDS[a] || '#ccc'}"></i>${esc(a)}</span>`).join('');

function card(p) {
  const badge = p.soon ? '<span class="badge">Próximamente</span>' : PROMO.active ? `<span class="badge badge--promo">${PROMO.name}</span>` : p.isNew ? '<span class="badge badge--new">Nuevo</span>' : '';
  return `<article class="card">
    <button class="card__media" data-open="${p.id}" aria-label="Ver ${esc(p.name)}">${media(p)}${badge}</button>
    <div class="card__body">
      <p class="card__house">Inspirado en · ${esc(p.house)}</p>
      <h3 class="card__name"><button data-open="${p.id}">${esc(p.name)}</button></h3>
      <div class="card__acc">${accordDots(p, 3)}</div>
      <div class="card__foot">
        <p class="card__price"><strong>${PROMO.active ? `<s>${LIST_100}</s> ` : ''}${bs(PRICE_100)}</strong><span>100 ml · decants desde 50</span></p>
        <button class="btn-add ${inCart(p.id) ? 'is-in' : ''}" data-add="${p.id}" aria-label="Agregar ${esc(p.name)} 100 ml al pedido"><span class="btn-add__plus">+</span><span class="btn-add__ok">✓</span></button>
      </div>
    </div>
  </article>`;
}

document.addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]');
  if (add) { e.preventDefault(); addToCart(add.dataset.add, add.dataset.size || '100'); return; }
  const open = e.target.closest('[data-open]');
  if (open) { e.preventDefault(); openProduct(open.dataset.open); return; }
  const g = e.target.closest('[data-gender]');
  if (g) { shop.gender = g.dataset.gender; shop.limit = PAGE; renderShop(); renderTabs(); }
});

/* ───────── hero: search + compare carousel ───────── */
function resultRow(p) {
  return `<div class="res" role="option">
    <button class="res__main" data-open="${p.id}">
      ${p.img ? `<img src="${p.img}" alt="" loading="lazy" />` : '<span class="res__ph">E</span>'}
      <span><strong>${esc(p.name)}</strong><small>${esc(p.house)} · ${GENDER[p.gender]}</small></span>
    </button>
    <button class="res__add" data-add="${p.id}" aria-label="Agregar ${esc(p.name)}">+ ${PRICE_100} Bs.</button>
  </div>`;
}

function wireSearch(input, box, { limit = 6, onEnter } = {}) {
  const render = () => {
    const q = input.value.trim();
    if (!q) { box.hidden = true; input.setAttribute('aria-expanded', 'false'); return; }
    const r = search(q).slice(0, limit);
    box.innerHTML = r.length
      ? r.map(resultRow).join('') + (onEnter ? `<button class="res__all" data-all>Ver todos los resultados para “${esc(q)}” →</button>` : '')
      : `<p class="res__none">No encontramos “${esc(q)}”. <a href="${waLink(`Hola Extracto Importado 👋 ¿tienen la equivalencia de ${q}?`)}" target="_blank" rel="noopener">Preguntanos por WhatsApp</a></p>`;
    box.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  };
  input.addEventListener('input', render);
  input.addEventListener('focus', render);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter(input.value); } if (e.key === 'Escape') box.hidden = true; });
  box.addEventListener('click', (e) => { if (e.target.closest('[data-all]')) onEnter(input.value); });
  return render;
}

const goShop = (q) => {
  $('#heroResults').hidden = true;
  shop.q = q; shop.gender = 'all'; shop.group = null; shop.limit = PAGE;
  $('#shopSearch').value = q;
  renderTabs(); renderChips(); renderShop();
  $('#tienda').scrollIntoView({ behavior: 'smooth' });
};
const heroRender = wireSearch($('#heroInput'), $('#heroResults'), { onEnter: goShop });
document.addEventListener('click', (e) => { if (!e.target.closest('#heroSearch')) $('#heroResults').hidden = true; });
$$('.hero__popular [data-q]').forEach((b) => b.addEventListener('click', () => { $('#heroInput').value = b.dataset.q; heroRender(); $('#heroInput').focus(); }));

// compare carousel
const showcase = bestsellers.map((id) => byId[id]);
let ci = 0, cTimer;
const dots = $('#compareDots');
dots.innerHTML = showcase.map((p, i) => `<button aria-label="${esc(p.name)}" data-i="${i}"></button>`).join('');
function showCompare(i) {
  ci = (i + showcase.length) % showcase.length;
  const p = showcase[ci];
  const img = $('#compareImg');
  img.classList.add('is-out');
  const next = new Image();
  next.src = p.img;
  next.decode().catch(() => {}).finally(() => {
    img.src = p.img;
    img.alt = `${p.name} de ${p.house} junto al frasco Extracto Importado`;
    img.classList.remove('is-out');
  });
  $('#compareName').textContent = p.name;
  $('#compareHouse').textContent = `Inspirado en · ${p.house}`;
  $('#compareAdd').dataset.add = p.id;
  $$('button', dots).forEach((d, k) => d.classList.toggle('is-on', k === ci));
}
const startCompare = () => { clearInterval(cTimer); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) cTimer = setInterval(() => showCompare(ci + 1), 4200); };
dots.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) { showCompare(+b.dataset.i); startCompare(); } });
$('#compare').addEventListener('mouseenter', () => clearInterval(cTimer));
$('#compare').addEventListener('mouseleave', startCompare);
$('#compareImg').addEventListener('click', () => openProduct(showcase[ci].id));
showCompare(0); startCompare();

/* ───────── categories + bestsellers ───────── */
const countG = (g) => products.filter((p) => p.gender === g).length;
$('#countF').textContent = `${countG('femenino')} fragancias`;
$('#countM').textContent = `${countG('masculino')} fragancias`;
$('#countU').textContent = `${countG('unisex')} fragancias`;

const rail = $('#bestRail');
rail.innerHTML = showcase.map(card).join('');
$$('[data-scroll]').forEach((b) => b.addEventListener('click', () => rail.scrollBy({ left: +b.dataset.scroll * rail.clientWidth * 0.8, behavior: 'smooth' })));

/* ───────── shop ───────── */
const PAGE = 24;
const shop = { gender: 'all', group: null, q: '', sort: 'catalog', limit: PAGE };

function filtered() {
  let list = products.filter((p) => shop.gender === 'all' || p.gender === shop.gender);
  if (shop.group) list = list.filter((p) => groupScore(p, shop.group) > 0).sort((a, b) => groupScore(b, shop.group) - groupScore(a, shop.group));
  if (shop.q) list = search(shop.q, list);
  if (shop.sort === 'az') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  if (shop.sort === 'house') list = [...list].sort((a, b) => a.house.localeCompare(b.house, 'es') || a.name.localeCompare(b.name, 'es'));
  return list;
}
function renderTabs() {
  const tabs = [['all', 'Todas', products.length], ['femenino', 'Ella', countG('femenino')], ['masculino', 'Él', countG('masculino')], ['unisex', 'Unisex', countG('unisex')]];
  $('#genderTabs').innerHTML = tabs.map(([id, l, n]) => `<button role="tab" aria-selected="${shop.gender === id}" data-g="${id}">${l} <small>${n}</small></button>`).join('');
}
function renderChips() {
  $('#accordChips').innerHTML = accordGroups.map((g) => `<button class="chip ${shop.group === g.id ? 'is-on' : ''}" data-grp="${g.id}" aria-pressed="${shop.group === g.id}"><i style="--c:${ACCORDS[g.match[0]]}"></i>${g.label}</button>`).join('');
}
function renderShop() {
  const list = filtered();
  $('#shopGrid').innerHTML = list.slice(0, shop.limit).map(card).join('') ||
    `<p class="empty">Sin resultados. <a href="${waLink(`Hola Extracto Importado 👋 ¿tienen la equivalencia de ${shop.q}?`)}" target="_blank" rel="noopener">Preguntanos por WhatsApp</a> — traemos nuevas fragancias seguido.</p>`;
  $('#shopCount').textContent = `${list.length} fragancia${list.length === 1 ? '' : 's'}${shop.gender !== 'all' ? ` · ${GENDER[shop.gender]}` : ''}`;
  $('#loadMore').hidden = list.length <= shop.limit;
  $('#loadMore').textContent = `Ver más fragancias (${list.length - shop.limit})`;
}
$('#genderTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-g]'); if (!b) return; shop.gender = b.dataset.g; shop.limit = PAGE; renderTabs(); renderShop(); });
$('#accordChips').addEventListener('click', (e) => { const b = e.target.closest('[data-grp]'); if (!b) return; shop.group = shop.group === b.dataset.grp ? null : b.dataset.grp; shop.limit = PAGE; renderChips(); renderShop(); });
let sT;
$('#shopSearch').addEventListener('input', (e) => { clearTimeout(sT); sT = setTimeout(() => { shop.q = e.target.value; shop.limit = PAGE; renderShop(); }, 120); });
$('#sort').addEventListener('change', (e) => { shop.sort = e.target.value; renderShop(); });
$('#loadMore').addEventListener('click', () => { shop.limit += PAGE; renderShop(); });
renderTabs(); renderChips(); renderShop();

/* ───────── product modal ───────── */
const modal = $('#modal');
let lastFocus;
function openLayer(el) { lastFocus = document.activeElement; el.setAttribute('aria-hidden', 'false'); el.classList.add('is-open'); document.body.classList.add('lock'); }
function closeLayer(el) { el.setAttribute('aria-hidden', 'true'); el.classList.remove('is-open'); if (!$('.is-open')) document.body.classList.remove('lock'); lastFocus?.focus?.(); }
$$('.modal, .drawer, .sheet').forEach((el) => el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeLayer(el); }));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.is-open').forEach(closeLayer); });

function openProduct(id) {
  const p = byId[id];
  $('#heroResults').hidden = true;
  if ($('#searchSheet').classList.contains('is-open')) closeLayer($('#searchSheet'));
  let size = '100', qty = 1;
  const max = p.accords.length;
  $('#modalPanel').innerHTML = `
    <button class="icon-btn pm__close" data-close aria-label="Cerrar">✕</button>
    <div class="pm__media">${media(p)}</div>
    <div class="pm__info">
      <p class="eyebrow">${GENDER[p.gender]} · Inspirado en ${esc(p.house)}</p>
      <h3 class="pm__title" id="pmTitle">${esc(p.name)}</h3>
      ${p.blurb ? `<p class="pm__blurb">${esc(p.blurb)}</p>` : ''}
      <div class="pm__acc"><p class="pm__label">Acordes principales</p>
        ${p.accords.map((a, i) => `<div class="bar"><span style="--c:${ACCORDS[a] || '#ccc'};--w:${100 - (i * 55) / max}%"></span><em>${esc(a)}</em></div>`).join('')}
      </div>
      <p class="pm__label">Formato</p>
      <div class="sizes" role="radiogroup" aria-label="Formato">
        ${SIZES.map((s) => `<button role="radio" aria-checked="${s.id === size}" data-size="${s.id}"><strong>${s.label}</strong><span>${s.list && s.list !== s.unit ? `<s>${s.list}</s> ` : ''}${bs(s.unit)}</span><small>${s.packs.map((k) => `${k.qty}× ${bs(k.price)}`).join(' · ')}</small></button>`).join('')}
      </div>
      <div class="pm__buy">
        <div class="qty"><button data-q="-1" aria-label="Menos">−</button><output id="pmQty">1</output><button data-q="1" aria-label="Más">+</button></div>
        <button class="btn btn--dark btn--grow" id="pmAdd">Agregar al pedido · <span id="pmPrice"></span></button>
      </div>
      <a class="pm__ask" href="${waLink(`Hola Extracto Importado 👋 quiero consultar por la fragancia inspirada en ${p.name} (${p.house})`)}" target="_blank" rel="noopener">¿Dudas? Consultar por WhatsApp →</a>
    </div>`;
  const upd = () => {
    $('#pmQty').textContent = qty;
    $('#pmPrice').textContent = bs(bestPrice(size, qty));
    $$('[data-size]', modal).forEach((b) => b.setAttribute('aria-checked', b.dataset.size === size));
  };
  $$('[data-size]', modal).forEach((b) => b.addEventListener('click', () => { size = b.dataset.size; upd(); }));
  $$('[data-q]', modal).forEach((b) => b.addEventListener('click', () => { qty = Math.max(1, Math.min(20, qty + +b.dataset.q)); upd(); }));
  $('#pmAdd').addEventListener('click', () => { addToCart(p.id, size, qty); closeLayer(modal); });
  upd();
  openLayer(modal);
  $('#pmAdd').focus();
}

/* ───────── cart drawer ───────── */
function lineRow(l, i) {
  const p = byId[l.id];
  return `<div class="line" data-i="${i}">
    <button class="line__img" data-open="${p.id}" aria-label="Ver ${esc(p.name)}">${p.img ? `<img src="${p.img}" alt="" loading="lazy" />` : '<span class="res__ph">E</span>'}</button>
    <div class="line__info">
      <p class="line__name">${esc(p.name)}</p>
      <p class="line__house">Inspirado en ${esc(p.house)}</p>
      <div class="line__ctl">
        <label class="sr-only" for="sz${i}">Formato</label>
        <select id="sz${i}" data-line-size>${SIZES.map((s) => `<option value="${s.id}" ${s.id === l.size ? 'selected' : ''}>${s.label} · ${s.unit} Bs.</option>`).join('')}</select>
        <div class="qty qty--sm"><button data-line-q="-1" aria-label="Menos">−</button><output>${l.qty}</output><button data-line-q="1" aria-label="Más">+</button></div>
      </div>
    </div>
    <button class="line__rm" data-line-rm aria-label="Quitar ${esc(p.name)}">✕</button>
  </div>`;
}
function wireLines(root) {
  root.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-line-size]'); if (!sel) return;
    const i = +sel.closest('[data-i]').dataset.i;
    const l = cart[i]; const dup = cart.findIndex((x, k) => k !== i && x.id === l.id && x.size === sel.value);
    if (dup > -1) { cart[dup].qty += l.qty; cart.splice(i, 1); } else l.size = sel.value;
    cartChanged();
  });
  root.addEventListener('click', (e) => {
    const row = e.target.closest('[data-i]'); if (!row) return;
    const i = +row.dataset.i;
    if (e.target.closest('[data-line-rm]')) { cart.splice(i, 1); cartChanged(); }
    const q = e.target.closest('[data-line-q]');
    if (q) { cart[i].qty += +q.dataset.lineQ; if (cart[i].qty < 1) cart.splice(i, 1); cartChanged(); }
  });
}
function totalsHtml(t) {
  return `${t.groups.map((g) => `<div class="tot"><span>${g.n} × ${g.size.label}</span><span>${g.save ? `<s>${bs(g.list)}</s> ` : ''}${bs(g.price)}</span></div>`).join('')}
    ${t.save ? `<div class="tot tot--save"><span>Ahorro${PROMO.active ? ` ${PROMO.name}` : ' por promo'}</span><span>−${bs(t.save)}</span></div>` : ''}
    <div class="tot tot--ship"><span>Envío</span><span>${t.groups.some((g) => g.size.id === '100') ? 'Gratis en 100 ml' : 'A confirmar'}</span></div>
    <div class="tot tot--total"><span>Total</span><strong>${bs(t.total)}</strong></div>`;
}
function nudge(t) {
  const n100 = t.groups.find((g) => g.size.id === '100')?.n || 0;
  if (n100 === 1) return `Sumá 1 perfume de 100 ml más y llevás los dos por ${bs(bestPrice('100', 2))}.`;
  if (n100 === 3) return `Con 1 más llevás 4 perfumes por ${bs(bestPrice('100', 4))}.`;
  return '';
}
function renderCart() {
  const t = totals();
  $('#cartBody').innerHTML = cart.length
    ? `${nudge(t) ? `<p class="nudge">${nudge(t)}</p>` : ''}${cart.map(lineRow).join('')}`
    : `<div class="empty-cart"><p>Tu pedido está vacío.</p><a class="btn btn--line" href="#tienda" data-close>Ver catálogo</a></div>`;
  $('#cartFoot').innerHTML = cart.length
    ? `${totalsHtml(t)}<a class="btn btn--dark btn--block" href="#pedido" id="toCheckout">Continuar pedido →</a><p class="summary__note">Lo terminás por WhatsApp. Sin pagos en la web.</p>`
    : '';
}
wireLines($('#cartBody'));
$('#openCart').addEventListener('click', () => openLayer($('#cart')));
$('#cart').addEventListener('click', (e) => {
  if (e.target.closest('#toCheckout')) { closeLayer($('#cart')); goStep(cart.length ? 3 : 1); }
  if (e.target.closest('a[data-close]')) closeLayer($('#cart'));
});

/* ───────── search sheet ───────── */
wireSearch($('#sheetInput'), $('#sheetResults'), { limit: 10, onEnter: (q) => { closeLayer($('#searchSheet')); goShop(q); } });
$('#openSearch').addEventListener('click', () => { openLayer($('#searchSheet')); setTimeout(() => $('#sheetInput').focus(), 50); });

/* ───────── WhatsApp order funnel ───────── */
let step = 1;
const pick = { q: '', gender: 'all' };

function goStep(n) {
  if (n > 1 && !cart.length) { toast('Elegí al menos una fragancia'); n = 1; }
  step = n;
  $$('.steps__item').forEach((s) => { const k = +s.dataset.step; s.classList.toggle('is-active', k === step); s.classList.toggle('is-done', k < step); });
  $$('.pane').forEach((p) => p.classList.toggle('is-active', +p.dataset.pane === step));
  $('#stepBack').hidden = step === 1;
  $('#stepNext').hidden = step === 3;
  $('#stepNext').textContent = step === 1 ? `Continuar con ${cart.length || ''} fragancia${cart.length === 1 ? '' : 's'} →`.replace('con  ', 'con ') : 'Continuar →';
  const top = $('#pedido').getBoundingClientRect().top;
  if (top < -40 || top > innerHeight * 0.5) $('#pedido').scrollIntoView({ behavior: 'smooth' });
}
$('#stepNext').addEventListener('click', () => goStep(step + 1));
$('#stepBack').addEventListener('click', () => goStep(step - 1));
$('#steps').addEventListener('click', (e) => { const s = e.target.closest('[data-step]'); if (s) goStep(+s.dataset.step); });

$('#pickTabs').innerHTML = [['all', 'Todas'], ['femenino', 'Ella'], ['masculino', 'Él'], ['unisex', 'Unisex']]
  .map(([id, l]) => `<button role="tab" aria-selected="${id === 'all'}" data-pg="${id}">${l}</button>`).join('');
$('#pickTabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-pg]'); if (!b) return;
  pick.gender = b.dataset.pg;
  $$('[data-pg]').forEach((x) => x.setAttribute('aria-selected', x === b));
  renderPick();
});
$('#pickSearch').addEventListener('input', (e) => { pick.q = e.target.value; renderPick(); });
function renderPick() {
  let list = products.filter((p) => pick.gender === 'all' || p.gender === pick.gender);
  list = search(pick.q, list);
  if (!pick.q && pick.gender === 'all') list = [...showcase, ...list.filter((p) => !bestsellers.includes(p.id))];
  $('#pickList').innerHTML = list.slice(0, 60).map((p) => {
    const on = inCart(p.id);
    return `<button class="pick ${on ? 'is-on' : ''}" data-pick="${p.id}" aria-pressed="${on}">
      ${p.img ? `<img src="${p.img}" alt="" loading="lazy" />` : '<span class="res__ph">E</span>'}
      <span class="pick__t"><strong>${esc(p.name)}</strong><small>${esc(p.house)}</small></span>
      <span class="pick__chk" aria-hidden="true"></span>
    </button>`;
  }).join('') + (list.length > 60 ? `<p class="pick__more">Mostrando 60 de ${list.length}. Buscá por nombre para encontrar más.</p>` : '')
    || `<p class="res__none">No encontramos “${esc(pick.q)}”. Igual podés escribirnos: <a href="${waLink(`Hola Extracto Importado 👋 ¿tienen la equivalencia de ${pick.q}?`)}" target="_blank" rel="noopener">consultar por WhatsApp</a>.</p>`;
}
$('#pickList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-pick]'); if (!b) return;
  const id = b.dataset.pick;
  if (inCart(id)) removeProduct(id); else addToCart(id, '100', 1, { silent: true });
});

const form = $('#orderForm');
$('#fCity').innerHTML = DEPARTAMENTOS.map((d) => `<option>${d}</option>`).join('');
function renderFunnel() {
  renderPick();
  $('#lines').innerHTML = cart.length ? cart.map(lineRow).join('') : '<p class="muted">Todavía no elegiste fragancias.</p>';
  const t = totals();
  $('#summaryItems').innerHTML = cart.length
    ? cart.map((l) => `<div class="sum"><span>${esc(byId[l.id].name)} <small>${sizeById[l.size].label}</small></span><span>× ${l.qty}</span></div>`).join('') + (nudge(t) ? `<p class="nudge">${nudge(t)}</p>` : '')
    : '<p class="muted">Elegí tus fragancias a la izquierda.</p>';
  $('#summaryTotals').innerHTML = cart.length ? totalsHtml(t) : '';
  $('#sendWa').disabled = !cart.length;
  if (step === 1) $('#stepNext').textContent = cart.length ? `Continuar con ${cart.length} fragancia${cart.length === 1 ? '' : 's'} →` : 'Continuar →';
}
wireLines($('#lines'));

function orderMessage() {
  const t = totals();
  const f = Object.fromEntries(new FormData(form));
  const lines = cart.map((l) => `• ${byId[l.id].name} (inspirado en ${byId[l.id].house}) — ${sizeById[l.size].label} × ${l.qty}`);
  return [
    'Hola Extracto Importado 👋 quiero hacer este pedido:',
    '',
    ...lines,
    '',
    ...t.groups.map((g) => `${g.n} × ${g.size.label}: ${bs(g.price)}`),
    t.save ? `Ahorro${PROMO.active ? ` ${PROMO.name}` : ' por promo'}: ${bs(t.save)}` : null,
    `*Total estimado: ${bs(t.total)}*`,
    '',
    `Nombre: ${f.name || '—'}`,
    `Departamento: ${f.city}`,
    `Entrega: ${f.delivery}`,
    f.addr ? `Dirección/zona: ${f.addr}` : null,
    `Pago: ${f.pay}`,
    f.note ? `Nota: ${f.note}` : null,
  ].filter((x) => x !== null).join('\n');
}
$('#sendWa').addEventListener('click', () => {
  if (!cart.length) return;
  if (step < 3 || !$('#fName').value.trim()) {
    goStep(3);
    $('#fName').focus();
    $('#fName').closest('.field').classList.add('is-err');
    toast('Completá tu nombre para enviar el pedido');
    return;
  }
  window.open(waLink(orderMessage()), '_blank', 'noopener');
});
$('#fName').addEventListener('input', () => $('#fName').closest('.field').classList.remove('is-err'));

/* ───────── promo copy ───────── */
if (PROMO.active) {
  document.documentElement.classList.add('has-promo');
  $('#compareAdd').textContent = `Agregar · ${PRICE_100} Bs.`;
}

/* ───────── misc ───────── */
const track = $('.topbar__track');
[...track.children].forEach((n) => { const c = n.cloneNode(true); c.className = 'dup'; c.setAttribute('aria-hidden', 'true'); track.append(c); });
$('#faqList').innerHTML = faqs.map((f) => `<details class="qa"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('');
$$('[data-wa]').forEach((a) => { a.href = waLink(a.dataset.wa); });
$('#year').textContent = new Date().getFullYear();

let tT;
function toast(msg) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${cart.length ? '<button id="toastCart">Ver pedido</button>' : ''}`;
  el.classList.add('is-on');
  clearTimeout(tT);
  tT = setTimeout(() => el.classList.remove('is-on'), 3200);
}
$('#toast').addEventListener('click', (e) => { if (e.target.closest('#toastCart')) { $('#toast').classList.remove('is-on'); openLayer($('#cart')); } });

const nav = $('#nav');
addEventListener('scroll', () => nav.classList.toggle('is-scrolled', scrollY > 10), { passive: true });

cartChanged();
$('#cartCount').classList.remove('bump');
