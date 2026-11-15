import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { fragrances, bottlePrices, decants, quiz, posts, badges, waLink } from './data.js';
import { catalog, ACCORDS, accordGroups, groupScore, counts } from './catalog.js';
import { bottleSVG } from './bottle.js';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const pad = (n) => String(n).padStart(2, '0');
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const genderLabel = { femenino: 'Femenino', masculino: 'Masculino', unisex: 'Unisex' };

$('#year').textContent = new Date().getFullYear();

// Link featured (Instagram) fragrances to their catalog entry for accords.
fragrances.forEach((f) => {
  const c = catalog.find((x) => norm(x.name) === norm(f.name) && norm(x.house) === norm(f.house));
  if (c) { f.accords = c.accords; f.gender = c.gender; f.n = c.n; }
});

/* ---------------- WhatsApp ---------------- */
function wireWA(root = document) {
  $$('[data-wa]', root).forEach((a) => { a.href = waLink(a.dataset.wa); });
}

/* ---------------- Smooth scroll ---------------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
function scrollTo(target) {
  if (lenis) lenis.scrollTo(target, { offset: -10 });
  else document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (href.length < 2) return;
  e.preventDefault();
  closeMenu();
  scrollTo(href);
});

/* ---------------- Split text ---------------- */
function splitChars(el) {
  const words = el.textContent.split(' ');
  el.textContent = '';
  const chars = [];
  words.forEach((w, wi) => {
    const word = document.createElement('span');
    word.className = 'word';
    [...w].forEach((ch) => {
      const s = document.createElement('span');
      s.className = 'char';
      s.textContent = ch;
      word.appendChild(s);
      chars.push(s);
    });
    el.appendChild(word);
    if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
  });
  return chars;
}

/* ---------------- Hero ---------------- */
let hero = null;
const glow = $('#heroGlow');
const swatchWrap = $('#heroSwatches');
const heroName = $('#heroScentName');
const heroScents = fragrances.filter((f) => !f.soon);
let autoCycle = true;
let heroIdx = 0;

function selectScent(i) {
  heroIdx = i;
  const f = heroScents[i];
  $$('.swatch', swatchWrap).forEach((s, j) => s.setAttribute('aria-pressed', String(i === j)));
  heroName.innerHTML = `${esc(f.name)} <span>— inspirado en ${esc(f.house)}</span>`;
  glow.style.setProperty('--glow', f.color);
  glow.style.setProperty('--glow-deep', f.deep);
  hero?.setScent(f);
}
heroScents.forEach((f, i) => {
  const b = document.createElement('button');
  b.className = 'swatch';
  b.style.setProperty('--c', f.color);
  b.style.setProperty('--d', f.deep);
  b.setAttribute('aria-label', `${f.name}, inspirado en ${f.house}`);
  b.dataset.cursor = f.name;
  b.addEventListener('click', () => { autoCycle = false; selectScent(i); });
  swatchWrap.appendChild(b);
});

async function initHero() {
  try {
    const { createHero } = await import('./hero3d.js');
    await document.fonts.ready;
    hero = createHero($('#heroCanvas'), { reducedMotion: reduced });
  } catch (e) { hero = null; }
  if (!hero) {
    document.body.classList.add('no-webgl');
    $('.hero__fallback').innerHTML = bottleSVG();
  }
  selectScent(0);
  if (!reduced) {
    setInterval(() => {
      if (!autoCycle || window.scrollY > window.innerHeight) return;
      selectScent((heroIdx + 1) % heroScents.length);
    }, 4200);
  }
  ScrollTrigger.create({
    trigger: '#hero', start: 'top top', end: 'bottom top',
    onUpdate: (s) => hero?.setScroll(s.progress),
  });
}

