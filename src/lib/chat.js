// "Asesor Extracto" — AI shopping assistant widget.
// Streams answers from /api/chat (Claude). If the API is unreachable or not configured,
// it answers from a local rules engine so the widget never dead-ends.
import gsap from 'gsap';
import {
  esc, bs, products, byId, search, productUrl, GENDER, groupScore, accordGroups, PROMO, PRICE_100, LIST_100, waLink, inCart,
} from './store.js';
import { DEPARTAMENTOS } from '../data.js';

const KEY = 'ei-chat-v1';
const WA = '<svg viewBox="0 0 32 32" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3Zm0 23.6c-2 0-4-.5-5.7-1.6l-.4-.2-3.9 1 1-3.8-.3-.4A10.6 10.6 0 1 1 16 26.6Zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5 1-1.7.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.7 3.7 0 0 0-1.1 2.7 6.5 6.5 0 0 0 1.4 3.4 14.6 14.6 0 0 0 5.6 5c2.1.9 2.9 1 4 .8.6-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5l-.4-.4Z"/></svg>';
const CHIPS = ['Recomendame algo dulce para la noche', '¿Cuánto cuesta un perfume?', '¿Envían a La Paz?', '¿Qué es una equivalencia?', 'Busco un regalo para él'];

let msgs = [];
try { msgs = JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch { msgs = []; }
const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-30))); } catch {} };

