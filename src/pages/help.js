import '../styles/base.css';
import '../styles/pages.css';
import { initLayout, $ } from '../lib/layout.js';
import { esc, waLink } from '../lib/store.js';
import { faqs } from '../data.js';

const extra = [
  { q: '¿Cuánto tarda el envío?', a: 'Depende de tu ciudad y del medio de envío (domicilio o courier). Al confirmar tu pedido por WhatsApp te decimos el tiempo estimado. En Santa Cruz podés coordinar entrega.' },
  { q: '¿Cuándo pago?', a: 'Después de que confirmamos stock y total por WhatsApp. Te enviamos el QR o los datos de transferencia; en algunas ciudades también aceptamos efectivo.' },
  { q: '¿Puedo combinar aromas en las promos?', a: 'Sí. Las promociones de 2 y 4 perfumes de 100 ml, y los packs de decants, se pueden armar con las fragancias que quieras. El carrito aplica solo la combinación más barata.' },
  { q: '¿Qué tamaño elijo?', a: 'Si ya conocés el aroma, el frasco de 100 ml es el que más conviene (y tiene envío gratis). Si querés probar, los decants de 5 o 10 ml son ideales; el de 30 ml es perfecto para llevar en la cartera o de viaje.' },
];
const ids = { '¿Hacen envíos?': 'envios', '¿Cómo pago?': 'pagos', '¿Venden por mayor?': 'mayor' };

initLayout('ayuda');
$('#faqList').innerHTML = [...faqs, ...extra].map((f, i) => `<details class="qa" ${ids[f.q] || f.id ? `id="${ids[f.q] || f.id}"` : ''} data-reveal ${i === 0 ? 'open' : ''}><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('');
$('#waBtn').href = waLink('Hola Extracto Importado 👋 tengo una consulta');
// open the matching question when arriving via #envios etc.
const open = () => { const d = location.hash && document.querySelector(location.hash); if (d?.tagName === 'DETAILS') d.open = true; };
addEventListener('hashchange', open);
document.addEventListener('click', (e) => { const a = e.target.closest('a[href^="#"]'); if (a) setTimeout(() => { const d = document.querySelector(a.getAttribute('href')); if (d?.tagName === 'DETAILS') d.open = true; }, 0); });
open();
