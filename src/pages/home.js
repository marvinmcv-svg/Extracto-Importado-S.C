import '../styles/base.css';
import '../styles/pages.css';
import { initLayout, card, tilt, reveals, gsap, ScrollTrigger, SplitText, reduced, $, $$ } from '../lib/layout.js';
import { initBottle3D } from '../lib/bottle3d.js';
import { products, byId, bestsellers, houses, productUrl, PROMO, PRICE_100, LIST_100 } from '../lib/store.js';

initLayout('home', { darkHero: true });

const showcase = bestsellers.map((id) => byId[id]);
const pad = (n) => String(n).padStart(2, '0');
const narrow = () => innerWidth < 834;

/* live promo copy */
if (!PROMO.active) {
  $('.story3d__eyebrow').innerHTML = '<span class="grad">Alta concentración</span>';
  $('.story3d__price').textContent = `Perfumes de 100 ml a ${PRICE_100} Bs.`;
} else {
  $('.story3d__price').innerHTML = `Perfumes de 100 ml a ${PRICE_100} Bs. <s>${LIST_100} Bs.</s>`;
}

/* counts */
const countG = (g) => products.filter((p) => p.gender === g).length;
$('#countF').textContent = `${countG('femenino')} fragancias`;
$('#countM').textContent = `${countG('masculino')} fragancias`;
$('#countU').textContent = `${countG('unisex')} fragancias y nicho`;

/* ───────── 1 · scroll story with the glossy bottle ───────── */
const bottle = initBottle3D($('#bottle'), { reduced });
if (!bottle) {
  document.body.classList.add('no-webgl');
  $('#bottleFallback').hidden = false;
}
const callouts = $$('[data-callout]');

function heroIn() {
  if (reduced) return;
  const split = SplitText.create('#heroTitle', { type: 'words,chars', mask: 'words' });
  gsap.from(split.chars, { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.022, delay: 0.25 });
  gsap.from('[data-hero-in]', { y: 22, opacity: 0, duration: 1.2, ease: 'power3.out', stagger: 0.09, delay: 0.55 });
  gsap.from('.story3d__glow', { opacity: 0, scale: 0.8, duration: 2.2, ease: 'power2.out' });
  gsap.from('.story3d__line', { scaleX: 0, opacity: 0, duration: 1.8, ease: 'expo.out', delay: 0.6 });
}
(document.fonts?.ready || Promise.resolve()).then(heroIn);

const mmStory = gsap.matchMedia();
mmStory.add({ wide: '(min-width: 834px)', narrow: '(max-width: 833px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
  const { wide, motion } = ctx.conditions;
  gsap.set(callouts, { autoAlpha: 0 });
  if (!motion) { gsap.set(callouts[callouts.length - 1], { autoAlpha: 1 }); return; }
  const dx = wide ? 1.35 : 0;          // bottle moves aside on wide screens…
  const dy = wide ? 0 : 0.55;          // …and up on phones so copy fits below
  const s = bottle?.state || {};
  const tl = gsap.timeline({
    defaults: { ease: 'power1.inOut' },
    scrollTrigger: { trigger: '#story', start: 'top top', end: 'bottom bottom', scrub: 0.6 },
  });
  // intro out, bottle steps forward
  tl.to('#heroIntro', { y: -80, autoAlpha: 0, scale: 0.96, duration: 1 }, 0)
    .to('#scrollHint', { autoAlpha: 0, duration: 0.3 }, 0)
    .to('.story3d__line', { scaleX: 1.6, opacity: 0.35, duration: 1 }, 0);
  if (bottle) tl.fromTo(s, { scale: 0.74, y: -0.95 }, { scale: wide ? 1.12 : 0.92, y: dy, rotY: 0.6, duration: 1, immediateRender: false }, 0);
  // three callouts: bottle swings to the opposite side, turns, lifts its cap on the second
  const beats = [
    { x: dx, rotY: 1.2, capLift: 0 },
    { x: -dx, rotY: 2.6, capLift: 0.42 },
    { x: dx, rotY: 3.9, capLift: 0 },
  ];
  beats.forEach((b, i) => {
    const at = 1 + i * 2;
    if (bottle) tl.to(s, { x: b.x, rotY: b.rotY, capLift: b.capLift, duration: 1 }, at);
    tl.fromTo(callouts[i], { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.6 }, at + 0.25)
      .to(callouts[i], { autoAlpha: 0, y: -60, duration: 0.5 }, at + 1.45);
  });
  // finale: centred, small, cap on, CTA
  if (bottle) tl.to(s, { x: 0, y: wide ? -0.35 : 0.65, scale: wide ? 0.82 : 0.72, rotY: Math.PI * 2 - 0.5, capLift: 0, duration: 1.2 }, 7);
  tl.fromTo(callouts[3], { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 7.5)
    .to('.story3d__glow', { opacity: 0.55, duration: 2 }, 6.5)
    .to({}, { duration: 0.6 }); // hold
});

/* ───────── 2 · houses marquee — speeds up and reverses with scroll velocity ───────── */
const hs = houses.filter((h) => products.filter((p) => p.house === h).length >= 2);
const row = `<span class="houses__item houses__lbl">Inspirados en</span>${hs.map((h) => `<span class="houses__item">${h}</span>`).join('')}`;
$('#houses').innerHTML = row + row;
if (!reduced) {
  const loop = gsap.to('#houses', { xPercent: -50, duration: 70, ease: 'none', repeat: -1 });
  let dir = 1;
  ScrollTrigger.create({
    onUpdate: (self) => {
      const v = self.getVelocity();
      dir = v < 0 ? -1 : 1;
      gsap.to(loop, { timeScale: dir * (1 + Math.min(Math.abs(v) / 300, 6)), duration: 0.3, overwrite: true });
      gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.3, overwrite: false });
    },
  });
}

