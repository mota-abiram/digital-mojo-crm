// Minimal Service Worker for PWA functionality
const CACHE_NAME = 'dm-crm-v1';

self.addEventListener('install', (event) => {
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Ensure the service worker takes control of the page immediately
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Basic fetch handler (can be expanded for offline support later)
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
