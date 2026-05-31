// Minimal service worker — its presence + a fetch handler is what makes
// Chromium browsers treat the app as installable. No offline caching yet.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // Pass-through. Required for installability heuristics on some browsers.
})
