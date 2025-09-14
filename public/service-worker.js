// --- Push Notifications ---
self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {}
  const title = data.title || "Cheddit Notification"
  const options = {
    body: data.body || "",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: data.url ? { url: data.url } : undefined,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", function (event) {
  event.notification.close()
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url))
  }
})

// --- Fetch Handling ---
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // 🛑 Allow API POST/PUT/DELETE (e.g., file upload) to go straight to network
  if (url.pathname.startsWith("/api/") && event.request.method !== "GET") {
    return
  }

  // ✅ Cache-first for GET requests (static assets + GET APIs)
  if (event.request.method === "GET") {
    event.respondWith(
      caches.open("cheddit-cache").then(async (cache) => {
        try {
          const response = await fetch(event.request)
          cache.put(event.request, response.clone())
          return response
        } catch (err) {
          const cached = await cache.match(event.request)
          return cached || Response.error()
        }
      })
    )
  }
})
