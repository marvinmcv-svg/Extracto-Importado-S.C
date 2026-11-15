import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const PAGES = ['index', 'tienda', 'producto', 'precios', 'nosotros', 'pedido', 'ayuda'];

/** Serve /tienda -> /tienda.html in dev & preview (Vercel does this with cleanUrls). */
const cleanUrls = () => {
  const rewrite = (req, _res, next) => {
    const [path, qs] = req.url.split('?');
    const name = path.replace(/^\/|\/$/g, '');
    if (PAGES.includes(name)) req.url = `/${name}.html${qs ? `?${qs}` : ''}`;
    next();
  };
  return {
    name: 'clean-urls',
    configureServer(server) { server.middlewares.use(rewrite); },
    configurePreviewServer(server) { server.middlewares.use(rewrite); },
  };
};

export default defineConfig({
  plugins: [cleanUrls()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: Object.fromEntries(PAGES.map((p) => [p, resolve(import.meta.dirname, `${p}.html`)])),
    },
  },
});
