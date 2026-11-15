// Shared chrome + motion for every page: header, menu, footer, cart drawer,
// search sheet, toast, Lenis smooth scroll, GSAP reveals, page transitions, 3D tilt cards.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import {
  esc, bs, products, byId, search, productUrl, GENDER, SIZES, sizeById, cart, onCart, addToCart, inCart,
  removeLine, setQty, setSize, totals, nudge, saveLabel, PROMO, PRICE_100, LIST_100, waLink,
} from './store.js';
import { mountChat } from './chat.js';

gsap.registerPlugin(ScrollTrigger, SplitText);
export { gsap, ScrollTrigger, SplitText };

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export { $, $$ };

const WA_ICON = '<svg viewBox="0 0 32 32" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3Zm0 23.6c-2 0-4-.5-5.7-1.6l-.4-.2-3.9 1 1-3.8-.3-.4A10.6 10.6 0 1 1 16 26.6Zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5 1-1.7.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.7 3.7 0 0 0-1.1 2.7 6.5 6.5 0 0 0 1.4 3.4 14.6 14.6 0 0 0 5.6 5c2.1.9 2.9 1 4 .8.6-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5l-.4-.4Z"/></svg>';
export { WA_ICON };
const ICON_SEARCH = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm5.3-2.2L21 21"/></svg>';
const ICON_BAG = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M5 8h14l-1.2 12H6.2L5 8Zm4 0V6a3 3 0 0 1 6 0v2"/></svg>';

const NAV = [
  ['/tienda', 'Tienda', 'tienda'],
  ['/tienda?linea=femenino', 'Para ella', 'ella'],
  ['/tienda?linea=masculino', 'Para él', 'el'],
  ['/precios', 'Precios', 'precios'],
  ['/nosotros', 'Nosotros', 'nosotros'],
  ['/ayuda', 'Ayuda', 'ayuda'],
];

