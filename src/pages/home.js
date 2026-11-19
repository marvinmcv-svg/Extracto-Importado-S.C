import '../styles/base.css';
import '../styles/pages.css';
import { initLayout, card, tilt, reveals, gsap, ScrollTrigger, SplitText, reduced, finePointer, $, $$, getLenis } from '../lib/layout.js';
import { initBottle3D } from '../lib/bottle3d.js';
import { products, byId, bestsellers, houses, productUrl, accordGroups, groupScore, PROMO, PRICE_100, LIST_100 } from '../lib/store.js';

initLayout('home', { overHero: true });

const showcase = bestsellers.map((id) => byId[id]);
const pad = (n, l = 2) => String(n).padStart(l, '0');
const wide = () => innerWidth >= 900;

/* live promo copy */
const kick = $('.hero__kicker');
if (PROMO.active) kick.innerHTML = `<b>${PROMO.name}</b><span>Perfumes de 100 ml a ${PRICE_100} Bs. <s>${LIST_100}</s></span>`;
else kick.innerHTML = `<b>Alta concentración</b><span>Perfumes de 100 ml a ${PRICE_100} Bs.</span>`;

const countG = (g) => products.filter((p) => p.gender === g).length;
$('#countF').textContent = `${countG('femenino')} fragancias`;
$('#countM').textContent = `${countG('masculino')} fragancias`;
$('#countU').textContent = `${countG('unisex')} fragancias`;

/* ───────── hero: liquid gold + glass bottle ───────── */
const bottle = initBottle3D($('#bottle'), { reduced });
if (!bottle) { document.body.classList.add('no-webgl'); $('#bottleFallback').hidden = false; }
const place = () => {
  if (!bottle) return;
  bottle.state.x = wide() ? 1.95 : 0;
  bottle.state.y = wide() ? 0.05 : 0.6;
  bottle.state.scale = wide() ? 0.92 : 0.7;
};
place();
addEventListener('resize', place);

function heroIn() {
  bottle?.play();
  if (reduced) return;
  const split = SplitText.create('#heroTitle .hl', { type: 'chars', mask: 'lines' });
  gsap.from(split.chars, { yPercent: 120, rotate: 6, duration: 1.6, ease: 'expo.out', stagger: 0.035, delay: 0.15 });
  gsap.from('[data-hero-in]', { y: 30, opacity: 0, duration: 1.4, ease: 'expo.out', stagger: 0.1, delay: 0.6 });
  gsap.from('.hero__badge', { scale: 0, rotate: -180, duration: 1.8, ease: 'expo.out', delay: 0.9 });
}

const pre = $('#preload');
if (reduced || sessionStorage.getItem('ei-seen') === '1') { pre.remove(); (document.fonts?.ready || Promise.resolve()).then(heroIn); }
else {
  sessionStorage.setItem('ei-seen', '1');
  getLenis()?.stop();
  const n = { v: 0 };
  gsap.timeline({ onComplete: () => { pre.remove(); getLenis()?.start(); } })
    .from('.preload__w', { yPercent: 110, duration: 1.2, ease: 'expo.out' })
    .from('.preload__s', { opacity: 0, letterSpacing: '1.4em', duration: 1.2, ease: 'expo.out' }, '-=0.9')
    .to(n, { v: 100, duration: 1.6, ease: 'power2.inOut', onUpdate: () => { $('#preN').textContent = pad(Math.round(n.v), 3); } }, 0)
    .to('.preload__bar i', { scaleX: 1, duration: 1.6, ease: 'power2.inOut' }, 0)
    .to('.preload__mark, .preload__n, .preload__bar', { opacity: 0, y: -30, duration: 0.5, ease: 'power2.in' }, '+=0.1')
    .to(pre, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=0.15')
    .add(heroIn, '-=0.7');
}

// scrolling out of the hero: the bottle lifts, turns and opens; the smoke heats up
if (!reduced) {
  const s = bottle?.state;
  const tl = gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.8 } });
  tl.to('.hero__copy', { yPercent: -35, opacity: 0, ease: 'none' }, 0)
    .to('.hero__meta, .hero__badge', { opacity: 0, ease: 'none', duration: 0.5 }, 0);
  if (s) tl.to(s, { y: () => (wide() ? 1.4 : 1.6), rotY: 1.9, rotX: 0.25, capLift: 0.5, heat: 1, scale: () => (wide() ? 1.15 : 0.85), ease: 'none' }, 0);
  gsap.to('.hero__badge svg', { rotate: 360, duration: 18, ease: 'none', repeat: -1 });
}
// keep the floating dock out of the hero composition
// (derived from the real scroll position, so landing mid-page — reload, anchor, back — still shows it)
const syncDock = (st) => document.body.classList.toggle('dock-hidden', st.progress < 1);
ScrollTrigger.create({ trigger: '#hero', start: 'top top', end: '70% top', onUpdate: syncDock, onRefresh: syncDock, onLeave: syncDock, onEnterBack: syncDock });

