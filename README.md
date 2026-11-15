# Extracto Importado — sitio web

Sitio de marca y catálogo para **Extracto Importado** (Santa Cruz, Bolivia) — perfumes de alta concentración / equivalencias.

## Stack
Vite · Three.js (frasco 3D en tiempo real) · GSAP + ScrollTrigger · Lenis (scroll suave). Sin framework.

## Desarrollo
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera /dist (sitio estático)
```

## Contenido
- `src/catalog.js` — catálogo completo (154 fragancias, transcrito del PDF oficial) con acordes principales.
- `src/data.js` — favoritos de Instagram, precios (100 ml y decants), test de aroma, posts.
- `public/img/still-life.jpg` — fotografía de marca (del catálogo PDF).

Pedidos: todos los botones abren WhatsApp (+591 65907181) con un mensaje pre-armado (fragancia + formato + precio).
