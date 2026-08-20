import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const ZASOBY = resolve(__dirname, '../sf555/res');

const TYPY: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.mp3': 'audio/mpeg',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

/**
 * Grafika gry (96 MB) lezy w `sf555/res` i jest wspolna ze stara wersja.
 *
 * Przy pracy lokalnej serwujemy ja wprost stamtad. NIE przez `public/`,
 * bo Vite kopiuje caly ten katalog do `dist/` przy kazdym budowaniu —
 * 96 MB przepisywane w kolko bez powodu. Na serwer zasoby trafiaja
 * osobno, skryptem backendu.
 */
function zasobyGry() {
  return {
    name: 'zasoby-gry',
    configureServer(server: { middlewares: { use: (sciezka: string, uchwyt: unknown) => void } }) {
      server.middlewares.use('/res', (req: { url?: string }, res: any, next: () => void) => {
        const wzgledna = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');

        // Bez tego `/res/../../etc/passwd` wyszloby poza katalog zasobow.
        const plik = join(ZASOBY, normalize(wzgledna).replace(/^(\.\.[/\\])+/, ''));
        if (!plik.startsWith(ZASOBY)) {
          res.statusCode = 403;
          res.end('poza katalogiem zasobow');
          return;
        }

        try {
          if (!statSync(plik).isFile()) return next();
        } catch {
          return next();
        }

        res.setHeader('Content-Type', TYPY[extname(plik).toLowerCase()] ?? 'application/octet-stream');
        createReadStream(plik).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), zasobyGry()],

  // Nic statycznego nie trzymamy w `web/` — grafika idzie z `sf555/res`.
  publicDir: false,

  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8787', changeOrigin: true },
    },
  },

  build: { outDir: 'dist', emptyOutDir: true },
});
