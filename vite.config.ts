import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * Emits a service worker that precaches the built bundle. The asset names carry content
 * hashes, so the list has to come from the bundle itself rather than a static file.
 * Cache-first: once installed, the tool opens with the network off.
 */
function offlinePlugin(): Plugin {
  return {
    name: "file-hasher-offline",
    apply: "build",
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle)
        .map((name) => `/${name}`)
        .filter((name) => !name.endsWith(".map"));
      const precache = ["/", "/manifest.webmanifest", "/favicon.svg", ...assets];
      const version = assets.join("|").length.toString(36) + "-" + assets.length;

      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: `const CACHE = "file-hasher-${version}";
const PRECACHE = ${JSON.stringify(precache)};

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// ignoreVary matters: a host that answers with "Vary: Origin" makes the cached entry
// miss on a plain lookup, and the tool then dies the moment the network goes away.
const LOOKUP = { ignoreVary: true };

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith(caches.match("/", LOOKUP).then((hit) => hit || fetch(req)));
    return;
  }

  e.respondWith(
    caches.match(req, LOOKUP).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
`,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), offlinePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  worker: {
    format: "es",
  },
  server: {
    port: 5178,
  },
});
