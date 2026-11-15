# Extracto Importado — tienda web

Tienda online de **Extracto Importado** (Santa Cruz, Bolivia): equivalencias de perfumes de alta concentración. Los pedidos se arman en la web y se cierran por WhatsApp (+591 659 071 81).

## Páginas
| Ruta | Archivo | Contenido |
|---|---|---|
| `/` | `index.html` | Frasco 3D con historia en scroll, marcas, destacados (bento), líneas, más pedidos, galería 360°, Black Friday, por qué comprar, asesor, cómo pedir |
| `/tienda` | `tienda.html` | Catálogo con filtros (línea, familia, casa), búsqueda y orden. Acepta `?linea=`, `?familia=`, `?casa=`, `?q=` |
| `/producto?id=…` | `producto.html` | Ficha: foto, acordes, formatos, cantidad, similares |
| `/precios` | `precios.html` | Promos, decants, calculadora de combos, envíos |
| `/nosotros` | `nosotros.html` | Marca, qué es una equivalencia, valores |
| `/pedido` | `pedido.html` | Pedido en 3 pasos → WhatsApp |
| `/ayuda` | `ayuda.html` | Preguntas frecuentes, envíos, pagos, contacto |

## Diseño
Lenguaje visual estilo Apple: tipografía SF Pro / Inter con tracking ajustado, superficies `#f5f5f7`, botones píldora azules y enlaces “Más ›”, navegación translúcida con blur, sub-navegación fija por página, cinta promocional, inputs con etiqueta flotante y un footer sobrio. El dorado-ámbar de la marca aparece como degradado en titulares y números.

- **Hero 3D** (`src/lib/bottle3d.js`): el frasco Extracto de 100 ml en WebGL — vidrio con transmisión/refracción, jugo ámbar, tapa negra mate, collar dorado y etiqueta crema — con reflejos de estudio (RoomEnvironment) y luces de borde de color. Una historia con scroll (`#story`, GSAP scrub) lo gira, lo mueve y le levanta la tapa mientras aparecen los textos.
- **Movimiento**: bento de destacados con tilt 3D y brillo, línea de productos con imágenes que suben, carril horizontal fijado de “Lo más pedido”, foto que se reduce de pantalla completa a tarjeta, galería 3D 360° (`src/lib/hero3d.js`, se carga al acercarse), banda Black Friday con resplandor, asesor con borde animado tipo Apple Intelligence.
- Todo respeta `prefers-reduced-motion` y tiene alternativa sin WebGL.

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
