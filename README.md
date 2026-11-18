# Extracto Importado — tienda web

Tienda online de **Extracto Importado** (Santa Cruz, Bolivia): equivalencias de perfumes de alta concentración. Los pedidos se arman en la web y se cierran por WhatsApp (+591 659 071 81).

## Páginas
| Ruta | Archivo | Contenido |
|---|---|---|
| `/` | `index.html` | Hero de oro líquido + frasco 3D, casas, manifiesto, tres caminos, familias olfativas, más pedidos, el frasco, galería 360°, Black Friday, asesor, el ritual |
| `/tienda` | `tienda.html` | Catálogo con filtros (línea, familia, casa), búsqueda y orden. Acepta `?linea=`, `?familia=`, `?casa=`, `?q=` |
| `/producto?id=…` | `producto.html` | Ficha: foto, acordes, formatos, cantidad, similares |
| `/precios` | `precios.html` | Promos, decants, calculadora de combos, envíos |
| `/nosotros` | `nosotros.html` | Marca, qué es una equivalencia, valores |
| `/pedido` | `pedido.html` | Pedido en 3 pasos → WhatsApp |
| `/ayuda` | `ayuda.html` | Preguntas frecuentes, envíos, pagos, contacto |

## Diseño — "Noir Ambré"
Alta perfumería en clave oscura: negro tinta cálido, tipografía marfil (Instrument Serif + Manrope, Cinzel solo en el logotipo) y acentos de oro líquido. Arcos, filetes finos y grano de película.

- **Hero WebGL** (`src/lib/bottle3d.js`): un campo de humo de oro líquido (shader fbm con *domain warping*) que el cursor revuelve, y delante el frasco Extracto de 100 ml en vidrio con transmisión real: refracta el humo que tiene detrás. Al bajar, el frasco sube, gira y levanta la tapa.
- **Movimiento** (GSAP + Lenis): precarga con contador, titulares que suben letra por letra, marquesina de casas que acelera con el scroll, manifiesto con píldoras de imagen, arcos con parallax, lista de familias olfativas con vista previa flotante, carril fijado de "Lo más pedido", galería 3D 360°, "350 Bs." gigante que se desliza, orbe del asesor, cortina dorada entre páginas.
- **Detalles**: cursor propio (anillo con etiqueta), menú a pantalla completa con previsualización en arco, footer monumental. Respeta `prefers-reduced-motion` y tiene alternativa sin WebGL.

## Stack
Vite (multi-página) · Three.js · GSAP (ScrollTrigger, SplitText) · Lenis · Vercel Functions · Claude API.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera /dist
```

## Asesor virtual (IA)
- `api/chat.js` es una función de Vercel que llama a Claude con toda la información de la tienda y el catálogo completo, y devuelve la respuesta en streaming.
- **Requiere la variable de entorno `ANTHROPIC_API_KEY`** en el proyecto de Vercel (Settings → Environment Variables). Sin ella, el asesor responde con un modo básico local (precios, envíos, pagos, recomendaciones por familia olfativa) y siempre ofrece pasar a WhatsApp.
- Las recomendaciones aparecen como tarjetas con botón para agregar al pedido.

## Contenido
- `src/catalog.js` — 156 fragancias del PDF oficial con sus acordes.
- `src/data.js` — precios, **promo Black Friday** (`PROMO.active`), más pedidos, novedades, preguntas frecuentes.
- `public/img/p/<id>.webp` — foto de cada fragancia extraída del PDF. El nombre del archivo es el `id` del catálogo.
- `public/img/` — still-life, logo, lámina de precios y collage del PDF.

Para agregar una fragancia: sumala en `src/catalog.js` y poné su foto en `public/img/p/<id>.webp`.
