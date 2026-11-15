import '../styles/base.css';
import '../styles/pages.css';
import { initLayout, gsap, reduced, $ } from '../lib/layout.js';
import { SIZES, bestPrice, bs, saveLabel } from '../lib/store.js';

initLayout('precios');

const q = { 100: 2, 30: 0, 10: 0, 5: 0 };
$('#calcRows').innerHTML = SIZES.map((s) => `
  <div class="calc__row">
    <div><strong>${s.label}</strong><small>${bs(s.unit)} c/u${s.packs.map((p) => ` · ${p.qty} × ${bs(p.price)}`).join('')}</small></div>
    <div class="qty"><button data-s="${s.id}" data-d="-1" aria-label="Menos ${s.label}">−</button><output id="cq${s.id}">${q[s.id]}</output><button data-s="${s.id}" data-d="1" aria-label="Más ${s.label}">+</button></div>
  </div>`).join('');

let shown = 0;
function render() {
  let total = 0, list = 0;
  const rows = SIZES.filter((s) => q[s.id]).map((s) => {
    const n = q[s.id], price = bestPrice(s.id, n), l = n * (s.list || s.unit);
    total += price; list += l;
    return `<div class="tot"><span>${n} × ${s.label}</span><span>${l > price ? `<s>${bs(l)}</s> ` : ''}${bs(price)}</span></div>`;
  });
  $('#calcSum').innerHTML = `${rows.join('') || '<p class="muted" style="margin:0">Sumá unidades para ver el total.</p>'}
    ${list > total ? `<div class="tot tot--save"><span>${saveLabel}</span><span>−${bs(list - total)}</span></div>` : ''}
    <div class="tot tot--total"><span>Total</span><strong id="calcTotal">${bs(shown)}</strong></div>`;
  const o = { v: shown };
  gsap.to(o, { v: total, duration: reduced ? 0 : 0.6, ease: 'power3.out', onUpdate: () => { $('#calcTotal').textContent = bs(Math.round(o.v)); }, onComplete: () => { shown = total; } });
}
$('#calcRows').addEventListener('click', (e) => {
  const b = e.target.closest('[data-s]'); if (!b) return;
  q[b.dataset.s] = Math.max(0, Math.min(20, q[b.dataset.s] + +b.dataset.d));
  $(`#cq${b.dataset.s}`).textContent = q[b.dataset.s];
  render();
});
render();
