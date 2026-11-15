import '../styles/base.css';
import '../styles/pages.css';
import { initLayout, card, tilt, reveals, gsap, ScrollTrigger, SplitText, reduced, $, $$, getLenis } from '../lib/layout.js';
import { initHero3D } from '../lib/hero3d.js';
import { products, byId, bestsellers, houses, productUrl } from '../lib/store.js';

initLayout('home', { darkHero: true });

const showcase = bestsellers.map((id) => byId[id]);
const pad = (n) => String(n).padStart(2, '0');

/* counts */
const countG = (g) => products.filter((p) => p.gender === g).length;
$('#countF').textContent = `${countG('femenino')} fragancias`;
$('#countM').textContent = `${countG('masculino')} fragancias`;
$('#countU').textContent = `${countG('unisex')} fragancias`;

/* hero 3D */
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
const hero = initHero3D($('#gl'), showcase, { onFront, onPick: (id) => { location.href = productUrl(id); }, reduced });
if (!hero) {
  document.body.classList.add('no-webgl');
  $('#heroFallback').innerHTML = showcase.slice(0, 3).map((p) => `<a href="${productUrl(p.id)}"><img src="${p.img}" alt="${p.name}" /></a>`).join('');
  onFront(showcase[0], 0);
}
$('#heroNext').addEventListener('click', () => hero?.next());
$('#heroPrev').addEventListener('click', () => hero?.prev());
// clicking the name bar opens the product in front
$('.hero__now > div').style.cursor = 'pointer';
$('.hero__now > div').addEventListener('click', () => {
  const p = showcase.find((s) => s.name === nameEl.textContent);
  if (p) location.href = productUrl(p.id);
});
if (hero && !reduced) {
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, onUpdate: (s) => hero.setScroll(s.progress) });
  gsap.to('.hero__top', { yPercent: -40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '60% top', scrub: true } });
}

/* intro sequence (preloader on first visit of the session) */
function heroIn() {
  if (reduced) return;
  const split = SplitText.create('#heroTitle', { type: 'lines,chars', mask: 'lines' });
  gsap.from(split.chars, { yPercent: 120, duration: 1.4, ease: 'expo.out', stagger: 0.03, delay: 0.1 });
  gsap.from('[data-hero-in]', { y: 24, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, delay: 0.5 });
}
const pre = $('#preload');
const seen = sessionStorage.getItem('ei-seen') === '1';
if (reduced || seen) { pre.remove(); (document.fonts?.ready || Promise.resolve()).then(heroIn); }
else {
  sessionStorage.setItem('ei-seen', '1');
  getLenis()?.stop();
  const tl = gsap.timeline({ onComplete: () => { pre.remove(); getLenis()?.start(); } });
  tl.from('.preload__w span', { yPercent: 110, duration: 0.9, ease: 'expo.out', stagger: 0.05 })
    .from('.preload__s', { opacity: 0, letterSpacing: '1.2em', duration: 1, ease: 'expo.out' }, '-=0.6')
    .to('.preload__bar i', { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, '-=0.8')
    .to(pre, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '+=0.1')
    .add(heroIn, '-=0.55');
}

/* houses marquee — speeds up and reverses with scroll velocity */
const hs = houses.filter((h) => products.filter((p) => p.house === h).length >= 2);
const row = `<span class="houses__item houses__lbl">Inspirados en</span>${hs.map((h) => `<span class="houses__item">${h}</span>`).join('')}`;
$('#houses').innerHTML = row + row;
if (!reduced) {
  const loop = gsap.to('#houses', { xPercent: -50, duration: 60, ease: 'none', repeat: -1 });
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

/* bestsellers: pinned horizontal scroll on desktop */
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
  // cards lean into the motion
  const skew = gsap.quickTo($$('.pcard', track), 'skewX', { duration: 0.4, ease: 'power3' });
  ScrollTrigger.create({ trigger: '#railPin', start: 'top bottom', end: 'bottom top', onUpdate: (s) => skew(gsap.utils.clamp(-6, 6, s.getVelocity() / -400)) });
  return () => tw.kill();
});
reveals();