/* ───────── houses marquee — speed follows scroll velocity ───────── */
const hs = houses.filter((h) => products.filter((p) => p.house === h).length >= 2);
const row = hs.map((h, i) => `<span class="houses__item ${i % 2 ? 'is-outline' : ''}">${h}</span>`).join('');
$('#houses').innerHTML = row + row;
if (!reduced) {
  const loop = gsap.to('#houses', { xPercent: -50, duration: 80, ease: 'none', repeat: -1 });
  ScrollTrigger.create({
    onUpdate: (self) => {
      const v = self.getVelocity(), dir = v < 0 ? -1 : 1;
      gsap.to(loop, { timeScale: dir * (1 + Math.min(Math.abs(v) / 250, 8)), duration: 0.3, overwrite: true });
      gsap.to(loop, { timeScale: dir, duration: 1.4, delay: 0.3, overwrite: false });
    },
  });
}

/* ───────── manifesto pills grow in ───────── */
if (!reduced) {
  $$('.pill').forEach((p) => gsap.fromTo(p, { width: 0 }, { width: () => p.offsetHeight * 1.9, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 85%', end: 'top 55%', scrub: 1 } }));
}

/* ───────── paths: arches drift at different speeds ───────── */
if (!reduced) {
  $$('.path__arch').forEach((f) => {
    gsap.fromTo(f, { yPercent: +f.dataset.speed }, { yPercent: -f.dataset.speed, ease: 'none', scrollTrigger: { trigger: '.paths', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo(f.querySelector('img'), { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom 40%', scrub: true } });
  });
  gsap.from('.path__arch', { clipPath: 'inset(100% 0 0 0 round 999px 999px 4px 4px)', duration: 1.6, ease: 'expo.inOut', stagger: 0.15, scrollTrigger: { trigger: '.paths__grid', start: 'top 80%', once: true } });
}

/* ───────── olfactory families: hover list with a floating preview ───────── */
const fams = accordGroups.map((g) => {
  const list = products.filter((p) => groupScore(p, g.id) > 0).sort((a, b) => groupScore(b, g.id) - groupScore(a, g.id));
  return { ...g, n: list.length, img: list.find((p) => p.img)?.img, top: list.slice(0, 3).map((p) => p.name) };
});
$('#famList').innerHTML = fams.map((f, i) => `
  <li data-reveal><a href="/tienda?familia=${f.id}" data-img="${f.img}" data-cursor="Ver">
    <small>${pad(i + 1)}</small><span class="fam__name">${f.label}</span><span class="fam__top">${f.top.join(' · ')}</span><span class="fam__n">${f.n}</span>
  </a></li>`).join('');
const prev = $('#famPreview'), pimg = prev.querySelector('img');
if (finePointer && !reduced) {
  const px = gsap.quickTo(prev, 'x', { duration: 0.7, ease: 'power3' }), py = gsap.quickTo(prev, 'y', { duration: 0.7, ease: 'power3' });
  const pr = gsap.quickTo(prev, 'rotate', { duration: 0.6, ease: 'power3' });
  let lastX = 0;
  $('#famList').addEventListener('pointermove', (e) => { px(e.clientX); py(e.clientY); pr(gsap.utils.clamp(-14, 14, (e.clientX - lastX) * 0.6)); lastX = e.clientX; });
  $$('#famList a').forEach((a) => a.addEventListener('pointerenter', () => {
    if (pimg.getAttribute('src') !== a.dataset.img) { pimg.src = a.dataset.img; gsap.fromTo(pimg, { scale: 1.3 }, { scale: 1, duration: 0.8, ease: 'expo.out' }); }
    prev.classList.add('is-on');
  }));
  $('#famList').addEventListener('pointerleave', () => { prev.classList.remove('is-on'); pr(0); });
}

/* ───────── bestsellers: pinned horizontal gallery ───────── */
const track = $('#railTrack');
track.innerHTML = showcase.map((p, i) => card(p, i + 1)).join('');
tilt(track);
const mm = gsap.matchMedia();
mm.add('(min-width: 861px) and (prefers-reduced-motion: no-preference)', () => {
  const dist = () => Math.max(0, track.scrollWidth - innerWidth);
  const cards = $$('.pcard', track);
  const tw = gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: {
      trigger: '#railPin', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: (st) => { gsap.set('#railBar', { scaleX: st.progress }); $('#railN').textContent = pad(Math.min(cards.length, 1 + Math.floor(st.progress * cards.length))); },
    },
  });
  const ry = gsap.quickTo(cards, 'rotationY', { duration: 0.6, ease: 'power3' });
  gsap.set(cards, { transformPerspective: 1100 });
  ScrollTrigger.create({ trigger: '#railPin', start: 'top bottom', end: 'bottom top', onUpdate: (st) => ry(gsap.utils.clamp(-16, 16, st.getVelocity() / -110)) });
  const settle = () => ry(0);
  ScrollTrigger.addEventListener('scrollEnd', settle);
  return () => { tw.kill(); ScrollTrigger.removeEventListener('scrollEnd', settle); };
});

/* ───────── 360° ring — built when you get near ───────── */
const nameEl = $('#heroName'), houseEl = $('#heroHouse'), idxEl = $('#heroIdx');
let firstFront = true;
const onFront = (p, i) => {
  idxEl.textContent = `${pad(i + 1)} / ${pad(showcase.length)}`;
  if (firstFront || reduced) { nameEl.textContent = p.name; houseEl.textContent = `Inspirado en ${p.house}`; firstFront = false; return; }
  gsap.timeline()
    .to([nameEl, houseEl], { yPercent: -60, opacity: 0, duration: 0.2, ease: 'power2.in' })
    .add(() => { nameEl.textContent = p.name; houseEl.textContent = `Inspirado en ${p.house}`; })
    .fromTo([nameEl, houseEl], { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out', stagger: 0.04 });
};
let ring = null;
const buildRing = async () => {
  const { initHero3D } = await import('../lib/hero3d.js');
  ring = initHero3D($('#gl'), showcase, { onFront, onPick: (id) => { location.href = productUrl(id); }, reduced, bg: '#0b0907' });
  if (!ring) {
    $('.ring').classList.add('is-fallback');
    $('#heroFallback').innerHTML = showcase.slice(0, 3).map((p) => `<a href="${productUrl(p.id)}"><img src="${p.img}" alt="${p.name}" /></a>`).join('');
    onFront(showcase[0], 0);
  } else if (!reduced) {
    ScrollTrigger.create({ trigger: '#r360', start: 'top bottom', end: 'bottom top', scrub: true, onUpdate: (st) => ring.setScroll((st.progress - 0.5) * 0.6) });
  }
};
new IntersectionObserver((entries, io) => { if (entries[0].isIntersecting) { io.disconnect(); buildRing(); } }, { rootMargin: '600px 0px' }).observe($('#r360'));
$('#heroNext').addEventListener('click', () => ring?.next());
$('#heroPrev').addEventListener('click', () => ring?.prev());
$('#ringInfo').addEventListener('click', () => { const p = showcase.find((x) => x.name === nameEl.textContent); if (p) location.href = productUrl(p.id); });

/* ───────── Black Friday: giant type slides with scroll ───────── */
if (!PROMO.active) $$('#promoTrack em').forEach((e) => { e.textContent = 'Alta concentración'; });
if (!reduced) {
  gsap.fromTo('#promoTrack', { xPercent: 0 }, { xPercent: -33.333, ease: 'none', scrollTrigger: { trigger: '.promo', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.advisor__orb', { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, ease: 'power2.out', scrollTrigger: { trigger: '.advisor', start: 'top 85%', end: 'top 35%', scrub: true } });
}

reveals();
