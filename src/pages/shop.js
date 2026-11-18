import '../styles/base.css';
import '../styles/pages.css';
import { initLayout, card, tilt, gsap, ScrollTrigger, reduced, $, $$ } from '../lib/layout.js';
import { products, search, accordGroups, groupScore, houses, bestsellers, GENDER, ACCORDS, esc } from '../lib/store.js';

initLayout('tienda');

const params = new URLSearchParams(location.search);
const PAGE = 24;
const state = {
  line: ['femenino', 'masculino', 'unisex'].includes(params.get('linea')) ? params.get('linea') : 'all',
  fam: params.get('familia') && accordGroups.some((g) => g.id === params.get('familia')) ? params.get('familia') : null,
  houses: new Set((params.get('casa') || '').split(',').filter((h) => houses.includes(h))),
  q: params.get('q') || '',
  sort: 'catalog',
  limit: PAGE,
};
const navKey = state.line === 'femenino' ? 'ella' : state.line === 'masculino' ? 'el' : 'tienda';
$$('.nav__links a').forEach((a) => a.toggleAttribute('aria-current', a.getAttribute('href') === (navKey === 'tienda' ? '/tienda' : `/tienda?linea=${state.line}`)));
$('#q').value = state.q;
if (state.line !== 'all') $('#shopTitle').innerHTML = { femenino: 'Para <i>ella.</i>', masculino: 'Para <i>él.</i>', unisex: 'Unisex <i>y nicho.</i>' }[state.line];

function filtered({ skip } = {}) {
  let list = products;
  if (skip !== 'line' && state.line !== 'all') list = list.filter((p) => p.gender === state.line);
  if (skip !== 'house' && state.houses.size) list = list.filter((p) => state.houses.has(p.house));
  if (skip !== 'fam' && state.fam) list = list.filter((p) => groupScore(p, state.fam) > 0).sort((a, b) => groupScore(b, state.fam) - groupScore(a, state.fam));
  if (state.q) list = search(state.q, list);
  if (state.sort === 'az') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  if (state.sort === 'house') list = [...list].sort((a, b) => a.house.localeCompare(b.house, 'es') || a.name.localeCompare(b.name, 'es'));
  if (state.sort === 'popular') list = [...list].sort((a, b) => (bestsellers.indexOf(b.id) + 1 ? 100 - bestsellers.indexOf(b.id) : 0) - (bestsellers.indexOf(a.id) + 1 ? 100 - bestsellers.indexOf(a.id) : 0));
  return list;
}

function syncUrl() {
  const p = new URLSearchParams();
  if (state.line !== 'all') p.set('linea', state.line);
  if (state.fam) p.set('familia', state.fam);
  if (state.houses.size) p.set('casa', [...state.houses].join(','));
  if (state.q) p.set('q', state.q);
  history.replaceState(null, '', `/tienda${p.toString() ? `?${p}` : ''}`);
}