/* ───────── rendering ───────── */
function md(text) {
  // escape, then a tiny safe subset of markdown
  let h = esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https:\/\/wa\.me\/[^)\s]+|\/[^)\s]*)\)/g, '<a href="$2">$1</a>');
  const lines = h.split('\n');
  let out = '', list = false;
  for (const ln of lines) {
    const m = ln.match(/^\s*(?:[-•*]|\d+\.)\s+(.*)/);
    if (m) { if (!list) { out += '<ul>'; list = true; } out += `<li>${m[1]}</li>`; continue; }
    if (list) { out += '</ul>'; list = false; }
    out += ln.trim() ? `<p>${ln}</p>` : '';
  }
  if (list) out += '</ul>';
  return out.replace(/<a href="https:\/\/wa\.me/g, '<a target="_blank" rel="noopener" href="https://wa.me');
}
const TOKEN = /\[\[([a-z0-9-]+)\]\]/g;
function splitTokens(text) {
  const ids = [];
  const clean = text.replace(/\s*\[\[([a-z0-9-]+)\]\]/g, (_, id) => { if (byId[id] && !ids.includes(id)) ids.push(id); return ''; })
    .replace(/\[\[[^\]]*$/, ''); // hide a half-streamed token
  return { clean, ids };
}
function mini(p) {
  return `<div class="cmini">
    <a href="${productUrl(p.id)}" class="cmini__img">${p.img ? `<img src="${p.img}" alt="" loading="lazy" />` : '<span class="ph">E</span>'}</a>
    <div class="cmini__t"><a href="${productUrl(p.id)}"><strong>${esc(p.name)}</strong></a><small>${esc(p.house)} · ${GENDER[p.gender]}</small></div>
    <button class="cmini__add ${inCart(p.id) ? 'is-in' : ''}" data-add="${p.id}" aria-label="Agregar ${esc(p.name)}">+ ${PRICE_100} Bs.</button>
  </div>`;
}
function bubble(m) {
  if (m.role === 'user') return `<div class="cmsg cmsg--u"><div class="cmsg__b">${esc(m.content)}</div></div>`;
  const { clean, ids } = splitTokens(m.content);
  return `<div class="cmsg cmsg--a"><div class="cmsg__b">${md(clean) || '<span class="dots"><i></i><i></i><i></i></span>'}</div>${ids.length ? `<div class="cmsg__cards">${ids.map((id) => mini(byId[id])).join('')}</div>` : ''}</div>`;
}

/* ───────── local fallback brain ───────── */
const has = (t, ...w) => w.some((x) => t.includes(x));
function recommend(t) {
  let gender = null;
  if (has(t, 'ella', 'mujer', 'femenin', 'novia', 'mama', 'esposa', 'chica', 'hermana')) gender = 'femenino';
  if (has(t, 'para el ', 'para el?', 'hombre', 'masculin', 'novio', 'papa', 'esposo', 'chico', 'hermano')) gender = gender ? null : 'masculino';
  if (has(t, 'unisex')) gender = 'unisex';
  const wants = [];
  if (has(t, 'dulce', 'vainill', 'caramel', 'gourmand', 'cremos')) wants.push('dulce');
  if (has(t, 'fresc', 'citric', 'limpi', 'acuatic', 'marin', 'verano', 'dia', 'calor', 'gym', 'oficina')) wants.push('fresco');
  if (has(t, 'flor', 'rosa', 'jazmin', 'romant')) wants.push('floral');
  if (has(t, 'mader', 'cuero', 'oud', 'elegan', 'serio')) wants.push('amaderado');
  if (has(t, 'especi', 'cafe', 'tabaco', 'noche', 'canela', 'intens', 'seduc')) wants.push('especiado');
  if (has(t, 'frut', 'tropical', 'cereza')) wants.push('frutal');
  let list = products.filter((p) => p.img && (!gender || p.gender === gender || p.gender === 'unisex'));
  if (wants.length) list = list.map((p) => ({ p, s: wants.reduce((a, w) => a + groupScore(p, w), 0) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.p);
  else list = ['lattafa-yara', 'dior-sauvage', 'carolina-herrera-good-girl', 'maison-francis-kurkdjian-baccarat-rouge-540', 'paco-rabanne-1-million', 'lattafa-khamrah'].map((id) => byId[id]).filter((p) => !gender || p.gender === gender || p.gender === 'unisex');
  return list.slice(0, 3);
}
function localAnswer(q) {
  const t = ` ${q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')} `;
  const hit = search(q).slice(0, 2);
  if (has(t, 'precio', 'cuesta', 'cuanto', 'vale', 'costo', 'promo', 'oferta', 'black')) {
    return `Precios actuales:\n- **100 ml**: ${PROMO.active ? `${PRICE_100} Bs. por ${PROMO.name} (antes ${LIST_100})` : `${LIST_100} Bs.`}\n- 2 perfumes de 100 ml: 690 Bs. · 4 perfumes: 1.260 Bs.\n- Decants: 5 ml 50 Bs. (3 × 135) · 10 ml 90 Bs. (3 × 240) · 30 ml 210 Bs. (2 × 370)\n\nEl envío es gratis a toda Bolivia en perfumes de 100 ml.`;
  }
  if (has(t, 'envi', 'delivery', 'llega', 'demora', 'departamento', ...DEPARTAMENTOS.map((d) => d.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')))) {
    return 'Enviamos a **toda Bolivia** (los 9 departamentos). En perfumes de 100 ml el envío es **gratis**; para decants te confirmamos el costo según tu ciudad. En Santa Cruz también podés coordinar la entrega. El tiempo exacto te lo confirma nuestro equipo por WhatsApp al cerrar el pedido.';
  }
  if (has(t, 'pago', 'pagar', 'qr', 'transfer', 'efectivo', 'tarjeta')) return 'Podés pagar por **QR**, **transferencia bancaria** o **efectivo** (según tu ciudad). Te pasamos los datos por WhatsApp cuando confirmamos tu pedido. No se paga nada en la web.';
  if (has(t, 'equivalen', 'original', 'replica', 'copia', 'trucho', 'autentic')) return 'Una **equivalencia** es nuestra versión de alta concentración (Extracto · Parfum) inspirada en un perfume de diseñador o nicho: busca el mismo perfil olfativo a una fracción del precio. No es el perfume original ni usa su marca — el nombre es solo una referencia del aroma.';
  if (has(t, 'dura', 'hora', 'fijacion', 'concentra')) return 'Nuestras fragancias son de concentración **Extracto / Parfum**: duran **más de 8 horas** en la piel, y más en la ropa.';
  if (has(t, 'mayor', 'mayorista', 'revender', 'negocio')) return 'Sí, vendemos **por mayor y por menor** (somos distribuidor autorizado). Escribinos por [WhatsApp](https://wa.me/59165907181) y te pasamos la lista de mayorista.';
  if (has(t, 'pedido', 'comprar', 'pido', 'ordenar')) return 'Podés armar tu pedido en [Hacer pedido](/pedido): elegís las fragancias, el formato y tus datos, y te abrimos WhatsApp con todo listo. Nuestro equipo confirma stock, total y envío.';
  if (hit.length && !has(t, 'recomend', 'suger', 'regalo', 'busco')) {
    const p = hit[0];
    return `Sí, tenemos la equivalencia de **${p.name}** (${p.house}). Sus acordes principales: ${p.accords.slice(0, 4).join(', ')}. Sale ${PRICE_100} Bs. en 100 ml, o desde 50 Bs. en decant. [[${p.id}]]${hit[1] ? ` [[${hit[1].id}]]` : ''}`;
  }
  const rec = recommend(t);
  return `Te recomiendo empezar por estas:\n${rec.map((p) => `- **${p.name}** (${p.house}): ${p.accords.slice(0, 3).join(', ')}`).join('\n')}\n\nSi querés, decime para quién es y qué aromas te gustan, y lo afino. ${rec.map((p) => `[[${p.id}]]`).join(' ')}`;
}

/* ───────── network ───────── */
async function ask(onDelta) {
  const pid = new URLSearchParams(location.search).get('id');
  const body = JSON.stringify({ messages: msgs.filter((m) => m.content).slice(-16), page: { path: location.pathname, product: byId[pid] ? pid : null } });
  const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  if (!res.ok || !res.body) throw new Error(`chat ${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let got = false;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = dec.decode(value, { stream: true });
    if (chunk) { got = true; onDelta(chunk); }
  }
  if (!got) throw new Error('empty');
}

/* ───────── widget ───────── */
export function mountChat() {
  document.body.insertAdjacentHTML('beforeend', `
  <div class="dock">
    <a class="dock__wa" href="${waLink('Hola Extracto Importado 👋')}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">${WA}</a>
    <button class="dock__chat" id="chatOpen" aria-expanded="false" aria-controls="chat"><span class="dock__orb" aria-hidden="true"></span><span>Asesor</span></button>
  </div>
  <section class="chat" id="chat" aria-hidden="true" aria-label="Asesor virtual Extracto">
    <header class="chat__head">
      <span class="dock__orb" aria-hidden="true"></span>
      <div><p class="chat__title">Asesor Extracto</p><p class="chat__sub">Asistente virtual · responde al instante</p></div>
      <button class="icon-btn" id="chatReset" aria-label="Nueva conversación" title="Nueva conversación">↺</button>
      <button class="icon-btn" id="chatClose" aria-label="Cerrar">✕</button>
    </header>
    <div class="chat__log" id="chatLog" data-lenis-prevent aria-live="polite"></div>
    <div class="chat__chips" id="chatChips"></div>
    <form class="chat__form" id="chatForm">
      <label class="sr-only" for="chatInput">Escribí tu consulta</label>
      <textarea id="chatInput" rows="1" maxlength="800" placeholder="Preguntá por precios, envíos o pedí una recomendación…"></textarea>
      <button class="chat__send" aria-label="Enviar">→</button>
    </form>
    <a class="chat__human" href="${waLink('Hola Extracto Importado 👋 quiero hablar con una persona')}" target="_blank" rel="noopener">${WA} Hablar con una persona por WhatsApp</a>
  </section>`);

  const panel = document.getElementById('chat');
  const log = document.getElementById('chatLog');
  const input = document.getElementById('chatInput');
  const chips = document.getElementById('chatChips');
  const openBtn = document.getElementById('chatOpen');
  let busy = false;

  const welcome = { role: 'assistant', content: `¡Hola! Soy el asesor virtual de **Extracto Importado**. Te ayudo a elegir tu fragancia entre nuestras ${products.length} equivalencias, y te respondo sobre precios, envíos y pedidos. ¿Qué estás buscando?` };
  const render = () => {
    log.innerHTML = [welcome, ...msgs].map(bubble).join('');
    chips.innerHTML = msgs.length ? '' : CHIPS.map((c) => `<button type="button">${esc(c)}</button>`).join('');
    log.scrollTop = log.scrollHeight;
  };

  const open = (q) => {
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    openBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('chat-open');
    render();
    gsap.fromTo(panel, { y: 30, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out' });
    if (q) send(q); else setTimeout(() => input.focus(), 50);
  };
  const close = () => {
    gsap.to(panel, { y: 20, opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: () => {
      panel.classList.remove('is-open'); panel.setAttribute('aria-hidden', 'true');
    } });
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('chat-open');
  };

  async function send(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true;
    msgs.push({ role: 'user', content: text.slice(0, 800) });
    const reply = { role: 'assistant', content: '' };
    msgs.push(reply);
    render();
    const last = () => log.lastElementChild;
    const paint = () => {
      const el = last();
      if (el) el.outerHTML = bubble(reply);
      log.scrollTop = log.scrollHeight;
    };
    try {
      await ask((d) => { reply.content += d; paint(); });
    } catch {
      reply.content = localAnswer(text);
      paint();
    }
    save();
    busy = false;
  }

  openBtn.addEventListener('click', () => (panel.classList.contains('is-open') ? close() : open()));
  document.getElementById('chatClose').addEventListener('click', close);
  document.getElementById('chatReset').addEventListener('click', () => { msgs = []; save(); render(); input.focus(); });
  chips.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) send(b.textContent); });
  document.getElementById('chatForm').addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; input.style.height = ''; send(v); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('chatForm').requestSubmit(); } });
  input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 120)}px`; });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-chat-open]');
    if (b) { e.preventDefault(); open(b.dataset.chatQ); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('is-open')) close(); });
  if (sessionStorage.getItem('ei-chat-open') === '1') open();
  addEventListener('pagehide', () => { try { sessionStorage.setItem('ei-chat-open', panel.classList.contains('is-open') ? '1' : '0'); } catch {} });
}