/* ───────── 4 · bento: thumbnails strip + tiles scale in ───────── */
$('#tileStrip').innerHTML = showcase.slice(0, 8).map((p) => `<img src="${p.img}" alt="" loading="lazy" width="760" height="440" />`).join('');
if (!reduced) {
  ScrollTrigger.batch('[data-tile]', {
    start: 'top 90%', once: true,
    onEnter: (els) => gsap.fromTo(els, { y: 60, scale: 0.94, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.08, clearProps: 'transform' }),
  });
  gsap.to('#tileStrip', { xPercent: -30, ease: 'none', scrollTrigger: { trigger: '.bento', start: 'top bottom', end: 'bottom top', scrub: true } });
  // line tiles: product shot rises out of the card
  $$('.lcard__img img').forEach((img) => gsap.fromTo(img, { yPercent: 18, scale: 1.08 }, { yPercent: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: img.closest('.lcard'), start: 'top bottom', end: 'center 55%', scrub: true } }));
}

/* ───────── 6 · bestsellers: pinned horizontal scroll on desktop ───────── */
const track = $('#railTrack');
track.innerHTML = showcase.map(card).join('');
tilt(track);
const mm = gsap.matchMedia();
mm.add('(min-width: 861px) and (prefers-reduced-motion: no-preference)', () => {
  const dist = () => Math.max(0, track.scrollWidth - innerWidth);
  const tw = gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: { trigger: '#railPin', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: (s) => gsap.set('#railBar', { scaleX: s.progress }) },
  });
  // cards lean into the motion (3D)
  const ry = gsap.quickTo($$('.pcard', track), 'rotationY', { duration: 0.5, ease: 'power3' });
  gsap.set($$('.pcard', track), { transformPerspective: 1000 });
  ScrollTrigger.create({ trigger: '#railPin', start: 'top bottom', end: 'bottom top', onUpdate: (s) => ry(gsap.utils.clamp(-14, 14, s.getVelocity() / -120)) });
  const settle = () => ry(0);
  ScrollTrigger.addEventListener('scrollEnd', settle);
  return () => { tw.kill(); ScrollTrigger.removeEventListener('scrollEnd', settle); };
});

/* ───────── 7 · image zoom: full-bleed photo settles into a rounded card ───────── */
mm.add('(prefers-reduced-motion: no-preference)', () => {
  const tl = gsap.timeline({ scrollTrigger: { trigger: '#zoomStage', start: 'top top', end: '+=120%', pin: true, scrub: 0.6, anticipatePin: 1 } });
  tl.fromTo('#zoomFig', { width: '100vw', height: '100svh', borderRadius: 0, y: 0 }, { width: () => (narrow() ? '86vw' : '52vw'), height: () => (narrow() ? '56svh' : '62svh'), y: () => innerHeight * 0.1, borderRadius: 28, ease: 'power2.inOut' }, 0)
    .fromTo('#zoomFig img', { scale: 1.15 }, { scale: 1, ease: 'power2.inOut' }, 0)
    .fromTo('#zoomCopy', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.45 }, 0.5);
  return () => tl.kill();
});

/* ───────── 8 · 360° ring — built only when you get near it ───────── */
const nameEl = $('#heroName'), houseEl = $('#heroHouse'), idxEl = $('#heroIdx');
let firstFront = true;
const onFront = (p, i) => {
  idxEl.textContent = `${pad(i + 1)} / ${pad(showcase.length)}`;
  if (firstFront || reduced) { nameEl.textContent = p.name; houseEl.textContent = `Inspirado en ${p.house}`; firstFront = false; return; }
  gsap.timeline()
    .to([nameEl, houseEl], { yPercent: -60, opacity: 0, duration: 0.2, ease: 'power2.in' })
    .add(() => { nameEl.textContent = p.name; houseEl.textContent = `Inspirado en ${p.house}`; })
    .fromTo([nameEl, houseEl], { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'expo.out', stagger: 0.04 });
};
let ring = null;
const buildRing = async () => {
  const { initHero3D } = await import('../lib/hero3d.js');
  ring = initHero3D($('#gl'), showcase, { onFront, onPick: (id) => { location.href = productUrl(id); }, reduced, bg: '#000000' });
  if (!ring) {
    $('.ring').classList.add('is-fallback');
    $('#heroFallback').innerHTML = showcase.slice(0, 3).map((p) => `<a href="${productUrl(p.id)}"><img src="${p.img}" alt="${p.name}" /></a>`).join('');
    onFront(showcase[0], 0);
  } else if (!reduced) {
    ScrollTrigger.create({ trigger: '#r360', start: 'top bottom', end: 'bottom top', scrub: true, onUpdate: (s) => ring.setScroll((s.progress - 0.5) * 0.6) });
  }
};
new IntersectionObserver((entries, io) => { if (entries[0].isIntersecting) { io.disconnect(); buildRing(); } }, { rootMargin: '600px 0px' }).observe($('#r360'));
$('#heroNext').addEventListener('click', () => ring?.next());
$('#heroPrev').addEventListener('click', () => ring?.prev());
$('#ringInfo').addEventListener('click', () => {
  const p = showcase.find((x) => x.name === nameEl.textContent);
  if (p) location.href = productUrl(p.id);
});

/* ───────── 9 · promo glow follows scroll ───────── */
if (!reduced) {
  gsap.fromTo('.promo__glow', { yPercent: 30, scale: 0.8 }, { yPercent: -10, scale: 1.1, ease: 'none', scrollTrigger: { trigger: '.promo', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.promo__big', { scale: 0.85, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.promo__big', start: 'top 85%', once: true } });
}

reveals();
