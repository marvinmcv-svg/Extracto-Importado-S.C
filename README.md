# Extracto Importado — tienda web

Tienda online para **Extracto Importado** (Santa Cruz, Bolivia): perfumes de alta concentración / equivalencias. El pedido se arma en la web y se envía por WhatsApp (+591 65907181).

## Stack
Vite + JavaScript sin framework. Sin dependencias en runtime.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera /dist (sitio estático)
```

## Contenido
- `src/catalog.js` — 156 fragancias del PDF oficial (orden y acordes del catálogo).
- `src/data.js` — precios, promos (2×690, 4×1260, decants), más pedidos, novedades de Instagram, FAQ.
- `public/img/p/<id>.webp` — foto de cada fragancia, extraída del PDF (original + frasco Extracto + acordes). El nombre del archivo es el `id` del catálogo.
- `public/img/` — foto still-life, logo, lámina de precios y collage, del PDF.

## Cómo funciona el pedido
Carrito compartido (se guarda en el navegador) → embudo de 3 pasos (fragancias, formato, datos) → abre WhatsApp con el pedido, total y promos aplicadas automáticamente. No hay pagos en la web.

Para agregar una fragancia: sumala en `src/catalog.js` y poné su foto en `public/img/p/<id>.webp`. Sin foto, se muestra una etiqueta Extracto como placeholder.