/* ───────── chrome ───────── */
function chrome(page) {
  const promo = PROMO.active
    ? `<a class="topbar__item topbar__item--hot" href="/precios">${PROMO.name} · Perfumes de 100 ml a ${PRICE_100} Bs.</a>`
    : '';
  const items = `${promo}<span class="topbar__item">Envío gratis a toda Bolivia en 100 ml</span><span class="topbar__item">Pedidos por WhatsApp · 659 071 81</span><span class="topbar__item">+8 horas de duración</span>`;
  document.body.insertAdjacentHTML('afterbegin', `
  <a class="skip" href="#main">Saltar al contenido</a>
  <div class="topbar"><div class="topbar__track">${items}${items.replace(/class="topbar__item/g, 'aria-hidden="true" class="topbar__item')}</div></div>
  <header class="nav" id="nav">
    <div class="nav__inner">
      <button class="nav__burger" id="burger" aria-label="Abrir menú" aria-expanded="false" aria-controls="menu"><span></span><span></span></button>
      <a href="/" class="wordmark" aria-label="Extracto Importado — inicio">
        <span class="wordmark__w">EXTRACTO</span><span class="wordmark__s">IMPORTADO</span>
      </a>
      <nav class="nav__links" aria-label="Principal">
        ${NAV.map(([h, l, k]) => `<a href="${h}" ${k === page ? 'aria-current="page"' : ''}>${l}</a>`).join('')}
      </nav>
      <div class="nav__actions">
        <button class="icon-btn" id="openSearch" aria-label="Buscar">${ICON_SEARCH}</button>
        <button class="icon-btn cart-btn" id="openCart" aria-label="Ver pedido">${ICON_BAG}<span class="cart-btn__count" id="cartCount" hidden>0</span></button>
      </div>
    </div>
  </header>
  <div class="menu" id="menu" aria-hidden="true">
    <nav class="menu__links">
      <a href="/">Inicio</a>${NAV.map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}<a href="/pedido">Hacer pedido</a>
    </nav>
    <div class="menu__foot"><a href="${waLink('Hola Extracto Importado 👋')}" target="_blank" rel="noopener">WhatsApp 659 071 81</a><a href="https://www.instagram.com/extractoimportado_sc/" target="_blank" rel="noopener">Instagram</a></div>
  </div>`);

  document.body.insertAdjacentHTML('beforeend', `
  <footer class="footer">
    <div class="footer__top">
      <div class="footer__cta">
        <p class="footer__kicker">Santa Cruz de la Sierra · Bolivia</p>
        <p class="footer__big">Tu aroma<br/>habla de vos.</p>
        <a class="btn btn--light" href="/pedido" data-magnetic>Hacer un pedido</a>
      </div>
      <div class="footer__cols">
        <div><p class="footer__h">Tienda</p><a href="/tienda">Todo el catálogo</a><a href="/tienda?linea=femenino">Para ella</a><a href="/tienda?linea=masculino">Para él</a><a href="/tienda?linea=unisex">Unisex & nicho</a><a href="/precios">Precios y decants</a></div>
        <div><p class="footer__h">Extracto</p><a href="/nosotros">Nosotros</a><a href="/nosotros#equivalencia">¿Qué es una equivalencia?</a><a href="/ayuda">Ayuda y envíos</a><a href="/pedido">Hacer pedido</a></div>
        <div><p class="footer__h">Contacto</p><a href="${waLink('Hola Extracto Importado 👋')}" target="_blank" rel="noopener">WhatsApp 659 071 81</a><a href="https://www.instagram.com/extractoimportado_sc/" target="_blank" rel="noopener">@extractoimportado_sc</a><button class="footer__chat" data-chat-open>Asesor virtual</button></div>
      </div>
    </div>
    <div class="footer__mark" aria-hidden="true">EXTRACTO</div>
    <p class="footer__legal">© ${new Date().getFullYear()} Extracto Importado. Nuestras fragancias son versiones inspiradas (equivalencias); las marcas y fotos de frascos originales se muestran únicamente como referencia olfativa y pertenecen a sus respectivos dueños.</p>
  </footer>
  <div class="drawer" id="cart" aria-hidden="true">
    <div class="drawer__backdrop" data-close></div>
    <aside class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="cartTitle">
      <div class="drawer__head"><p id="cartTitle">Tu pedido</p><button class="icon-btn" data-close aria-label="Cerrar">✕</button></div>
      <div class="drawer__body" id="cartBody" data-lenis-prevent></div>
      <div class="drawer__foot" id="cartFoot"></div>
    </aside>
  </div>
  <div class="sheet" id="searchSheet" aria-hidden="true">
    <div class="sheet__backdrop" data-close></div>
    <div class="sheet__panel" role="dialog" aria-modal="true" aria-label="Buscar">
      <label class="field-search field-search--lg">${ICON_SEARCH}<span class="sr-only">Buscar</span>
        <input id="sheetInput" type="search" placeholder="Buscá un perfume o marca: Sauvage, Yara, Chanel…" autocomplete="off" />
        <button class="icon-btn" data-close aria-label="Cerrar">✕</button>
      </label>
      <div class="results" id="sheetResults" data-lenis-prevent></div>
    </div>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <div class="curtain" id="curtain" aria-hidden="true"><span class="curtain__mark">EXTRACTO</span></div>`);
}

/* ───────── layers ───────── */
let lenis = null;
export const getLenis = () => lenis;
let lastFocus;
export function openLayer(el) {
  lastFocus = document.activeElement;
  el.setAttribute('aria-hidden', 'false');
  el.classList.add('is-open');
  document.documentElement.classList.add('lock');
  lenis?.stop();
}
export function closeLayer(el) {
  el.setAttribute('aria-hidden', 'true');
  el.classList.remove('is-open');
  if (!$('.drawer.is-open, .sheet.is-open, .menu.is-open, .modal.is-open')) {
    document.documentElement.classList.remove('lock');
    lenis?.start();
  }
  lastFocus?.focus?.({ preventScroll: true });
}

