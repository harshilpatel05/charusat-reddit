// ✅ Push Notification handler
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Cheddit Notification";
  const options = {
    body: data.body || "",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: { url: data.url || "/" }, // 👈 proper object with url
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ✅ Notification Click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // focus if already open
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      // otherwise open new tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ✅ Fetch handler (safe for APIs)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  console.log("[SW] Fetch:", url.pathname, event.request.method);

  // 🔒 Always bypass service worker for non-GET API calls
  if (url.pathname.startsWith("/api/") && event.request.method !== "GET") {
    console.log("[SW] Bypass:", url.pathname, event.request.method);
    return; // let it go straight to the network
  }

  // ✅ Cache-first only for GET requests
  if (event.request.method === "GET") {
    event.respondWith(
      caches.open("cheddit-cache").then(async (cache) => {
        try {
          const response = await fetch(event.request);
          cache.put(event.request, response.clone());
          return response;
        } catch (err) {
          console.warn("[SW] Fetch failed, serving cache:", url.pathname);
          const cached = await cache.match(event.request);
          return cached || Response.error();
        }
      })
    );
  }
});