// Layered SVG of the Extracto Importado 100 ml flask (square glass, black cap,
// cream label). Layers carry data-depth so 3D tilt cards can parallax them.
let uid = 0;

export function bottleSVG({ tint = '#e7a640', deep = '#a8590e', clear = false } = {}) {
  const id = `b${uid++}`;
  const top = clear ? '#fbf3dc' : mix('#f0b552', tint, 0.25);
  const bot = clear ? '#e9dcb8' : mix('#a8590e', deep, 0.25);
  return `
<svg class="bottle" viewBox="0 0 220 300" aria-hidden="true">
  <defs>
    <linearGradient id="${id}l" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${top}" stop-opacity="${clear ? 0.55 : 0.92}"/>
      <stop offset="1" stop-color="${bot}" stop-opacity="${clear ? 0.6 : 0.96}"/>
    </linearGradient>
    <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity=".55"/>
      <stop offset=".1" stop-color="#fff" stop-opacity=".08"/>
      <stop offset=".85" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#fff" stop-opacity=".4"/>
    </linearGradient>
    <linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#050404"/>
      <stop offset=".28" stop-color="#2e2a26"/>
      <stop offset=".5" stop-color="#121010"/>
      <stop offset="1" stop-color="#020202"/>
    </linearGradient>
    <radialGradient id="${id}s" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#000" stop-opacity=".5"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <ellipse cx="110" cy="290" rx="96" ry="8" fill="url(#${id}s)"/>

  <g class="b-layer" data-depth="18">
    <rect x="72" y="14" width="76" height="62" rx="5" fill="url(#${id}c)"/>
    <ellipse cx="110" cy="15" rx="38" ry="3" fill="#3a3530"/>
    <rect x="80" y="20" width="5" height="50" rx="2.5" fill="#fff" opacity=".1"/>
    <rect x="92" y="74" width="36" height="10" fill="rgba(255,255,255,.25)"/>
  </g>

  <g class="b-layer" data-depth="6">
    <rect x="22" y="82" width="176" height="200" rx="10" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.5)" stroke-width="1.2"/>
    <rect x="30" y="94" width="160" height="164" rx="5" fill="url(#${id}l)"/>
    <rect x="30" y="250" width="160" height="26" rx="4" fill="rgba(255,255,255,.12)"/>
    <rect x="22" y="82" width="176" height="200" rx="10" fill="url(#${id}g)"/>
    <rect x="28" y="92" width="6" height="176" rx="3" fill="#fff" opacity=".35"/>
  </g>

  <g class="b-layer" data-depth="26">
    <rect x="46" y="110" width="128" height="150" fill="#efe8da"/>
    <rect x="52" y="116" width="116" height="138" fill="none" stroke="#1a1714" stroke-width=".9"/>
    <text x="110" y="150" text-anchor="middle" fill="#1a1714" font-family="Cinzel, 'Cormorant Garamond', serif" font-size="15" letter-spacing="1.6">EXTRACTO</text>
    <line x1="64" y1="157" x2="84" y2="157" stroke="#1a1714" stroke-width=".5"/>
    <line x1="136" y1="157" x2="156" y2="157" stroke="#1a1714" stroke-width=".5"/>
    <text x="110" y="159" text-anchor="middle" fill="#1a1714" font-family="Cinzel, serif" font-size="5.2" letter-spacing="1.4">IMPORTADO</text>
    <text x="110" y="204" text-anchor="middle" fill="#1a1714" font-family="Manrope, sans-serif" font-weight="600" font-size="5" letter-spacing="1">PARFUM</text>
    <text x="60" y="246" fill="#1a1714" font-family="Manrope, sans-serif" font-size="4.2">100 ML.</text>
    <text x="160" y="246" text-anchor="end" fill="#1a1714" font-family="Manrope, sans-serif" font-size="4.2">3.4 FL.OZ.</text>
  </g>
</svg>`;
}

function mix(a, b, t) {
  const pa = hex(a), pb = hex(b);
  const r = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${r.join(',')})`;
}
function hex(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