/* ---------------- Loader ---------------- */
function runLoader() {
  return new Promise((resolve) => {
    const count = $('#loaderCount');
    const bar = $('#loaderBar');
    const o = { v: 0 };
    gsap.timeline({ onComplete: resolve })
      .from('.loader__word', { letterSpacing: '0.9em', opacity: 0, duration: 1.4, ease: 'expo.out' })
      .from('.loader__sub', { opacity: 0, y: 10, duration: 0.8 }, 0.4)
      .to(o, {
        v: 100, duration: reduced ? 0.3 : 1.6, ease: 'power2.inOut',
        onUpdate: () => { count.textContent = Math.round(o.v); bar.style.transform = `scaleX(${o.v / 100})`; },
      }, 0.2)
      .to('.loader__mark, .loader__bar, .loader__count', { opacity: 0, y: -24, duration: 0.5, stagger: 0.05 })
      .to('#loader', { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '-=0.2')
      .set('#loader', { display: 'none' });
  });
}

function heroIntro() {
  const chars = $$('.hero__title .split').flatMap(splitChars);
  gsap.timeline()
    .from(chars, { yPercent: 120, rotate: 6, opacity: 0, duration: 1.4, ease: 'expo.out', stagger: 0.03 })
    .from('.reveal-hero', { y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08 }, '-=1')
    .from('#heroCanvas, .hero__fallback', { opacity: 0, scale: 0.9, duration: 1.8, ease: 'power3.out' }, 0)
    .from('.nav', { y: -40, opacity: 0, duration: 1, ease: 'power3.out', clearProps: 'transform,opacity' }, 0.3);

  gsap.to('.hero__title', {
    yPercent: -30, opacity: 0.15, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}

/* ---------------- Cursor & magnetic ---------------- */
function initCursor() {
  if (!finePointer || reduced) return;
  const c = $('#cursor');
  const label = $('#cursorLabel');
  document.body.classList.add('has-cursor');
  const xTo = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); });
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor], a, button, input');
    c.classList.remove('is-hover', 'is-label');
    label.textContent = '';
    if (!t) return;
    if (t.dataset.cursor) { c.classList.add('is-label'); label.textContent = t.dataset.cursor; }
    else c.classList.add('is-hover');
  });
  $$('.magnetic').forEach((el) => {
    const xm = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1,0.4)' });
    const ym = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1,0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xm((e.clientX - r.left - r.width / 2) * 0.35);
      ym((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => { xm(0); ym(0); });
  });
}

/* ---------------- Nav ---------------- */
const nav = $('#nav');
const menu = $('#menu');
const burger = $('#burger');
function closeMenu() {
  document.body.classList.remove('menu-open');
  burger.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-hidden', 'true');
}
burger.addEventListener('click', () => {
  const open = !document.body.classList.contains('menu-open');
  document.body.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-hidden', String(!open));
  if (open) gsap.from('#menu a', { yPercent: 100, opacity: 0, stagger: 0.06, duration: 0.8, ease: 'expo.out' });
});
let lastY = 0;
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: (s) => {
    const y = s.scroll();
    nav.classList.toggle('is-solid', y > 60);
    nav.classList.toggle('is-hidden', y > lastY && y > 400 && !document.body.classList.contains('menu-open'));
    lastY = y;
  },
});

/* ---------------- Marquee ---------------- */
function initMarquee() {
  const track = $('#marquee');
  track.innerHTML += track.innerHTML;
  if (reduced) return;
  const tween = gsap.to(track, { xPercent: -50, duration: 32, ease: 'none', repeat: -1 });
  let decay;
  ScrollTrigger.create({
    onUpdate: (s) => {
      const v = s.getVelocity() / 250;
      tween.timeScale(Math.max(-6, Math.min(6, 1 + v)));
      clearTimeout(decay);
      decay = setTimeout(() => gsap.to(tween, { timeScale: 1, duration: 1 }), 120);
    },
  });
}

