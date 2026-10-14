/*
 * Offline-Hülle für "von mir aus": merkt sich die App-Dateien beim Online-Besuch, damit die App auch ohne Netz
 * öffnet (z. B. Zug, Funkloch). Deine Daten liegen ohnehin nur auf dem Gerät – dieser Speicher enthält nur die App selbst.
 *  - Seitenaufrufe: erst Netz (damit neue Versionen sofort ankommen), ohne Netz die gemerkte App.
 *  - /assets/* (Dateinamen mit Prüfsumme): gemerkt, ändern sich nie unter demselben Namen.
 *  - Alles von anderen Servern (Fotos, Schriften) und version.json: unberührt.
 */
const CACHE = 'vma-shell-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  // preload every app file once, so the whole app is available offline after the first online visit
  event.waitUntil(
    (async () => {
      try {
        const res = await fetch('/precache.json', { cache: 'no-store' });
        if (!res.ok) return;
        const list = await res.json();
        const cache = await caches.open(CACHE);
        await Promise.all(list.map((u) => cache.add(new Request(u, { cache: 'reload' })).catch(() => {})));
      } catch {
        // offline mode is a bonus – never block the installation
      }
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/version.json' || url.pathname === '/sw.js') return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('/index.html', copy));
          }
          return res;
        })
        .catch(async () => (await caches.match('/index.html')) || Response.error()),
    );
    return;
  }

  // everything else (manifest, …) goes straight to the network; only the hashed files and icons are remembered
  if (!url.pathname.startsWith('/assets/') && !url.pathname.startsWith('/icons/')) return;

  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => Response.error()),
    ),
  );
});
