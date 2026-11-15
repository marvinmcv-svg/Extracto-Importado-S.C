import '../styles/base.css';
import '../styles/pages.css';
import { initLayout, lineRow, wireLines, totalsHtml, toast, gsap, reduced, $, $$, getLenis } from '../lib/layout.js';
import { products, byId, search, bestsellers, cart, onCart, inCart, addToCart, removeProduct, totals, nudge, sizeById, saveLabel, bs, esc, waLink } from '../lib/store.js';
import { DEPARTAMENTOS } from '../data.js';

initLayout('pedido');

let step = 1;
const pick = { q: '', gender: 'all' };
const showcase = bestsellers.map((id) => byId[id]);

function goStep(n, scroll = true) {
  if (n > 1 && !cart.length) { toast('Elegí al menos una fragancia', false); n = 1; }
  step = n;
  $$('.steps__item').forEach((s) => { const k = +s.dataset.step; s.classList.toggle('is-active', k === step); s.classList.toggle('is-done', k < step); });
  $$('.pane').forEach((p) => p.classList.toggle('is-active', +p.dataset.pane === step));
  $('#stepBack').hidden = step === 1;
  $('#stepNext').hidden = step === 3;
  setNextLabel();
  const pane = $(`.pane[data-pane="${step}"]`);
  if (!reduced) gsap.fromTo(pane, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' });
  if (scroll) {
    const top = $('#pedido').getBoundingClientRect().top;
    if (top < -40 || top > innerHeight * 0.5) getLenis() ? getLenis().scrollTo('#pedido', { offset: -90 }) : $('#pedido').scrollIntoView();
  }
}
const setNextLabel = () => {
  if (step === 1) $('#stepNext').textContent = cart.length ? `Continuar con ${cart.length} fragancia${cart.length === 1 ? '' : 's'} →` : 'Continuar →';
  else $('#stepNext').textContent = 'Continuar →';
};
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
      ${p.img ? `<img src="${p.img}" alt="" loading="lazy" />` : '<span class="ph">E</span>'}
      <span class="pick__t"><strong>${esc(p.name)}</strong><small>${esc(p.house)}</small></span>
      <span class="pick__chk" aria-hidden="true"></span></button>`;
  }).join('') + (list.length > 60 ? `<p class="pick__more">Mostrando 60 de ${list.length}. Buscá por nombre para encontrar más.</p>` : '')
    || `<p class="res__none">No encontramos “${esc(pick.q)}”. <a href="${waLink(`Hola Extracto Importado 👋 ¿tienen la equivalencia de ${pick.q}?`)}" target="_blank" rel="noopener">Consultar por WhatsApp</a>.</p>`;
}
$('#pickList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-pick]'); if (!b) return;
  if (inCart(b.dataset.pick)) removeProduct(b.dataset.pick); else addToCart(b.dataset.pick, '100', 1);
});

const form = $('#orderForm');
$('#fCity').innerHTML = DEPARTAMENTOS.map((d) => `<option>${d}</option>`).join('');
function render() {
  renderPick();
  $('#lines').innerHTML = cart.length ? cart.map(lineRow).join('') : '<p class="muted">Todavía no elegiste fragancias.</p>';
  const t = totals();
  $('#summaryItems').innerHTML = cart.length
    ? cart.map((l) => `<div class="sum"><span>${esc(byId[l.id].name)} <small>${sizeById[l.size].label}</small></span><span>× ${l.qty}</span></div>`).join('') + (nudge(t) ? `<p class="nudge">${nudge(t)}</p>` : '')
    : '<p class="muted" style="margin:0">Elegí tus fragancias a la izquierda.</p>';
  $('#summaryTotals').innerHTML = cart.length ? totalsHtml(t) : '';
  $('#sendWa').disabled = !cart.length;
  setNextLabel();
}
wireLines($('#lines'));
onCart(render);
render();

function orderMessage() {
  const t = totals();
  const f = Object.fromEntries(new FormData(form));
  return [
    'Hola Extracto Importado 👋 quiero hacer este pedido:', '',
    ...cart.map((l) => `• ${byId[l.id].name} (inspirado en ${byId[l.id].house}) — ${sizeById[l.size].label} × ${l.qty}`), '',
    ...t.groups.map((g) => `${g.n} × ${g.size.label}: ${bs(g.price)}`),
    t.save ? `${saveLabel}: ${bs(t.save)}` : null,
    `*Total estimado: ${bs(t.total)}*`, '',
    `Nombre: ${f.name || '—'}`, `Departamento: ${f.city}`, `Entrega: ${f.delivery}`,
    f.addr ? `Dirección/zona: ${f.addr}` : null, `Pago: ${f.pay}`, f.note ? `Nota: ${f.note}` : null,
  ].filter((x) => x !== null).join('\n');
}
$('#sendWa').addEventListener('click', () => {
  if (!cart.length) return;
  if (step < 3 || !$('#fName').value.trim()) {
    goStep(3);
    $('#fName').focus({ preventScroll: true });
    $('#fName').closest('.field').classList.add('is-err');
    toast('Completá tu nombre para enviar el pedido', false);
    return;
  }
  window.open(waLink(orderMessage()), '_blank', 'noopener');
});
$('#fName').addEventListener('input', () => $('#fName').closest('.field').classList.remove('is-err'));

if (location.hash === '#datos' && cart.length) goStep(3, false);
else if (cart.length) goStep(2, false);