/* ---------------- Manifesto & stats ---------------- */
function initManifesto() {
  const el = $('#manifestoText');
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
  if (!reduced) {
    gsap.fromTo('#manifestoText .w', { opacity: 0.12 }, {
      opacity: 1, stagger: 0.05, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
  }
  $$('.stat__num').forEach((n) => {
    const end = +n.dataset.count; const suf = n.dataset.suffix || '';
    const o = { v: 0 };
    const fmt = () => { n.textContent = Math.round(o.v).toLocaleString('es-BO') + suf; };
    if (reduced) { o.v = end; fmt(); return; }
    ScrollTrigger.create({
      trigger: n, start: 'top 90%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: fmt }),
    });
  });
}

/* ---------------- Flask editorial ---------------- */
function initFlask() {
  if (reduced) return;
  gsap.fromTo('.flask__img img', { yPercent: -8, scale: 1.15 }, {
    yPercent: 8, scale: 1.15, ease: 'none',
    scrollTrigger: { trigger: '.flask', start: 'top bottom', end: 'bottom top', scrub: true },
  });
  gsap.from('.flask__img', {
    clipPath: 'inset(100% 0 0 0)', duration: 1.6, ease: 'expo.inOut',
    scrollTrigger: { trigger: '.flask', start: 'top 75%', once: true },
  });
  gsap.from('.flask__specs li', {
    x: 40, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out',
    scrollTrigger: { trigger: '.flask__specs', start: 'top 85%', once: true },
  });
  attachTilt($('.flask__photo'), 8);
}

/* ---------------- Accord bars ---------------- */
function accordBars(accords, max = 5) {
  return `<ul class="accords">${accords.slice(0, max).map((a, i) => `
    <li style="--w:${100 - i * 13}%;--ac:${ACCORDS[a] || '#888'}"><span>${a}</span></li>`).join('')}</ul>`;
}

/* ---------------- Favorites (3D tilt cards) ---------------- */
function renderFavorites() {
  const grid = $('#grid');
  grid.innerHTML = fragrances.map((f, i) => {
    const badge = f.soon ? 'Próximamente' : f.isNew ? 'Novedad' : '';
    return `
    <article class="card" style="--c:${f.color};--d:${f.deep}">
      <button class="card__inner" data-fav="${i}" aria-label="Ver ${esc(f.name)}, inspirado en ${esc(f.house)}" data-cursor="Ver aroma">
        <div class="card__bg"></div>
        <div class="card__glare"></div>
        <span class="card__num">${f.n ? `N° ${pad(f.n)}` : 'IG'}</span>
        ${badge ? `<span class="card__badge">${badge}</span>` : ''}
        <div class="card__bottle">${bottleSVG({ tint: f.color, deep: f.deep })}</div>
        <div class="card__info">
          <p class="card__family">${f.familyLabel}</p>
          <h3 class="card__name">${esc(f.name)}</h3>
          <p class="card__house">Inspirado en ${esc(f.house)}</p>
        </div>
      </button>
    </article>`;
  }).join('');

  $$('.card', grid).forEach((card) => attachTilt(card));
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-fav]');
    if (b) openModal(fragrances[+b.dataset.fav]);
  });
  if (!reduced) {
    gsap.fromTo($$('.card', grid), { y: 80, opacity: 0, rotateX: -12 }, {
      y: 0, opacity: 1, rotateX: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07,
      scrollTrigger: { trigger: grid, start: 'top 85%', once: true },
    });
  }
}

function attachTilt(card, strength = 16) {
  if (!card || !finePointer || reduced) return;
  const inner = card.querySelector('.card__inner, .flask__img') || card;
  const glare = card.querySelector('.card__glare');
  const layers = $$('.b-layer', card);
  gsap.set(inner, { transformPerspective: 900 });
  const rx = gsap.quickTo(inner, 'rotationX', { duration: 0.6, ease: 'power3' });
  const ry = gsap.quickTo(inner, 'rotationY', { duration: 0.6, ease: 'power3' });
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rx(-py * strength); ry(px * strength);
    glare?.style.setProperty('--gx', `${(px + 0.5) * 100}%`);
    glare?.style.setProperty('--gy', `${(py + 0.5) * 100}%`);
    layers.forEach((l) => { const d = +l.dataset.depth; l.style.transform = `translate(${px * d}px, ${py * d}px)`; });
  });
  card.addEventListener('pointerleave', () => {
    rx(0); ry(0);
    layers.forEach((l) => { l.style.transform = ''; });
  });
}

/* ---------------- Full catalog ---------------- */
const state = { gender: 'all', group: null, q: '', shown: 24 };
const PAGE = 24;

function filtered() {
  const q = norm(state.q.trim());
  let list = catalog.filter((c) =>
    (state.gender === 'all' || c.gender === state.gender) &&
    (!q || norm(`${c.name} ${c.house} ${c.accords.join(' ')}`).includes(q)));
  if (state.group) {
    list = list.map((c) => ({ c, s: groupScore(c, state.group) })).filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s).map((x) => x.c);
  }
  return list;
}