let showAllHouses = false;
function renderFilters() {
  const byLine = filtered({ skip: 'line' });
  const lines = [['all', 'Todas', byLine.length], ...Object.keys(GENDER).map((g) => [g, GENDER[g], byLine.filter((p) => p.gender === g).length])];
  $('#fLine').innerHTML = lines.map(([id, l, n]) => `<button class="fopt fopt--radio" data-line="${id}" aria-pressed="${state.line === id}"><span><i></i>${l}</span><small>${n}</small></button>`).join('');
  const byFam = filtered({ skip: 'fam' });
  $('#fFam').innerHTML = accordGroups.map((g) => `<button class="fopt" data-fam="${g.id}" aria-pressed="${state.fam === g.id}"><span><i style="${state.fam === g.id ? '' : `border-color:${ACCORDS[g.match[0]]}`}"></i>${g.label}</span><small>${byFam.filter((p) => groupScore(p, g.id) > 0).length}</small></button>`).join('');
  const byHouse = filtered({ skip: 'house' });
  const hc = houses.map((h) => [h, byHouse.filter((p) => p.house === h).length]).filter(([h, n]) => n || state.houses.has(h)).sort((a, b) => b[1] - a[1]);
  const list = showAllHouses ? hc : hc.slice(0, 10);
  $('#fHouse').innerHTML = list.map(([h, n]) => `<button class="fopt" data-house="${esc(h)}" aria-pressed="${state.houses.has(h)}"><span><i></i>${esc(h)}</span><small>${n}</small></button>`).join('');
  $('#houseMore').hidden = hc.length <= 10;
  $('#houseMore').textContent = showAllHouses ? 'Ver menos' : `Ver todas (${hc.length})`;

  const chips = [];
  if (state.line !== 'all') chips.push(['line', GENDER[state.line]]);
  if (state.fam) chips.push(['fam', accordGroups.find((g) => g.id === state.fam).label]);
  state.houses.forEach((h) => chips.push([`house:${h}`, h]));
  if (state.q) chips.push(['q', `“${state.q}”`]);
  $('#active').innerHTML = chips.map(([k, l]) => `<button data-rm="${esc(k)}">${esc(l)} <span aria-hidden="true">✕</span><span class="sr-only">Quitar filtro</span></button>`).join('');
}

function renderGrid(animate = true) {
  const list = filtered();
  const grid = $('#grid');
  grid.innerHTML = list.slice(0, state.limit).map(card).join('') ||
    '<p class="empty">Sin resultados. Probá con otro nombre o <button class="link" data-chat-open data-chat-q="Busco algo parecido a ' + esc(state.q) + '">preguntale al asesor</button>.</p>';
  $('#count').textContent = `${list.length} fragancia${list.length === 1 ? '' : 's'}`;
  $('#shopTotal').textContent = list.length;
  $('#more').hidden = list.length <= state.limit;
  $('#more').textContent = `Ver más (${list.length - state.limit})`;
  tilt(grid);
  if (animate && !reduced) gsap.from($$('.pcard', grid).slice(0, 12), { y: 40, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.04, clearProps: 'opacity' });
  ScrollTrigger.refresh();
}
const update = () => { state.limit = PAGE; syncUrl(); renderFilters(); renderGrid(); };

$('#filters').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.line) { state.line = b.dataset.line; update(); }
  else if (b.dataset.fam) { state.fam = state.fam === b.dataset.fam ? null : b.dataset.fam; update(); }
  else if (b.dataset.house) { const h = b.dataset.house; state.houses.has(h) ? state.houses.delete(h) : state.houses.add(h); update(); }
  else if (b.id === 'houseMore') { showAllHouses = !showAllHouses; renderFilters(); }
  else if (b.id === 'fReset') { state.line = 'all'; state.fam = null; state.houses.clear(); state.q = ''; $('#q').value = ''; update(); }
  else if (b.id === 'filtersClose') $('#filters').classList.remove('is-open');
});
$('#active').addEventListener('click', (e) => {
  const b = e.target.closest('[data-rm]'); if (!b) return;
  const k = b.dataset.rm;
  if (k === 'line') state.line = 'all';
  else if (k === 'fam') state.fam = null;
  else if (k === 'q') { state.q = ''; $('#q').value = ''; }
  else state.houses.delete(k.slice(6));
  update();
});
let t;
$('#q').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value.trim(); update(); }, 160); });
$('#sort').addEventListener('change', (e) => { state.sort = e.target.value; renderGrid(); });
$('#more').addEventListener('click', () => {
  const from = state.limit;
  state.limit += PAGE;
  renderGrid(false);
  if (!reduced) gsap.from($$('.pcard', $('#grid')).slice(from), { y: 40, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.03, clearProps: 'opacity' });
});
$('#filtersOpen').addEventListener('click', () => $('#filters').classList.add('is-open'));

renderFilters();
renderGrid();
