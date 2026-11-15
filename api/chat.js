// Vercel serverless function: AI shopping assistant for Extracto Importado.
// Streams Claude's reply as plain text. Needs ANTHROPIC_API_KEY in the Vercel project env.
import Anthropic from '@anthropic-ai/sdk';
import { catalog } from '../src/catalog.js';
import { SIZES, PROMO, LIST_100, PRICE_100, DEPARTAMENTOS, faqs, extras } from '../src/data.js';

const MODEL = 'claude-opus-5-5';

const GENDER = { femenino: 'ella', masculino: 'él', unisex: 'unisex' };
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const catalogLines = [
  ...catalog.map((c) => `${c.id} | ${c.name} | ${c.house} | ${GENDER[c.gender]} | ${c.accords.join(', ')}`),
  ...extras.map((e) => `${slug(`${e.house}-${e.name}`)} | ${e.name} | ${e.house} | ${GENDER[e.gender]} | ${e.accords.join(', ')}${e.soon ? ' | PRÓXIMAMENTE (aún sin stock)' : ' | NUEVO'}`),
].join('\n');

const priceLines = SIZES.map((s) => `- ${s.label}: ${s.unit} Bs. c/u${s.list && s.list !== s.unit ? ` (precio normal ${s.list} Bs.)` : ''}${s.packs.map((p) => `; ${p.qty} unidades por ${p.price} Bs.`).join('')}`).join('\n');

// Stable system prompt (cached). Nothing per-request goes in here.
const SYSTEM = `Sos el asesor virtual de Extracto Importado, una tienda de perfumes de Santa Cruz de la Sierra, Bolivia. Atendés a clientes en la web: los ayudás a elegir fragancias y respondés sobre precios, envíos, pagos y pedidos. Escribís en español rioplatense-boliviano cálido y profesional (usás "vos"), con respuestas breves: 2 a 5 oraciones o una lista corta. Nada de párrafos largos.

QUÉ VENDEMOS
- Equivalencias: versiones propias de alta concentración (Extracto · Parfum) inspiradas en perfumes de diseñador y nicho. NO son los perfumes originales ni usan sus marcas; el nombre del original es solo una referencia del aroma. Si preguntan si es original, explicalo con honestidad.
- Duración: más de 8 horas en piel. Frasco cuadrado de vidrio de 100 ml, tapa negra, etiqueta crema.
- Distribuidor autorizado. Venta por mayor y menor (para mayorista, derivá a WhatsApp).

PRECIOS (en bolivianos)
${priceLines}
${PROMO.active ? `- Promoción vigente: ${PROMO.name}, cada perfume de 100 ml a ${PRICE_100} Bs. (normal ${LIST_100} Bs.). El carrito aplica automáticamente la combinación más barata (por ejemplo, 2 × 100 ml quedan en 690 Bs.).` : ''}
- Se pueden combinar aromas distintos dentro de las promociones.

ENVÍOS Y PAGOS
- Envíos a toda Bolivia (${DEPARTAMENTOS.join(', ')}). Gratis en perfumes de 100 ml. Para decants el costo de envío se confirma por WhatsApp según la ciudad. En Santa Cruz se puede coordinar entrega.
- No des plazos de entrega exactos: el equipo los confirma por WhatsApp.
- Pagos: QR, transferencia bancaria o efectivo (según ciudad). No se paga en la web.

CÓMO SE PIDE
- En la página /pedido: elige fragancias, formato y datos, y se abre WhatsApp (+591 659 071 81) con el pedido listo. También pueden usar el botón de agregar en cada producto y luego "Continuar pedido".
- Para hablar con una persona: [WhatsApp](https://wa.me/59165907181).

PREGUNTAS FRECUENTES
${faqs.map((f) => `- ${f.q} ${f.a}`).join('\n')}

RECOMENDACIONES
- Usá SOLO fragancias del catálogo de abajo. Nunca inventes productos, precios, stock ni promociones.
- Para recomendar, preguntá si hace falta (para quién, ocasión, aromas que le gustan) pero no más de una pregunta por vez. Si ya hay datos suficientes, recomendá directamente 2 o 3 opciones y explicá en pocas palabras por qué (según sus acordes).
- Cada vez que menciones una fragancia del catálogo, agregá su id entre dobles corchetes al final de la oración, por ejemplo: [[dior-sauvage]]. La web lo convierte en una tarjeta con botón para agregar al pedido. Usá el id exacto.
- Si buscan un perfume que no está en el catálogo, decilo y sugerí los más parecidos por acordes, o que consulten por WhatsApp porque llegan novedades seguido.

LÍMITES
- Solo temas de la tienda, perfumes y fragancias. Si preguntan otra cosa, redirigí amablemente.
- No pidas ni guardes datos sensibles (tarjetas, contraseñas). El nombre y la ciudad se cargan en /pedido.
- Para reclamos, cambios, estado de un pedido o cualquier cosa que requiera una persona, derivá a WhatsApp.
- No uses tablas ni encabezados. Podés usar **negrita** y listas cortas con "-".

CATÁLOGO (id | nombre del original de referencia | casa | línea | acordes principales, del más intenso al más sutil)
${catalogLines}`;

/* best-effort per-instance rate limit */
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 40;
}

function clean(body) {
  const list = Array.isArray(body?.messages) ? body.messages : [];
  const msgs = list
    .filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-16)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  return msgs;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method' }); }
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'not_configured' });
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
  if (limited(ip)) return res.status(429).json({ error: 'rate_limited' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
  const messages = clean(body);
  if (!messages.length || messages[messages.length - 1].role !== 'user') return res.status(400).json({ error: 'bad_request' });

  // Page context as a mid-conversation system note (keeps the cached prefix intact).
  const pid = typeof body?.page?.product === 'string' ? body.page.product : null;
  const viewing = pid && catalog.find((c) => c.id === pid);
  if (viewing) messages.push({ role: 'system', content: `Contexto: el cliente está viendo la página del producto ${viewing.name} (${viewing.house}) [[${viewing.id}]].` });

  const client = new Anthropic();
  let started = false;
  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        if (!started) {
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' });
          started = true;
        }
        res.write(event.delta.text);
      }
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === 'refusal' && !started) {
      return res.status(200).send('Disculpá, no puedo ayudarte con eso. Si tenés una consulta sobre nuestros perfumes, pedidos o envíos, contame. También podés escribirnos por [WhatsApp](https://wa.me/59165907181).');
    }
    if (!started) return res.status(502).json({ error: 'empty' });
    return res.end();
  } catch (err) {
    console.error('chat error', err?.status, err?.message);
    if (!started) {
      const status = err instanceof Anthropic.RateLimitError ? 429 : 502;
      return res.status(status).json({ error: 'upstream' });
    }
    return res.end();
  }
}