function itemCard(c) {
  const lead = ACCORDS[c.accords[0]] || '#c9a46a';
  return `
  <button class="item" data-id="${c.id}" style="--lead:${lead}" data-cursor="Ver">
    <span class="item__glow"></span>
    <span class="item__top"><span>N° ${pad(c.n)}</span><span class="item__g item__g--${c.gender}">${genderLabel[c.gender]}</span></span>
    <span class="item__name">${esc(c.name)}</span>
    <span class="item__house">Inspirado en ${esc(c.house)}</span>
    ${accordBars(c.accords, 4)}
  </button>`;
}

function renderCatalog(animate = true) {
  const list = filtered();
  const box = $('#catalogList');
  const shown = list.slice(0, state.shown);
  box.innerHTML = shown.length ? shown.map(itemCard).join('')
    : `<p class="catalog__empty">No encontramos “${esc(state.q)}” en el catálogo impreso — <a data-wa="Hola Extracto Importado ✨ ¿tienen la equivalencia de ${esc(state.q)}?" href="#" target="_blank" rel="noopener">preguntanos por WhatsApp</a>, puede que lo tengamos.</p>`;
  wireWA(box);
  $('#catalogCount').textContent = `${list.length} fragancia${list.length === 1 ? '' : 's'}${state.gender !== 'all' ? ` · ${genderLabel[state.gender]}` : ''}`;
  $('#loadMore').hidden = list.length <= state.shown;
  if (animate && !reduced) {
    gsap.fromTo($$('.item', box), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.02 });
    gsap.fromTo($$('.accords li', box), { '--p': 0 }, { '--p': 1, duration: 1.2, ease: 'expo.out', stagger: 0.004, delay: 0.1 });
  }
}

function initCatalog() {
  const tabs = [['all', `Todos <small>${counts.total}</small>`], ['femenino', `Femenino <small>${counts.femenino}</small>`], ['masculino', `Masculino <small>${counts.masculino}</small>`], ['unisex', `Unisex <small>${counts.unisex}</small>`]];
  $('#genderTabs').innerHTML = tabs.map(([id, l]) => `<button role="tab" class="tab" data-g="${id}" aria-selected="${id === 'all'}">${l}</button>`).join('');
  $('#accordChips').innerHTML = accordGroups.map((g) => {
    const col = ACCORDS[g.match[0]];
    return `<button class="chip" data-a="${g.id}" aria-pressed="false" style="--ac:${col}"><i></i>${g.label}</button>`;
  }).join('');

  $('#genderTabs').addEventListener('click', (e) => {
    const b = e.target.closest('.tab'); if (!b) return;
    $$('.tab').forEach((t) => t.setAttribute('aria-selected', String(t === b)));
    state.gender = b.dataset.g; state.shown = PAGE; renderCatalog();
  });
  $('#accordChips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    const on = b.getAttribute('aria-pressed') !== 'true';
    $$('.chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', String(on));
    state.group = on ? b.dataset.a : null; state.shown = PAGE; renderCatalog();
  });
  let t;
  $('#search').addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => { state.q = e.target.value; state.shown = PAGE; renderCatalog(); }, 160);
  });
  $('#loadMore').addEventListener('click', () => {
    const before = state.shown;
    state.shown += PAGE;
    renderCatalog(false);
    const fresh = $$('.item').slice(before);
    if (!reduced) gsap.fromTo(fresh, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.02 });
    ScrollTrigger.refresh();
  });
  $('#catalogList').addEventListener('click', (e) => {
    const b = e.target.closest('.item');
    if (b) openModal(catalog.find((c) => c.id === b.dataset.id));
  });
  renderCatalog(false);
  if (!reduced) {
    ScrollTrigger.create({ trigger: '#catalogList', start: 'top 85%', once: true, onEnter: () => renderCatalog(true) });
  }
}

/* ---------------- Modal ---------------- */
const modal = $('#modal');
const panel = $('#modalPanel');
let lastFocus = null;
const SIZES = [
  { ml: 100, price: 410, note: 'Envío gratis' },
  { ml: 30, price: 210 },
  { ml: 10, price: 90 },
  { ml: 5, price: 50 },
];