/* ───────── toast ───────── */
let tT;
export function toast(msg, withCart = true) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${withCart && cart.length ? '<button data-open-cart>Ver pedido</button>' : ''}`;
  el.classList.add('is-on');
  clearTimeout(tT);
  tT = setTimeout(() => el.classList.remove('is-on'), 3200);
}

/* ───────── product card ───────── */
export function media(p, cls = '') {
  if (p.img) return `<img class="${cls}" src="${p.img}" alt="Inspirado en ${esc(p.name)} de ${esc(p.house)}: el original junto al frasco Extracto Importado" loading="lazy" decoding="async" width="760" height="440" />`;
  return `<div class="label-art ${cls}" role="img" aria-label="Frasco Extracto Importado inspirado en ${esc(p.name)}">
    <div class="label-art__label"><span class="label-art__w">EXTRACTO</span><span class="label-art__s">IMPORTADO</span><span class="label-art__n">${esc(p.name)}</span><span class="label-art__p">PARFUM · 100 ML</span></div></div>`;
}
export const priceHtml = () => `${PROMO.active ? `<s>${LIST_100}</s>` : ''}<strong>${bs(PRICE_100)}</strong>`;

export function card(p) {
  const badge = p.soon ? '<span class="tag">Próximamente</span>' : p.isNew ? '<span class="tag tag--new">Nuevo</span>' : PROMO.active ? `<span class="tag tag--promo">${PROMO.name}</span>` : '';
  return `<article class="pcard" data-tilt>
    <a class="pcard__media" href="${productUrl(p.id)}" aria-label="${esc(p.name)}, inspirado en ${esc(p.house)}">${media(p)}${badge}<span class="pcard__glare" aria-hidden="true"></span></a>
    <div class="pcard__body">
      <p class="pcard__house">${esc(p.house)}</p>
      <h3 class="pcard__name"><a href="${productUrl(p.id)}">${esc(p.name)}</a></h3>
      <p class="pcard__acc">${p.accords.slice(0, 3).map((a) => esc(a)).join(' · ')}</p>
      <div class="pcard__foot">
        <p class="pcard__price">${priceHtml()}<span>100 ml</span></p>
        <button class="add ${inCart(p.id) ? 'is-in' : ''}" data-add="${p.id}" aria-label="Agregar ${esc(p.name)} 100 ml al pedido"><span class="add__plus">+</span><span class="add__ok">✓</span></button>
      </div>
    </div>
  </article>`;
}

/* 3D tilt with glare — applied to any [data-tilt] (re-run after rendering cards) */
export function tilt(root = document) {
  if (!finePointer || reduced) return;
  $$('[data-tilt]:not([data-tilt-on])', root).forEach((el) => {
    el.dataset.tiltOn = '1';
    const max = +(el.dataset.tilt || 9);
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3' });
    gsap.set(el, { transformPerspective: 900, transformStyle: 'preserve-3d' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      ry((x - 0.5) * max * 2);
      rx((0.5 - y) * max * 2);
      el.style.setProperty('--gx', `${x * 100}%`);
      el.style.setProperty('--gy', `${y * 100}%`);
    });
    el.addEventListener('pointerenter', () => el.classList.add('is-tilt'));
    el.addEventListener('pointerleave', () => { rx(0); ry(0); el.classList.remove('is-tilt'); });
  });
}

/* magnetic buttons */
function magnetic() {
  if (!finePointer || reduced) return;
  $$('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.3);
      y((e.clientY - r.top - r.height / 2) * 0.4);
    });
    el.addEventListener('pointerleave', () => { x(0); y(0); });
  });
}

/* ───────── scroll reveals ───────── */
export function reveals(root = document) {
  if (reduced) return;
  // headings: masked line reveal
  $$('[data-split]:not([data-split-on])', root).forEach((el) => {
    el.dataset.splitOn = '1';
    const type = el.dataset.split || 'lines';
    SplitText.create(el, {
      type: type === 'chars' ? 'lines,chars' : 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit(self) {
        const targets = type === 'chars' ? self.chars : self.lines;
        return gsap.from(targets, {
          yPercent: 110, rotate: type === 'chars' ? 0 : 2, duration: 1.1, ease: 'expo.out',
          stagger: type === 'chars' ? 0.025 : 0.09,
          scrollTrigger: el.dataset.splitNow != null ? undefined : { trigger: el, start: 'top 88%', once: true },
          delay: +(el.dataset.delay || 0),
        });
      },
    });
  });
  // words scrubbed from dim to full as you scroll
  $$('[data-scrub-words]:not([data-scrub-on])', root).forEach((el) => {
    el.dataset.scrubOn = '1';
    const split = SplitText.create(el, { type: 'words' });
    gsap.fromTo(split.words, { opacity: 0.14 }, {
      opacity: 1, stagger: 0.08, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
  });
  // generic fade-up
  ScrollTrigger.batch($$('[data-reveal]:not([data-reveal-on])', root).map((el) => { el.dataset.revealOn = '1'; return el; }), {
    start: 'top 92%', once: true,
    onEnter: (els) => gsap.fromTo(els, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.08, overwrite: true }),
  });
  // image clip reveal
  $$('[data-clip]:not([data-clip-on])', root).forEach((el) => {
    el.dataset.clipOn = '1';
    gsap.fromTo(el, { clipPath: 'inset(18% 12% 18% 12% round 24px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 18px)', ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 30%', scrub: true },
    });
    const img = el.querySelector('img');
    if (img) gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  // parallax
  $$('[data-parallax]:not([data-parallax-on])', root).forEach((el) => {
    el.dataset.parallaxOn = '1';
    gsap.to(el, { yPercent: +(el.dataset.parallax || -15), ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  // counters
  $$('[data-count]:not([data-count-on])', root).forEach((el) => {
    el.dataset.countOn = '1';
    const o = { v: 0 };
    gsap.to(o, { v: +el.dataset.count, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { el.textContent = Math.round(o.v) + (el.dataset.suffix || ''); } });
  });
}

/* ───────── cart drawer ───────── */
export function lineRow(l, i) {
  const p = byId[l.id];
  return `<div class="line" data-i="${i}">
    <a class="line__img" href="${productUrl(p.id)}" aria-label="${esc(p.name)}">${p.img ? `<img src="${p.img}" alt="" loading="lazy" />` : '<span class="ph">E</span>'}</a>
    <div class="line__info">
      <p class="line__name">${esc(p.name)}</p>
      <p class="line__house">Inspirado en ${esc(p.house)}</p>
      <div class="line__ctl">
        <label class="sr-only" for="sz${i}-${l.id}">Formato</label>
        <select id="sz${i}-${l.id}" data-line-size>${SIZES.map((s) => `<option value="${s.id}" ${s.id === l.size ? 'selected' : ''}>${s.label} · ${s.unit} Bs.</option>`).join('')}</select>
        <div class="qty qty--sm"><button data-line-q="-1" aria-label="Menos">−</button><output>${l.qty}</output><button data-line-q="1" aria-label="Más">+</button></div>
      </div>
    </div>
    <button class="line__rm" data-line-rm aria-label="Quitar ${esc(p.name)}">✕</button>
  </div>`;
}
export function wireLines(root) {
  root.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-line-size]'); if (!sel) return;
    setSize(+sel.closest('[data-i]').dataset.i, sel.value);
  });
  root.addEventListener('click', (e) => {
    const row = e.target.closest('[data-i]'); if (!row) return;
    const i = +row.dataset.i;
    if (e.target.closest('[data-line-rm]')) removeLine(i);
    const q = e.target.closest('[data-line-q]');
    if (q) setQty(i, cart[i].qty + +q.dataset.lineQ);
  });
}
export function totalsHtml(t = totals()) {
  return `${t.groups.map((g) => `<div class="tot"><span>${g.n} × ${g.size.label}</span><span>${g.save ? `<s>${bs(g.list)}</s> ` : ''}${bs(g.price)}</span></div>`).join('')}
    ${t.save ? `<div class="tot tot--save"><span>${saveLabel}</span><span>−${bs(t.save)}</span></div>` : ''}
    <div class="tot"><span>Envío</span><span>${t.groups.some((g) => g.size.id === '100') ? 'Gratis' : 'A confirmar'}</span></div>
    <div class="tot tot--total"><span>Total</span><strong>${bs(t.total)}</strong></div>`;
}
function renderCart() {
  const t = totals();
  $('#cartBody').innerHTML = cart.length
    ? `${nudge(t) ? `<p class="nudge">${nudge(t)}</p>` : ''}${cart.map(lineRow).join('')}`
    : '<div class="empty-cart"><p>Tu pedido está vacío.</p><a class="btn btn--line" href="/tienda">Ver la tienda</a></div>';
  $('#cartFoot').innerHTML = cart.length
    ? `${totalsHtml(t)}<a class="btn btn--dark btn--block" href="/pedido#datos">Continuar pedido</a><p class="fine">Lo terminás por WhatsApp. Sin pagos en la web.</p>`
    : '';
  const c = $('#cartCount');
  c.hidden = !t.count;
  c.textContent = t.count;
  $$('[data-add]').forEach((b) => b.classList.toggle('is-in', inCart(b.dataset.add)));
}

/* ───────── search sheet ───────── */
export function resultRow(p) {
  return `<div class="res">
    <a class="res__main" href="${productUrl(p.id)}">
      ${p.img ? `<img src="${p.img}" alt="" loading="lazy" />` : '<span class="ph">E</span>'}
      <span><strong>${esc(p.name)}</strong><small>${esc(p.house)} · ${GENDER[p.gender]}</small></span>
    </a>
    <button class="res__add" data-add="${p.id}" aria-label="Agregar ${esc(p.name)}">+ ${PRICE_100} Bs.</button>
  </div>`;
}
export function wireSearch(input, box, { limit = 6, onEnter, keepOpen } = {}) {
  const render = () => {
    const q = input.value.trim();
    if (!q) { if (!keepOpen) box.hidden = true; box.innerHTML = ''; input.setAttribute('aria-expanded', 'false'); return; }
    const r = search(q).slice(0, limit);
    box.innerHTML = r.length
      ? r.map(resultRow).join('') + `<a class="res__all" href="/tienda?q=${encodeURIComponent(q)}">Ver todos los resultados para “${esc(q)}” →</a>`
      : `<p class="res__none">No encontramos “${esc(q)}”. <a href="${waLink(`Hola Extracto Importado 👋 ¿tienen la equivalencia de ${q}?`)}" target="_blank" rel="noopener">Preguntanos por WhatsApp</a> o <button data-chat-open data-chat-q="¿Tienen algo parecido a ${esc(q)}?">consultá al asesor</button>.</p>`;
    box.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  };
  input.addEventListener('input', render);
  input.addEventListener('focus', render);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); (onEnter || ((q) => { location.href = `/tienda?q=${encodeURIComponent(q)}`; }))(input.value.trim()); }
    if (e.key === 'Escape' && !keepOpen) box.hidden = true;
  });
  return render;
}

/* ───────── page transitions ───────── */
function transitions() {
  const curtain = $('#curtain');
  const arrived = sessionStorage.getItem('ei-transit') === '1';
  sessionStorage.removeItem('ei-transit');
  if (arrived && !reduced) {
    gsap.set(curtain, { yPercent: 0, autoAlpha: 1 });
    gsap.to(curtain, { yPercent: -100, duration: 0.9, ease: 'expo.inOut', delay: 0.05, onComplete: () => gsap.set(curtain, { autoAlpha: 0 }) });
  } else gsap.set(curtain, { autoAlpha: 0 });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname.startsWith('/img/')) return;
    const samePage = url.pathname === location.pathname && url.search === location.search;
    if (samePage) {
      if (url.hash) { e.preventDefault(); const t = $(url.hash); if (t) lenis ? lenis.scrollTo(t, { offset: -80 }) : t.scrollIntoView(); }
      return;
    }
    if (reduced) return;
    e.preventDefault();
    $$('.is-open').forEach(closeLayer);
    sessionStorage.setItem('ei-transit', '1');
    gsap.fromTo(curtain, { yPercent: 100, autoAlpha: 1 }, { yPercent: 0, duration: 0.65, ease: 'expo.inOut', onComplete: () => { location.href = url.href; } });
  });
  // bfcache: make sure curtain is gone when navigating back
  addEventListener('pageshow', (e) => { if (e.persisted) gsap.set(curtain, { autoAlpha: 0 }); });
}

/* ───────── smooth scroll ───────── */
function smooth() {
  if (reduced) return;
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 1.4, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  if (location.hash) setTimeout(() => { const t = $(location.hash); if (t) lenis.scrollTo(t, { offset: -80, immediate: true }); }, 60);
}

/* ───────── init ───────── */
export function initLayout(page, { darkHero = false } = {}) {
  chrome(page);
  if (darkHero) document.body.classList.add('has-dark-hero');

  const nav = $('#nav');
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    nav.classList.toggle('is-hidden', y > 400 && y > (onScroll.last || 0) + 2 && !$('.is-open'));
    if (y < (onScroll.last || 0) - 2) nav.classList.remove('is-hidden');
    onScroll.last = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // mobile menu
  const menu = $('#menu'), burger = $('#burger');
  burger.addEventListener('click', () => {
    const open = !menu.classList.contains('is-open');
    burger.setAttribute('aria-expanded', open);
    burger.classList.toggle('is-x', open);
    if (open) {
      openLayer(menu);
      if (!reduced) gsap.fromTo($$('.menu__links a, .menu__foot a', menu), { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, ease: 'expo.out', stagger: 0.05, delay: 0.15 });
    } else closeLayer(menu);
  });

  // layers
  $$('.drawer, .sheet').forEach((el) => el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeLayer(el); }));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    $$('.is-open').forEach((el) => { closeLayer(el); if (el === menu) { burger.classList.remove('is-x'); burger.setAttribute('aria-expanded', 'false'); } });
  });
  $('#openCart').addEventListener('click', () => openLayer($('#cart')));
  $('#openSearch').addEventListener('click', () => { openLayer($('#searchSheet')); setTimeout(() => $('#sheetInput').focus(), 60); });
  wireSearch($('#sheetInput'), $('#sheetResults'), { limit: 8, keepOpen: true });
  wireLines($('#cartBody'));

  // global: add to cart / open cart
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) {
      e.preventDefault();
      const p = byId[add.dataset.add];
      addToCart(p.id, add.dataset.size || '100');
      toast(`Agregado: ${p.name} · ${sizeById[add.dataset.size || '100'].label}`);
      if (!reduced) {
        gsap.fromTo(add, { scale: 0.8 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
        gsap.fromTo('#cartCount', { scale: 1.6 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      }
    }
    if (e.target.closest('[data-open-cart]')) { $('#toast').classList.remove('is-on'); openLayer($('#cart')); }
  });

  onCart(renderCart);
  renderCart();
  smooth();
  transitions();
  mountChat();
  // wait for fonts so split lines measure correctly
  (document.fonts?.ready || Promise.resolve()).then(() => { reveals(); tilt(); magnetic(); ScrollTrigger.refresh(); });
}
