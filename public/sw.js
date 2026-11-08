// Service worker do Sistema Viver Bem — só cuida de deixar o app instalável
// e funcionar um pouco melhor com internet ruim. Não guarda dados do paciente:
// esses sempre vêm direto do Firebase.
const CACHE = "viverbem-shell-v3";
const SHELL = ["./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Tenta a rede primeiro (pra sempre pegar a versão mais nova do sistema);
// se não tiver internet, cai pro que tiver guardado.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const staticURLs = SHELL.map(path => new URL(path, self.registration.scope).href);
  // Nunca interceptar ou armazenar respostas de Authentication, Firestore ou URLs externas.
  if (url.origin !== self.location.origin || url.search || !staticURLs.includes(url.href)) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (!res.ok) return res;
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || (e.request.mode === "navigate" ? caches.match("./index.html") : undefined)))
  );
});