function openModal(item) {
  if (!item) return;
  lastFocus = document.activeElement;
  const color = item.color || ACCORDS[item.accords?.[0]] || '#c9a46a';
  const deep = item.deep || '#2a1a10';
  panel.style.setProperty('--c', color);
  panel.style.setProperty('--d', deep);
  const eyebrow = [item.n ? `N° ${pad(item.n)}` : null, item.gender ? genderLabel[item.gender] : null, item.familyLabel].filter(Boolean).join(' — ');
  const pyramid = item.notes ? `
    <div class="pyramid">
      ${[['Salida', item.notes.salida], ['Corazón', item.notes.corazon], ['Fondo', item.notes.fondo]].map(([t, ns], k) => `
        <div class="pyramid__row" style="--w:${60 + k * 20}%"><span class="pyramid__label">${t}</span><span class="pyramid__notes">${ns.join(' · ')}</span></div>`).join('')}
    </div>` : '';
  panel.innerHTML = `
    <button class="modal__close" data-close aria-label="Cerrar">✕</button>
    <div class="modal__visual">
      <div class="modal__aura"></div>
      ${bottleSVG({ tint: color, deep })}
    </div>
    <div class="modal__body">
      <p class="eyebrow">${eyebrow}</p>
      <h2 id="modalTitle" class="modal__title">${esc(item.name)}</h2>
      <p class="modal__house">Nuestra versión inspirada en <strong>${esc(item.name)} de ${esc(item.house)}</strong></p>
      ${item.tagline ? `<p class="modal__tag">“${esc(item.tagline)}”</p>` : ''}
      ${item.accords ? `<p class="modal__label">Acordes principales</p>${accordBars(item.accords, 6)}` : ''}
      ${pyramid}
      ${item.soon ? '<p class="modal__soon">Próximamente en Extracto Importado — reservalo por WhatsApp.</p>' : ''}
      <p class="modal__label">Elegí tu formato</p>
      <div class="sizes" role="radiogroup" aria-label="Formato">
        ${SIZES.map((s, i) => `<button role="radio" class="size" aria-checked="${i === 0}" data-ml="${s.ml}" data-price="${s.price}"><strong>${s.ml} ml</strong><span>Bs. ${s.price}</span>${s.note ? `<em>${s.note}</em>` : ''}</button>`).join('')}
      </div>
      <a class="btn btn--gold modal__cta" target="_blank" rel="noopener" href="#"><span>Pedir por WhatsApp</span></a>
    </div>`;

  const cta = $('.modal__cta', panel);
  const setMsg = (ml, price) => {
    cta.href = waLink(`Hola Extracto Importado ✨ quiero ${item.name} (inspirado en ${item.house}) en ${ml} ml — Bs. ${price}.${item.soon ? ' ¿Cuándo llega?' : ''}`);
  };
  setMsg(100, 410);
  $$('.size', panel).forEach((b) => b.addEventListener('click', () => {
    $$('.size', panel).forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    setMsg(b.dataset.ml, b.dataset.price);
  }));

  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  lenis?.stop();
  gsap.fromTo(panel, { y: 60, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'expo.out' });
  gsap.fromTo('.modal__backdrop', { opacity: 0 }, { opacity: 1, duration: 0.5 });
  gsap.fromTo($$('.accords li', panel), { '--p': 0 }, { '--p': 1, duration: 1.2, ease: 'expo.out', stagger: 0.06, delay: 0.2 });
  gsap.from($$('.pyramid__row', panel), { x: -30, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'expo.out', delay: 0.2 });
  gsap.fromTo($('.modal__visual .bottle', panel), { y: 40, rotate: -6, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: 1.2, ease: 'expo.out', delay: 0.1 });
  $('.modal__close', panel).focus();
}
function closeModal() {
  if (modal.getAttribute('aria-hidden') === 'true') return;
  gsap.to(panel, { y: 40, opacity: 0, duration: 0.35, ease: 'power2.in' });
  gsap.to('.modal__backdrop', {
    opacity: 0, duration: 0.35, onComplete: () => {
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      lenis?.start();
      lastFocus?.focus();
    },
  });
}
modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeModal(); closeMenu(); }
  if (e.key === 'Tab' && modal.getAttribute('aria-hidden') === 'false') {
    const f = $$('button, a[href]', panel);
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
  }
});

/* ---------------- Notes horizontal ---------------- */
function initNotes() {
  gsap.matchMedia().add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
    const track = $('#notesTrack');
    const dist = () => track.scrollWidth - track.clientWidth + 80;
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '#notesPin', start: 'top top', end: () => `+=${dist() + window.innerHeight * 0.5}`, scrub: 1, pin: true, invalidateOnRefresh: true },
    });
    $$('.act__orb').forEach((o) => gsap.to(o, {
      rotate: 180, scale: 1.3, ease: 'none',
      scrollTrigger: { trigger: '#notesPin', start: 'top top', end: '+=1600', scrub: true },
    }));
  });
}

/* ---------------- Finder ---------------- */
function initFinder() {
  const stage = $('#finderStage');
  const bar = $('#finderBar');
  let step = 0; let score = {}; let genders = ['femenino', 'masculino', 'unisex'];

  function render() {
    bar.style.transform = `scaleX(${step / quiz.length})`;
    if (step >= quiz.length) return renderResult();
    const q = quiz[step];
    stage.innerHTML = `
      <p class="finder__step">Pregunta ${step + 1} de ${quiz.length}</p>
      <h3 class="finder__q">${q.q}</h3>
      <div class="finder__opts">
        ${q.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="opt__icon" aria-hidden="true">${o.icon}</span><span>${o.label}</span></button>`).join('')}
      </div>`;
    if (!reduced) gsap.from($$('.finder__q, .opt', stage), { y: 24, opacity: 0, stagger: 0.05, duration: 0.7, ease: 'expo.out' });
    $$('.opt', stage).forEach((b) => b.addEventListener('click', () => {
      const o = q.options[+b.dataset.i];
      if (o.gender) genders = o.gender;
      Object.entries(o.tags || {}).forEach(([k, v]) => { score[k] = (score[k] || 0) + v; });
      b.classList.add('is-picked');
      const next = () => { step++; render(); };
      if (reduced) return next();
      gsap.to(stage.children, { y: -20, opacity: 0, duration: 0.3, stagger: 0.03, delay: 0.15, onComplete: next });
    }));
  }

  function renderResult() {
    const ranked = catalog
      .filter((c) => genders.includes(c.gender))
      .map((c) => ({ c, s: Object.entries(score).reduce((sum, [g, w]) => sum + groupScore(c, g) * w, 0) + Math.random() * 3 }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.c);
    const [best, ...alts] = ranked;
    const color = ACCORDS[best.accords[0]];
    stage.innerHTML = `
      <div class="result" style="--c:${color}">
        <div class="result__bottle">${bottleSVG({ tint: color, deep: '#5a2a0a' })}</div>
        <div class="result__body">
          <p class="finder__step">Tu fragancia es</p>
          <h3 class="result__name">${esc(best.name)}</h3>
          <p class="result__house">Inspirado en ${esc(best.house)} · ${genderLabel[best.gender]}</p>
          ${accordBars(best.accords, 5)}
          <p class="result__alt">También te pueden gustar: ${alts.slice(0, 3).map((a) => `<button class="link" data-open="${a.id}">${esc(a.name)}</button>`).join(', ')}</p>
          <div class="result__actions">
            <a class="btn btn--gold" target="_blank" rel="noopener" href="${waLink(`Hola Extracto Importado ✨ hice el test de la web y me salió ${best.name} (inspirado en ${best.house}). ¿Me ayudan?`)}"><span>Lo quiero</span></a>
            <button class="btn btn--ghost" id="finderReset"><span>Repetir</span></button>
          </div>
        </div>
      </div>`;
    if (!reduced) {
      gsap.from('.result__bottle', { scale: 0.6, rotate: -10, opacity: 0, duration: 1.2, ease: 'elastic.out(1,0.6)' });
      gsap.from('.result__body > *', { x: 30, opacity: 0, stagger: 0.07, duration: 0.8, ease: 'expo.out' });
      gsap.fromTo($$('.accords li', stage), { '--p': 0 }, { '--p': 1, duration: 1.2, ease: 'expo.out', stagger: 0.06, delay: 0.3 });
    }
    $('#finderReset').addEventListener('click', () => { step = 0; score = {}; genders = ['femenino', 'masculino', 'unisex']; render(); });
    $$('[data-open]', stage).forEach((b) => b.addEventListener('click', () => openModal(catalog.find((c) => c.id === b.dataset.open))));
  }
  render();
}

/* ---------------- Pricing ---------------- */
function initPricing() {
  $('#tiers').innerHTML = bottlePrices.map((t) => `
    <article class="tier ${t.featured ? 'tier--featured' : ''}">
      ${t.featured ? '<span class="tier__flag">Más elegido</span>' : ''}
      <div class="tier__bottles" aria-hidden="true">${Array.from({ length: t.qty }, (_, k) => `<span class="mini" style="--i:${k};--n:${t.qty}">${bottleSVG()}</span>`).join('')}</div>
      <p class="tier__label">${t.label} de 100 ml</p>
      <p class="tier__price"><span class="tier__num" data-price="${t.price}">${t.price.toLocaleString('es-BO')}</span><small> Bs.</small></p>
      <p class="tier__unit">Bs. ${Math.round(t.price / t.qty)} c/u</p>
      ${t.save ? `<p class="tier__save">Ahorrás Bs. ${t.save}</p>` : '<p class="tier__save tier__save--muted">Envío gratis incluido</p>'}
      <a class="btn ${t.featured ? 'btn--gold' : 'btn--ghost'}" target="_blank" rel="noopener" href="${waLink(`Hola Extracto Importado ✨ quiero la promo de ${t.label} de 100 ml (Bs. ${t.price}).`)}"><span>Elegir</span></a>
    </article>`).join('');

  $('#decants').innerHTML = decants.map((d) => `
    <div class="decant">
      <div class="decant__vial" style="--h:${40 + d.ml * 2}px" aria-hidden="true"><span></span><b>EXTRACTO</b></div>
      <div class="decant__ml">${d.ml}<small>ml</small></div>
      <div class="decant__prices">
        <p><span>1 decant</span><strong>Bs. ${d.single}</strong></p>
        <p><span>${d.pack.qty} decants</span><strong>Bs. ${d.pack.price}</strong></p>
      </div>
    </div>`).join('');

  $('#badges').innerHTML = badges.map((b, i) => `<li class="badge"><span class="badge__i">0${i + 1}</span><strong>${b.t}</strong><span>${b.d}</span></li>`).join('');

  if (!reduced) {
    gsap.from('.tier', { y: 80, opacity: 0, stagger: 0.12, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '#tiers', start: 'top 80%', once: true } });
    gsap.from('.mini', { y: -60, opacity: 0, stagger: 0.06, duration: 1, ease: 'bounce.out', scrollTrigger: { trigger: '#tiers', start: 'top 75%', once: true } });
    gsap.from('.decant', { y: 50, opacity: 0, stagger: 0.1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '#decants', start: 'top 85%', once: true } });
    gsap.from('.decant__vial span', { scaleY: 0, transformOrigin: 'bottom', stagger: 0.15, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '#decants', start: 'top 85%', once: true } });
    gsap.from('.badge', { y: 30, opacity: 0, stagger: 0.08, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: '#badges', start: 'top 90%', once: true } });
  }
}

/* ---------------- Journal ---------------- */
function initJournal() {
  $('#journalRail').innerHTML = posts.map((p) => `
    <a class="post" href="${p.url}" target="_blank" rel="noopener" style="--t1:${p.tint[0]};--t2:${p.tint[1]}" data-cursor="Instagram">
      <div class="post__art"><span class="post__ring"></span><span class="post__ring post__ring--2"></span><div class="post__bottle">${bottleSVG({ tint: p.tint[1], deep: p.tint[0] })}</div></div>
      <div class="post__body">
        <p class="post__date">${p.date}</p>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.body)}</p>
      </div>
    </a>`).join('');
}

/* ---------------- Reveals ---------------- */
function initReveals() {
  if (reduced) return;
  $$('.section-head, .notes__intro, .finder__head, .flask__copy').forEach((h) => {
    gsap.from(h.children, { y: 50, opacity: 0, stagger: 0.1, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%', once: true } });
  });
  gsap.from('.step', { y: 60, opacity: 0, stagger: 0.15, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.steps', start: 'top 80%', once: true } });
  gsap.from('.post', { x: 120, opacity: 0, stagger: 0.08, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '#journalRail', start: 'top 85%', once: true } });
  gsap.from('.cta__title', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.cta', start: 'top 70%', once: true } });
  gsap.to('.cta__bg', { rotate: 120, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.footer__big', { yPercent: 50 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
}

/* ---------------- Boot ---------------- */
wireWA();
renderFavorites();
initMarquee();
initManifesto();
initFlask();
initNotes();
initCatalog();
initFinder();
initPricing();
initJournal();
initReveals();
initCursor();

const heroReady = initHero();
runLoader().then(async () => {
  await heroReady;
  heroIntro();
  ScrollTrigger.refresh();
});
